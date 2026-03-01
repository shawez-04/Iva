using Iva.Backend.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace Iva.Backend.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // Proceed to the next middleware or controller
                await _next(context);
            }
            catch (ServiceException ex)
            {
                // We log business logic exceptions as warnings, not critical server errors
                _logger.LogWarning("Service Exception: {ErrorCode} - {Message}", ex.ErrorCode, ex.Message);
                await HandleServiceExceptionAsync(context, ex);
            }
            catch (Exception ex)
            {
                // Log unhandled exceptions cleanly
                _logger.LogError(ex, "An unexpected error occurred.");
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleServiceExceptionAsync(HttpContext context, ServiceException exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = exception.StatusCode;

            // Return the specific error format requested
            var response = new
            {
                errorCode = exception.ErrorCode,
                message = exception.Message,
                statusCode = exception.StatusCode
            };

            var result = JsonSerializer.Serialize(response);
            return context.Response.WriteAsync(result);
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            var problemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Server Error",
                Detail = "An unexpected error occurred while processing your request. Please try again later."
            };

            var result = JsonSerializer.Serialize(problemDetails);
            return context.Response.WriteAsync(result);
        }
    }
}