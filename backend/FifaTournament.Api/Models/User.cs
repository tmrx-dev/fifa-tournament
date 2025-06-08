using System.ComponentModel.DataAnnotations;

namespace FifaTournament.Api.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string DisplayName { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string AvatarUrl { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string ExternalProvider { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string ExternalId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties - One user owns exactly one team
        public Team? Team { get; set; }
        public ICollection<TournamentUser> TournamentUsers { get; set; } = new List<TournamentUser>();
    }
}
