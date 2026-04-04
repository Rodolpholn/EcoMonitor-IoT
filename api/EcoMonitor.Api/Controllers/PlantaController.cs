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
                // Busca a configuração da planta (ID 1)
                var result = await _supabaseClient
                    .From<PlantaModel>()
                    .Where(x => x.Id == 1)
                    .Get();

                var planta = result.Models.FirstOrDefault();
                if (planta == null) return NotFound(new { mensagem = "Configuração não encontrada" });

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
                // Forçamos o ID 1 para garantir que só exista uma configuração de planta
                planta.Id = 1;

                await _supabaseClient
                    .From<PlantaModel>()
                    .Upsert(planta);

                return Ok(new { mensagem = "Planta atualizada com sucesso!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro ao salvar planta", detalhe = ex.Message });
            }
        }
    }
 }
