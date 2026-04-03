using Microsoft.EntityFrameworkCore;
using EcoMonitor.Api;
using Scalar.AspNetCore;
using Supabase;
using System.Text.Json;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// 1. Banco de Dados
var connectionString = "Host=aws-1-sa-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.eznsxbjdssojayrqetry;Password=3ca!8M39Fa$%s@N;SslMode=Require;Trust Server Certificate=true;";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Supabase Client
var supabaseUrl = "https://eznsxbjdssojayrqetry.supabase.co";
var supabaseKey = "sb_publishable_EWmGPALIJD2IzpS9o0nvWg_qz5zs..."; 

builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(supabaseUrl, supabaseKey, new SupabaseOptions
    {
        AutoRefreshToken = true,
        AutoConnectRealtime = true
    }));

// 3. CORS Super Flexível (Para matar o erro de uma vez)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTudo", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 4. Controllers com Ajuste de JSON (Evita o Erro 400 por causa de nomes de campos)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Mantém nomes originais
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true; // Aceita maiúsculo ou minúsculo
    });

builder.Services.AddOpenApi(); 

var app = builder.Build();

// --- ORDEM DOS MIDDLEWARES (AJUSTADA PARA RAILWAY) ---

// O CORS DEVE SER O PRIMEIRO
app.UseCors("PermitirTudo");

// Forçar HTTPS para o Railway não se perder
app.Use((context, next) =>
{
    context.Request.Scheme = "https";
    return next();
});

app.MapOpenApi();
app.MapScalarApiReference(options => 
{
    options.WithTitle("EcoMonitor API")
           .WithTheme(ScalarTheme.Moon);
});

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();