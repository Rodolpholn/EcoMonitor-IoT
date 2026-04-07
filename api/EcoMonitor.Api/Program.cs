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
    // Esta policy exige que o usuário tenha a role 'admin' na tabela user_roles
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
});

// 5. CORS Ajustado para Produção/Railway
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTudo", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .SetIsOriginAllowed(_ => true) // Permite qualquer origem (Localhost ou Produção)
              .AllowCredentials(); 
    });
});

// 6. Controllers com Ajuste de JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null; 
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddOpenApi(); 

var app = builder.Build();

// --- ORDEM DOS MIDDLEWARES (CRÍTICO) ---

// CORS deve ser um dos primeiros para evitar bloqueio do navegador
app.UseCors("PermitirTudo");

// Middleware para Railway/HTTPS (ajusta o esquema vindo do Proxy)
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

// Redirecionamento HTTPS desativado temporariamente se houver loop no Railway, 
// mas geralmente mantido para segurança:
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();