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

// ── PIPELINE ──────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// IMPORTANTE: UseCors debe ir ANTES de UseRouting y MapHub
app.UseCors("AllowFrontends");

app.UseAuthorization();
app.MapControllers();
app.MapHub<IncidentHub>("/hubs/incident");

app.Run();
