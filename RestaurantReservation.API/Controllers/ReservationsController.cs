using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RestaurantReservation.API.Data;
using RestaurantReservation.API.DTOs;
using RestaurantReservation.API.Models;
using AutoMapper;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace RestaurantReservation.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReservationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<ReservationsController> _logger;

        public ReservationsController(ApplicationDbContext context, IMapper mapper, ILogger<ReservationsController> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReservationDto>>> GetReservations()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var isAdmin = User.IsInRole("Admin");

                _logger.LogInformation($"Getting reservations for user {userId}, isAdmin: {isAdmin}");

                var query = _context.Reservations
                    .Include(r => r.Table)
                    .Include(r => r.User)
                    .AsQueryable();

                if (!isAdmin)
                {
                    query = query.Where(r => r.UserId == userId);
                }

                var reservations = await query.ToListAsync();
                _logger.LogInformation($"Found {reservations.Count} reservations");

                var result = _mapper.Map<IEnumerable<ReservationDto>>(reservations);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reservations");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ReservationDto>> GetReservation(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var isAdmin = User.IsInRole("Admin");

            var reservation = await _context.Reservations
                .Include(r => r.Table)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reservation == null)
            {
                return NotFound();
            }

            if (!isAdmin && reservation.UserId != userId)
            {
                return Forbid();
            }

            return _mapper.Map<ReservationDto>(reservation);
        }

        [HttpPost]
        [Authorize(Roles = "User,Admin")]
        public async Task<ActionResult<ReservationDto>> CreateReservation(CreateReservationDto createReservationDto)
        {
            try
            {
                _logger.LogInformation("Creating new reservation");
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                _logger.LogInformation($"User ID: {userId}");

                var table = await _context.Tables.FindAsync(createReservationDto.TableId);
                _logger.LogInformation($"Table found: {table != null}");

                if (table == null)
                {
                    return BadRequest("Table not found");
                }

                if (!table.IsAvailable)
                {
                    return BadRequest("Table is not available");
                }

                // Check for overlapping reservations
                var reservations = await _context.Reservations
                    .Where(r => r.TableId == createReservationDto.TableId &&
                               r.Date.Date == createReservationDto.Date.Date &&
                               r.Status != ReservationStatus.Cancelled)
                    .ToListAsync();

                _logger.LogInformation($"Found {reservations.Count} existing reservations for this table and date");

                var hasOverlap = reservations.Any(r =>
                    (createReservationDto.TimeFrom >= r.TimeFrom && createReservationDto.TimeFrom < r.TimeTo) ||
                    (createReservationDto.TimeTo > r.TimeFrom && createReservationDto.TimeTo <= r.TimeTo));

                if (hasOverlap)
                {
                    return BadRequest("Time slot is already reserved");
                }

                var reservation = _mapper.Map<Reservation>(createReservationDto);
                reservation.UserId = userId;
                reservation.Status = ReservationStatus.Pending;

                _logger.LogInformation($"Created reservation object: UserId={reservation.UserId}, TableId={reservation.TableId}, Status={reservation.Status}");

                // Update table availability
                table.IsAvailable = false;
                _context.Tables.Update(table);

                _context.Reservations.Add(reservation);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Reservation saved successfully with ID: {reservation.Id}");

                var result = _mapper.Map<ReservationDto>(reservation);
                _logger.LogInformation($"Mapped reservation to DTO: {result != null}");

                return CreatedAtAction(nameof(GetReservation), new { id = reservation.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating reservation");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateReservationStatus(int id, UpdateReservationStatusDto updateStatusDto)
        {
            var reservation = await _context.Reservations.FindAsync(id);

            if (reservation == null)
            {
                return NotFound();
            }

            reservation.Status = updateStatusDto.Status;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("{id}/cancel")]
        [Authorize(Roles = "User,Admin")]
        public async Task<IActionResult> CancelReservation(int id)
        {
            try
            {
                _logger.LogInformation($"Cancelling reservation {id}");
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var isAdmin = User.IsInRole("Admin");

                var reservation = await _context.Reservations
                    .Include(r => r.Table)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (reservation == null)
                {
                    _logger.LogWarning($"Reservation {id} not found");
                    return NotFound();
                }

                if (!isAdmin && reservation.UserId != userId)
                {
                    _logger.LogWarning($"User {userId} is not authorized to cancel reservation {id}");
                    return Forbid();
                }

                _logger.LogInformation($"Found reservation for table {reservation.TableId}");
                reservation.Status = ReservationStatus.Cancelled;
                
                // Update table availability
                var table = reservation.Table;
                if (table != null)
                {
                    _logger.LogInformation($"Updating table {table.Id} availability to true");
                    table.IsAvailable = true;
                    _context.Tables.Update(table);
                }
                else
                {
                    _logger.LogWarning($"Table not found for reservation {id}");
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Reservation {id} cancelled successfully");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error cancelling reservation {id}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
} 