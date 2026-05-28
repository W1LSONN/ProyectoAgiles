namespace IncidentService.DTOs;

/// <summary>
/// Payload que el IncidentService envía al NotificationService
/// tras crear un incidente.
/// </summary>
public class AlertaNotificacionDto
{
    public int IdIncidente { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string Facultad { get; set; } = string.Empty;
    public string Zona { get; set; } = string.Empty;
    public string TipoIncidente { get; set; } = string.Empty;
    public DateTime FechaReporte { get; set; }
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
}
