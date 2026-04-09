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

// 5. CORS - AJUSTE PARA ELIMINAR O ERRO DO CONSOLE
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Permite explicitamente o seu Angular local
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Necessário para enviar tokens/sessão
    });
});

// 6. Controllers com Ajuste de JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Importante: PropertyNamingPolicy = null mantém os nomes das propriedades como estão no C#
        options.JsonSerializerOptions.PropertyNamingPolicy = null; 
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddOpenApi(); 

var app = builder.Build();

// --- ORDEM DOS MIDDLEWARES (CRÍTICO) ---

// 1. CORS deve ser a PRIMEIRA coisa para evitar erro no pre-flight do navegador
app.UseCors("AllowAll");

// 2. Middleware para Railway/HTTPS (ajusta o esquema para não dar erro de segurança)
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