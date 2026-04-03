using Microsoft.EntityFrameworkCore;
using EcoMonitor.Api;
using Scalar.AspNetCore;
using Supabase; // <--- Certifique-se de ter o pacote instalado

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração do Banco de Dados (PostgreSQL/Supabase)
var connectionString = "Host=aws-1-sa-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.eznsxbjdssojayrqetry;Password=3ca!8M39Fa$%s@N;SslMode=Require;Trust Server Certificate=true;";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. REGISTRO DO CLIENTE SUPABASE (Essencial para o Controller funcionar)
// Substitua pelas suas chaves reais do painel do Supabase (Project Settings > API)
var supabaseUrl = "https://eznsxbjdssojayrqetry.supabase.co";
var supabaseKey = "sb_publishable_EWmGPALIJD2IzpS9o0nvWg_qz5zs..."; // <--- COLOQUE SUA ANON KEY AQUI

builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(supabaseUrl, supabaseKey, new SupabaseOptions
    {
        AutoRefreshToken = true,
        AutoConnectRealtime = true
    }));

// 3. Configurar CORS (Liberar o Angular)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirAngular", policy =>
    {
        policy.AllowAnyOrigin() 
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi(); 

var app = builder.Build();

// Middleware para forçar HTTPS no Railway
app.Use((context, next) =>
{
    context.Request.Scheme = "https";
    return next();
});

// Configuração do Scalar (Documentação)
app.MapOpenApi();
app.MapScalarApiReference(options => 
{
    options.WithTitle("EcoMonitor API")
           .WithTheme(ScalarTheme.Moon);
});

// Ordem correta dos Middlewares
app.UseCors("PermitirAngular");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();