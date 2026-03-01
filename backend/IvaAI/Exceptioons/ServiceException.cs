using System;

namespace Iva.Backend.Exceptions
{
    public class ServiceException : Exception
    {
        public int StatusCode { get; }
        public string ErrorCode { get; }

        public ServiceException(string message, int statusCode = 400, string errorCode = "BAD_REQUEST")
            : base(message)
        {
            StatusCode = statusCode;
            ErrorCode = errorCode;
        }
    }
}