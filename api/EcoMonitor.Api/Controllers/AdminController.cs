using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using EcoMonitor.Api.Models;
using System.Collections.Generic;

namespace EcoMonitor.Api.Controllers
{
    // [Authorize(Policy = "AdminOnly")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _supabaseUrl;
        private readonly string _serviceKey;

        public AdminController(IConfiguration configuration)
        {
            _configuration = configuration;
            _supabaseUrl = "https://eznsxbjdssojayrqetry.supabase.co";
            _serviceKey = _configuration["Supabase:ServiceRoleKey"] ?? "";
        }

        public class CreateUserRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Role { get; set; } = "client";
        }

        // Classe ajustada para bater com o retorno do Supabase Admin API
        private class AdminUserResponse
        {
            public string id { get; set; } = string.Empty;
            public string email { get; set; } = string.Empty;
        }

        [HttpPost("User")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (string.IsNullOrEmpty(_serviceKey) || _serviceKey.Contains("COLOQUE"))
            {
                return StatusCode(500, new { mensagem = "ServiceRoleKey não configurada corretamente no appsettings.json." });
            }

            try
            {
                // 1. Criar Usuário no Auth do Supabase via Admin API
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("apikey", _serviceKey);
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _serviceKey);

                var authPayload = new
                {
                    email = request.Email,
                    password = request.Password,
                    email_confirm = true // Usuário já nasce confirmado
                };

                var content = new StringContent(JsonSerializer.Serialize(authPayload), Encoding.UTF8, "application/json");
                
                // Endpoint correto de administração do GoTrue (Auth)
                var response = await httpClient.PostAsync($"{_supabaseUrl}/auth/v1/admin/users", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest(new { mensagem = "Falha ao criar usuário no Auth.", detalhe = responseBody });
                }

                // O Supabase retorna o objeto do usuário diretamente
                var createdUser = JsonSerializer.Deserialize<AdminUserResponse>(responseBody);

                if (createdUser == null || string.IsNullOrEmpty(createdUser.id))
                {
                    return BadRequest(new { mensagem = "Usuário criado, mas não foi possível obter o ID de retorno." });
                }

                // 2. Vincular Role na tabela 'user_roles'
                // Criamos um cliente Supabase temporário com a Service Key para bypassar o RLS
                var options = new Supabase.SupabaseOptions { AutoRefreshToken = false, AutoConnectRealtime = false };
                var adminClient = new Supabase.Client(_supabaseUrl, _serviceKey, options);
                await adminClient.InitializeAsync();

                var newUserRole = new UserRole
                {
                    Id = createdUser.id,
                    Role = request.Role.ToLower() == "admin" ? "admin" : "client"
                };

                // Inserção na tabela pública.user_roles
                await adminClient.From<UserRole>().Insert(newUserRole);

                return Ok(new { 
                    mensagem = "Usuário e Role criados com sucesso!", 
                    userId = createdUser.id,
                    email = createdUser.email,
                    role = newUserRole.Role 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro interno ao processar criação.", detalhe = ex.Message });
            }
        }
    }
}