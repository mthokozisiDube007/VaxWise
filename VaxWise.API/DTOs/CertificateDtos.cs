namespace VaxWise.API.DTOs
{
    // What the API returns after generating a certificate
    public class CertificateResponseDto
    {
        public int CertId { get; set; }
        public int EventId { get; set; }
        public string AnimalEarTag { get; set; } = string.Empty;
        public string VaccineName { get; set; } = string.Empty;
        public string AuditHash { get; set; } = string.Empty;
        public string QrCodeUrl { get; set; } = string.Empty;
        public DateTime IssuedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string Status { get; set; } = string.Empty;

        // Base64 encoded PDF — client downloads this
        public string PdfBase64 { get; set; } = string.Empty;
    }

    // What the public verification portal returns
    public class CertificateVerificationDto
    {
        public int CertId { get; set; }
        public string AnimalEarTag { get; set; } = string.Empty;
        public string FarmerName { get; set; } = string.Empty;
        public string VaccineName { get; set; } = string.Empty;
        public string VaccineBatch { get; set; } = string.Empty;
        public string SavcNumber { get; set; } = string.Empty;
        public string GpsCoordinates { get; set; } = string.Empty;
        public DateTime EventTimestamp { get; set; }
        public string AuditHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }

        // Valid, Expired, or Tampered
        public string VerificationStatus { get; set; } = string.Empty;
    }
}