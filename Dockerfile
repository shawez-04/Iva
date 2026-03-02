# 1. Base runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
# ASP.NET Core 8 defaults to port 8080
EXPOSE 8080

# 2. Build image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the csproj and restore dependencies
COPY ["Iva.Backend.csproj", "./"]
RUN dotnet restore "Iva.Backend.csproj"

# Copy the rest of the backend source code
COPY . .
WORKDIR "/src/"

# Build the application
RUN dotnet build "Iva.Backend.csproj" -c Release -o /app/build

# 3. Publish image
FROM build AS publish
RUN dotnet publish "Iva.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 4. Final production image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Start the application
ENTRYPOINT ["dotnet", "Iva.Backend.dll"]