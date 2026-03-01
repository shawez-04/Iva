using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Iva.Backend.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property for EF Core
        public ICollection<Chat> Chats { get; set; } = new List<Chat>();
    }
}