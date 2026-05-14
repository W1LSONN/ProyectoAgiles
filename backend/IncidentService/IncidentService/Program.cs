using Microsoft.EntityFrameworkCore;
using IncidentService.Data;

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
                "http://localhost:5173",  // React web (Vite)
                "http://localhost:8100"   // Ionic mobile
            )
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// ── CLIENTE HTTP HACIA NOTIFICATIONSERVICE ────────────────────────────
builder.Services.AddHttpClient<IncidentService.Services.NotificationClient>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["NotificationService:BaseUrl"]
        ?? "http://localhost:5009");
});


// ── CONTROLADORES + SWAGGER ───────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// UseRouting antes de UseCors para que CORS funcione con los endpoints
app.UseRouting();
app.UseCors("AllowFrontends");
app.MapControllers();
app.Run();
