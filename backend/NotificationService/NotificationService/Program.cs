using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ── BASE DE DATOS ─────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── CORS ──────────────────────────────────────────────────────────────
// Permite conexiones desde el frontend web (5173) y la app móvil (8100)
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
            .AllowCredentials() // OBLIGATORIO para SignalR WebSockets
            .SetIsOriginAllowed(origin => true); // Permite pruebas locales (file:// o Live Server)
    });
});

// ── SIGNALR ───────────────────────────────────────────────────────────
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true; // Útil en desarrollo para ver errores en el cliente
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

// ── CONTROLADORES + OPENAPI ───────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// ── PIPELINE ──────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// IMPORTANTE: UseCors debe ir ANTES de UseRouting y MapHub
app.UseCors("AllowFrontends");

app.UseAuthorization();
app.MapControllers();

// ── HUB SIGNALR ───────────────────────────────────────────────────────
// Los clientes se conectarán a: http://localhost:5199/hubs/incident
app.MapHub<IncidentHub>("/hubs/incident");

app.Run();
