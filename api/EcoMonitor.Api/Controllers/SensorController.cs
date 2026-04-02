using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcoMonitor.Api.Models;

namespace EcoMonitor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SensorController : ControllerBase
{
    private readonly AppDbContext _context;

    public SensorController(AppDbContext context)
    {
        _context = context;
    }

    // Método para RECEBER os dados do sensor ESP32 (POST)
    [HttpPost]
    public async Task<IActionResult> EnviarDados([FromBody] SensorLeitura leitura)
    {
        if (leitura == null) return BadRequest("Dados inválidos.");

        // --- Lógica de Alerta do Cliente ---
        // Usamos a temperatura do SHT40 como referência principal
        if (leitura.TempSht40 > 60 || leitura.TempSht40 < -20)
        {
            leitura.AlertaAtivo = true;
        }
        else
        {
            leitura.AlertaAtivo = false;
        }

        leitura.DataHora = DateTime.Now; // Garante o horário do registro

        _context.SensorLeituras.Add(leitura);
        await _context.SaveChangesAsync();

        return Ok(new { 
            mensagem = "Dados salvos com sucesso!", 
            alerta = leitura.AlertaAtivo,
            id = leitura.Id 
        });
    }

    // Método para BUSCAR os dados para o Angular (GET)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SensorLeitura>>> ListarDados()
    {
        // Retorna as últimas 50 leituras para não sobrecarregar o gráfico inicial
        return await _context.SensorLeituras
            .OrderByDescending(x => x.DataHora)
            .Take(50)
            .ToListAsync();
    }
}