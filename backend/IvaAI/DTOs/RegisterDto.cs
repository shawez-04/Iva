using System.ComponentModel.DataAnnotations;

namespace Iva.Backend.DTOs
{
    public class RegisterDto
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty; // Added for registration

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        public string Password { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty; // Return name to frontend
        public Guid UserId { get; set; }
    }
}