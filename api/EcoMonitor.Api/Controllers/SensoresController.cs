using Microsoft.AspNetCore.Mvc;
using EcoMonitor.Api.Models;
using Postgrest;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace EcoMonitor.Api.Controllers
{
    [ApiController]
    [Route("api/Sensores")]
    public class SensoresController : ControllerBase
    {
        private readonly Supabase.Client _supabaseClient;

        public SensoresController(Supabase.Client supabaseClient)
        {
            _supabaseClient = supabaseClient;
        }

        // GET: api/Sensores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SensorModel>>> GetSensores()
        {
            try 
            {
                var result = await _supabaseClient.From<SensorModel>().Get();
                // Retorna a lista de modelos encontrados no Supabase
                return Ok(result.Models);
            }
            catch (Exception ex) 
            {
                return BadRequest(new { mensagem = "Erro ao ler do banco", detalhe = ex.Message });
            }
        }

        // POST: api/Sensores
        [HttpPost]
        public async Task<ActionResult<SensorModel>> SalvarSensor([FromBody] SensorModel sensor)
        {
            try
            {
                // Removi a linha 'sensor.UpdatedAt' porque removemos do Model
                // O Upsert vai inserir se o ID for novo ou atualizar se já existir
                var result = await _supabaseClient
                    .From<SensorModel>()
                    .Upsert(sensor);

                // Retorna o objeto que foi salvo
                return Ok(result.Model);
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro ao salvar sensor", detalhe = ex.Message });
            }
        }

        // DELETE: api/Sensores/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSensor(string id)
        {
            try
            {
                await _supabaseClient
                    .From<SensorModel>()
                    .Where(x => x.Id == id)
                    .Delete();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro ao excluir sensor", detalhe = ex.Message });
            }
        }
    }
}