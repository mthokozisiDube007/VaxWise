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

// Accept both URI format (postgresql://user:pass@host/db) and key-value format
// Manual parser avoids System.Uri breaking on special characters (@ # ?) in passwords
static string NormalizeConnectionString(string? cs)
{
    if (string.IsNullOrEmpty(cs)) return cs ?? "";
    if (!cs.StartsWith("postgresql://") && !cs.StartsWith("postgres://")) return cs;

    var rest = cs.StartsWith("postgresql://") ? cs[13..] : cs[11..];

    // Find the last @ before the first / — handles passwords containing @
    var firstSlash = rest.IndexOf('/');
    var atIdx = firstSlash > 0 ? rest.LastIndexOf('@', firstSlash - 1) : rest.LastIndexOf('@');

    var userInfo = atIdx >= 0 ? rest[..atIdx] : "";
    var hostPart = atIdx >= 0 ? rest[(atIdx + 1)..] : rest;

    // user:password (split on first colon only)
    var colonIdx = userInfo.IndexOf(':');
    var user = Uri.UnescapeDataString(colonIdx >= 0 ? userInfo[..colonIdx] : userInfo);
    var pass = colonIdx >= 0 ? Uri.UnescapeDataString(userInfo[(colonIdx + 1)..]) : "";

    // host:port/database?query
    var pathIdx = hostPart.IndexOf('/');
    var hostPort = pathIdx >= 0 ? hostPart[..pathIdx] : hostPart;
    var pathQuery = pathIdx >= 0 ? hostPart[(pathIdx + 1)..] : "";

    var portColon = hostPort.LastIndexOf(':');
    var host = portColon >= 0 ? hostPort[..portColon] : hostPort;
    var port = portColon >= 0 ? hostPort[(portColon + 1)..] : "5432";

    var queryIdx = pathQuery.IndexOf('?');
    var db = (queryIdx >= 0 ? pathQuery[..queryIdx] : pathQuery).Trim('/');
    if (string.IsNullOrEmpty(db)) db = "postgres";

    return $"Host={host};Port={port};Database={db};Username={user};Password={pass};SSL Mode=Require";
}

// Register database context
var connectionString = NormalizeConnectionString(
    builder.Configuration.GetConnectionString("DefaultConnection"));
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

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
builder.Services.AddScoped<ILoginAuditService, LoginAuditService>();
builder.Services.AddScoped<IAdminFarmService, AdminFarmService>();

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
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("VaxWiseClient", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// .NET 10 uses OpenApi + Scalar instead of Swagger
builder.Services.AddOpenApi();

var app = builder.Build();

// Auto-run migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

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