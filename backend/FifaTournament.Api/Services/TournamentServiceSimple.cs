using AutoMapper;
using Microsoft.EntityFrameworkCore;
using FifaTournament.Api.Data;
using FifaTournament.Api.DTOs;
using FifaTournament.Api.Models;

namespace FifaTournament.Api.Services
{
    public class TournamentServiceSimple : ITournamentService
    {
        private readonly FifaTournamentContext _context;
        private readonly IMapper _mapper;

        public TournamentServiceSimple(FifaTournamentContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public Task<TournamentDto?> GetTournamentByIdAsync(Guid id, Guid? userId = null)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<TournamentSummaryDto>> GetTournamentsAsync(Guid? userId = null)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<TournamentSummaryDto>> GetUserTournamentsAsync(Guid userId)
        {
            throw new NotImplementedException();
        }

        public Task<TournamentDto> CreateTournamentAsync(Guid createdById, CreateTournamentDto createTournamentDto)
        {
            throw new NotImplementedException();
        }

        public Task<TournamentDto?> UpdateTournamentAsync(Guid id, Guid userId, UpdateTournamentDto updateTournamentDto)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteTournamentAsync(Guid id, Guid userId)
        {
            throw new NotImplementedException();
        }

        public Task<bool> JoinTournamentAsync(Guid tournamentId, Guid userId)
        {
            throw new NotImplementedException();
        }

        public Task<bool> LeaveTournamentAsync(Guid tournamentId, Guid userId)
        {
            throw new NotImplementedException();
        }

        public Task<bool> StartTournamentAsync(Guid id, Guid userId)
        {
            throw new NotImplementedException();
        }

        public Task<bool> CompleteTournamentAsync(Guid id, Guid userId)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<MatchDto>> GetTournamentMatchesAsync(Guid tournamentId, Guid? userId = null)
        {
            throw new NotImplementedException();
        }
    }
}
