using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FifaTournament.Api.Data;
using FifaTournament.Api.Services;
using AutoMapper;
using FifaTournament.Api.Models;
using FifaTournament.Api.DTOs;

namespace FifaTournament.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly FifaTournamentContext _context;
        private readonly ITeamService _teamService;
        private readonly IMapper _mapper;

        public HealthController(FifaTournamentContext context, ITeamService teamService, IMapper mapper)
        {
            _context = context;
            _teamService = teamService;
            _mapper = mapper;
        }

        [HttpGet]
        public IActionResult GetHealth()
        {
            return Ok(new { 
                status = "healthy", 
                timestamp = DateTime.UtcNow,
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "unknown"
            });
        }
        
        [HttpGet("detailed")]
        public IActionResult GetDetailedHealth()
        {
            try
            {
                // Test database connectivity
                var canConnect = _context.Database.CanConnect();
                var databaseProvider = _context.Database.ProviderName;
                
                return Ok(new { 
                    status = "healthy", 
                    timestamp = DateTime.UtcNow,
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "unknown",
                    database = new {
                        canConnect = canConnect,
                        provider = databaseProvider
                    }
                });
            }
            catch (Exception ex)
            {
                return Ok(new { 
                    status = "unhealthy", 
                    timestamp = DateTime.UtcNow,
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "unknown",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("teams-debug")]
        [AllowAnonymous]
        public async Task<IActionResult> DebugTeams()
        {
            try
            {
                Console.WriteLine("🩺 HealthController.DebugTeams: Starting...");
                
                // Step 1: Test raw EF query
                Console.WriteLine("🩺 Step 1: Testing raw EF query...");
                var rawTeams = await _context.Teams.ToListAsync();
                Console.WriteLine($"🩺 Raw teams count: {rawTeams.Count}");
                
                // Step 2: Test EF query with Include
                Console.WriteLine("🩺 Step 2: Testing EF query with Include...");
                var teamsWithOwners = await _context.Teams.Include(t => t.Owner).ToListAsync();
                Console.WriteLine($"🩺 Teams with owners count: {teamsWithOwners.Count}");
                
                // Step 3: Test individual team mapping
                if (teamsWithOwners.Any())
                {
                    Console.WriteLine("🩺 Step 3: Testing individual team mapping...");
                    var firstTeam = teamsWithOwners.First();
                    Console.WriteLine($"🩺 First team: {firstTeam.Name}, Owner: {firstTeam.Owner?.DisplayName ?? "NULL"}");
                    
                    var mappedTeam = _mapper.Map<TeamDto>(firstTeam);
                    Console.WriteLine($"🩺 Mapped team: {mappedTeam.Name}, OwnerName: {mappedTeam.OwnerName}");
                }
                
                // Step 4: Test collection mapping
                Console.WriteLine("🩺 Step 4: Testing collection mapping...");
                var mappedTeams = _mapper.Map<IEnumerable<TeamDto>>(teamsWithOwners);
                Console.WriteLine($"🩺 Mapped teams count: {mappedTeams.Count()}");
                
                return Ok(new { 
                    rawTeamsCount = rawTeams.Count,
                    teamsWithOwnersCount = teamsWithOwners.Count,
                    mappedTeamsCount = mappedTeams.Count(),
                    firstTeamData = teamsWithOwners.Any() ? new {
                        name = teamsWithOwners.First().Name,
                        ownerName = teamsWithOwners.First().Owner?.DisplayName
                    } : null,
                    timestamp = DateTime.UtcNow 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🩺 ❌ DebugTeams ERROR: {ex.GetType().Name}: {ex.Message}");
                Console.WriteLine($"🩺 ❌ Stack: {ex.StackTrace}");
                
                return StatusCode(500, new { 
                    error = ex.Message, 
                    type = ex.GetType().Name,
                    stackTrace = ex.StackTrace,
                    innerException = ex.InnerException?.Message,
                    timestamp = DateTime.UtcNow 
                });
            }
        }

        [HttpGet("test-teams-service")]
        [AllowAnonymous]
        public async Task<IActionResult> TestTeamService()
        {
            try
            {
                Console.WriteLine("🧪 Testing ITeamService injection...");
                
                // Test if we can call the team service
                var teams = await _teamService.GetTeamsAsync();
                Console.WriteLine($"🧪 ITeamService.GetTeamsAsync() returned {teams.Count()} teams");
                
                return Ok(new { 
                    success = true,
                    teamsCount = teams.Count(),
                    teams = teams,
                    timestamp = DateTime.UtcNow 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🧪 ❌ ITeamService test ERROR: {ex.GetType().Name}: {ex.Message}");
                
                return StatusCode(500, new { 
                    error = ex.Message, 
                    type = ex.GetType().Name,
                    stackTrace = ex.StackTrace,
                    innerException = ex.InnerException?.Message,
                    timestamp = DateTime.UtcNow 
                });
            }
        }
    }
}
