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

app.Use((context, next) =>
{
    context.Request.Scheme = "https";
    return next();
});

// 2. Interface Visual do Scalar (O novo Swagger)
app.MapOpenApi();
app.MapScalarApiReference(options => // <-- VEJA O "options =>" AQUI
{
    options.WithTitle("EcoMonitor API")
           .WithTheme(ScalarTheme.Moon);
});
 // Cria a página visual em /scalar/v1
app.UseCors("PermitirAngular");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();