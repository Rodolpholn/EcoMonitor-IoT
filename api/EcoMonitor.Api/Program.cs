using Microsoft.EntityFrameworkCore;
using EcoMonitor.Api;
using Scalar.AspNetCore; // <--- Importante adicionar isso

var builder = WebApplication.CreateBuilder(args);

// 1. Banco de Dados
var connectionString = "Host=db.eznsxbjdssojayrqetry.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=3ca!8M39Fa$%s@N;SslMode=Require;Trust Server Certificate=true";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Configurar CORS (Liberar o Angular)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirAngular", policy =>
    {
        policy.AllowAnyOrigin() // Permite qualquer site (Vercel, Celular, etc)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi(); // Nativo do .NET 9

var app = builder.Build();


// 2. Interface Visual do Scalar (O novo Swagger)
app.UseHttpsRedirection();
app.MapOpenApi();
app.MapScalarApiReference(ptions =>
{
    // Define o título da página e força o servidor a usar HTTPS
    options.WithTitle("EcoMonitor API")
           .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
}); // Cria a página visual em /scalar/v1
app.UseCors("PermitirAngular");
app.UseHttpsRedirection();
app.MapControllers();

app.Run();