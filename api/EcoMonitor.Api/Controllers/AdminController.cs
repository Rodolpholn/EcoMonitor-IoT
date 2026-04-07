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
using System.Linq;

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
                return StatusCode(500, new { mensagem = "ServiceRoleKey não configurada no Railway." });

            try
            {
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("apikey", _serviceKey);
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _serviceKey);

                var authPayload = new { email = request.Email, password = request.Password, email_confirm = true };
                var content = new StringContent(JsonSerializer.Serialize(authPayload), Encoding.UTF8, "application/json");
                
                var response = await httpClient.PostAsync($"{_supabaseUrl}/auth/v1/admin/users", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return BadRequest(new { mensagem = "Falha ao criar usuário no Auth.", detalhe = responseBody });

                var createdUser = JsonSerializer.Deserialize<AdminUserResponse>(responseBody);

                var options = new Supabase.SupabaseOptions { AutoRefreshToken = false, AutoConnectRealtime = false };
                var adminClient = new Supabase.Client(_supabaseUrl, _serviceKey, options);
                await adminClient.InitializeAsync();

                var newUserRole = new UserRole
                {
                    Id = createdUser.Id,
                    Role = request.Role.ToLower() == "admin" ? "admin" : "client"
                };

                await adminClient.From<UserRole>().Insert(newUserRole);

                return Ok(new { mensagem = "Usuário e Role criados com sucesso!", userId = createdUser.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro crítico na criação.", detalhe = ex.Message });
            }
        }

        // --- 2. LISTAR USUÁRIOS (Cruzando Auth com Banco de Dados) ---
        [HttpGet("Users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                // A. Buscar e-mails no Supabase Auth
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("apikey", _serviceKey);
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _serviceKey);

                var authResponse = await httpClient.GetAsync($"{_supabaseUrl}/auth/v1/admin/users");
                if (!authResponse.IsSuccessStatusCode)
                    return BadRequest(new { mensagem = "Erro ao buscar usuários no Auth" });

                var authResponseBody = await authResponse.Content.ReadAsStringAsync();
                var authData = JsonDocument.Parse(authResponseBody);
                var usersArray = authData.RootElement.GetProperty("users");

                // B. Buscar Roles na tabela user_roles
                var options = new Supabase.SupabaseOptions { AutoRefreshToken = false, AutoConnectRealtime = false };
                var adminClient = new Supabase.Client(_supabaseUrl, _serviceKey, options);
                await adminClient.InitializeAsync();
                
                var rolesResponse = await adminClient.From<UserRole>().Select("id, role").Get();
                var rolesList = rolesResponse.Models;

                // C. Cruzar os dados para gerar a lista final
                var listaCompleta = new List<object>();

                foreach (var user in usersArray.EnumerateArray())
                {
                    var id = user.GetProperty("id").GetString();
                    var email = user.GetProperty("email").GetString();
                    
                    // Busca a role correspondente ao ID, se não achar define como client
                    var roleObj = rolesList.FirstOrDefault(r => r.Id == id);
                    var roleName = roleObj?.Role ?? "client";

                    listaCompleta.Add(new
                    {
                        Id = id,
                        Email = email,
                        Role = roleName
                    });
                }

                return Ok(listaCompleta);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensagem = "Erro ao processar lista de usuários.", detalhe = ex.Message });
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

                // 1. Deleta do Auth
                var response = await httpClient.DeleteAsync($"{_supabaseUrl}/auth/v1/admin/users/{id}");

                // 2. Deleta do Banco (user_roles)
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