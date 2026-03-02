# -----------------------------
# 1️⃣ Build Stage
# -----------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY Iva.Backend.csproj .
RUN dotnet restore

# Copy everything else and build
COPY . .
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false


# -----------------------------
# 2️⃣ Runtime Stage
# -----------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published output
COPY --from=build /app/publish .

# Render requires app to listen on 8080
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

# Start application
ENTRYPOINT ["dotnet", "Iva.Backend.dll"]