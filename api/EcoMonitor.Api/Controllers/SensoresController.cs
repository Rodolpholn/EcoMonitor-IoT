using Microsoft.AspNetCore.Mvc;
using EcoMonitor.Api.Models;
using Postgrest;
using System.Threading.Tasks;
using System.Collections.Generic;

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

        // GET: api/sensores
        // Retorna todos os sensores cadastrados para desenhar no mapa do Angular
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SensorModel>>> GetSensores()
        {
            try 
    {
        var result = await _supabaseClient.From<SensorModel>().Get();
        return Ok(result.Models);
    }
    catch (Exception ex) 
    {
        // Isso vai fazer o erro aparecer no Log do Railway sem derrubar a API
        return BadRequest(new { mensagem = "Erro ao ler do banco", detalhe = ex.Message });
    }
        }

        // POST: api/sensores
        // Salva um novo sensor ou atualiza a posição de um existente
        [HttpPost]
        public async Task<ActionResult<SensorModel>> SalvarSensor([FromBody] SensorModel sensor)
        {
            try
            {
                // O método Upsert do Supabase insere se não existir 
                // ou atualiza se o ID já estiver no banco
                sensor.UpdatedAt = DateTime.UtcNow;
                
                var result = await _supabaseClient
                    .From<SensorModel>()
                    .Upsert(sensor);

                return Ok(result.Model);
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao salvar sensor: {ex.Message}");
            }
        }

        // DELETE: api/sensores/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSensor(string id)
        {
            await _supabaseClient
                .From<SensorModel>()
                .Where(x => x.Id == id)
                .Delete();

            return NoContent();
        }
    }
}