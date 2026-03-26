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

    // Método para RECEBER os dados do sensor (POST)
    [HttpPost]
    public async Task<IActionResult> EnviarDados([FromBody] LeituraSensor leitura)
    {
        _context.Leituras.Add(leitura);
        await _context.SaveChangesAsync();
        return Ok(new { mensagem = "Dados salvos com sucesso no banco!" });
    }

    // Método para BUSCAR os dados para o Angular (GET)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeituraSensor>>> ListarDados()
    {
        return await _context.Leituras.OrderByDescending(x => x.DataHora).ToListAsync();
    }
}