using Iva.Backend.DTOs;
using Iva.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Iva.Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly IChatService _chatService;

        public MessagesController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] MessageRequestDto request)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            try
            {
                var result = await _chatService.ProcessMessageAsync(userId, request);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetChatHistory()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var history = await _chatService.GetUserHistoryAsync(userId);
            return Ok(history);
        }

        [HttpGet("{chatId}")]
        public async Task<IActionResult> GetChat(Guid chatId)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var chat = await _chatService.GetChatDetailsAsync(userId, chatId);
            if (chat == null) return NotFound(new { message = "Chat not found." });

            return Ok(chat);
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearAllChats()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            await _chatService.ClearAllUserChatsAsync(userId);
            return Ok(new { message = "All chats have been permanently deleted." });
        }

        [HttpDelete("{chatId}")]
        public async Task<IActionResult> DeleteChat(Guid chatId)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var deleted = await _chatService.DeleteChatAsync(userId, chatId);
            if (!deleted) return NotFound(new { message = "Chat not found or access denied." });

            return Ok(new { message = "Chat deleted successfully." });
        }

        private Guid GetUserId()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userIdString, out Guid userId) ? userId : Guid.Empty;
        }
    }
}