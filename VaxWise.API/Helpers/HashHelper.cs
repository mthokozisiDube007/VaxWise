using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace VaxWise.API.Helpers
{
    public static class HashHelper
    {
        public static string GenerateSha256(
            string vaccineBatch,
            string gpsCoordinates,
            string savcNumber,
            string rfidTag,
            DateTime timestamp)
        {
            // JSON serialization avoids pipe-delimiter collision when field values contain '|'
            var payload = JsonSerializer.Serialize(new
            {
                vaccineBatch,
                gpsCoordinates,
                savcNumber,
                rfidTag,
                timestamp = timestamp.ToString("O")
            });

            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(payload));

            return BitConverter.ToString(bytes).Replace("-", "").ToLower();
        }
    }
}
