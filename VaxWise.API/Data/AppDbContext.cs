using Microsoft.EntityFrameworkCore;
using VaxWise.API.Models;

namespace VaxWise.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Animal> Animals { get; set; }
        public DbSet<AnimalType> AnimalTypes { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<VaccinationEvent> VaccinationEvents { get; set; }
        public DbSet<Certificate> Certificates { get; set; }
        public DbSet<HealthRecord> HealthRecords { get; set; }
        public DbSet<Farm> Farms { get; set; }
        public DbSet<FarmWorker> FarmWorkers { get; set; }
        public DbSet<WorkerInvitation> WorkerInvitations { get; set; }
        public DbSet<VaccineSchedule> VaccineSchedules { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Seed animal types
            modelBuilder.Entity<AnimalType>().HasData(
                new AnimalType { AnimalTypeId = 1, TypeName = "Cattle", GestationDays = 283 },
                new AnimalType { AnimalTypeId = 2, TypeName = "Sheep", GestationDays = 147 },
                new AnimalType { AnimalTypeId = 3, TypeName = "Goat", GestationDays = 150 },
                new AnimalType { AnimalTypeId = 4, TypeName = "Pig", GestationDays = 114 },
                new AnimalType { AnimalTypeId = 5, TypeName = "Chicken", GestationDays = 21 }
            );
            // VaccineSchedule belongs to AnimalType — no cascade needed (reference data)
            modelBuilder.Entity<VaccineSchedule>()
                .HasOne(vs => vs.AnimalType)
                .WithMany()
                .HasForeignKey(vs => vs.AnimalTypeId)
                .OnDelete(DeleteBehavior.NoAction);

            // Seed South African DALRRD-aligned vaccine schedules
            // AnimalTypeIds: Cattle=1, Sheep=2, Goat=3, Pig=4, Chicken=5
            modelBuilder.Entity<VaccineSchedule>().HasData(
                // Cattle
                new VaccineSchedule { VaccineScheduleId = 1,  AnimalTypeId = 1, VaccineName = "FMD Vaccine",                IntervalDays = 180, IsNotifiable = true,  NotifiableDiseaseName = "Foot-and-Mouth Disease",              ReportingWindowHours = 24 },
                new VaccineSchedule { VaccineScheduleId = 2,  AnimalTypeId = 1, VaccineName = "Brucellosis Vaccine",        IntervalDays = 365, IsNotifiable = true,  NotifiableDiseaseName = "Brucellosis",                          ReportingWindowHours = 24 },
                new VaccineSchedule { VaccineScheduleId = 3,  AnimalTypeId = 1, VaccineName = "Anthrax Vaccine",            IntervalDays = 365, IsNotifiable = true,  NotifiableDiseaseName = "Anthrax",                              ReportingWindowHours = 24 },
                new VaccineSchedule { VaccineScheduleId = 4,  AnimalTypeId = 1, VaccineName = "Lumpy Skin Disease Vaccine", IntervalDays = 365, IsNotifiable = true,  NotifiableDiseaseName = "Lumpy Skin Disease",                   ReportingWindowHours = 24 },
                new VaccineSchedule { VaccineScheduleId = 5,  AnimalTypeId = 1, VaccineName = "Bluetongue Vaccine",         IntervalDays = 365, IsNotifiable = true,  NotifiableDiseaseName = "Bluetongue",                           ReportingWindowHours = 24 },
                new VaccineSchedule { VaccineScheduleId = 6,  AnimalTypeId = 1, VaccineName = "Blackleg Vaccine",           IntervalDays = 365, IsNotifiable = false, NotifiableDiseaseName = null,                                   ReportingWindowHours = 24 },
                // Sheep
                new VaccineSchedule { VaccineScheduleId = 7,  AnimalTypeId = 2, VaccineName = "FMD Vaccine",                IntervalDays = 180, IsNotifiable = true,  NotifiableDiseaseName = "Foot-and-Mouth Disease",              ReportingWindowHours = 24 },
                new VaccineSchedule { VaccineScheduleId = 8,  AnimalTypeId = 2, VaccineName = "Anthrax Vaccine",            IntervalDays = 365, IsNotifiable = true,  NotifiableDiseaseName = "Anthrax",                              ReportingWindowHours = 24 },
                new VaccineSchedule { VaccineScheduleId = 9,  AnimalTypeId = 2, VaccineName = "Bluetongue Vaccine",         IntervalDays = 365, IsNotifiable = true,  NotifiableDiseaseName = "Bluetongue",                           ReportingWindowHours = 24 },
                new VaccineSchedule { VaccineScheduleId = 10, AnimalTypeId = 2, VaccineName = "Pasteurellosis Vaccine",     IntervalDays = 365, IsNotifiable = false, NotifiableDiseaseName = null,                                   ReportingWindowHours = 24 },
                // Goat
                new VaccineSchedule { VaccineScheduleId = 11, AnimalTypeId = 3, VaccineName = "FMD Vaccine",                IntervalDays = 180, IsNotifiable = true,  NotifiableDiseaseName = "Foot-and-Mouth Disease",              ReportingWindowHours = 24 },
                new VaccineSchedule { VaccineScheduleId = 12, AnimalTypeId = 3, VaccineName = "Pasteurellosis Vaccine",     IntervalDays = 365, IsNotifiable = false, NotifiableDiseaseName = null,                                   ReportingWindowHours = 24 },
                // Pig
                new VaccineSchedule { VaccineScheduleId = 13, AnimalTypeId = 4, VaccineName = "FMD Vaccine",                IntervalDays = 180, IsNotifiable = true,  NotifiableDiseaseName = "Foot-and-Mouth Disease",              ReportingWindowHours = 24 },
                new VaccineSchedule { VaccineScheduleId = 14, AnimalTypeId = 4, VaccineName = "African Swine Fever Vaccine",IntervalDays = 180, IsNotifiable = true,  NotifiableDiseaseName = "African Swine Fever",                  ReportingWindowHours = 24 },
                // Chicken
                new VaccineSchedule { VaccineScheduleId = 15, AnimalTypeId = 5, VaccineName = "Newcastle Disease Vaccine",  IntervalDays = 42,  IsNotifiable = true,  NotifiableDiseaseName = "Newcastle Disease",                    ReportingWindowHours = 24 },
                new VaccineSchedule { VaccineScheduleId = 16, AnimalTypeId = 5, VaccineName = "Avian Influenza Vaccine",    IntervalDays = 180, IsNotifiable = true,  NotifiableDiseaseName = "Highly Pathogenic Avian Influenza",    ReportingWindowHours = 24 }
            );

            // Animal belongs to Farm
            modelBuilder.Entity<Animal>()
                .HasOne(a => a.Farm)
                .WithMany()
                .HasForeignKey(a => a.FarmId)
                .OnDelete(DeleteBehavior.NoAction);

            // HealthRecord belongs to Farm
            modelBuilder.Entity<HealthRecord>()
                .HasOne<Farm>()
                .WithMany()
                .HasForeignKey(h => h.FarmId)
                .OnDelete(DeleteBehavior.NoAction);

            // VaccinationEvent belongs to Farm
            modelBuilder.Entity<VaccinationEvent>()
                .HasOne<Farm>()
                .WithMany()
                .HasForeignKey(v => v.FarmId)
                .OnDelete(DeleteBehavior.NoAction);
            // Fix cascade delete cycle on Farm — owner deletion
            modelBuilder.Entity<Farm>()
                .HasOne(f => f.Owner)
                .WithMany()
                .HasForeignKey(f => f.OwnerId)
                .OnDelete(DeleteBehavior.NoAction);

            // Fix cascade delete cycle on FarmWorker
            modelBuilder.Entity<FarmWorker>()
                .HasOne(fw => fw.Farm)
                .WithMany(f => f.Workers)
                .HasForeignKey(fw => fw.FarmId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<FarmWorker>()
                .HasOne(fw => fw.User)
                .WithMany()
                .HasForeignKey(fw => fw.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // Fix cascade on WorkerInvitation
            modelBuilder.Entity<WorkerInvitation>()
                .HasOne(wi => wi.Farm)
                .WithMany()
                .HasForeignKey(wi => wi.FarmId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WorkerInvitation>()
                .HasOne(wi => wi.InvitedBy)
                .WithMany()
                .HasForeignKey(wi => wi.InvitedByUserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}