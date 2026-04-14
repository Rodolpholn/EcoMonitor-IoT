using Microsoft.EntityFrameworkCore;
using EcoMonitor.Api;
using Scalar.AspNetCore;
using Supabase;
using Microsoft.AspNetCore.Http.Features;
using EcoMonitor.Api.Authentication;
using Microsoft.Extensions.Options;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração de Limites de Upload
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = int.MaxValue;
    options.MemoryBufferThreshold = int.MaxValue;
});

// 2. Banco de Dados (Supabase PostgreSQL)
var connectionString = "Host=aws-1-sa-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.eznsxbjdssojayrqetry;Password=3ca!8M39Fa$%s@N;SslMode=Require;Trust Server Certificate=true;";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 3. Supabase Client
var supabaseUrl = "https://eznsxbjdssojayrqetry.supabase.co";
var supabaseKey = "sb_publishable_EWmGpALIJD2IzpS9o0nvWg_qz5zsgWR"; 

builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(supabaseUrl, supabaseKey, new SupabaseOptions
    {
        AutoRefreshToken = true,
        AutoConnectRealtime = true
    }));

// 4. Autenticação e Autorização
builder.Services.AddAuthentication("Supabase")
    .AddScheme<SupabaseAuthenticationOptions, SupabaseAuthenticationHandler>("Supabase", null);

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
});

// 5. CORS (Ajustado para permitir apenas o domínio do frontend hospedado)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        // Permite o domínio principal do Vercel, links temporários de preview e o seu ambiente local
        policy.SetIsOriginAllowed(origin => 
                  origin.EndsWith(".vercel.app") || 
                  origin == "http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Necessário para enviar tokens/sessão
    });
});

// 6. Controllers com Ajuste de JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Mantém os nomes das propriedades exatamente como estão no modelo C# (sem camelCase)
        options.JsonSerializerOptions.PropertyNamingPolicy = null; 
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddOpenApi(); 

var app = builder.Build();

// --- ORDEM DOS MIDDLEWARES (CRÍTICO) ---

// 1. CORS SEMPRE antes de Autenticação/Autorização
app.UseCors("AllowAll");

// 2. Middleware para corrigir o esquema (http/https) quando atrás de um proxy reverso
app.Use((context, next) =>
{
    if (context.Request.Headers.ContainsKey("X-Forwarded-Proto"))
    {
        context.Request.Scheme = context.Request.Headers["X-Forwarded-Proto"]!;
    }
    return next();
});

app.MapOpenApi();
app.MapScalarApiReference(options => 
{
    options.WithTitle("EcoMonitor API").WithTheme(ScalarTheme.Moon);
});

// Autenticação e Autorização SEMPRE depois do CORS
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();