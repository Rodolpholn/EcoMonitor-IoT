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
        private const string IOT_API_KEY = "Thermofrio_Seguranca_Maxima_2026_@#";

        public SensoresController(Supabase.Client supabaseClient)
        {
            _supabaseClient = supabaseClient;
        }

        // GET: api/Sensores
        [HttpGet]
        [EndpointSummary("Lista todos os sensores com telemetria e posição")]
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

        // POST: api/Sensores/Cadastrar (Ação do Dashboard Angular)
        [HttpPost("Cadastrar")]
        [EndpointSummary("Fixa a posição de um sensor na planta (Dashboard)")]
        public async Task<ActionResult> CadastrarSensor([FromBody] SensorModel sensor)
        {
            try
            {
                Console.WriteLine($"[ANGULAR] Cadastrando ID: {sensor.Id} em X:{sensor.PosX} Y:{sensor.PosY}");

                var options = new QueryOptions { Returning = QueryOptions.ReturnType.Minimal };
                
                // Realiza o Upsert (Cria se não existe, atualiza se já existe)
                await _supabaseClient.From<SensorModel>().Upsert(sensor, options);

                return Ok(new { mensagem = "Equipamento fixado na planta!", id = sensor.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro ao cadastrar equipamento", detalhe = ex.Message });
            }
        }

        // POST: api/Sensores (Ação da ESP32)
        [AllowAnonymous]
        [HttpPost]
        [EndpointSummary("Recebe telemetria da ESP32 (Não altera posição)")]
        public async Task<ActionResult> SalvarSensor([FromBody] SensorModel sensor)
        {
            try
            {
                // Correção do erro de referência nula
                if (User.Identity?.IsAuthenticated != true)
                {
                    if (!Request.Headers.TryGetValue("X-Api-Key", out var extractedApiKey) || extractedApiKey != IOT_API_KEY)
                    {
                        return Unauthorized(new { mensagem = "Acesso negado: API Key inválida ou Token ausente." });
                    }
                }

                var check = await _supabaseClient.From<SensorModel>().Where(x => x.Id == sensor.Id).Get();

                if (check.Models.Count == 0)
                {
                    return NotFound(new { mensagem = "Equipamento não pré-cadastrado." });
                }

                // Preserva as coordenadas atuais do banco para a ESP32 não zerar o ícone
                var sensorExistente = check.Models[0];
                sensor.PosX = sensorExistente.PosX;
                sensor.PosY = sensorExistente.PosY;

                await _supabaseClient
                    .From<SensorModel>()
                    .Where(x => x.Id == sensor.Id)
                    .Update(sensor);

                return Ok(new { mensagem = "Leitura processada!", id = sensor.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro ao processar dados", detalhe = ex.Message });
            }
        }

        // DELETE: api/Sensores/{id}
        [AllowAnonymous]
        [HttpDelete("{id}")]
        [EndpointSummary("Remove um sensor do sistema")]
        public async Task<IActionResult> DeleteSensor(string id)
        {
            try
            {
                var check = await _supabaseClient.From<SensorModel>().Where(x => x.Id == id).Get();
                if (check.Models.Count == 0) return NotFound(new { mensagem = "Sensor não encontrado." });

                await _supabaseClient.From<SensorModel>().Where(x => x.Id == id).Delete();
                return Ok(new { mensagem = "Sensor removido!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro ao excluir", detalhe = ex.Message });
            }
        }
    }
}