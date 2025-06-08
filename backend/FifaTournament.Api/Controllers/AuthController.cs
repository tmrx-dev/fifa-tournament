using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FifaTournament.Api.Services;
using FifaTournament.Api.DTOs;

namespace FifaTournament.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IUserService userService, IConfiguration configuration, ILogger<AuthController> logger)
        {
            _userService = userService;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Get available OAuth providers
        /// </summary>
        [HttpGet("providers")]
        public IActionResult GetAvailableProviders()
        {
            var providers = new List<object>();
            
            // Check Google OAuth configuration
            var googleClientId = _configuration["Google:ClientId"];
            var googleClientSecret = _configuration["Google:ClientSecret"];
            if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
            {
                providers.Add(new { 
                    name = "google", 
                    displayName = "Google", 
                    available = true,
                    loginUrl = "/api/auth/login/google"
                });
            }
            
            // Check Microsoft OAuth configuration
            var microsoftClientId = _configuration["Microsoft:ClientId"];
            var microsoftClientSecret = _configuration["Microsoft:ClientSecret"];
            if (!string.IsNullOrEmpty(microsoftClientId) && !string.IsNullOrEmpty(microsoftClientSecret))
            {
                providers.Add(new { 
                    name = "microsoft", 
                    displayName = "Microsoft", 
                    available = true,
                    loginUrl = "/api/auth/login/microsoft"
                });
            }
            
            return Ok(new { providers });
        }

        /// <summary>
        /// Initiate Google OAuth login
        /// </summary>
        [HttpGet("login/google")]
        public IActionResult LoginGoogle([FromQuery] string? returnUrl = null)
        {
            var googleClientId = _configuration["Google:ClientId"];
            var googleClientSecret = _configuration["Google:ClientSecret"];
            
            if (string.IsNullOrEmpty(googleClientId) || string.IsNullOrEmpty(googleClientSecret))
            {
                _logger.LogWarning("Google OAuth attempted but credentials not configured");
                return BadRequest(new { error = "Google OAuth is not configured" });
            }
            
            try
            {
                var properties = new AuthenticationProperties
                {
                    RedirectUri = "/api/auth/callback/google",
                    Items = 
                    {
                        ["provider"] = "google",
                        ["returnUrl"] = returnUrl ?? "/"
                    }
                };
                
                _logger.LogInformation("Initiating Google OAuth challenge");
                return Challenge(properties, "Google");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google OAuth challenge failed");
                return BadRequest(new { error = $"Google OAuth failed: {ex.Message}" });
            }
        }

        /// <summary>
        /// Initiate Microsoft OAuth login
        /// </summary>
        [HttpGet("login/microsoft")]
        public IActionResult LoginMicrosoft([FromQuery] string? returnUrl = null)
        {
            var microsoftClientId = _configuration["Microsoft:ClientId"];
            var microsoftClientSecret = _configuration["Microsoft:ClientSecret"];
            
            if (string.IsNullOrEmpty(microsoftClientId) || string.IsNullOrEmpty(microsoftClientSecret))
            {
                _logger.LogWarning("Microsoft OAuth attempted but credentials not configured");
                return BadRequest(new { error = "Microsoft OAuth is not configured" });
            }
            
            try
            {
                var properties = new AuthenticationProperties
                {
                    RedirectUri = "/api/auth/callback/microsoft",
                    Items = 
                    {
                        ["provider"] = "microsoft",
                        ["returnUrl"] = returnUrl ?? "/"
                    }
                };
                
                _logger.LogInformation("Initiating Microsoft OAuth challenge");
                return Challenge(properties, "Microsoft");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Microsoft OAuth challenge failed");
                return BadRequest(new { error = $"Microsoft OAuth failed: {ex.Message}" });
            }
        }

        /// <summary>
        /// Handle Google OAuth callback (standard OAuth path)
        /// </summary>
        [HttpGet("/signin-google")]
        public async Task<IActionResult> SignInGoogle()
        {
            return await HandleOAuthCallback("Google", "google");
        }

        /// <summary>
        /// Handle Microsoft OAuth callback (standard OAuth path)
        /// </summary>
        [HttpGet("/signin-microsoft")]
        public async Task<IActionResult> SignInMicrosoft()
        {
            return await HandleOAuthCallback("Microsoft", "microsoft");
        }

        /// <summary>
        /// Handle Google OAuth callback
        /// </summary>
        [HttpGet("callback/google")]
        public async Task<IActionResult> GoogleCallback()
        {
            return await HandleOAuthCallback("Google", "google");
        }

        /// <summary>
        /// Handle Microsoft OAuth callback
        /// </summary>
        [HttpGet("callback/microsoft")]
        public async Task<IActionResult> MicrosoftCallback()
        {
            return await HandleOAuthCallback("Microsoft", "microsoft");
        }

        /// <summary>
        /// Generic OAuth callback handler
        /// </summary>
        private async Task<IActionResult> HandleOAuthCallback(string scheme, string provider)
        {
            try
            {
                _logger.LogInformation("Processing {Provider} OAuth callback", provider);
                
                // Authenticate using the OAuth scheme
                var authenticateResult = await HttpContext.AuthenticateAsync(scheme);
                
                if (!authenticateResult.Succeeded)
                {
                    _logger.LogError("{Provider} authentication failed: {Error}", provider, authenticateResult.Failure?.Message);
                    return RedirectToFrontendWithError($"{provider} authentication failed", provider);
                }
                
                _logger.LogInformation("{Provider} authentication succeeded", provider);
                
                // Extract user information from claims
                var claims = authenticateResult.Principal?.Claims;
                var email = GetClaimValue(claims, ClaimTypes.Email);
                var name = GetClaimValue(claims, ClaimTypes.Name);
                var nameIdentifier = GetClaimValue(claims, ClaimTypes.NameIdentifier);
                var picture = GetClaimValue(claims, "picture");

                _logger.LogInformation("{Provider} user info - Email: {Email}, Name: {Name}, ID: {NameIdentifier}", 
                    provider, email, name, nameIdentifier);

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(nameIdentifier))
                {
                    _logger.LogError("Required user information not available from {Provider}", provider);
                    return RedirectToFrontendWithError("Required user information not available", provider);
                }

                // Find or create user
                var user = await GetOrCreateUserAsync(provider, nameIdentifier, email, name, picture);
                
                // Generate JWT token
                var token = GenerateJwtToken(user);

                // Redirect to frontend with token
                return RedirectToFrontendWithToken(token, provider);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{Provider} callback error", provider);
                return RedirectToFrontendWithError($"{provider} authentication failed: {ex.Message}", provider);
            }
        }

        /// <summary>
        /// Get or create a user based on OAuth information
        /// </summary>
        private async Task<UserDto> GetOrCreateUserAsync(string provider, string externalId, string email, string? name, string? avatarUrl)
        {
            // Check if user exists
            var existingUser = await _userService.GetUserByExternalIdAsync(provider, externalId);
            
            if (existingUser != null)
            {
                _logger.LogInformation("Existing user found for {Provider} ID: {ExternalId}", provider, externalId);
                return existingUser;
            }

            // Create new user
            var createUserDto = new CreateUserDto
            {
                Email = email,
                DisplayName = name ?? email.Split('@')[0],
                AvatarUrl = avatarUrl ?? "",
                ExternalProvider = provider,
                ExternalId = externalId
            };

            var newUser = await _userService.CreateUserAsync(createUserDto);
            _logger.LogInformation("Created new user for {Provider} - Email: {Email}, ID: {UserId}", 
                provider, email, newUser.Id);
            
            return newUser;
        }

        /// <summary>
        /// Generate JWT token for authenticated user
        /// </summary>
        private string GenerateJwtToken(UserDto user)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? "your-super-secret-jwt-key-here-min-256-bits-long-for-security";
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "FifaTournament";
            var jwtAudience = _configuration["Jwt:Audience"] ?? "FifaTournament";

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("displayName", user.DisplayName),
                new Claim("avatarUrl", user.AvatarUrl ?? "")
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Get current authenticated user information
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "Invalid user token" });
            }

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(user);
        }

        /// <summary>
        /// Sign out current user (invalidate token on client side)
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // With JWT tokens, logout is handled client-side by removing the token
            // In a production system, you might want to implement token blacklisting
            return Ok(new { message = "Logged out successfully" });
        }

        /// <summary>
        /// Health check endpoint for authentication system
        /// </summary>
        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            var googleConfigured = !string.IsNullOrEmpty(_configuration["Google:ClientId"]) && 
                                  !string.IsNullOrEmpty(_configuration["Google:ClientSecret"]);
            var microsoftConfigured = !string.IsNullOrEmpty(_configuration["Microsoft:ClientId"]) && 
                                     !string.IsNullOrEmpty(_configuration["Microsoft:ClientSecret"]);
            
            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                providers = new
                {
                    google = googleConfigured,
                    microsoft = microsoftConfigured
                }
            });
        }

        // Helper methods
        private static string? GetClaimValue(IEnumerable<Claim>? claims, string claimType)
        {
            return claims?.FirstOrDefault(c => c.Type == claimType)?.Value;
        }

        private IActionResult RedirectToFrontendWithToken(string token, string provider)
        {
            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
            return Redirect($"{frontendUrl}/auth/callback?token={token}&provider={provider}");
        }

        private IActionResult RedirectToFrontendWithError(string error, string provider)
        {
            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
            return Redirect($"{frontendUrl}/auth/callback?error={Uri.EscapeDataString(error)}&provider={provider}");
        }
    }
}