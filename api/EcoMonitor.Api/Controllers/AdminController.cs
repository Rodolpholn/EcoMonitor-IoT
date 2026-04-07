using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
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
            
            // Tenta ler de diferentes formatos de chave comuns no Railway
            _serviceKey = _configuration["Supabase:ServiceRoleKey"] 
                          ?? _configuration["Supabase__ServiceRoleKey"] 
                          ?? "";
        }

        public class CreateUserRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Role { get; set; } = "client";
        }

        private class AdminUserResponse
        {
            [JsonPropertyName("id")]
            public string Id { get; set; } = string.Empty;

            [JsonPropertyName("email")]
            public string Email { get; set; } = string.Empty;
        }

        // --- 1. CRIAR USUÁRIO ---
        [HttpPost("User")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (string.IsNullOrEmpty(_serviceKey))
            {
                return StatusCode(500, new { mensagem = "ServiceRoleKey não configurada no Railway." });
            }

            try
            {
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

                var createdUser = JsonSerializer.Deserialize<AdminUserResponse>(responseBody);

                if (createdUser == null || string.IsNullOrEmpty(createdUser.Id))
                {
                    return BadRequest(new { mensagem = "O ID mapeado ainda está nulo.", corpo_recebido = responseBody });
                }

                var options = new Supabase.SupabaseOptions { AutoRefreshToken = false, AutoConnectRealtime = false };
                var adminClient = new Supabase.Client(_supabaseUrl, _serviceKey, options);
                await adminClient.InitializeAsync();

                var newUserRole = new UserRole
                {
                    Id = createdUser.Id,
                    Role = request.Role.ToLower() == "admin" ? "admin" : "client"
                };

                await adminClient.From<UserRole>().Insert(newUserRole);

                return Ok(new { 
                    mensagem = "Usuário e Role criados com sucesso!", 
                    userId = createdUser.Id,
                    email = createdUser.Email,
                    role = newUserRole.Role 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro crítico na criação.", detalhe = ex.Message });
            }
        }

        // --- 2. LISTAR USUÁRIOS (Corrigido para evitar Erro 500) ---
        [HttpGet("Users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var options = new Supabase.SupabaseOptions { AutoRefreshToken = false, AutoConnectRealtime = false };
                var adminClient = new Supabase.Client(_supabaseUrl, _serviceKey, options);
                await adminClient.InitializeAsync();

                // O SEGREDO: .Select("id, role") evita que o C# busque colunas que não existem
                var response = await adminClient.From<UserRole>()
                                                .Select("id, role")
                                                .Get();

                return Ok(response.Models);
            }
            catch (Exception ex)
            {
                // Retorna o erro real para você ver no navegador
                return StatusCode(500, new { mensagem = "Erro ao listar usuários no banco.", detalhe = ex.Message });
            }
        }

        // --- 3. EXCLUIR USUÁRIO ---
        [HttpDelete("User/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            try
            {
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("apikey", _serviceKey);
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _serviceKey);

                var response = await httpClient.DeleteAsync($"{_supabaseUrl}/auth/v1/admin/users/{id}");

                if (!response.IsSuccessStatusCode)
                {
                    var errorDetail = await response.Content.ReadAsStringAsync();
                    return BadRequest(new { mensagem = "Erro ao deletar no Auth.", detalhe = errorDetail });
                }

                var options = new Supabase.SupabaseOptions { AutoRefreshToken = false, AutoConnectRealtime = false };
                var adminClient = new Supabase.Client(_supabaseUrl, _serviceKey, options);
                await adminClient.InitializeAsync();

                await adminClient.From<UserRole>().Where(x => x.Id == id).Delete();

                return Ok(new { mensagem = "Usuário removido com sucesso!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro interno ao deletar.", detalhe = ex.Message });
            }
        }
    }
}