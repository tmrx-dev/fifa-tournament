using System.ComponentModel.DataAnnotations;

namespace FifaTournament.Api.Models
{
    public class TournamentTeam
    {
        [Key]
        public Guid Id { get; set; }
        
        public Guid TournamentId { get; set; }
        public Guid TeamId { get; set; }
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public bool IsEliminated { get; set; } = false;
        public int Position { get; set; } = 0; // Final position in tournament
        
        // Navigation properties
        public Tournament Tournament { get; set; } = null!;
        public Team Team { get; set; } = null!;
    }
}
