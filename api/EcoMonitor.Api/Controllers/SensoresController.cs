using Microsoft.AspNetCore.Mvc;
using EcoMonitor.Api.Models;
using Postgrest;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Linq; // ADICIONADO: Necessário para o .Select()
using Postgrest.Models;

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
        // Busca todos os sensores e limpa os dados antes de enviar (Resolve o Erro 500)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SensorDTO>>> GetSensores()
        {
            try 
            {
                var result = await _supabaseClient.From<SensorModel>().Get();
                
                // Transformamos a lista do banco (SensorModel) na lista limpa (SensorDTO)
                // Isso remove os campos "sujos" como baseUrl, tableName, etc.
                var listaLimpa = result.Models.Select(s => new SensorDTO
                {
                    Id = s.Id,
                    Nome = s.Nome,
                    PosX = s.PosX,
                    PosY = s.PosY,
                    Temperatura = s.Temperatura,
                    Umidade = s.Umidade,
                    Co2 = s.Co2
                }).ToList();

                return Ok(listaLimpa);
            }
            catch (Exception ex) 
            {
                return BadRequest(new { mensagem = "Erro ao ler do banco", detalhe = ex.Message });
            }
        }

        // POST: api/Sensores
        [HttpPost]
        public async Task<ActionResult> SalvarSensor([FromBody] SensorModel sensor)
        {
            try
            {
                var options = new QueryOptions 
                { 
                    Returning = QueryOptions.ReturnType.Minimal 
                };

                await _supabaseClient
                    .From<SensorModel>()
                    .Upsert(sensor, options);

                return Ok(new { mensagem = "Sensor salvo com sucesso!", id = sensor.Id });
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