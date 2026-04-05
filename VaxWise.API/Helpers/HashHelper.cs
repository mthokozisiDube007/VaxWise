using System.Security.Cryptography;
using System.Text;

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
            // Concatenate all five fields into one payload string
            // Order matters — changing the order changes the hash
            var payload = $"{vaccineBatch}|{gpsCoordinates}|{savcNumber}|{rfidTag}|{timestamp:O}";

            // Run the payload through SHA-256
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(payload));

            // Convert the byte array to a readable hex string
            return BitConverter.ToString(bytes).Replace("-", "").ToLower();
        }
    }
}