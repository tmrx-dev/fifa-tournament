using AutoMapper;
using Microsoft.EntityFrameworkCore;
using FifaTournament.Api.Data;
using FifaTournament.Api.DTOs;
using FifaTournament.Api.Models;

namespace FifaTournament.Api.Services
{
    public class TeamService : ITeamService
    {
        private readonly FifaTournamentContext _context;
        private readonly IMapper _mapper;

        public TeamService(FifaTournamentContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<TeamDto?> GetTeamByIdAsync(Guid id)
        {
            var team = await _context.Teams
                .Include(t => t.Owner)
                .FirstOrDefaultAsync(t => t.Id == id);

            return team != null ? _mapper.Map<TeamDto>(team) : null;
        }

        public async Task<TeamDto?> GetTeamByOwnerIdAsync(Guid ownerId)
        {
            var team = await _context.Teams
                .Include(t => t.Owner)
                .FirstOrDefaultAsync(t => t.OwnerId == ownerId);

            return team != null ? _mapper.Map<TeamDto>(team) : null;
        }

        public async Task<IEnumerable<TeamDto>> GetTeamsAsync()
        {
            try
            {
                Console.WriteLine("🔧 TeamService.GetTeamsAsync: Starting query...");
                
                var teams = await _context.Teams
                    .Include(t => t.Owner)
                    .OrderBy(t => t.Name)
                    .ToListAsync();
                
                Console.WriteLine($"🔧 TeamService.GetTeamsAsync: Found {teams.Count} teams in database");
                
                // Log each team for debugging
                foreach (var team in teams)
                {
                    Console.WriteLine($"🔧 Team: {team.Name}, Owner: {team.Owner?.DisplayName ?? "NULL"}, OwnerId: {team.OwnerId}");
                }
                
                Console.WriteLine("🔧 TeamService.GetTeamsAsync: Starting AutoMapper mapping...");
                var mappedTeams = _mapper.Map<IEnumerable<TeamDto>>(teams);
                Console.WriteLine($"🔧 TeamService.GetTeamsAsync: Successfully mapped {mappedTeams.Count()} teams");
                
                return mappedTeams;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔧 ❌ TeamService.GetTeamsAsync ERROR: {ex.GetType().Name}: {ex.Message}");
                Console.WriteLine($"🔧 ❌ Stack: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<bool> UserHasTeamAsync(Guid userId)
        {
            return await _context.Teams.AnyAsync(t => t.OwnerId == userId);
        }

        public async Task<TeamDto> CreateTeamAsync(Guid ownerId, CreateTeamDto createTeamDto)
        {
            // Check if user already has a team
            var existingTeam = await _context.Teams.FirstOrDefaultAsync(t => t.OwnerId == ownerId);
            if (existingTeam != null)
            {
                throw new InvalidOperationException("User already has a team");
            }

            var team = _mapper.Map<Team>(createTeamDto);
            team.Id = Guid.NewGuid();
            team.OwnerId = ownerId;

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            // Load the team with owner for mapping
            var createdTeam = await _context.Teams
                .Include(t => t.Owner)
                .FirstAsync(t => t.Id == team.Id);

            return _mapper.Map<TeamDto>(createdTeam);
        }

        public async Task<TeamDto?> UpdateTeamAsync(Guid id, Guid ownerId, UpdateTeamDto updateTeamDto)
        {
            var team = await _context.Teams
                .Include(t => t.Owner)
                .FirstOrDefaultAsync(t => t.Id == id && t.OwnerId == ownerId);
            
            if (team == null) return null;

            _mapper.Map(updateTeamDto, team);
            await _context.SaveChangesAsync();

            return _mapper.Map<TeamDto>(team);
        }

        public async Task<bool> DeleteTeamAsync(Guid id, Guid ownerId)
        {
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == id && t.OwnerId == ownerId);
            if (team == null) return false;

            // Check if team is in any active tournaments
            var activeParticipation = await _context.TournamentTeams
                .AnyAsync(tt => tt.TeamId == id && 
                    (tt.Tournament.Status == TournamentStatus.Open || 
                     tt.Tournament.Status == TournamentStatus.InProgress));

            if (activeParticipation)
            {
                throw new InvalidOperationException("Cannot delete team while participating in active tournaments");
            }

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
