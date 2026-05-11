using System.Text;
using System.Text.Json;
using IncidentService.DTOs;

namespace IncidentService.Services;

/// <summary>
/// Cliente HTTP que llama al NotificationService para disparar alertas SignalR.
/// </summary>
public class NotificationClient
{
    private readonly HttpClient _http;
    private readonly ILogger<NotificationClient> _logger;

    public NotificationClient(HttpClient http, ILogger<NotificationClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task EnviarAlertaAsync(AlertaNotificacionDto alerta)
    {
        try
        {
            var json = JsonSerializer.Serialize(alerta, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync("/api/notifications/alert", content);

            if (response.IsSuccessStatusCode)
                _logger.LogInformation("✅ NotificationService notificado para incidente #{Id}", alerta.IdIncidente);
            else
                _logger.LogWarning("⚠️ NotificationService respondió {Status}", response.StatusCode);
        }
        catch (Exception ex)
        {
            // NO lanzamos el error — si el NotificationService falla, el incidente
            // ya fue guardado. El error solo se loguea para no bloquear la respuesta.
            _logger.LogError(ex, "❌ Error al notificar al NotificationService");
        }
    }
}
