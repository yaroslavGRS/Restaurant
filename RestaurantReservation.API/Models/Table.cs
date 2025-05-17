using System.ComponentModel.DataAnnotations;

namespace RestaurantReservation.API.Models
{
    public class Table
    {
        public int Id { get; set; }

        [Required]
        public int Number { get; set; }

        [Required]
        public int Seats { get; set; }

        [Required]
        public string Location { get; set; }

        public bool IsAvailable { get; set; } = true;

        // Navigation properties
        public ICollection<Reservation> Reservations { get; set; }
    }
} 