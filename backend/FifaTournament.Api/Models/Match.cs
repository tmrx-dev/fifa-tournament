using System.ComponentModel.DataAnnotations;

namespace FifaTournament.Api.Models
{
    public enum MatchStatus
    {
        Scheduled,
        InProgress,
        Completed,
        Cancelled
    }

    public enum MatchRound
    {
        Round1 = 1,
        Round2 = 2,
        Round3 = 3,
        Quarterfinal = 4,
        Semifinal = 5,
        Final = 6
    }

    public class Match
    {
        [Key]
        public Guid Id { get; set; }
        
        public Guid TournamentId { get; set; }
        public Guid? HomeTeamId { get; set; }
        public Guid? AwayTeamId { get; set; }
        
        public MatchRound Round { get; set; }
        public int MatchNumber { get; set; }
        
        public MatchStatus Status { get; set; } = MatchStatus.Scheduled;
        
        public int? HomeTeamScore { get; set; }
        public int? AwayTeamScore { get; set; }
        
        public Guid? WinnerTeamId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PlayedAt { get; set; }
        public Guid? RecordedById { get; set; }
        
        // Navigation properties
        public Tournament Tournament { get; set; } = null!;
        public Team? HomeTeam { get; set; }
        public Team? AwayTeam { get; set; }
        public Team? WinnerTeam { get; set; }
        public User? RecordedBy { get; set; }
        
        // Computed properties
        public bool IsCompleted => Status == MatchStatus.Completed;
        public bool HasResult => HomeTeamScore.HasValue && AwayTeamScore.HasValue;
        public string ScoreDisplay => HasResult ? $"{HomeTeamScore} - {AwayTeamScore}" : "vs";
    }
}
