using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantReservation.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentsColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Comments",
                table: "Reservations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Comments",
                table: "Reservations");
        }
    }
}
