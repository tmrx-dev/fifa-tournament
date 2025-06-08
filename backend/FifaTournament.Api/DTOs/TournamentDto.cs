using FifaTournament.Api.Models;

namespace FifaTournament.Api.DTOs
{
    public class TournamentDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int MaxTeams { get; set; }
        public decimal EntryFee { get; set; }
        public decimal PrizePool { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public TournamentStatus Status { get; set; }
        public Guid OwnerId { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public int TeamCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public UserDto CreatedBy { get; set; } = null!;
        public List<TeamDto> Teams { get; set; } = new();
        public bool IsFull { get; set; }
        public bool CanStart { get; set; }
        public bool IsUserParticipant { get; set; }
        public bool IsUserAdmin { get; set; }
    }

    public class CreateTournamentDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int MaxTeams { get; set; } = 16;
        public decimal EntryFee { get; set; } = 0;
        public decimal PrizePool { get; set; } = 0;
        public DateTime StartDate { get; set; }
    }

    public class UpdateTournamentDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int MaxTeams { get; set; }
        public decimal EntryFee { get; set; }
        public decimal PrizePool { get; set; }
        public DateTime StartDate { get; set; }
    }

    public class TournamentSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int MaxTeams { get; set; }
        public decimal EntryFee { get; set; }
        public decimal PrizePool { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public TournamentStatus Status { get; set; }
        public Guid OwnerId { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public int TeamCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
