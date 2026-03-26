using Microsoft.EntityFrameworkCore;
using EcoMonitor.Api;
using Scalar.AspNetCore; // <--- Importante adicionar isso

var builder = WebApplication.CreateBuilder(args);

// 1. Banco de Dados
var connectionString = "server=localhost;database=ecomonitor_db;user=root;password=Tec.2023";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 2. Configurar CORS (Liberar o Angular)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi(); // Nativo do .NET 9

var app = builder.Build();


// 2. Interface Visual do Scalar (O novo Swagger)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // Cria a página visual em /scalar/v1
}
app.UseCors("PermitirAngular");
app.UseHttpsRedirection();
app.MapControllers();

app.Run();