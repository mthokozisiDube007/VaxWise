namespace VaxWise.API.Models
{
    public class AnimalType
    {
        // Primary key - EF Core recognises "Id" automatically
        public int AnimalTypeId { get; set; }

        // The name of the animal type e.g. Cattle, Sheep, Goat
        public string TypeName { get; set; } = string.Empty;

        // Gestation period in days - used by the breeding module later
        public int GestationDays { get; set; }

        // Navigation property - one AnimalType has many Animals
        public ICollection<Animal> Animals { get; set; } = new List<Animal>();
    }
}