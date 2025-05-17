using Microsoft.EntityFrameworkCore;
using RestaurantReservation.API.Models;
using System.Security.Cryptography;
using System.Text;
using BCrypt.Net;

namespace RestaurantReservation.API.Data
{
    public static class DbSeeder
    {
        public static async Task SeedData(ApplicationDbContext context)
        {
            // Seed Admin User if not exists
            if (!await context.Users.AnyAsync(u => u.Email == "admin@restaurant.com"))
            {
                var adminUser = new User
                {
                    Email = "admin@restaurant.com",
                    Role = UserRole.Admin
                };

                // Hash password
                adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!");

                await context.Users.AddAsync(adminUser);
            }

            // Seed Tables if none exist
            if (!await context.Tables.AnyAsync())
            {
                var tables = new List<Table>
                {
                    new Table { Number = 1, Seats = 2, Location = "Window", IsAvailable = true },
                    new Table { Number = 2, Seats = 4, Location = "Window", IsAvailable = true },
                    new Table { Number = 3, Seats = 6, Location = "Center", IsAvailable = true },
                    new Table { Number = 4, Seats = 2, Location = "Bar", IsAvailable = true },
                    new Table { Number = 5, Seats = 8, Location = "Private Room", IsAvailable = true }
                };

                await context.Tables.AddRangeAsync(tables);
            }

            await context.SaveChangesAsync();
        }
    }
} 