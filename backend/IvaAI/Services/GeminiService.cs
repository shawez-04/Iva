using Iva.Backend.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

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
            var apiKey = _configuration["Gemini:ApiKey"] ?? throw new ArgumentNullException("Gemini API Key is missing.");
            var model = _configuration["Gemini:Model"] ?? "gemini-2.5-flash";
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

            // Map our database messages to the exact format Gemini expects
            var formattedContents = previousMessages.OrderBy(m => m.CreatedAt).Select(m => new
            {
                role = m.Role, // "user" or "model"
                parts = new[] { new { text = m.Content } }
            }).ToList();

            var payload = new
            {
                contents = formattedContents
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Gemini API error: {error}");
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseBody);

            // Extract the text from the Gemini JSON response
            var aiText = document.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return aiText ?? "I'm sorry, I couldn't generate a response.";
        }
    }
}