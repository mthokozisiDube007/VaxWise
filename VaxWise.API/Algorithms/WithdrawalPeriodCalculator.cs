namespace VaxWise.API.Algorithms
{
    public static class WithdrawalPeriodCalculator
    {
        public static DateTime GetClearDate(DateTime treatmentDate, int withdrawalDays)
            => treatmentDate.AddDays(withdrawalDays);

        public static bool IsActive(DateTime treatmentDate, int withdrawalDays, DateTime now)
            => withdrawalDays > 0 && GetClearDate(treatmentDate, withdrawalDays) > now;

        // Positive = days remaining, negative = already cleared
        public static int DaysRemaining(DateTime treatmentDate, int withdrawalDays, DateTime now)
            => (int)Math.Ceiling((GetClearDate(treatmentDate, withdrawalDays) - now).TotalDays);
    }
}
