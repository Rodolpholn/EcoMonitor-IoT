using Microsoft.AspNetCore.Mvc;
using EcoMonitor.Api.Models;
using Postgrest;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Linq; 
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
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SensorDTO>>> GetSensores()
        {
            try 
            {
                var result = await _supabaseClient.From<SensorModel>().Get();
                
                var listaLimpa = result.Models.Select(s => new SensorDTO
                {
                    Id = s.Id,
                    Nome = s.Nome,
                    PosX = s.PosX,
                    PosY = s.PosY,
                    // Novos campos da sua ESP32
                    Co2 = s.Co2,
                    Tvoc = s.Tvoc,
                    TempAht20 = s.TempAht20,
                    UmidadeAht20 = s.UmidadeAht20,
                    PressaoBmp280 = s.PressaoBmp280,
                    TempSht40 = s.TempSht40,
                    UmidadeSht40 = s.UmidadeSht40,
                    TempSht41 = s.TempSht41,
                    Luminosidade = s.Luminosidade,
                    TensaoBateria = s.TensaoBateria,
                    CorrenteCompressor = s.CorrenteCompressor,
                    TensaoCompressor = s.TensaoCompressor,
                    SensorPorta = s.SensorPorta
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