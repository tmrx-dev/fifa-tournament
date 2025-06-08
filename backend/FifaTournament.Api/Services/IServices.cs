using FifaTournament.Api.DTOs;
using FifaTournament.Api.Models;

namespace FifaTournament.Api.Services
{
    public interface IUserService
    {
        Task<UserDto?> GetUserByIdAsync(Guid id);
        Task<UserDto?> GetUserByEmailAsync(string email);
        Task<UserDto?> GetUserByExternalIdAsync(string provider, string externalId);
        Task<UserDto> CreateUserAsync(CreateUserDto createUserDto);
        Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserDto updateUserDto);
        Task<bool> DeleteUserAsync(Guid id);
    }

    public interface ITeamService
    {
        Task<TeamDto?> GetTeamByIdAsync(Guid id);
        Task<TeamDto?> GetTeamByOwnerIdAsync(Guid ownerId);
        Task<IEnumerable<TeamDto>> GetTeamsAsync();
        Task<bool> UserHasTeamAsync(Guid userId);
        Task<TeamDto> CreateTeamAsync(Guid ownerId, CreateTeamDto createTeamDto);
        Task<TeamDto?> UpdateTeamAsync(Guid id, Guid ownerId, UpdateTeamDto updateTeamDto);
        Task<bool> DeleteTeamAsync(Guid id, Guid ownerId);
    }

    public interface ITournamentService
    {
        Task<TournamentDto?> GetTournamentByIdAsync(Guid id, Guid? userId = null);
        Task<IEnumerable<TournamentSummaryDto>> GetTournamentsAsync(Guid? userId = null);
        Task<IEnumerable<TournamentSummaryDto>> GetUserTournamentsAsync(Guid userId);
        Task<TournamentDto> CreateTournamentAsync(Guid createdById, CreateTournamentDto createTournamentDto);
        Task<TournamentDto?> UpdateTournamentAsync(Guid id, Guid userId, UpdateTournamentDto updateTournamentDto);
        Task<bool> DeleteTournamentAsync(Guid id, Guid userId);
        Task<bool> JoinTournamentAsync(Guid tournamentId, Guid userId);
        Task<bool> LeaveTournamentAsync(Guid tournamentId, Guid userId);
        Task<bool> StartTournamentAsync(Guid id, Guid userId);
        Task<bool> CompleteTournamentAsync(Guid id, Guid userId);
        Task<IEnumerable<MatchDto>> GetTournamentMatchesAsync(Guid tournamentId, Guid? userId = null);
    }

    public interface IMatchService
    {
        Task<MatchDto?> GetMatchByIdAsync(Guid id, Guid? userId = null);
        Task<MatchDto?> RecordMatchResultAsync(Guid matchId, Guid userId, RecordMatchResultDto recordResultDto);
        Task<IEnumerable<MatchDto>> GetTeamMatchesAsync(Guid teamId, Guid? userId = null);
    }
}
