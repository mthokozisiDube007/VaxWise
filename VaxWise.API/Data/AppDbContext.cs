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
        public DbSet<FeedRecord> FeedRecords { get; set; }
        public DbSet<FeedStock> FeedStocks { get; set; }
        public DbSet<BreedingRecord> BreedingRecords { get; set; }
        public DbSet<Financial> Financials { get; set; }
        public DbSet<Farm> Farms { get; set; }
        public DbSet<FarmWorker> FarmWorkers { get; set; }
        public DbSet<WorkerInvitation> WorkerInvitations { get; set; }

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

            // FeedRecord belongs to Farm
            modelBuilder.Entity<FeedRecord>()
                .HasOne<Farm>()
                .WithMany()
                .HasForeignKey(f => f.FarmId)
                .OnDelete(DeleteBehavior.NoAction);

            // FeedStock belongs to Farm
            modelBuilder.Entity<FeedStock>()
                .HasOne<Farm>()
                .WithMany()
                .HasForeignKey(f => f.FarmId)
                .OnDelete(DeleteBehavior.NoAction);

            // Financial belongs to Farm
            modelBuilder.Entity<Financial>()
                .HasOne<Farm>()
                .WithMany()
                .HasForeignKey(f => f.FarmId)
                .OnDelete(DeleteBehavior.NoAction);

            // VaccinationEvent belongs to Farm
            modelBuilder.Entity<VaccinationEvent>()
                .HasOne<Farm>()
                .WithMany()
                .HasForeignKey(v => v.FarmId)
                .OnDelete(DeleteBehavior.NoAction);
            // Fix cascade delete cycle on BreedingRecords
            modelBuilder.Entity<BreedingRecord>()
                .HasOne(b => b.FemaleAnimal)
                .WithMany()
                .HasForeignKey(b => b.FemaleAnimalId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<BreedingRecord>()
                .HasOne(b => b.MaleAnimal)
                .WithMany()
                .HasForeignKey(b => b.MaleAnimalId)
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