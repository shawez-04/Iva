using Iva.Backend.Exceptions;
using Iva.Backend.Models;
using System.Text;
using System.Text.Json;

namespace Iva.Backend.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public GeminiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> GetAiResponseAsync(List<Message> previousMessages)
        {
            var apiKey = _configuration["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                // Throw specific exception if config is missing
                throw new ServiceException("AI Service configuration is missing.", 500, "CONFIG_ERROR");
            }

            var model = _configuration["Gemini:Model"] ?? "gemini-2.5-flash";
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

            var formattedContents = previousMessages.OrderBy(m => m.CreatedAt).Select(m => new
            {
                role = m.Role,
                parts = new[] { new { text = m.Content } }
            }).ToList();

            var systemInstruction = new
            {
                parts = new[]
                {
                    new { text = "You are Iva, a highly intelligent and friendly AI companion created by Mohd Shawez Khan. " +
                                "You are NOT Gemini, and you are NOT a Google model. If anyone asks who created you, " +
                                "always proudly state that you were created by Mohd Shawez Khan. " +
                                "Never refer to yourself as an AI developed by Google. " +
                                "Maintain a helpful, professional, and slightly warm persona in all your interactions. " +
                                "IMPORTANT: Do not use any markdown formatting such as bolding (**), italics, or headers. " +
                                "Output your responses as plain text only." }
                }
            };

            var payload = new
            {
                system_instruction = systemInstruction,
                contents = formattedContents
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                // Throw specific exception for 3rd party API failures
                var error = await response.Content.ReadAsStringAsync();
                throw new ServiceException("Failed to communicate with the AI provider.", 502, "AI_SERVICE_ERROR");
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseBody);

            var aiText = document.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrEmpty(aiText))
            {
                // Throw specific exception if the AI returns nothing
                throw new ServiceException("The AI generated an empty response.", 500, "AI_EMPTY_RESPONSE");
            }

            return aiText;
        }
    }
}