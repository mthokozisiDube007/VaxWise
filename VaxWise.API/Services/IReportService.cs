namespace VaxWise.API.Services
{
    public interface IReportService
    {
        Task<byte[]?> GenerateDalrrdReportAsync(int farmId);
    }
}
