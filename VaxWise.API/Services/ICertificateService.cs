using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface ICertificateService
    {
        /// <summary>
        /// Generates a VaxWise Verified Certificate PDF 
        /// for the given vaccination event.
        /// </summary>
        /// <param name="eventId">The vaccination event ID.</param>
        /// <returns>Certificate response with PDF bytes and QR code.</returns>
        Task<CertificateResponseDto> GenerateCertificateAsync(int eventId);

        /// <summary>
        /// Returns all certificates issued for a specific farm.
        /// </summary>
        /// <param name="farmerId">The farmer's user ID from JWT token.</param>
        /// <returns>List of certificates.</returns>
        Task<List<CertificateResponseDto>> GetByFarmerAsync(int farmerId);

        /// <summary>
        /// Public verification — any inspector can verify a certificate.
        /// No authentication required.
        /// Returns real-time compliance status.
        /// </summary>
        /// <param name="certId">The certificate ID from QR code.</param>
        /// <returns>Certificate verification result.</returns>
        Task<CertificateVerificationDto?> VerifyAsync(int certId);
    }
}