using Microsoft.AspNetCore.Mvc;
using EcoMonitor.Api.Models;
using Postgrest;
using System.Threading.Tasks;
using System;
using System.Linq;
using Microsoft.AspNetCore.Authorization;

namespace EcoMonitor.Api.Controllers
{
    [Authorize]
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
        public async Task<ActionResult> GetPlanta()
        {
            try
            {
                var result = await _supabaseClient.From<PlantaModel>().Get();
                var planta = result.Models.FirstOrDefault(x => x.Id == 1);

                if (planta == null) 
                    return Ok(new { Id = 1, ImagemUrl = "" });

                // Retorna apenas o ID e a URL da imagem para o frontend
                return Ok(new { Id = planta.Id, ImagemUrl = planta.ImagemUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        // POST: api/Planta/update
        [Authorize(Policy = "AdminOnly")]
        [HttpPost("update")]
        public async Task<ActionResult> UpdatePlanta([FromBody] PlantaModel planta)
        {
            try
            {
                if (planta == null || string.IsNullOrEmpty(planta.ImagemUrl)) 
                {
                    // Se a planta for nula ou a URL da imagem estiver vazia, cria um novo registro com ID 1 e URL vazia
                    planta = new PlantaModel { Id = 1, ImagemUrl = "" };
                }

                planta.Id = 1;

                Console.WriteLine($"[INFO] Atualizando planta. Tamanho Base64: {planta.ImagemUrl.Length}");

                await _supabaseClient
                    .From<PlantaModel>()
                    .Upsert(planta);

                return Ok(new { mensagem = "Planta atualizada com sucesso!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERRO POST] {ex.Message}");
                return BadRequest(new { mensagem = "Erro ao salvar planta", detalhe = ex.Message });
            }
        }
    }
}