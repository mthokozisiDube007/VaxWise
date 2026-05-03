using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Infrastructure;
using Scalar.AspNetCore;
using System.Text;
using VaxWise.API.Data;
using VaxWise.API.Services;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

QuestPDF.Settings.License = LicenseType.Community;
var builder = WebApplication.CreateBuilder(args);

// Register database context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration
        .GetConnectionString("DefaultConnection")));

// Add before builder.Build()
builder.Services.AddRateLimiter(options =>
{
    // Strict limit on login � 5 attempts per minute per IP
    options.AddFixedWindowLimiter("login", o =>
    {
        o.PermitLimit = 5;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 0;
    });

    // General API limit � 100 requests per minute per IP
    options.AddFixedWindowLimiter("api", o =>
    {
        o.PermitLimit = 100;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 10;
    });

    // Return 429 Too Many Requests when limit is hit
    options.RejectionStatusCode = 429;
});


// Register AuthService for dependency injection
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAnimalService, AnimalService>();
builder.Services.AddScoped<IVaccinationService, VaccinationService>();
builder.Services.AddScoped<ICertificateService, CertificateService>();
builder.Services.AddScoped<IHealthService, HealthService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IFarmService, FarmService>();
builder.Services.AddScoped<IVaccineScheduleService, VaccineScheduleService>();
builder.Services.AddScoped<IReportService, ReportService>();

// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!))
        };
    });

// Register role-based authorisation
builder.Services.AddAuthorization();
builder.Services.AddControllers();
// Cors policy for frontend access
builder.Services.AddCors(options =>
{
    options.AddPolicy("VaxWiseClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// .NET 10 uses OpenApi + Scalar instead of Swagger
builder.Services.AddOpenApi();

var app = builder.Build();
// Global error handling middleware to catch unhandled exceptions and return a generic error response
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        var error = context.Features
            .Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();

        if (error != null)
        {
            // Log the REAL error internally
            var logger = context.RequestServices
                .GetRequiredService<ILogger<Program>>();

            logger.LogError(error.Error,
                "Unhandled exception at {Path}",
                context.Request.Path);

            // Return a SAFE generic message to the client
            // Never expose the real error to the outside world
            await context.Response.WriteAsJsonAsync(new
            {
                message = "An unexpected error occurred. Please try again.",
                traceId = context.TraceIdentifier
            });
        }
    });
});
app.UseRateLimiter();
app.UseCors("VaxWiseClient");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}
app.Use(async (context, next) =>
{
    context.Response.Headers.Append(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
    context.Response.Headers.Append(
        "X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append(
        "X-Frame-Options", "DENY");
    context.Response.Headers.Append(
        "Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers().RequireRateLimiting("api");

app.Run();