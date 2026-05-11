using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ── BASE DE DATOS ─────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── CORS ──────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontends", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",   // React web (Vite)
                "http://localhost:8100",   // Ionic mobile (dev)
                "http://localhost:4200"    // Angular (por si acaso)
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // OBLIGATORIO para SignalR WebSockets
    });
});

// ── SIGNALR ───────────────────────────────────────────────────────────
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

// ── CONTROLADORES + OPENAPI ───────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// ── PIPELINE (ORDEN CORRECTO PARA SIGNALR) ────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// 1. Routing primero — necesario para que SignalR mapee el Hub
app.UseRouting();

// 2. CORS después de Routing y ANTES de los endpoints
app.UseCors("AllowFrontends");

// 3. Endpoints: controladores REST y Hub SignalR
app.MapControllers();
app.MapHub<IncidentHub>("/hubs/incident");

app.Run();
