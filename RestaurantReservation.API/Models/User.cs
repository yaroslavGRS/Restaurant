using System.ComponentModel.DataAnnotations;

namespace RestaurantReservation.API.Models
{
    public enum UserRole
    {
        Guest,
        User,
        Admin
    }

    public class User
    {
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        [Required]
        public UserRole Role { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Reservation> Reservations { get; set; }
    }
} 