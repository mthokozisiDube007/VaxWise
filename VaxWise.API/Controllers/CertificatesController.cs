using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VaxWise.API.Services;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CertificatesController : ControllerBase
    {
        private readonly ICertificateService _certificateService;

        public CertificatesController(ICertificateService certificateService)
        {
            _certificateService = certificateService;
        }

        // POST api/certificates/generate/1 — Vet only
        [HttpPost("generate/{eventId}")]
        [Authorize(Roles = "Vet")]
        public async Task<IActionResult> Generate(int eventId)
        {
            var result = await _certificateService.GenerateCertificateAsync(eventId);
            return Ok(result);
        }

        // GET api/certificates/farm — FarmOwner sees their certificates
        [HttpGet("farm")]
        [Authorize]
        public async Task<IActionResult> GetByFarmer()
        {
            var farmerId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var results = await _certificateService.GetByFarmerAsync(farmerId);
            return Ok(results);
        }

        // GET api/certificates/verify/1 — PUBLIC — no auth needed
        // This is what an inspector scans with a QR code
        [HttpGet("verify/{certId}")]
        [AllowAnonymous]
        public async Task<IActionResult> Verify(int certId)
        {
            var result = await _certificateService.VerifyAsync(certId);

            if (result == null)
                return NotFound(new { message = "Certificate not found" });

            return Ok(result);
        }
    }
}