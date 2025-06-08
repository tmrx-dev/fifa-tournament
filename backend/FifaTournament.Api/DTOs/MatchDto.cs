using FifaTournament.Api.Models;

namespace FifaTournament.Api.DTOs
{
    public class MatchDto
    {
        public Guid Id { get; set; }
        public Guid TournamentId { get; set; }
        public TeamDto HomeTeam { get; set; } = null!;
        public TeamDto AwayTeam { get; set; } = null!;
        public MatchRound Round { get; set; }
        public int MatchNumber { get; set; }
        public MatchStatus Status { get; set; }
        public int? HomeTeamScore { get; set; }
        public int? AwayTeamScore { get; set; }
        public TeamDto? WinnerTeam { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PlayedAt { get; set; }
        public UserDto? RecordedBy { get; set; }
        public string ScoreDisplay { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public bool CanRecordResult { get; set; }
    }

    public class RecordMatchResultDto
    {
        public int HomeTeamScore { get; set; }
        public int AwayTeamScore { get; set; }
    }
}
