using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ── BASE DE DATOS ─────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── CORS ──────────────────────────────────────────────────────────────
// ABIERTO para permitir conexión desde cualquier red (universidad, ngrok, etc.)
// Nota: Para SignalR con WebSockets se necesita AllowCredentials + orígenes específicos.
// Pero para Long Polling fallback, AllowAnyOrigin funciona.
// Usamos una política flexible que acepta cualquier origen CON credenciales.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontends", policy =>
    {
        policy
            .SetIsOriginAllowed(_ => true) // Permite CUALQUIER origen (universidad, ngrok, IP local, etc.)
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
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60); // Más tiempo para redes lentas
    options.MaximumReceiveMessageSize = 128 * 1024; // 128 KB
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

// SignalR Hub — permite todos los transportes: WebSocket, SSE y Long Polling
// Esto es CLAVE para que funcione en redes restrictivas (universidad)
app.MapHub<IncidentHub>("/hubs/incident", options =>
{
    options.Transports =
        Microsoft.AspNetCore.Http.Connections.HttpTransportType.WebSockets |
        Microsoft.AspNetCore.Http.Connections.HttpTransportType.ServerSentEvents |
        Microsoft.AspNetCore.Http.Connections.HttpTransportType.LongPolling;
});

app.Run();
