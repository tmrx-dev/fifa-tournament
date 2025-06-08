using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FifaTournament.Api.Services;
using FifaTournament.Api.DTOs;
using System.Security.Claims;

namespace FifaTournament.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TournamentsController : ControllerBase
    {
        private readonly ITournamentService _tournamentService;

        public TournamentsController(ITournamentService tournamentService)
        {
            _tournamentService = tournamentService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TournamentSummaryDto>>> GetTournaments()
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrNull();
                var tournaments = await _tournamentService.GetTournamentsAsync(currentUserId);
                return Ok(tournaments);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTournaments: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TournamentDto>> GetTournament(Guid id)
        {
            var currentUserId = GetCurrentUserIdOrNull();
            var tournament = await _tournamentService.GetTournamentByIdAsync(id, currentUserId);
            if (tournament == null)
                return NotFound();

            return tournament;
        }

        [HttpGet("my-tournaments")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<TournamentSummaryDto>>> GetMyTournaments()
        {
            var currentUserId = GetCurrentUserId();
            var tournaments = await _tournamentService.GetUserTournamentsAsync(currentUserId);
            return Ok(tournaments);
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<TournamentDto>> CreateTournament(CreateTournamentDto createTournamentDto)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var tournament = await _tournamentService.CreateTournamentAsync(currentUserId, createTournamentDto);
                return CreatedAtAction(nameof(GetTournament), new { id = tournament.Id }, tournament);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<TournamentDto>> UpdateTournament(Guid id, UpdateTournamentDto updateTournamentDto)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var tournament = await _tournamentService.UpdateTournamentAsync(id, currentUserId, updateTournamentDto);
                if (tournament == null)
                    return NotFound();

                return tournament;
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteTournament(Guid id)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var result = await _tournamentService.DeleteTournamentAsync(id, currentUserId);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/join")]
        [Authorize]
        public async Task<IActionResult> JoinTournament(Guid id)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var result = await _tournamentService.JoinTournamentAsync(id, currentUserId);
                if (!result)
                    return NotFound();

                return Ok(new { message = "Successfully joined tournament" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/leave")]
        [Authorize]
        public async Task<IActionResult> LeaveTournament(Guid id)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var result = await _tournamentService.LeaveTournamentAsync(id, currentUserId);
                if (!result)
                    return NotFound();

                return Ok(new { message = "Successfully left tournament" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/start")]
        [Authorize]
        public async Task<IActionResult> StartTournament(Guid id)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var result = await _tournamentService.StartTournamentAsync(id, currentUserId);
                if (!result)
                    return NotFound();

                return Ok(new { message = "Tournament started successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/complete")]
        [Authorize]
        public async Task<IActionResult> CompleteTournament(Guid id)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var result = await _tournamentService.CompleteTournamentAsync(id, currentUserId);
                if (!result)
                    return NotFound();

                return Ok(new { message = "Tournament completed successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}/matches")]
        public async Task<ActionResult<IEnumerable<MatchDto>>> GetTournamentMatches(Guid id)
        {
            var currentUserId = GetCurrentUserIdOrNull();
            var matches = await _tournamentService.GetTournamentMatchesAsync(id, currentUserId);
            return Ok(matches);
        }

        private Guid? GetCurrentUserIdOrNull()
        {
            // For JWT tokens, user ID is stored in the 'sub' claim
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                             User.FindFirst("sub")?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        private Guid GetCurrentUserId()
        {
            // For JWT tokens, user ID is stored in the 'sub' claim
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                             User.FindFirst("sub")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
                return userId;
            
            throw new UnauthorizedAccessException("User ID not found in token");
        }
    }
}
