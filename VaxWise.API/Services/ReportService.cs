using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VaxWise.API.Algorithms;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Models;

namespace VaxWise.API.Services
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;

        public ReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<byte[]?> GenerateDalrrdReportAsync(int farmId)
        {
            var now = DateTime.UtcNow;

            var farm = await _context.Farms
                .Include(f => f.Owner)
                .FirstOrDefaultAsync(f => f.FarmId == farmId);

            if (farm == null) return null;

            var recentRecords = await _context.HealthRecords
                .Include(h => h.Animal)
                    .ThenInclude(a => a.AnimalType)
                .Where(h => h.FarmId == farmId && h.TreatmentDate >= now.AddHours(-48))
                .ToListAsync();

            if (recentRecords.Count < 3) return null;

            int totalAnimals = await _context.Animals.CountAsync(a => a.FarmId == farmId);

            var notifiableDiseases = await _context.VaccineSchedules
                .Where(vs => vs.IsNotifiable && vs.NotifiableDiseaseName != null)
                .Select(vs => new { vs.VaccineName, DiseaseName = vs.NotifiableDiseaseName!, vs.ReportingWindowHours })
                .Distinct()
                .ToListAsync();

            var notifiableList = notifiableDiseases
                .Select(d => (d.VaccineName, d.DiseaseName, d.ReportingWindowHours))
                .ToList<(string Keyword, string DiseaseName, int ReportingWindowHours)>();

            var mostReported = recentRecords
                .GroupBy(h => h.Symptoms)
                .OrderByDescending(g => g.Count())
                .First();

            var records = recentRecords
                .Select(r => (r, r.Animal.EarTagNumber))
                .ToList();

            var alert = OutbreakDetectionEngine.Analyse(
                mostReported.Key, records, totalAnimals, notifiableList);

            if (!alert.IsNotifiable) return null;

            var affectedTags = alert.AffectedEarTags.ToHashSet();
            var affectedRecords = recentRecords
                .Where(r => affectedTags.Contains(r.Animal.EarTagNumber))
                .ToList();

            var reportNumber = $"VW-{farmId:D4}-{now:yyyyMMddHHmm}";
            return BuildPdf(farm, alert, affectedRecords, totalAnimals, reportNumber, now);
        }

        private static byte[] BuildPdf(
            Farm farm,
            OutbreakAlertDto alert,
            List<HealthRecord> affected,
            int totalAnimals,
            string reportNumber,
            DateTime now)
        {
            var sast = now.AddHours(2);
            var deadline = alert.DalrrdReportDeadline?.AddHours(2);
            var diseaseName = alert.NotifiableDiseaseName ?? "Unknown Notifiable Disease";
            var coveragePct = totalAnimals > 0
                ? Math.Round((double)affected.Count / totalAnimals * 100, 1) : 0;

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.MarginHorizontal(1.8f, Unit.Centimetre);
                    page.MarginVertical(1.4f, Unit.Centimetre);
                    page.DefaultTextStyle(t => t.FontSize(10).FontColor("#1A1A18"));

                    // ── HEADER ──────────────────────────────────────
                    page.Header()
                        .Background("#0B1F14")
                        .Padding(14)
                        .Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("VAXWISE BIOSECURITY PLATFORM")
                                    .FontColor(Colors.White).FontSize(13).Bold();
                                col.Item().PaddingTop(3)
                                    .Text("DALRRD Notifiable Disease Report")
                                    .FontColor("#86EFAC").FontSize(10);
                            });
                            row.ConstantItem(190).AlignRight().Column(col =>
                            {
                                col.Item().Text($"Ref: {reportNumber}").FontColor("#D1FAE5").FontSize(8);
                                col.Item().PaddingTop(2).Text($"Generated: {sast:dd MMM yyyy HH:mm} SAST").FontColor("#A7F3D0").FontSize(8);
                                col.Item().PaddingTop(2).Text("Animal Diseases Act 35 of 1984").FontColor("#6EE7B7").FontSize(7);
                            });
                        });

                    // ── CONTENT ─────────────────────────────────────
                    page.Content().PaddingTop(18).Column(col =>
                    {
                        // Deadline alert box
                        col.Item()
                            .Border(1).BorderColor("#FECACA")
                            .Background("#FEF2F2")
                            .Row(row =>
                            {
                                row.ConstantItem(6).Background("#B91C1C");
                                row.RelativeItem().Padding(12).Column(c =>
                                {
                                    c.Item().Text($"NOTIFIABLE DISEASE DETECTED: {diseaseName.ToUpper()}")
                                        .FontColor("#B91C1C").FontSize(12).Bold();
                                    c.Item().PaddingTop(4)
                                        .Text($"MANDATORY REPORTING DEADLINE: {(deadline.HasValue ? deadline.Value.ToString("dd MMM yyyy HH:mm") : "N/A")} SAST")
                                        .FontColor("#7F1D1D").FontSize(10).Bold();
                                    c.Item().PaddingTop(3)
                                        .Text("Failure to report within 24 hours is a criminal offence under the Animal Diseases Act.")
                                        .FontColor("#991B1B").FontSize(8);
                                });
                            });

                        // ── Section 1: Farm Information ──────────────
                        col.Item().PaddingTop(20).PaddingBottom(5)
                            .Text("SECTION 1 — FARM INFORMATION").FontSize(11).Bold().FontColor("#0B1F14");
                        col.Item().LineHorizontal(1).LineColor("#E0D9CE");
                        col.Item().PaddingTop(10).Row(row =>
                        {
                            row.RelativeItem().Column(c => InfoField(c, "FARM NAME", farm.FarmName));
                            row.ConstantItem(10);
                            row.RelativeItem().Column(c => InfoField(c, "GLN / REGISTRATION NUMBER", farm.GlnNumber ?? "Not registered"));
                            row.ConstantItem(10);
                            row.RelativeItem().Column(c => InfoField(c, "PROVINCE", farm.Province));
                        });
                        col.Item().PaddingTop(12).Row(row =>
                        {
                            row.RelativeItem().Column(c => InfoField(c, "FARM TYPE", farm.FarmType));
                            row.ConstantItem(10);
                            row.RelativeItem().Column(c => InfoField(c, "GPS COORDINATES", farm.GpsCoordinates ?? "Not recorded"));
                            row.ConstantItem(10);
                            row.RelativeItem().Column(c => InfoField(c, "RESPONSIBLE PERSON", farm.Owner?.FullName ?? "Unknown"));
                        });

                        // ── Section 2: Disease Details ────────────────
                        col.Item().PaddingTop(20).PaddingBottom(5)
                            .Text("SECTION 2 — NOTIFIABLE DISEASE DETAILS").FontSize(11).Bold().FontColor("#0B1F14");
                        col.Item().LineHorizontal(1).LineColor("#E0D9CE");
                        col.Item().PaddingTop(10).Row(row =>
                        {
                            row.RelativeItem().Column(c => InfoField(c, "DISEASE NAME", diseaseName));
                            row.ConstantItem(10);
                            row.RelativeItem().Column(c => InfoField(c, "DATE FIRST DETECTED", sast.ToString("dd MMM yyyy")));
                            row.ConstantItem(10);
                            row.RelativeItem().Column(c => InfoField(c, "OUTBREAK RISK LEVEL", alert.RiskLevel));
                        });
                        col.Item().PaddingTop(12).Row(row =>
                        {
                            row.RelativeItem().Column(c => InfoField(c, "ANIMALS AFFECTED", $"{affected.Count} of {totalAnimals} ({coveragePct}%)"));
                            row.ConstantItem(10);
                            row.RelativeItem().Column(c => InfoField(c, "TRIGGER SYMPTOMS", affected.FirstOrDefault()?.Symptoms ?? "—"));
                            row.ConstantItem(10);
                            row.RelativeItem().Column(c => InfoField(c, "REPORTING WINDOW", "24 hours"));
                        });

                        // ── Section 3: Affected Animals ───────────────
                        col.Item().PaddingTop(20).PaddingBottom(5)
                            .Text("SECTION 3 — AFFECTED ANIMALS").FontSize(11).Bold().FontColor("#0B1F14");
                        col.Item().LineHorizontal(1).LineColor("#E0D9CE");
                        col.Item().PaddingTop(10).Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(3);
                                cols.RelativeColumn(3);
                                cols.RelativeColumn(2.5f);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                foreach (var h in new[] { "EAR TAG", "SPECIES", "SYMPTOMS", "DIAGNOSIS", "MEDICATION", "DATE", "VET" })
                                    header.Cell().Background("#0B1F14").Padding(7)
                                        .Text(h).FontColor(Colors.White).FontSize(8).Bold();
                            });

                            var idx = 0;
                            foreach (var r in affected)
                            {
                                var bg = idx++ % 2 == 0 ? "#FFFFFF" : "#F8F5F0";
                                void TC(string? v) => table.Cell()
                                    .Background(bg).BorderBottom(1).BorderColor("#EDE8DF")
                                    .Padding(7).Text(string.IsNullOrEmpty(v) ? "—" : v).FontSize(9);

                                TC(r.Animal.EarTagNumber);
                                TC(r.Animal.AnimalType?.TypeName ?? "Livestock");
                                TC(r.Symptoms);
                                TC(r.Diagnosis);
                                TC(r.MedicationUsed);
                                TC(r.TreatmentDate.AddHours(2).ToString("dd MMM yyyy"));
                                TC(r.VetName);
                            }
                        });

                        // ── Section 4: Declaration ────────────────────
                        col.Item().PaddingTop(20).PaddingBottom(5)
                            .Text("SECTION 4 — STATUTORY DECLARATION").FontSize(11).Bold().FontColor("#0B1F14");
                        col.Item().LineHorizontal(1).LineColor("#E0D9CE");
                        col.Item().PaddingTop(10).Text(t =>
                        {
                            t.Line("This report has been automatically generated by the VaxWise biosecurity platform in compliance with the Animal Diseases Act 35 of 1984 (as amended).").FontSize(9).FontColor("#6E6B60");
                            t.Span("The farm operator and attending veterinarian confirm that the information above is true and correct, and acknowledge their legal obligation to notify DALRRD within the prescribed reporting window.").FontSize(9).FontColor("#6E6B60");
                        });

                        col.Item().PaddingTop(20).Row(row =>
                        {
                            void SigLine(string label)
                            {
                                row.RelativeItem().PaddingRight(16).Column(c =>
                                {
                                    c.Item().PaddingBottom(4).Text(label).FontSize(8).FontColor("#8C8677").Bold();
                                    c.Item().LineHorizontal(1).LineColor("#1A1A18");
                                    c.Item().PaddingTop(3).Text("(Signature / Date / SAVC No.)").FontSize(7).FontColor("#B0A898");
                                });
                            }
                            SigLine("Responsible Veterinarian");
                            SigLine("Farm Owner / Manager");
                            SigLine("DALRRD Inspector (Official Use)");
                        });

                        // DALRRD contact
                        col.Item().PaddingTop(20)
                            .Background("#F0FDF4").Border(1).BorderColor("#86EFAC")
                            .Padding(12).Column(c =>
                            {
                                c.Item().Text("DALRRD CONTACT INFORMATION").FontSize(9).Bold().FontColor("#0B1F14");
                                c.Item().PaddingTop(4)
                                    .Text("Animal Health Directorate  ·  Tel: 012 319 7000  ·  Email: AHD@dalrrd.gov.za  ·  www.dalrrd.gov.za")
                                    .FontSize(9).FontColor("#166534");
                                c.Item().PaddingTop(2)
                                    .Text($"Provincial Veterinary Office — {(string.IsNullOrEmpty(farm.Province) ? "Contact Head Office" : farm.Province)}")
                                    .FontSize(9).FontColor("#166534");
                            });

                        // Official-use box
                        col.Item().PaddingTop(12)
                            .Border(1).BorderColor("#C0B9B0")
                            .Padding(12).Column(c =>
                            {
                                c.Item().Text("FOR DALRRD OFFICIAL USE ONLY").FontSize(9).Bold().FontColor("#6E6B60");
                                c.Item().PaddingTop(8).Row(row =>
                                {
                                    row.RelativeItem().Column(inner =>
                                    {
                                        inner.Item().Text("Date Received: _____________________________").FontSize(9);
                                        inner.Item().PaddingTop(6).Text("Received By: ______________________________").FontSize(9);
                                    });
                                    row.RelativeItem().Column(inner =>
                                    {
                                        inner.Item().Text("Reference No: _____________________________").FontSize(9);
                                        inner.Item().PaddingTop(6).Text("Action Taken: _____________________________").FontSize(9);
                                    });
                                });
                            });
                    });

                    // ── FOOTER ──────────────────────────────────────
                    page.Footer().AlignCenter().PaddingTop(8).Text(text =>
                    {
                        text.Span("VaxWise Biosecurity Platform  ·  Ref: ").FontSize(8).FontColor("#8C8677");
                        text.Span(reportNumber).FontSize(8).FontColor("#8C8677");
                        text.Span("  ·  Page ").FontSize(8).FontColor("#8C8677");
                        text.CurrentPageNumber().FontSize(8).FontColor("#8C8677");
                        text.Span(" of ").FontSize(8).FontColor("#8C8677");
                        text.TotalPages().FontSize(8).FontColor("#8C8677");
                    });
                });
            }).GeneratePdf();
        }

        private static void InfoField(ColumnDescriptor col, string label, string value)
        {
            col.Item().Text(label).FontSize(8).FontColor("#8C8677").Bold();
            col.Item().PaddingTop(2).Text(string.IsNullOrEmpty(value) ? "—" : value).FontSize(10);
        }
    }
}
