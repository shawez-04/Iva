using Iva.Backend.DTOs;

namespace Iva.Backend.Services
{
    public interface IChatService
    {
        Task<MessageResponseDto> ProcessMessageAsync(Guid userId, MessageRequestDto request);
        Task<List<ChatHistoryDto>> GetUserHistoryAsync(Guid userId);
        Task<object?> GetChatDetailsAsync(Guid userId, Guid chatId);
        Task<bool> DeleteChatAsync(Guid userId, Guid chatId);
        Task ClearAllUserChatsAsync(Guid userId);
    }
}
