using System.ComponentModel.DataAnnotations;

namespace FifaTournament.Api.Models
{
    public enum UserRole
    {
        Participant,
        Admin
    }

    public class TournamentUser
    {
        [Key]
        public Guid Id { get; set; }
        
        public Guid TournamentId { get; set; }
        public Guid UserId { get; set; }
        
        public UserRole Role { get; set; } = UserRole.Participant;
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public Tournament Tournament { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
