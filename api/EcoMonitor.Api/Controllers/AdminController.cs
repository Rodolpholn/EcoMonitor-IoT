using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization; // Necessário para o JsonPropertyName
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

        // --- MAPEAMENTO EXPLÍCITO: FORÇA O C# A LER O "id" DO JSON ---
        private class AdminUserResponse
        {
            [JsonPropertyName("id")]
            public string Id { get; set; } = string.Empty;

            [JsonPropertyName("email")]
            public string Email { get; set; } = string.Empty;
        }

        [HttpPost("User")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (string.IsNullOrEmpty(_serviceKey))
            {
                return StatusCode(500, new { mensagem = "ServiceRoleKey não configurada no Railway." });
            }

            try
            {
                // 1. Criar Usuário no Auth via Admin API
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("apikey", _serviceKey);
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _serviceKey);

                var authPayload = new
                {
                    email = request.Email,
                    password = request.Password,
                    email_confirm = true 
                };

                var content = new StringContent(JsonSerializer.Serialize(authPayload), Encoding.UTF8, "application/json");
                var response = await httpClient.PostAsync($"{_supabaseUrl}/auth/v1/admin/users", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest(new { mensagem = "Falha ao criar usuário no Auth.", detalhe = responseBody });
                }

                // Desserialização com mapeamento explícito
                var createdUser = JsonSerializer.Deserialize<AdminUserResponse>(responseBody);

                if (createdUser == null || string.IsNullOrEmpty(createdUser.Id))
                {
                    return BadRequest(new { 
                        mensagem = "O ID mapeado ainda está nulo.", 
                        corpo_recebido = responseBody 
                    });
                }

                // 2. Vincular Role na tabela 'user_roles'
                var options = new Supabase.SupabaseOptions { AutoRefreshToken = false, AutoConnectRealtime = false };
                var adminClient = new Supabase.Client(_supabaseUrl, _serviceKey, options);
                await adminClient.InitializeAsync();

                var newUserRole = new UserRole
                {
                    Id = createdUser.Id, // Usando a propriedade mapeada
                    Role = request.Role.ToLower() == "admin" ? "admin" : "client"
                };

                try 
                {
                    await adminClient.From<UserRole>().Insert(newUserRole);
                }
                catch (Exception dbEx)
                {
                    return BadRequest(new { 
                        mensagem = "Usuário criado no Auth, mas falhou ao salvar a Role no banco.", 
                        erro_banco = dbEx.Message 
                    });
                }

                return Ok(new { 
                    mensagem = "Usuário e Role criados com sucesso!", 
                    userId = createdUser.Id,
                    email = createdUser.Email,
                    role = newUserRole.Role 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { 
                    mensagem = "Erro crítico no processo.", 
                    detalhe = ex.Message,
                    stack = ex.StackTrace 
                });
            }
        }
    }
}