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
                    UpdatedAt = s.UpdatedAt,
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
                    SensorPorta = s.SensorPorta,
                    TempMax = s.TempMax,
                    TempMin = s.TempMin,
                    UmidadeMax = s.UmidadeMax,
                    UmidadeMin = s.UmidadeMin
                }).ToList();

                return Ok(listaLimpa);
            }
            catch (Exception ex) 
            {
                return BadRequest(new { mensagem = "Erro ao ler do banco", detalhe = ex.Message });
            }
        }

        // DTO para receber o cadastro do Angular (com mapeamento correto de snake_case)
        public class CadastrarSensorRequest
        {
            [System.Text.Json.Serialization.JsonPropertyName("id")]
            public string Id { get; set; } = string.Empty;

            [System.Text.Json.Serialization.JsonPropertyName("nome")]
            public string? Nome { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("pos_x")]
            public double? PosX { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("pos_y")]
            public double? PosY { get; set; }
        }

        // POST: api/Sensores/Cadastrar (Ação do Dashboard Angular)
        [HttpPost("Cadastrar")]
        [EndpointSummary("Fixa a posição de um sensor na planta (Dashboard)")]
        public async Task<ActionResult> CadastrarSensor([FromBody] CadastrarSensorRequest request)
        {
            try
            {
                Console.WriteLine($"[ANGULAR] Cadastrando ID: {request.Id} em X:{request.PosX} Y:{request.PosY}");

                // Mapeia o DTO para o SensorModel do Postgrest
                var sensor = new SensorModel
                {
                    Id = request.Id,
                    Nome = request.Nome,
                    PosX = request.PosX,
                    PosY = request.PosY
                };

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

        // DTO para receber atualização de alertas
        public class AtualizarAlertasRequest
        {
            [System.Text.Json.Serialization.JsonPropertyName("id")]
            public string Id { get; set; } = string.Empty;

            [System.Text.Json.Serialization.JsonPropertyName("temp_max")]
            public double? TempMax { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("temp_min")]
            public double? TempMin { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("umidade_max")]
            public double? UmidadeMax { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("umidade_min")]
            public double? UmidadeMin { get; set; }
        }

        // POST: api/Sensores/Alertas
        [HttpPost("Alertas")]
        [EndpointSummary("Atualiza os limites de alerta de um sensor")]
        public async Task<ActionResult> AtualizarAlertas([FromBody] AtualizarAlertasRequest request)
        {
            try
            {
                var check = await _supabaseClient.From<SensorModel>().Where(x => x.Id == request.Id).Get();
                if (check.Models.Count == 0) return NotFound(new { mensagem = "Equipamento não encontrado." });

                var sensor = check.Models[0];
                sensor.TempMax = request.TempMax;
                sensor.TempMin = request.TempMin;
                sensor.UmidadeMax = request.UmidadeMax;
                sensor.UmidadeMin = request.UmidadeMin;

                await _supabaseClient.From<SensorModel>().Where(x => x.Id == request.Id).Update(sensor);
                return Ok(new { mensagem = "Alertas atualizados com sucesso!" });
            }
            catch (Exception ex) { return BadRequest(new { mensagem = "Erro ao atualizar alertas", detalhe = ex.Message }); }
        }

        // DTO para Editar
        public class EditarSensorRequest
        {
            [System.Text.Json.Serialization.JsonPropertyName("id_antigo")]
            public string IdAntigo { get; set; } = string.Empty;

            [System.Text.Json.Serialization.JsonPropertyName("id_novo")]
            public string IdNovo { get; set; } = string.Empty;

            [System.Text.Json.Serialization.JsonPropertyName("nome")]
            public string? Nome { get; set; }
        }

        // PUT: api/Sensores/Editar
        [HttpPut("Editar")]
        [EndpointSummary("Edita o ID e o Nome de um equipamento")]
        public async Task<ActionResult> EditarSensor([FromBody] EditarSensorRequest request)
        {
            try
            {
                var check = await _supabaseClient.From<SensorModel>().Where(x => x.Id == request.IdAntigo).Get();
                if (check.Models.Count == 0) return NotFound(new { mensagem = "Equipamento não encontrado." });

                var sensor = check.Models[0];

                if (request.IdAntigo != request.IdNovo)
                {
                    // Como a chave primária mudou, criamos um novo registro com os mesmos dados e deletamos o antigo para não perder as referências
                    var novoSensor = new SensorModel
                    {
                        Id = request.IdNovo,
                        Nome = request.Nome,
                        PosX = sensor.PosX,
                        PosY = sensor.PosY,
                        Co2 = sensor.Co2,
                        Tvoc = sensor.Tvoc,
                        UpdatedAt = sensor.UpdatedAt,
                        TempAht20 = sensor.TempAht20,
                        UmidadeAht20 = sensor.UmidadeAht20,
                        PressaoBmp280 = sensor.PressaoBmp280,
                        TempSht40 = sensor.TempSht40,
                        UmidadeSht40 = sensor.UmidadeSht40,
                        TempSht41 = sensor.TempSht41,
                        Luminosidade = sensor.Luminosidade,
                        TensaoBateria = sensor.TensaoBateria,
                        CorrenteCompressor = sensor.CorrenteCompressor,
                        TensaoCompressor = sensor.TensaoCompressor,
                        SensorPorta = sensor.SensorPorta,
                        TempMax = sensor.TempMax,
                        TempMin = sensor.TempMin,
                        UmidadeMax = sensor.UmidadeMax,
                        UmidadeMin = sensor.UmidadeMin
                    };

                    await _supabaseClient.From<SensorModel>().Insert(novoSensor);
                    await _supabaseClient.From<SensorModel>().Where(x => x.Id == request.IdAntigo).Delete();
                }
                else
                {
                    // Apenas atualiza o nome se o ID continuou igual
                    sensor.Nome = request.Nome;
                    await _supabaseClient.From<SensorModel>().Where(x => x.Id == request.IdAntigo).Update(sensor);
                }

                return Ok(new { mensagem = "Equipamento atualizado com sucesso!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro ao atualizar equipamento", detalhe = ex.Message });
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

                // Preserva as informações manuais atuais do banco para a ESP32 não apagá-las
                var sensorExistente = check.Models[0];
                sensor.PosX = sensorExistente.PosX;
                sensor.PosY = sensorExistente.PosY;
                sensor.Nome = sensorExistente.Nome;
                sensor.TempMax = sensorExistente.TempMax;
                sensor.TempMin = sensorExistente.TempMin;
                sensor.UmidadeMax = sensorExistente.UmidadeMax;
                sensor.UmidadeMin = sensorExistente.UmidadeMin;

                // Garante que o horário da leitura será atualizado no banco (Supabase) a cada POST da ESP32
                sensor.UpdatedAt = DateTime.UtcNow;

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