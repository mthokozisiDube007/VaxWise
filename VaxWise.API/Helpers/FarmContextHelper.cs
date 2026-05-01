using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VaxWise.API.Data;

namespace VaxWise.API.Helpers
{
    public static class FarmContextHelper
    {
        /// <summary>
        /// Gets the active FarmId for the current user.
        /// For FarmOwners — reads from the X-Farm-Id request header.
        /// For Workers/Vets — reads from their FarmWorker assignment.
        /// </summary>
        public static async Task<int> GetActiveFarmIdAsync(
            ClaimsPrincipal user,
            HttpRequest request,
            AppDbContext context)
        {
            var role = user.FindFirst(
                "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;

            // FarmOwner sends their selected FarmId in the request header
            if (role == "FarmOwner" || role == "Admin")
            {
                var headerValue = request.Headers["X-Farm-Id"].FirstOrDefault();
                if (int.TryParse(headerValue, out int farmId))
                    return farmId;

                throw new Exception("No farm selected. Please select a farm first.");
            }

            // Workers and Vets get their FarmId from their assignment
            var userIdClaim = user.FindFirst(
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                throw new UnauthorizedAccessException("Invalid user context.");

            var worker = await context.FarmWorkers
                .FirstOrDefaultAsync(fw =>
                    fw.UserId == userId && fw.Status == "Active");

            if (worker == null)
                throw new Exception("You are not assigned to any farm.");

            return worker.FarmId;
        }
    }
}