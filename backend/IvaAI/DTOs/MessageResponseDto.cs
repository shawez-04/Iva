namespace Iva.Backend.DTOs
{
    public class MessageResponseDto
    {
        public Guid ChatId { get; set; }
        public string AiResponse { get; set; } = string.Empty;
    }
}
