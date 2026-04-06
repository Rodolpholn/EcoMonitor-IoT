using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using System.Linq;
using System;
using Microsoft.Net.Http.Headers;

namespace EcoMonitor.Api.Authentication
{
    public class SupabaseAuthenticationOptions : AuthenticationSchemeOptions { }

    public class SupabaseAuthenticationHandler : AuthenticationHandler<SupabaseAuthenticationOptions>
    {
        private readonly Supabase.Client _supabaseClient;

        public SupabaseAuthenticationHandler(
            IOptionsMonitor<SupabaseAuthenticationOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            Supabase.Client supabaseClient)
            : base(options, logger, encoder)
        {
            _supabaseClient = supabaseClient;
        }

        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.ContainsKey(HeaderNames.Authorization))
                return AuthenticateResult.Fail("Missing Authorization Header");

            var token = Request.Headers[HeaderNames.Authorization].ToString().Replace("Bearer ", "").Trim();

            if (string.IsNullOrEmpty(token))
                return AuthenticateResult.Fail("Invalid Authorization Header");

            try
            {
                var user = await _supabaseClient.Auth.GetUser(token);
                if (user == null)
                    return AuthenticateResult.Fail("Invalid Token");

                var claims = new System.Collections.Generic.List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Email, user.Email ?? "")
                };

                // Fetch role from user_roles table
                var roleResult = await _supabaseClient.From<Models.UserRole>().Where(r => r.Id == user.Id).Get();
                var userRole = roleResult.Models.FirstOrDefault();

                if (userRole != null && !string.IsNullOrEmpty(userRole.Role))
                {
                    claims.Add(new Claim(ClaimTypes.Role, userRole.Role));
                }
                else 
                {
                    // Default to client if no role found
                    claims.Add(new Claim(ClaimTypes.Role, "client"));
                }

                var identity = new ClaimsIdentity(claims, Scheme.Name);
                var principal = new ClaimsPrincipal(identity);
                var ticket = new AuthenticationTicket(principal, Scheme.Name);

                return AuthenticateResult.Success(ticket);
            }
            catch (Exception ex)
            {
                return AuthenticateResult.Fail($"Authentication failed: {ex.Message}");
            }
        }
    }
}
