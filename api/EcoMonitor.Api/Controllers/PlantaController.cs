using Microsoft.AspNetCore.Mvc;
using EcoMonitor.Api.Models;
using Postgrest;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace EcoMonitor.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlantaController : ControllerBase
    {
        private readonly Supabase.Client _supabaseClient;

        public PlantaController(Supabase.Client supabaseClient)
        {
            _supabaseClient = supabaseClient;
        }

        // GET: api/Planta
        [HttpGet]
        public async Task<ActionResult<PlantaModel>> GetPlanta()
        {
            try
            {
                // Busca todas as configurações e filtra o ID 1 na memória para evitar erros de cast/query
                var result = await _supabaseClient
                    .From<PlantaModel>()
                    .Get();

                var planta = result.Models.FirstOrDefault(x => x.Id == 1);
                
                if (planta == null) 
                    return NotFound(new { mensagem = "Configuração não encontrada no banco." });

                return Ok(planta);
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro ao buscar planta", detalhe = ex.Message });
            }
        }

        // POST: api/Planta/update
        [HttpPost("update")]
        public async Task<ActionResult> UpdatePlanta([FromBody] PlantaModel planta)
        {
            try
            {
                if (planta == null) return BadRequest("Dados inválidos.");

                // Garante que estamos sempre atualizando o registro único
                planta.Id = 1;

                // LOG DE DEBUG: Verifique isso no console do seu Railway/Terminal
                Console.WriteLine($"[INFO] Recebendo update de planta. ID: {planta.Id}");
                if (!string.IsNullOrEmpty(planta.ImagemUrl))
                {
                    Console.WriteLine($"[INFO] Tamanho da string Base64: {planta.ImagemUrl.Length} caracteres.");
                }

                // O Upsert identifica o ID 1 e atualiza a linha existente
                await _supabaseClient
                    .From<PlantaModel>()
                    .Upsert(planta);

                return Ok(new { mensagem = "Planta atualizada com sucesso!" });
            }
            catch (Exception ex)
            {
                // Log detalhado do erro no servidor
                Console.WriteLine($"[ERRO] Falha ao dar Upsert na planta: {ex.Message}");
                return BadRequest(new { mensagem = "Erro ao salvar planta", detalhe = ex.Message });
            }
        }
    }
}