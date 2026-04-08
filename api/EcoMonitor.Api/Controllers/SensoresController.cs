using Microsoft.AspNetCore.Mvc;
using EcoMonitor.Api.Models;
using Postgrest;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Linq; 
using Postgrest.Models;
using Microsoft.AspNetCore.Authorization;

namespace EcoMonitor.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/Sensores")]
    public class SensoresController : ControllerBase
    {
        private readonly Supabase.Client _supabaseClient;
        
        // Chave de segurança para os dispositivos IoT (Mesma que colocar no ESP32)
        private const string IOT_API_KEY = "Thermofrio_Seguranca_Maxima_2026_@#";

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
        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult> SalvarSensor([FromBody] SensorModel sensor)
        {
            try
            {
                // Se for uma requisição do ESP32 (ou se não houver Token Auth), valida pela API Key
                if (!User.Identity.IsAuthenticated)
                {
                    if (!Request.Headers.TryGetValue("X-Api-Key", out var extractedApiKey) || extractedApiKey != IOT_API_KEY)
                    {
                        return Unauthorized(new { mensagem = "Acesso negado: API Key inválida ou Token ausente." });
                    }
                }

                var options = new QueryOptions 
                { 
                    Returning = QueryOptions.ReturnType.Minimal 
                };

                await _supabaseClient
                    .From<SensorModel>()
                    .Upsert(sensor, options);

                return Ok(new { mensagem = "Dados processados com sucesso!", id = sensor.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro ao processar dados", detalhe = ex.Message });
            }
        }

        // DELETE: api/Sensores/{id}
        // LIBERADO TEMPORARIAMENTE: AllowAnonymous para limpeza via Scalar sem erro 401
        [AllowAnonymous]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSensor(string id)
        {
            try
            {
                // Busca o sensor antes de deletar para garantir que existe
                var check = await _supabaseClient
                    .From<SensorModel>()
                    .Where(x => x.Id == id)
                    .Get();

                if (check.Models.Count == 0)
                {
                    return NotFound(new { mensagem = "Sensor não encontrado no banco de dados." });
                }

                // Executa a exclusão
                await _supabaseClient
                    .From<SensorModel>()
                    .Where(x => x.Id == id)
                    .Delete();

                return Ok(new { mensagem = "Sensor removido com sucesso!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro ao excluir sensor", detalhe = ex.Message });
            }
        }
    }
}