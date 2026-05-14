namespace NotificationService.Hubs;

/// <summary>
/// Define los métodos que el servidor invoca en los clientes conectados.
/// El cliente React/Ionic debe implementar estos métodos al conectarse al Hub.
/// </summary>
public interface IIncidentClient
{
    /// <summary>
    /// Recibe una notificación de incidente en tiempo real.
    /// </summary>
    /// <param name="notificacion">Datos del incidente que se acaba de reportar.</param>
    Task RecibirAlertaIncidente(AlertaIncidenteDto notificacion);
}

/// <summary>
/// DTO con los datos que viajan por WebSocket hacia los clientes.
/// </summary>
public class AlertaIncidenteDto
{
    public int IdIncidente { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string Facultad { get; set; } = string.Empty;
    public string Zona { get; set; } = string.Empty;
    public string TipoIncidente { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public DateTime FechaReporte { get; set; }
}
