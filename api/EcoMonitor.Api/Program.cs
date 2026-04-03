using Microsoft.EntityFrameworkCore;
using EcoMonitor.Api;
using Scalar.AspNetCore;
using Supabase;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração do Banco de Dados (PostgreSQL/Supabase via Entity Framework)
var connectionString = "Host=aws-1-sa-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.eznsxbjdssojayrqetry;Password=3ca!8M39Fa$%s@N;SslMode=Require;Trust Server Certificate=true;";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. REGISTRO DO CLIENTE SUPABASE (Para o Controller de Sensores)
var supabaseUrl = "https://eznsxbjdssojayrqetry.supabase.co";
var supabaseKey = "sb_publishable_EWmGPALIJD2IzpS9o0nvWg_qz5zs..."; 

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
        policy.AllowAnyOrigin() // Em produção no Railway, o AnyOrigin é mais seguro para testes iniciais
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi(); 

var app = builder.Build();

// --- ORDEM DOS MIDDLEWARES (CRÍTICO) ---

// 1. O CORS deve ser um dos primeiros para evitar o erro de 'No Access-Control-Allow-Origin'
app.UseCors("PermitirAngular");

// 2. Forçar HTTPS (Necessário para Railway e segurança do Supabase)
app.Use((context, next) =>
{
    context.Request.Scheme = "https";
    return next();
});

// 3. Documentação e Interface Visual
app.MapOpenApi();
app.MapScalarApiReference(options => 
{
    options.WithTitle("EcoMonitor API")
           .WithTheme(ScalarTheme.Moon);
});

app.UseHttpsRedirection();
app.UseAuthorization();

// 4. Mapeamento final dos Controllers
app.MapControllers();

app.Run();