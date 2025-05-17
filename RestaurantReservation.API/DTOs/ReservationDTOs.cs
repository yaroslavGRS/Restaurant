using System.ComponentModel.DataAnnotations;
using RestaurantReservation.API.Models;

namespace RestaurantReservation.API.DTOs
{
    public class ReservationDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int TableId { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan TimeFrom { get; set; }
        public TimeSpan TimeTo { get; set; }
        public ReservationStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public TableDto Table { get; set; }
        public UserDto User { get; set; }
    }

    public class CreateReservationDto
    {
        [Required]
        public int TableId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public TimeSpan TimeFrom { get; set; }

        [Required]
        public TimeSpan TimeTo { get; set; }
    }

    public class UpdateReservationStatusDto
    {
        [Required]
        public ReservationStatus Status { get; set; }
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public UserRole Role { get; set; }
    }
} 