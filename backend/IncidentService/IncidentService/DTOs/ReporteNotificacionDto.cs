namespace IncidentService.DTOs;

/// <summary>
/// Payload que el IncidentService envía al NotificationService
/// cuando un guardia crea un reporte.
/// </summary>
public class ReporteNotificacionDto
{
    public int IdReporte { get; set; }
    public string NumeroReporte { get; set; } = string.Empty;
    public string NombreGuardia { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string TipoReporte { get; set; } = string.Empty;
    public string Prioridad { get; set; } = string.Empty;
    public string Zona { get; set; } = string.Empty;
    public DateTime HoraIncidente { get; set; }
    public DateTime FechaCreacion { get; set; }
}
