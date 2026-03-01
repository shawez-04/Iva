using Iva.Backend.Data;
using Iva.Backend.DTOs;
using Iva.Backend.Exceptions;
using Iva.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Iva.Backend.Services
{
    public class ChatService : IChatService
    {
        private readonly AppDbContext _context;
        private readonly GeminiService _geminiService;

        public ChatService(AppDbContext context, GeminiService geminiService)
        {
            _context = context;
            _geminiService = geminiService;
        }

        public async Task<MessageResponseDto> ProcessMessageAsync(Guid userId, MessageRequestDto request)
        {
            Chat chat;

            if (request.ChatId == null)
            {
                chat = new Chat
                {
                    UserId = userId,
                    Title = string.Join(" ", request.Content.Split(' ').Take(4)) + "..."
                };
                _context.Chats.Add(chat);
                await _context.SaveChangesAsync();
            }
            else
            {
                chat = await _context.Chats
                    .Include(c => c.Messages)
                    .FirstOrDefaultAsync(c => c.Id == request.ChatId && c.UserId == userId);

                // Throwing specific ServiceException instead of KeyNotFoundException
                if (chat == null)
                    throw new ServiceException("Chat not found or access denied.", 404, "CHAT_NOT_FOUND");
            }

            var userMessage = new Message
            {
                ChatId = chat.Id,
                Role = "user",
                Content = request.Content
            };
            _context.Messages.Add(userMessage);
            await _context.SaveChangesAsync();

            var history = chat.Messages.ToList();
            if (!history.Any(m => m.Id == userMessage.Id)) history.Add(userMessage);

            var aiResponseText = await _geminiService.GetAiResponseAsync(history);

            var aiMessage = new Message
            {
                ChatId = chat.Id,
                Role = "model",
                Content = aiResponseText
            };
            _context.Messages.Add(aiMessage);
            await _context.SaveChangesAsync();

            return new MessageResponseDto
            {
                ChatId = chat.Id,
                AiResponse = aiResponseText
            };
        }

        public async Task<List<ChatHistoryDto>> GetUserHistoryAsync(Guid userId)
        {
            return await _context.Chats
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new ChatHistoryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<object> GetChatDetailsAsync(Guid userId, Guid chatId)
        {
            var chat = await _context.Chats
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Id == chatId && c.UserId == userId);

            // Throwing specific ServiceException instead of returning null
            if (chat == null)
                throw new ServiceException("Chat details could not be found.", 404, "CHAT_NOT_FOUND");

            return new
            {
                chat.Id,
                chat.Title,
                messages = chat.Messages.OrderBy(m => m.CreatedAt).Select(m => new { m.Role, m.Content })
            };
        }

        public async Task<bool> DeleteChatAsync(Guid userId, Guid chatId)
        {
            var chat = await _context.Chats.FirstOrDefaultAsync(c => c.Id == chatId && c.UserId == userId);

            // Throwing specific ServiceException
            if (chat == null)
                throw new ServiceException("Cannot delete: Chat not found or access denied.", 404, "CHAT_NOT_FOUND");

            _context.Chats.Remove(chat);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task ClearAllUserChatsAsync(Guid userId)
        {
            var userChats = await _context.Chats.Where(c => c.UserId == userId).ToListAsync();
            if (userChats.Any())
            {
                _context.Chats.RemoveRange(userChats);
                await _context.SaveChangesAsync();
            }
        }
    }
}