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
            // No Railway, isso lê a variável Supabase__ServiceRoleKey
            _serviceKey = _configuration["Supabase:ServiceRoleKey"] ?? "";
        }

        public class CreateUserRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Role { get; set; } = "client";
        }

        private class AdminUserResponse
        {
            // O Supabase Auth Admin API retorna o ID em letras minúsculas
            public string id { get; set; } = string.Empty;
            public string email { get; set; } = string.Empty;
        }

        [HttpPost("User")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (string.IsNullOrEmpty(_serviceKey) || _serviceKey.Contains("COLOQUE"))
            {
                return StatusCode(500, new { mensagem = "ServiceRoleKey não configurada corretamente. Verifique as variáveis no Railway." });
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
                    email_confirm = true 
                };

                var content = new StringContent(JsonSerializer.Serialize(authPayload), Encoding.UTF8, "application/json");
                
                var response = await httpClient.PostAsync($"{_supabaseUrl}/auth/v1/admin/users", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest(new { mensagem = "Falha ao criar usuário no Auth.", detalhe = responseBody });
                }

                // Usamos JsonSerializerOptions para garantir que ele ache o "id" mesmo se vier diferente do esperado
                var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var createdUser = JsonSerializer.Deserialize<AdminUserResponse>(responseBody, jsonOptions);

                // LOG DE SEGURANÇA: Se o ID vier nulo, precisamos saber o que o Supabase cuspiu
                if (createdUser == null || string.IsNullOrEmpty(createdUser.id))
                {
                    return BadRequest(new { 
                        mensagem = "Usuário criado no Auth, mas o ID veio nulo no retorno.", 
                        corpo_recebido = responseBody 
                    });
                }

                // 2. Vincular Role na tabela 'user_roles'
                var options = new Supabase.SupabaseOptions { AutoRefreshToken = false, AutoConnectRealtime = false };
                var adminClient = new Supabase.Client(_supabaseUrl, _serviceKey, options);
                await adminClient.InitializeAsync();

                var newUserRole = new UserRole
                {
                    Id = createdUser.id, // Aqui garantimos que o ID do Auth vai para a tabela
                    Role = request.Role.ToLower() == "admin" ? "admin" : "client"
                };

                // Inserção na tabela user_roles
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
                // return BadRequest(new { mensagem = "Erro interno ao processar criação.", detalhe = ex.Message });
                return BadRequest(new { 
                mensagem = "Erro interno ao processar criação.", 
                detalhe = ex.Message,
                stack = ex.StackTrace 
                });
            }
        }
    }
}