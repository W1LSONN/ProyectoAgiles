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
    /// <summary>
    /// Recibe las actualizaciones de ubicación en tiempo real de los guardias.
    /// </summary>
    Task RecibirActualizacionUbicacion(UbicacionGuardiaDto ubicacion);
    /// <summary>
    /// Recibe un nuevo reporte de guardia en tiempo real (para el panel de Admin).
    /// </summary>
    Task RecibirNuevoReporte(ReporteGuardiaDto reporte);
    /// <summary>
    /// Recibe una notificación de solicitud de unión a grupo en tiempo real.
    /// </summary>
    Task RecibirSolicitudGrupo(SolicitudGrupoSignalRDto solicitud);
}

/// <summary>
/// DTO con los datos que viajan por WebSocket hacia los clientes.
/// </summary>
public class AlertaIncidenteDto
{
    public int IdIncidente { get; set; }
    public int? IdUsuario { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string Facultad { get; set; } = string.Empty;
    public string Zona { get; set; } = string.Empty;
    public string TipoIncidente { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public DateTime FechaReporte { get; set; }
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
    public string? Estado { get; set; }
    public string? GuardiaAsignado { get; set; }
}



/// <summary>
/// DTO para enviar las coordenadas de los guardias a la Web.
/// </summary>
public class UbicacionGuardiaDto
{
    public string UserId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lon { get; set; }
}

/// <summary>
/// DTO para enviar los reportes de guardia a los Admins via SignalR.
/// </summary>
public class ReporteGuardiaDto
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

/// <summary>
/// DTO para enviar la notificación de solicitud de grupo.
/// </summary>
public class SolicitudGrupoSignalRDto
{
    public int IdSolicitud { get; set; }
    public int IdGrupo { get; set; }
    public string NombreGrupo { get; set; } = string.Empty;
    public int IdUsuarioSolicitante { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}
