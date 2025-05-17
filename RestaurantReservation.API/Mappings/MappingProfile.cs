using AutoMapper;
using RestaurantReservation.API.DTOs;
using RestaurantReservation.API.Models;

namespace RestaurantReservation.API.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Table mappings
            CreateMap<Table, TableDto>();
            CreateMap<CreateTableDto, Table>();
            CreateMap<UpdateTableDto, Table>();

            // User mappings
            CreateMap<User, UserDto>();

            // Reservation mappings
            CreateMap<Reservation, ReservationDto>()
                .ForMember(dest => dest.Table, opt => opt.MapFrom(src => src.Table))
                .ForMember(dest => dest.User, opt => opt.MapFrom(src => src.User))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
                .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.Date))
                .ForMember(dest => dest.TimeFrom, opt => opt.MapFrom(src => src.TimeFrom))
                .ForMember(dest => dest.TimeTo, opt => opt.MapFrom(src => src.TimeTo))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt));

            CreateMap<CreateReservationDto, Reservation>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => ReservationStatus.Pending))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<UpdateReservationStatusDto, Reservation>();
        }
    }
} 