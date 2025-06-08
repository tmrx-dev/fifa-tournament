using System.ComponentModel.DataAnnotations;

namespace FifaTournament.Api.Models
{
    public enum TournamentStatus
    {
        Draft,
        Open,
        InProgress,
        Completed,
        Cancelled
    }

    public class Tournament
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        public int MaxTeams { get; set; } = 16;
        public int MinTeams { get; set; } = 4;
        
        public decimal EntryFee { get; set; } = 0;
        public decimal PrizePool { get; set; } = 0;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        
        public Guid CreatedById { get; set; }
        public TournamentStatus Status { get; set; } = TournamentStatus.Draft;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        
        // Navigation properties
        public User CreatedBy { get; set; } = null!;
        public ICollection<TournamentTeam> TournamentTeams { get; set; } = new List<TournamentTeam>();
        public ICollection<TournamentUser> TournamentUsers { get; set; } = new List<TournamentUser>();
        public ICollection<Match> Matches { get; set; } = new List<Match>();
        
        // Computed properties
        public int CurrentTeamCount => TournamentTeams.Count;
        public bool IsFull => CurrentTeamCount >= MaxTeams;
        public bool CanStart => CurrentTeamCount >= MinTeams && Status == TournamentStatus.Open;
    }
}
