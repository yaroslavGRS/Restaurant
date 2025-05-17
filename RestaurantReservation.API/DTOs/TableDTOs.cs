using System.ComponentModel.DataAnnotations;

namespace RestaurantReservation.API.DTOs
{
    public class TableDto
    {
        public int Id { get; set; }
        public int Number { get; set; }
        public int Seats { get; set; }
        public string Location { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class CreateTableDto
    {
        [Required]
        public int Number { get; set; }

        [Required]
        [Range(1, 20)]
        public int Seats { get; set; }

        [Required]
        public string Location { get; set; }
    }

    public class UpdateTableDto
    {
        [Required]
        public int Number { get; set; }

        [Required]
        [Range(1, 20)]
        public int Seats { get; set; }

        [Required]
        public string Location { get; set; }

        public bool IsAvailable { get; set; }
    }
} 