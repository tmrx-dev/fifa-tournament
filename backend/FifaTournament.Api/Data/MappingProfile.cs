using AutoMapper;
using FifaTournament.Api.Models;
using FifaTournament.Api.DTOs;

namespace FifaTournament.Api.Data
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<User, UserDto>();
            CreateMap<CreateUserDto, User>();
            CreateMap<UpdateUserDto, User>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Team mappings
            CreateMap<Team, TeamDto>()
                .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.Owner != null ? src.Owner.DisplayName : "Unknown"));
            CreateMap<CreateTeamDto, Team>();
            CreateMap<UpdateTeamDto, Team>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Tournament mappings
            CreateMap<Tournament, TournamentDto>()
                .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => src.CreatedById))
                .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.DisplayName : "Unknown"))
                .ForMember(dest => dest.TeamCount, opt => opt.MapFrom(src => src.CurrentTeamCount))
                .ForMember(dest => dest.Teams, opt => opt.MapFrom(src => src.TournamentTeams.Select(tt => tt.Team)))
                .ForMember(dest => dest.IsUserParticipant, opt => opt.Ignore())
                .ForMember(dest => dest.IsUserAdmin, opt => opt.Ignore());
            
            CreateMap<Tournament, TournamentSummaryDto>()
                .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => src.CreatedById))
                .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.DisplayName : "Unknown"))
                .ForMember(dest => dest.TeamCount, opt => opt.MapFrom(src => src.CurrentTeamCount));
            
            CreateMap<CreateTournamentDto, Tournament>();
            CreateMap<UpdateTournamentDto, Tournament>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Match mappings
            CreateMap<Match, MatchDto>()
                .ForMember(dest => dest.CanRecordResult, opt => opt.Ignore());
        }
    }
}
