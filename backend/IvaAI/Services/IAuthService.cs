using Iva.Backend.DTOs;

namespace Iva.Backend.Services
{
    public interface IAuthService
    {
        Task RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
    }
}
