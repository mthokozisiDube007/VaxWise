using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Models;

namespace VaxWise.API.Services
{
    public class CertificateService : ICertificateService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public CertificateService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;

            // Set QuestPDF license — Community is free for open source
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<CertificateResponseDto> GenerateCertificateAsync(int eventId)
        {
            // Load vaccination event with animal details
            var vacEvent = await _context.VaccinationEvents
                .Include(v => v.Animal)
                .ThenInclude(a => a.AnimalType)
                .FirstOrDefaultAsync(v => v.EventId == eventId);

            if (vacEvent == null)
                throw new Exception("Vaccination event not found");

            // Certificate expires in 30 days
            var expiresAt = DateTime.UtcNow.AddDays(30);

            // Create certificate record first to get the CertId
            var certificate = new Certificate
            {
                EventId = eventId,
                FarmerId = vacEvent.FarmId,
                AuditHash = vacEvent.AuditHash,
                Status = "Valid",
                IssuedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt
            };

            _context.Certificates.Add(certificate);
            await _context.SaveChangesAsync();

            // Build QR code URL pointing to public verification endpoint
            var baseUrl = _config["AppSettings:BaseUrl"] ?? "https://localhost:7232";
            certificate.QrCodeUrl = $"{baseUrl}/api/certificates/verify/{certificate.CertId}";
            await _context.SaveChangesAsync();

            // Generate the PDF
            var pdfBytes = GeneratePdf(vacEvent, certificate);
            var pdfBase64 = Convert.ToBase64String(pdfBytes);

            return new CertificateResponseDto
            {
                CertId = certificate.CertId,
                EventId = eventId,
                AnimalEarTag = vacEvent.Animal.EarTagNumber,
                VaccineName = vacEvent.VaccineName,
                AuditHash = vacEvent.AuditHash,
                QrCodeUrl = certificate.QrCodeUrl,
                IssuedAt = certificate.IssuedAt,
                ExpiresAt = certificate.ExpiresAt,
                Status = certificate.Status,
                PdfBase64 = pdfBase64
            };
        }

        public async Task<List<CertificateResponseDto>> GetByFarmerAsync(int farmerId)
        {
            var certificates = await _context.Certificates
                .AsNoTracking()
                .Include(c => c.VaccinationEvent)
                .ThenInclude(v => v.Animal)
                .Where(c => c.FarmerId == farmerId)
                .OrderByDescending(c => c.IssuedAt)
                .ToListAsync();

            return certificates.Select(c => new CertificateResponseDto
            {
                CertId = c.CertId,
                EventId = c.EventId,
                AnimalEarTag = c.VaccinationEvent.Animal.EarTagNumber,
                VaccineName = c.VaccinationEvent.VaccineName,
                AuditHash = c.AuditHash,
                QrCodeUrl = c.QrCodeUrl,
                IssuedAt = c.IssuedAt,
                ExpiresAt = c.ExpiresAt,
                Status = c.Status,
                PdfBase64 = string.Empty
            }).ToList();
        }

        public async Task<CertificateVerificationDto?> VerifyAsync(int certId)
        {
            var certificate = await _context.Certificates
                .Include(c => c.VaccinationEvent)
                .ThenInclude(v => v.Animal)
                .FirstOrDefaultAsync(c => c.CertId == certId);

            if (certificate == null) return null;

            // Check if certificate has expired
            if (DateTime.UtcNow > certificate.ExpiresAt)
                certificate.Status = "Expired";

            await _context.SaveChangesAsync();

            return new CertificateVerificationDto
            {
                CertId = certificate.CertId,
                AnimalEarTag = certificate.VaccinationEvent.Animal.EarTagNumber,
                FarmerName = "VaxWise Farm",
                VaccineName = certificate.VaccinationEvent.VaccineName,
                VaccineBatch = certificate.VaccinationEvent.VaccineBatch,
                SavcNumber = certificate.VaccinationEvent.SavcNumber,
                GpsCoordinates = certificate.VaccinationEvent.GpsCoordinates,
                EventTimestamp = certificate.VaccinationEvent.EventTimestamp,
                AuditHash = certificate.AuditHash,
                ExpiresAt = certificate.ExpiresAt,
                VerificationStatus = certificate.Status
            };
        }

        // Private — generates the actual PDF document
        private byte[] GeneratePdf(VaccinationEvent vacEvent, Certificate cert)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);

                    page.Header().Column(col =>
                    {
                        col.Item().Text("VaxWise Verified Certificate")
                            .FontSize(24).Bold().FontColor("#1A5276");
                        col.Item().Text("Biosecurity Operating System — South Africa")
                            .FontSize(12).FontColor("#555555");
                        col.Item().LineHorizontal(1).LineColor("#1A5276");
                    });

                    page.Content().Column(col =>
                    {
                        col.Item().PaddingTop(20).Text("Animal Details")
                            .FontSize(14).Bold();
                        col.Item().Text($"Ear Tag: {vacEvent.Animal.EarTagNumber}");
                        col.Item().Text($"RFID Tag: {vacEvent.Animal.RfidTag}");
                        col.Item().Text($"Breed: {vacEvent.Animal.Breed}");

                        col.Item().PaddingTop(20).Text("Vaccination Details")
                            .FontSize(14).Bold();
                        col.Item().Text($"Vaccine: {vacEvent.VaccineName}");
                        col.Item().Text($"Batch: {vacEvent.VaccineBatch}");
                        col.Item().Text($"Manufacturer: {vacEvent.Manufacturer}");
                        col.Item().Text($"Date: {vacEvent.EventTimestamp:yyyy-MM-dd HH:mm} UTC");
                        col.Item().Text($"GPS: {vacEvent.GpsCoordinates}");
                        col.Item().Text($"Vet SAVC: {vacEvent.SavcNumber}");

                        col.Item().PaddingTop(20).Text("Cryptographic Proof")
                            .FontSize(14).Bold();
                        col.Item().Text($"Audit Hash (SHA-256):")
                            .FontSize(10);
                        col.Item().Text(vacEvent.AuditHash)
                            .FontSize(9).FontColor("#1A5276");

                        col.Item().PaddingTop(20).Text("Verification")
                            .FontSize(14).Bold();
                        col.Item().Text($"Certificate ID: {cert.CertId}");
                        col.Item().Text($"Issued: {cert.IssuedAt:yyyy-MM-dd}");
                        col.Item().Text($"Expires: {cert.ExpiresAt:yyyy-MM-dd}");
                        col.Item().Text($"Verify at: {cert.QrCodeUrl}")
                            .FontColor("#1A5276");
                    });

                    page.Footer().Text($"VaxWise (Pty) Ltd — BBBEE Level 1 — " +
                        $"Certificate {cert.CertId} — {cert.Status}")
                        .FontSize(9).FontColor("#999999");
                });
            }).GeneratePdf();
        }
    }
}