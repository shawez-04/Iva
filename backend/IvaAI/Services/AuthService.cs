using Iva.Backend.Data;
using Iva.Backend.DTOs;
using Iva.Backend.Exceptions;
using Iva.Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace Iva.Backend.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService;

        public AuthService(AppDbContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        public async Task RegisterAsync(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                throw new ServiceException("Email already in use.", 400, "EMAIL_IN_USE");
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                throw new ServiceException("Invalid email or password.", 401, "INVALID_CREDENTIALS");
            }

            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                FullName = user.FullName,
                UserId = user.Id
            };
        }
    }
}