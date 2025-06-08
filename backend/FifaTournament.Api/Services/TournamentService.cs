using AutoMapper;
using Microsoft.EntityFrameworkCore;
using FifaTournament.Api.Data;
using FifaTournament.Api.DTOs;
using FifaTournament.Api.Models;

namespace FifaTournament.Api.Services
{
    public class TournamentService : ITournamentService
    {
        private readonly FifaTournamentContext _context;
        private readonly IMapper _mapper;

        public TournamentService(FifaTournamentContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<TournamentDto?> GetTournamentByIdAsync(Guid id, Guid? userId = null)
        {
            var tournament = await _context.Tournaments
                .Include(t => t.CreatedBy)
                .Include(t => t.TournamentTeams)
                    .ThenInclude(tt => tt.Team)
                        .ThenInclude(t => t!.Owner)
                .Include(t => t.TournamentUsers)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tournament == null) return null;

            var dto = _mapper.Map<TournamentDto>(tournament);
            
            // Set computed properties
            dto.TeamCount = tournament.TournamentTeams.Count;
            dto.IsFull = dto.TeamCount >= tournament.MaxTeams;
            dto.CanStart = dto.TeamCount >= tournament.MinTeams && 
                          tournament.Status == TournamentStatus.Open;
            
            if (userId.HasValue)
            {
                dto.IsUserParticipant = tournament.TournamentUsers.Any(tu => tu.UserId == userId.Value);
                dto.IsUserAdmin = tournament.CreatedById == userId.Value;
            }

            return dto;
        }

        public async Task<IEnumerable<TournamentSummaryDto>> GetTournamentsAsync(Guid? userId = null)
        {
            var query = _context.Tournaments
                .Include(t => t.CreatedBy)
                .Include(t => t.TournamentTeams)
                .AsQueryable();

            var tournaments = await query.ToListAsync();

            return tournaments.Select(t =>
            {
                var dto = _mapper.Map<TournamentSummaryDto>(t);
                dto.TeamCount = t.TournamentTeams.Count;
                return dto;
            });
        }

        public async Task<IEnumerable<TournamentSummaryDto>> GetUserTournamentsAsync(Guid userId)
        {
            var tournaments = await _context.Tournaments
                .Include(t => t.CreatedBy)
                .Include(t => t.TournamentTeams)
                .Include(t => t.TournamentUsers)
                .Where(t => t.CreatedById == userId || t.TournamentUsers.Any(tu => tu.UserId == userId))
                .ToListAsync();

            return tournaments.Select(t =>
            {
                var dto = _mapper.Map<TournamentSummaryDto>(t);
                dto.TeamCount = t.TournamentTeams.Count;
                return dto;
            });
        }

        public async Task<TournamentDto> CreateTournamentAsync(Guid createdById, CreateTournamentDto createTournamentDto)
        {
            var user = await _context.Users.FindAsync(createdById);
            if (user == null)
                throw new ArgumentException("User not found", nameof(createdById));

            var tournament = _mapper.Map<Tournament>(createTournamentDto);
            tournament.Id = Guid.NewGuid();
            tournament.CreatedById = createdById;
            tournament.Status = TournamentStatus.Draft;

            _context.Tournaments.Add(tournament);
            await _context.SaveChangesAsync();

            return await GetTournamentByIdAsync(tournament.Id, createdById) ?? 
                   throw new InvalidOperationException("Failed to retrieve created tournament");
        }

        public async Task<TournamentDto?> UpdateTournamentAsync(Guid id, Guid userId, UpdateTournamentDto updateTournamentDto)
        {
            var tournament = await _context.Tournaments.FindAsync(id);
            if (tournament == null) return null;

            // Only tournament creator can update
            if (tournament.CreatedById != userId)
                throw new UnauthorizedAccessException("Only tournament creator can update tournament");

            // Can only update if tournament is in Draft status
            if (tournament.Status != TournamentStatus.Draft)
                throw new InvalidOperationException("Can only update tournaments in Draft status");

            _mapper.Map(updateTournamentDto, tournament);
            await _context.SaveChangesAsync();

            return await GetTournamentByIdAsync(id, userId);
        }

        public async Task<bool> DeleteTournamentAsync(Guid id, Guid userId)
        {
            var tournament = await _context.Tournaments.FindAsync(id);
            if (tournament == null) return false;

            // Only tournament creator can delete
            if (tournament.CreatedById != userId)
                throw new UnauthorizedAccessException("Only tournament creator can delete tournament");

            // Can only delete if tournament is in Draft status
            if (tournament.Status != TournamentStatus.Draft)
                throw new InvalidOperationException("Can only delete tournaments in Draft status");

            _context.Tournaments.Remove(tournament);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> JoinTournamentAsync(Guid tournamentId, Guid userId)
        {
            var tournament = await _context.Tournaments
                .Include(t => t.TournamentTeams)
                .Include(t => t.TournamentUsers)
                .FirstOrDefaultAsync(t => t.Id == tournamentId);

            if (tournament == null) return false;

            // Check if tournament is open for registration
            if (tournament.Status != TournamentStatus.Open)
                throw new InvalidOperationException("Tournament is not open for registration");

            // Check if tournament is full
            if (tournament.TournamentTeams.Count >= tournament.MaxTeams)
                throw new InvalidOperationException("Tournament is full");

            // Check if user already joined
            if (tournament.TournamentUsers.Any(tu => tu.UserId == userId))
                return true; // Already joined

            // Check if user has a team
            var userTeam = await _context.Teams.FirstOrDefaultAsync(t => t.OwnerId == userId);
            if (userTeam == null)
                throw new InvalidOperationException("User must have a team to join tournament");

            // Check if team is already in tournament
            if (tournament.TournamentTeams.Any(tt => tt.TeamId == userTeam.Id))
                throw new InvalidOperationException("Team is already in tournament");

            // Add user and team to tournament
            var tournamentUser = new TournamentUser
            {
                TournamentId = tournamentId,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            };

            var tournamentTeam = new TournamentTeam
            {
                TournamentId = tournamentId,
                TeamId = userTeam.Id,
                JoinedAt = DateTime.UtcNow
            };

            _context.TournamentUsers.Add(tournamentUser);
            _context.TournamentTeams.Add(tournamentTeam);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> LeaveTournamentAsync(Guid tournamentId, Guid userId)
        {
            var tournament = await _context.Tournaments
                .Include(t => t.TournamentUsers)
                .Include(t => t.TournamentTeams)
                    .ThenInclude(tt => tt.Team)
                .FirstOrDefaultAsync(t => t.Id == tournamentId);

            if (tournament == null) return false;

            // Can only leave if tournament is not started
            if (tournament.Status == TournamentStatus.InProgress || tournament.Status == TournamentStatus.Completed)
                throw new InvalidOperationException("Cannot leave tournament that has started or completed");

            var tournamentUser = tournament.TournamentUsers.FirstOrDefault(tu => tu.UserId == userId);
            if (tournamentUser == null) return false; // Not in tournament

            // Find and remove user's team from tournament
            var userTeam = await _context.Teams.FirstOrDefaultAsync(t => t.OwnerId == userId);
            if (userTeam != null)
            {
                var tournamentTeam = tournament.TournamentTeams.FirstOrDefault(tt => tt.TeamId == userTeam.Id);
                if (tournamentTeam != null)
                {
                    _context.TournamentTeams.Remove(tournamentTeam);
                }
            }

            _context.TournamentUsers.Remove(tournamentUser);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> StartTournamentAsync(Guid id, Guid userId)
        {
            var tournament = await _context.Tournaments
                .Include(t => t.TournamentTeams)
                    .ThenInclude(tt => tt.Team)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tournament == null) return false;

            // Only tournament creator can start
            if (tournament.CreatedById != userId)
                throw new UnauthorizedAccessException("Only tournament creator can start tournament");

            // Check if tournament can be started
            if (tournament.Status != TournamentStatus.Open)
                throw new InvalidOperationException("Tournament must be open to start");

            if (tournament.TournamentTeams.Count < tournament.MinTeams)
                throw new InvalidOperationException($"Tournament needs at least {tournament.MinTeams} teams to start");

            // Update tournament status
            tournament.Status = TournamentStatus.InProgress;
            tournament.StartedAt = DateTime.UtcNow;

            // Generate tournament bracket (matches)
            GenerateTournamentBracket(tournament);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CompleteTournamentAsync(Guid id, Guid userId)
        {
            var tournament = await _context.Tournaments.FindAsync(id);
            if (tournament == null) return false;

            // Only tournament creator can complete
            if (tournament.CreatedById != userId)
                throw new UnauthorizedAccessException("Only tournament creator can complete tournament");

            // Check if tournament can be completed
            if (tournament.Status != TournamentStatus.InProgress)
                throw new InvalidOperationException("Tournament must be in progress to complete");

            tournament.Status = TournamentStatus.Completed;
            tournament.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<MatchDto>> GetTournamentMatchesAsync(Guid tournamentId, Guid? userId = null)
        {
            var matches = await _context.Matches
                .Include(m => m.HomeTeam)
                    .ThenInclude(t => t!.Owner)
                .Include(m => m.AwayTeam)
                    .ThenInclude(t => t!.Owner)
                .Include(m => m.WinnerTeam)
                    .ThenInclude(t => t!.Owner)
                .Include(m => m.RecordedBy)
                .Where(m => m.TournamentId == tournamentId)
                .OrderBy(m => m.Round)
                .ThenBy(m => m.MatchNumber)
                .ToListAsync();

            var dtos = _mapper.Map<List<MatchDto>>(matches);

            // Set computed properties
            foreach (var dto in dtos)
            {
                var match = matches.First(m => m.Id == dto.Id);
                dto.IsCompleted = match.Status == MatchStatus.Completed;
                dto.ScoreDisplay = match.Status == MatchStatus.Completed 
                    ? $"{match.HomeTeamScore} - {match.AwayTeamScore}"
                    : "vs";
                
                if (userId.HasValue)
                {
                    // User can record result if they are participant in the match
                    dto.CanRecordResult = match.Status == MatchStatus.Scheduled &&
                        (match.HomeTeam?.OwnerId == userId.Value || match.AwayTeam?.OwnerId == userId.Value);
                }
            }

            return dtos;
        }

        private void GenerateTournamentBracket(Tournament tournament)
        {
            var teams = tournament.TournamentTeams.Select(tt => tt.Team!).ToList();
            var teamCount = teams.Count;

            if (teamCount < 2)
                throw new InvalidOperationException("At least 2 teams are required to generate a bracket");

            // Shuffle teams for random draw
            var random = new Random();
            teams = teams.OrderBy(x => random.Next()).ToList();

            // Generate single elimination bracket
            var matches = new List<Match>();
            var currentRound = MatchRound.Round1;
            var matchNumber = 1;

            // Generate first round matches
            var firstRoundTeams = new List<Team>(teams);
            
            // If odd number of teams, one team gets a bye (automatically advances)
            if (teamCount % 2 == 1)
            {
                // Last team gets a bye to next round
                var byeTeam = firstRoundTeams.Last();
                firstRoundTeams.RemoveAt(firstRoundTeams.Count - 1);
                
                // Create a bye match (team vs null)
                var byeMatch = new Match
                {
                    Id = Guid.NewGuid(),
                    TournamentId = tournament.Id,
                    HomeTeamId = byeTeam.Id,
                    AwayTeamId = null, // Bye - no opponent
                    Round = currentRound,
                    MatchNumber = matchNumber++,
                    Status = MatchStatus.Completed, // Bye matches are automatically completed
                    HomeTeamScore = 1, // Bye team "wins" 1-0
                    AwayTeamScore = 0,
                    WinnerTeamId = byeTeam.Id,
                    PlayedAt = DateTime.UtcNow
                };
                matches.Add(byeMatch);
            }

            // Create first round matches for remaining teams
            for (int i = 0; i < firstRoundTeams.Count; i += 2)
            {
                if (i + 1 < firstRoundTeams.Count)
                {
                    var match = new Match
                    {
                        Id = Guid.NewGuid(),
                        TournamentId = tournament.Id,
                        HomeTeamId = firstRoundTeams[i].Id,
                        AwayTeamId = firstRoundTeams[i + 1].Id,
                        Round = currentRound,
                        MatchNumber = matchNumber++,
                        Status = MatchStatus.Scheduled
                    };
                    matches.Add(match);
                }
            }

            // Generate subsequent rounds (placeholders)
            var roundMatches = matches.Where(m => m.Round == currentRound).Count();
            var totalWinners = roundMatches; // Including bye winners
            
            while (totalWinners > 1)
            {
                currentRound = (MatchRound)((int)currentRound + 1);
                var nextRoundMatchCount = totalWinners / 2;
                
                for (int i = 0; i < nextRoundMatchCount; i++)
                {
                    var match = new Match
                    {
                        Id = Guid.NewGuid(),
                        TournamentId = tournament.Id,
                        HomeTeamId = null, // TBD - will be filled when previous round completes
                        AwayTeamId = null, // TBD - will be filled when previous round completes
                        Round = currentRound,
                        MatchNumber = matchNumber++,
                        Status = MatchStatus.Scheduled
                    };
                    matches.Add(match);
                }
                
                totalWinners = nextRoundMatchCount;
            }

            _context.Matches.AddRange(matches);
            
            Console.WriteLine($"✅ Generated tournament bracket:");
            Console.WriteLine($"   - {teamCount} teams (shuffled for random draw)");
            Console.WriteLine($"   - {matches.Count} total matches across {(int)currentRound} rounds");
            Console.WriteLine($"   - {matches.Count(m => m.Round == MatchRound.Round1)} first round matches");
        }
    }
}
