using System.ComponentModel.DataAnnotations;

namespace Iva.Backend.DTOs
{
    public class MessageRequestDto
    {
        // If this is null, the backend knows to create a brand new chat thread.
        public Guid? ChatId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Message cannot be empty.")]
        public string Content { get; set; } = string.Empty;
    }
}
