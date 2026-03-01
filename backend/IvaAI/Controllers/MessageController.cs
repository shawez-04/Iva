using Iva.Backend.Data;
using Iva.Backend.DTOs;
using Iva.Backend.Models;
using Iva.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Iva.Backend.Controllers
{
    [Authorize] // Requires a valid JWT to access anything in this controller
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GeminiService _geminiService;

        public MessagesController(AppDbContext context, GeminiService geminiService)
        {
            _context = context;
            _geminiService = geminiService;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] MessageRequestDto request)
        {
            // Get the authenticated User ID from the JWT token
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out Guid userId))
            {
                return Unauthorized();
            }

            Chat chat;

            // The "Smart Endpoint" Logic: Create a new chat if no ChatId is provided
            if (request.ChatId == null)
            {
                chat = new Chat
                {
                    UserId = userId,
                    Title = string.Join(" ", request.Content.Split(' ').Take(4)) + "..." // Simple title generation
                };
                _context.Chats.Add(chat);
                await _context.SaveChangesAsync();
            }
            else
            {
                // Validate that the chat exists and belongs to the user
                chat = await _context.Chats
                    .Include(c => c.Messages) // Load previous messages for context
                    .FirstOrDefaultAsync(c => c.Id == request.ChatId && c.UserId == userId);

                if (chat == null) return NotFound("Chat not found.");
            }

            // Save the User's Message
            var userMessage = new Message
            {
                ChatId = chat.Id,
                Role = "user",
                Content = request.Content
            };
            _context.Messages.Add(userMessage);
            await _context.SaveChangesAsync();

            // Fetch the AI Response using the history (Ensuring we add the new user message to the context)
            var history = chat.Messages.ToList();
            if (!history.Any(m => m.Id == userMessage.Id))
            {
                history.Add(userMessage);
            }

            var aiResponseText = await _geminiService.GetAiResponseAsync(history);

            // Save the AI's Message
            var aiMessage = new Message
            {
                ChatId = chat.Id,
                Role = "model",
                Content = aiResponseText
            };
            _context.Messages.Add(aiMessage);
            await _context.SaveChangesAsync();

            // Return the response to the frontend
            return Ok(new MessageResponseDto
            {
                ChatId = chat.Id,
                AiResponse = aiResponseText
            });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetChatHistory()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var chats = await _context.Chats
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new ChatHistoryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(chats);
        }
    }
}