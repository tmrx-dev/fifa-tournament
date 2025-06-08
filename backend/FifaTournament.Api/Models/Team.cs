using System.ComponentModel.DataAnnotations;

namespace FifaTournament.Api.Models
{
    public class Team
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string LogoUrl { get; set; } = string.Empty;
        
        public Guid OwnerId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Statistics
        public int TotalMatches { get; set; } = 0;
        public int Wins { get; set; } = 0;
        public int Losses { get; set; } = 0;
        public int GoalsFor { get; set; } = 0;
        public int GoalsAgainst { get; set; } = 0;
        
        // Navigation properties
        public User Owner { get; set; } = null!;
        public ICollection<TournamentTeam> TournamentTeams { get; set; } = new List<TournamentTeam>();
        public ICollection<Match> HomeMatches { get; set; } = new List<Match>();
        public ICollection<Match> AwayMatches { get; set; } = new List<Match>();
        
        // Computed properties
        public int GoalDifference => GoalsFor - GoalsAgainst;
        public double WinRate => TotalMatches > 0 ? (double)Wins / TotalMatches : 0;
    }
}
