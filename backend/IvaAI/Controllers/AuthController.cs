using Iva.Backend.DTOs;
using Iva.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Iva.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            await _authService.RegisterAsync(dto);
            return StatusCode(201, new { message = "User registered successfully." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var response = await _authService.LoginAsync(dto);
            return Ok(response);
        }
    }
}