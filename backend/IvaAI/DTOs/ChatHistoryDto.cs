namespace Iva.Backend.DTOs
{
    public class ChatHistoryDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
