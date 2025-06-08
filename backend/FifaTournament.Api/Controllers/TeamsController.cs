using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FifaTournament.Api.Services;
using FifaTournament.Api.DTOs;
using System.Security.Claims;

namespace FifaTournament.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamsController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamsController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<TeamDto>>> GetTeams()
        {
            try
            {
                Console.WriteLine("🔍 GetTeams: Starting to get teams...");
                
                // Test the service call step by step
                Console.WriteLine("🔍 GetTeams: Calling _teamService.GetTeamsAsync()...");
                var teams = await _teamService.GetTeamsAsync();
                Console.WriteLine($"🔍 GetTeams: Successfully retrieved {teams.Count()} teams");
                
                Console.WriteLine("🔍 GetTeams: Returning Ok result...");
                return Ok(teams);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ CRITICAL ERROR in GetTeams: {ex.GetType().Name}: {ex.Message}");
                Console.WriteLine($"❌ Full Stack trace: {ex.StackTrace}");
                
                var currentEx = ex;
                int depth = 0;
                while (currentEx != null && depth < 5)
                {
                    Console.WriteLine($"❌ Exception[{depth}]: {currentEx.GetType().Name}: {currentEx.Message}");
                    if (currentEx.StackTrace != null)
                    {
                        Console.WriteLine($"❌ StackTrace[{depth}]: {currentEx.StackTrace}");
                    }
                    currentEx = currentEx.InnerException;
                    depth++;
                }
                
                // Return detailed error information
                return StatusCode(500, new { 
                    error = ex.Message, 
                    type = ex.GetType().Name,
                    details = ex.StackTrace,
                    innerException = ex.InnerException?.Message,
                    innerType = ex.InnerException?.GetType().Name
                });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<TeamDto>> GetTeam(Guid id)
        {
            var team = await _teamService.GetTeamByIdAsync(id);
            if (team == null)
                return NotFound();

            return team;
        }

        [HttpGet("my-team")]
        [Authorize]
        public async Task<ActionResult<TeamDto>> GetMyTeam()
        {
            var currentUserId = GetCurrentUserId();
            var team = await _teamService.GetTeamByOwnerIdAsync(currentUserId);
            if (team == null)
                return NotFound("You don't have a team yet.");

            return team;
        }

        [HttpGet("has-team")]
        [Authorize]
        public async Task<ActionResult<bool>> HasTeam()
        {
            var currentUserId = GetCurrentUserId();
            var hasTeam = await _teamService.UserHasTeamAsync(currentUserId);
            return Ok(hasTeam);
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<TeamDto>> CreateTeam(CreateTeamDto createTeamDto)
        {
            var currentUserId = GetCurrentUserId();
            
            try
            {
                var team = await _teamService.CreateTeamAsync(currentUserId, createTeamDto);
                return CreatedAtAction(nameof(GetTeam), new { id = team.Id }, team);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<TeamDto>> UpdateTeam(Guid id, UpdateTeamDto updateTeamDto)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var team = await _teamService.UpdateTeamAsync(id, currentUserId, updateTeamDto);
                if (team == null)
                    return NotFound();

                return team;
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteTeam(Guid id)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var result = await _teamService.DeleteTeamAsync(id, currentUserId);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        private Guid GetCurrentUserId()
        {
            // For JWT tokens, user ID is stored in the 'sub' claim
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                             User.FindFirst("sub")?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }
    }
}
