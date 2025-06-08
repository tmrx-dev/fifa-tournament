using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.MicrosoftAccount;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FluentValidation;
using FifaTournament.Api.Data;
using FifaTournament.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var frontendUrl = builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
        policy.WithOrigins(frontendUrl)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Database configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<FifaTournamentContext>(options =>
{
    if (string.IsNullOrEmpty(connectionString))
    {
        options.UseInMemoryDatabase("FifaTournamentDb");
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Configure FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Register services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<ITournamentService, TournamentService>();
builder.Services.AddScoped<IMatchService, MatchService>();

// Configure JWT Authentication (Primary authentication scheme)
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["Key"] ?? "your-super-secret-jwt-key-here-min-256-bits-long-for-security";
var issuer = jwtSettings["Issuer"] ?? "FifaTournament";
var audience = jwtSettings["Audience"] ?? "FifaTournament";

builder.Services.AddAuthentication(options =>
{
    // Set JWT Bearer as the default authentication scheme
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

// Configure OAuth providers for external authentication
var googleClientId = builder.Configuration["Google:ClientId"];
var googleClientSecret = builder.Configuration["Google:ClientSecret"];
var microsoftClientId = builder.Configuration["Microsoft:ClientId"];
var microsoftClientSecret = builder.Configuration["Microsoft:ClientSecret"];

// Add Google OAuth if configured
if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    builder.Services.AddAuthentication()
        .AddGoogle("Google", options =>
        {
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;
            options.CallbackPath = "/api/auth/callback/google";
            options.SaveTokens = true;
            
            // Request necessary scopes
            options.Scope.Clear();
            options.Scope.Add("openid");
            options.Scope.Add("profile");
            options.Scope.Add("email");
            
            // Standard claims are automatically mapped by the OAuth handler
            
            // Configure correlation cookie settings for better reliability
            options.CorrelationCookie.HttpOnly = true;
            options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        });
}

// Add Microsoft OAuth if configured
if (!string.IsNullOrEmpty(microsoftClientId) && !string.IsNullOrEmpty(microsoftClientSecret))
{
    builder.Services.AddAuthentication()
        .AddMicrosoftAccount("Microsoft", options =>
        {
            options.ClientId = microsoftClientId;
            options.ClientSecret = microsoftClientSecret;
            options.CallbackPath = "/api/auth/callback/microsoft";
            options.SaveTokens = true;
            
            // Request necessary scopes
            options.Scope.Clear();
            options.Scope.Add("openid");
            options.Scope.Add("profile");
            options.Scope.Add("email");
            options.Scope.Add("User.Read");
            
            // Configure correlation cookie settings
            options.CorrelationCookie.HttpOnly = true;
            options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        });
}

// Configure authorization
builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Ensure database is created and seeded
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<FifaTournamentContext>();
    if (app.Environment.IsDevelopment())
    {
        await context.Database.EnsureCreatedAsync();
        await SeedTestDataAsync(context);
    }
}

Console.WriteLine("🚀 FIFA Tournament API is starting...");
Console.WriteLine($"🔧 Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"🌐 Frontend URL: {builder.Configuration["Frontend:BaseUrl"]}");
Console.WriteLine($"🔑 Google OAuth: {(!string.IsNullOrEmpty(googleClientId) ? "✅ Configured" : "❌ Not Configured")}");
Console.WriteLine($"🔑 Microsoft OAuth: {(!string.IsNullOrEmpty(microsoftClientId) ? "✅ Configured" : "❌ Not Configured")}");

app.Run();

async Task SeedTestDataAsync(FifaTournamentContext context)
{
    // Only seed if no data exists
    if (await context.Users.AnyAsync())
    {
        Console.WriteLine("📊 Test data already exists, skipping seeding.");
        return;
    }

    Console.WriteLine("🌱 Seeding test data...");

    // Create test users (these will be replaced by OAuth users in practice)
    var users = new[]
    {
        new FifaTournament.Api.Models.User
        {
            Id = Guid.NewGuid(),
            Email = "alex@example.com",
            DisplayName = "Alex Rodriguez",
            AvatarUrl = "",
            ExternalProvider = "test",
            ExternalId = "test1",
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        },
        new FifaTournament.Api.Models.User
        {
            Id = Guid.NewGuid(),
            Email = "sarah@example.com",
            DisplayName = "Sarah Johnson",
            AvatarUrl = "",
            ExternalProvider = "test",
            ExternalId = "test2",
            CreatedAt = DateTime.UtcNow.AddDays(-8)
        },
        new FifaTournament.Api.Models.User
        {
            Id = Guid.NewGuid(),
            Email = "mike@example.com",
            DisplayName = "Mike Chen",
            AvatarUrl = "",
            ExternalProvider = "test",
            ExternalId = "test3",
            CreatedAt = DateTime.UtcNow.AddDays(-6)
        },
        new FifaTournament.Api.Models.User
        {
            Id = Guid.NewGuid(),
            Email = "emma@example.com",
            DisplayName = "Emma Wilson",
            AvatarUrl = "",
            ExternalProvider = "test",
            ExternalId = "test4",
            CreatedAt = DateTime.UtcNow.AddDays(-4)
        }
    };

    context.Users.AddRange(users);
    await context.SaveChangesAsync();

    // Create teams for each user
    var teams = new[]
    {
        new FifaTournament.Api.Models.Team
        {
            Id = Guid.NewGuid(),
            Name = "Thunder Strikers",
            LogoUrl = "",
            OwnerId = users[0].Id,
            CreatedAt = DateTime.UtcNow.AddDays(-5)
        },
        new FifaTournament.Api.Models.Team
        {
            Id = Guid.NewGuid(),
            Name = "Phoenix United",
            LogoUrl = "",
            OwnerId = users[1].Id,
            CreatedAt = DateTime.UtcNow.AddDays(-4)
        },
        new FifaTournament.Api.Models.Team
        {
            Id = Guid.NewGuid(),
            Name = "Velocity FC",
            LogoUrl = "",
            OwnerId = users[2].Id,
            CreatedAt = DateTime.UtcNow.AddDays(-3)
        },
        new FifaTournament.Api.Models.Team
        {
            Id = Guid.NewGuid(),
            Name = "Elite Warriors",
            LogoUrl = "",
            OwnerId = users[3].Id,
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        }
    };

    context.Teams.AddRange(teams);
    await context.SaveChangesAsync();

    Console.WriteLine("✅ Test data seeded successfully!");
    Console.WriteLine($"   - Created {users.Length} test users");
    Console.WriteLine($"   - Created {teams.Length} test teams");
}