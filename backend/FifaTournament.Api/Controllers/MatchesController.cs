using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FifaTournament.Api.Services;
using FifaTournament.Api.DTOs;
using System.Security.Claims;

namespace FifaTournament.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MatchesController : ControllerBase
    {
        private readonly IMatchService _matchService;

        public MatchesController(IMatchService matchService)
        {
            _matchService = matchService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MatchDto>> GetMatch(Guid id)
        {
            var currentUserId = GetCurrentUserIdOrNull();
            var match = await _matchService.GetMatchByIdAsync(id, currentUserId);
            if (match == null)
                return NotFound();

            return match;
        }

        [HttpPost("{id}/record-result")]
        public async Task<ActionResult<MatchDto>> RecordMatchResult(Guid id, RecordMatchResultDto recordResultDto)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var match = await _matchService.RecordMatchResultAsync(id, currentUserId, recordResultDto);
                if (match == null)
                    return NotFound();

                return match;
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("team/{teamId}")]
        public async Task<ActionResult<IEnumerable<MatchDto>>> GetTeamMatches(Guid teamId)
        {
            var currentUserId = GetCurrentUserIdOrNull();
            var matches = await _matchService.GetTeamMatchesAsync(teamId, currentUserId);
            return Ok(matches);
        }

        private Guid? GetCurrentUserIdOrNull()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }
    }
}
