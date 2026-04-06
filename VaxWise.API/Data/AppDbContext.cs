using Microsoft.EntityFrameworkCore;
using VaxWise.API.Models;

namespace VaxWise.API.Data
{
    public class AppDbContext : DbContext
    {
        // The constructor receives configuration from Program.cs
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Each DbSet becomes a table in your database
        public DbSet<Animal> Animals { get; set; }
        public DbSet<AnimalType> AnimalTypes { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<VaccinationEvent> VaccinationEvents { get; set; }
        public DbSet<Certificate> Certificates { get; set; }
        public DbSet<HealthRecord> HealthRecords { get; set; }
        public DbSet<FeedRecord> FeedRecords { get; set; }
        public DbSet<FeedStock> FeedStocks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Seed initial animal types so the database has data from day one
            modelBuilder.Entity<AnimalType>().HasData(
                new AnimalType { AnimalTypeId = 1, TypeName = "Cattle", GestationDays = 283 },
                new AnimalType { AnimalTypeId = 2, TypeName = "Sheep", GestationDays = 147 },
                new AnimalType { AnimalTypeId = 3, TypeName = "Goat", GestationDays = 150 },
                new AnimalType { AnimalTypeId = 4, TypeName = "Pig", GestationDays = 114 },
                new AnimalType { AnimalTypeId = 5, TypeName = "Chicken", GestationDays = 21 }
            );
        }
    }
}