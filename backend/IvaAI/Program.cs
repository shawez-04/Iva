using Iva.Backend.Data;
using Iva.Backend.Services;
using Iva.Backend.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Database Context (Neon Postgres)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Custom Services
builder.Services.AddScoped<JwtService>();
builder.Services.AddHttpClient<GeminiService>();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"] ?? throw new ArgumentNullException("JWT Secret is missing");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// Configure User-Id Based Rate Limiting (The SDE-1 Flex)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("UserRateLimit", httpContext =>
    {
        // Extract the UserId from the JWT token
        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

        // If authenticated, limit per user ID. Otherwise, fall back to IP (for open endpoints like login/register)
        var partitionKey = !string.IsNullOrEmpty(userId)
            ? userId
            : httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10, // Max 10 requests
            Window = TimeSpan.FromMinutes(1), // Per 1 minute window
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });
});

// CORS Policy (Allows your HTML/JS frontend to call this API)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // In a real production scenario, replace AllowAnyOrigin with your specific GitHub Pages URL
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Global Exception Handler (Keeps errors clean and prevents app crashes)
app.UseMiddleware<ExceptionMiddleware>();

app.UseHttpsRedirection();

// The order of these middleware components is crucial!
app.UseCors("AllowFrontend");
app.UseAuthentication(); // 1st: Verify who the user is
app.UseAuthorization();  // 2nd: Verify what they can do
app.UseRateLimiter();    // 3rd: Apply rate limits based on their identity

app.MapControllers();

app.Run();