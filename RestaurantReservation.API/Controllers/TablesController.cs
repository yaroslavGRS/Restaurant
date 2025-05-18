using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RestaurantReservation.API.Data;
using RestaurantReservation.API.DTOs;
using RestaurantReservation.API.Models;
using AutoMapper;

namespace RestaurantReservation.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TablesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public TablesController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<TableDto>>> GetTables()
        {
            var tables = await _context.Tables.ToListAsync();
            return Ok(_mapper.Map<IEnumerable<TableDto>>(tables));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<TableDto>> GetTable(int id)
        {
            var table = await _context.Tables.FindAsync(id);

            if (table == null)
            {
                return NotFound();
            }

            return _mapper.Map<TableDto>(table);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<TableDto>> CreateTable(CreateTableDto createTableDto)
        {
            if (await _context.Tables.AnyAsync(t => t.Number == createTableDto.Number))
            {
                return BadRequest("Table number already exists");
            }

            var table = _mapper.Map<Table>(createTableDto);
            _context.Tables.Add(table);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTable), new { id = table.Id }, _mapper.Map<TableDto>(table));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTable(int id, UpdateTableDto updateTableDto)
        {
            var table = await _context.Tables.FindAsync(id);

            if (table == null)
            {
                return NotFound();
            }

            if (await _context.Tables.AnyAsync(t => t.Number == updateTableDto.Number && t.Id != id))
            {
                return BadRequest("Table number already exists");
            }

            _mapper.Map(updateTableDto, table);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTable(int id)
        {
            var table = await _context.Tables.FindAsync(id);

            if (table == null)
            {
                return NotFound();
            }

            if (await _context.Reservations.AnyAsync(r => r.TableId == id))
            {
                return BadRequest("Cannot delete table with existing reservations");
            }

            _context.Tables.Remove(table);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}/force")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ForceDeleteTable(int id)
        {
            var table = await _context.Tables
                .Include(t => t.Reservations)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (table == null)
            {
                return NotFound();
            }

            // Delete all reservations for this table
            _context.Reservations.RemoveRange(table.Reservations);
            
            // Delete the table
            _context.Tables.Remove(table);
            
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
} 