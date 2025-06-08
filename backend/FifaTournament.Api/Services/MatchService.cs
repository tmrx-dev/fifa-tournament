using AutoMapper;
using Microsoft.EntityFrameworkCore;
using FifaTournament.Api.Data;
using FifaTournament.Api.DTOs;
using FifaTournament.Api.Models;

namespace FifaTournament.Api.Services
{
    public class MatchService : IMatchService
    {
        private readonly FifaTournamentContext _context;
        private readonly IMapper _mapper;

        public MatchService(FifaTournamentContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<MatchDto?> GetMatchByIdAsync(Guid id, Guid? userId = null)
        {
            var match = await _context.Matches
                .Include(m => m.HomeTeam)
                    .ThenInclude(t => t!.Owner)
                .Include(m => m.AwayTeam)
                    .ThenInclude(t => t!.Owner)
                .Include(m => m.WinnerTeam)
                    .ThenInclude(t => t!.Owner)
                .Include(m => m.RecordedBy)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (match == null) return null;

            var dto = _mapper.Map<MatchDto>(match);
            
            // Set computed properties
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

            return dto;
        }

        public async Task<MatchDto?> RecordMatchResultAsync(Guid matchId, Guid userId, RecordMatchResultDto recordResultDto)
        {
            var match = await _context.Matches
                .Include(m => m.HomeTeam)
                .Include(m => m.AwayTeam)
                .Include(m => m.Tournament)
                .FirstOrDefaultAsync(m => m.Id == matchId);

            if (match == null) return null;

            // Validate that user can record this result
            if (match.HomeTeam?.OwnerId != userId && match.AwayTeam?.OwnerId != userId)
                throw new UnauthorizedAccessException("Only match participants can record results");

            // Validate match status
            if (match.Status != MatchStatus.Scheduled)
                throw new InvalidOperationException("Can only record results for scheduled matches");

            // Validate tournament status
            if (match.Tournament?.Status != TournamentStatus.InProgress)
                throw new InvalidOperationException("Can only record results for matches in active tournaments");

            // Validate scores
            if (recordResultDto.HomeTeamScore < 0 || recordResultDto.AwayTeamScore < 0)
                throw new ArgumentException("Scores cannot be negative");

            // Update match
            match.HomeTeamScore = recordResultDto.HomeTeamScore;
            match.AwayTeamScore = recordResultDto.AwayTeamScore;
            match.Status = MatchStatus.Completed;
            match.PlayedAt = DateTime.UtcNow;
            match.RecordedById = userId;

            // Determine winner
            if (recordResultDto.HomeTeamScore > recordResultDto.AwayTeamScore)
            {
                match.WinnerTeamId = match.HomeTeamId;
            }
            else if (recordResultDto.AwayTeamScore > recordResultDto.HomeTeamScore)
            {
                match.WinnerTeamId = match.AwayTeamId;
            }
            // If it's a tie, WinnerTeamId remains null

            await _context.SaveChangesAsync();

            // Check if we need to advance winner to next round
            await AdvanceWinnerToNextRoundAsync(match);

            return await GetMatchByIdAsync(matchId, userId);
        }

        public async Task<IEnumerable<MatchDto>> GetTeamMatchesAsync(Guid teamId, Guid? userId = null)
        {
            var matches = await _context.Matches
                .Include(m => m.HomeTeam)
                    .ThenInclude(t => t!.Owner)
                .Include(m => m.AwayTeam)
                    .ThenInclude(t => t!.Owner)
                .Include(m => m.WinnerTeam)
                    .ThenInclude(t => t!.Owner)
                .Include(m => m.RecordedBy)
                .Include(m => m.Tournament)
                .Where(m => m.HomeTeamId == teamId || m.AwayTeamId == teamId)
                .OrderByDescending(m => m.CreatedAt)
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

        private async Task AdvanceWinnerToNextRoundAsync(Match completedMatch)
        {
            if (completedMatch.WinnerTeamId == null) return; // No winner (tie)

            var tournament = await _context.Tournaments
                .Include(t => t.Matches)
                .FirstOrDefaultAsync(t => t.Id == completedMatch.TournamentId);

            if (tournament == null) return;

            // For now, just implement basic single elimination logic
            // In a full implementation, you'd have more sophisticated bracket advancement
            var nextRound = GetNextRound(completedMatch.Round);
            if (nextRound == null) 
            {
                // This was the final match, tournament is complete
                tournament.Status = TournamentStatus.Completed;
                tournament.CompletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return;
            }

            // Check if there's already a match in the next round for this winner
            var existingNextMatch = tournament.Matches
                .FirstOrDefault(m => m.Round == nextRound && 
                                   (!m.HomeTeamId.HasValue || !m.AwayTeamId.HasValue));

            if (existingNextMatch != null)
            {
                // Add winner to existing match
                if (!existingNextMatch.HomeTeamId.HasValue)
                {
                    existingNextMatch.HomeTeamId = completedMatch.WinnerTeamId;
                }
                else if (!existingNextMatch.AwayTeamId.HasValue)
                {
                    existingNextMatch.AwayTeamId = completedMatch.WinnerTeamId;
                }
            }
            else
            {
                // Create new match for next round
                var nextMatch = new Match
                {
                    Id = Guid.NewGuid(),
                    TournamentId = tournament.Id,
                    HomeTeamId = completedMatch.WinnerTeamId,
                    AwayTeamId = null, // Will be filled when opponent wins their match
                    Round = nextRound.Value,
                    MatchNumber = GetNextMatchNumber(tournament.Matches, nextRound.Value),
                    Status = MatchStatus.Scheduled
                };
                _context.Matches.Add(nextMatch);
            }

            await _context.SaveChangesAsync();
        }

        private static MatchRound? GetNextRound(MatchRound currentRound)
        {
            return currentRound switch
            {
                MatchRound.Round1 => MatchRound.Round2,
                MatchRound.Round2 => MatchRound.Quarterfinal,
                MatchRound.Quarterfinal => MatchRound.Semifinal,
                MatchRound.Semifinal => MatchRound.Final,
                MatchRound.Final => null,
                _ => null
            };
        }

        private static int GetNextMatchNumber(IEnumerable<Match> matches, MatchRound round)
        {
            return matches.Where(m => m.Round == round).Count() + 1;
        }
    }
}
