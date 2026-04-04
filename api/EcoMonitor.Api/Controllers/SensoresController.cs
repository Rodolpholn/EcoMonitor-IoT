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
        // Busca todos os sensores para renderizar na planta baixa do Angular
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
                return BadRequest(new { mensagem = "Erro ao ler do banco", detalhe = ex.Message });
            }
        }

        // POST: api/Sensores
        // Insere ou atualiza um sensor (Upsert)
        [HttpPost]
        public async Task<ActionResult> SalvarSensor([FromBody] SensorModel sensor)
        {
            try
            {
                // CONFIGURAÇÃO CRÍTICA:
                // ReturnType.Minimal impede que o Supabase tente devolver o objeto completo.
                // Isso resolve o Erro 500 que derrubava sua API ao processar a resposta.
                var options = new QueryOptions 
                { 
                    Returning = QueryOptions.ReturnType.Minimal 
                };

                await _supabaseClient
                    .From<SensorModel>()
                    .Upsert(sensor, options);

                // Retornamos um JSON manual para confirmar o sucesso para o Angular/Scalar
                return Ok(new { mensagem = "Sensor salvo com sucesso!", id = sensor.Id });
            }
            catch (Exception ex)
            {
                // Se der erro de coluna faltando ou tipo de dado, ele aparece aqui sem cair a API
                return BadRequest(new { mensagem = "Erro ao salvar sensor", detalhe = ex.Message });
            }
        }

        // DELETE: api/Sensores/{id}
        // Remove um sensor da planta baixa
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