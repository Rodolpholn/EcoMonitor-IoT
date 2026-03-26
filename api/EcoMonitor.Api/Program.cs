using Microsoft.EntityFrameworkCore;
using EcoMonitor.Api;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar a Conexão com o Banco de Dados (MySQL)
// Usaremos "root" e senha "root" para o seu teste local.
var connectionString = "server=localhost;database=ecomonitor_db;user=root;password=Tec.2023";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 2. Ativar os Controllers (a nossa recepção)
builder.Services.AddControllers();

// 3. Ativar o Swagger (a tela de testes que mencionei)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

// 4. Configurar o que a API faz ao rodar
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// 5. Ligar as rotas automáticas
app.MapControllers();

app.Run();