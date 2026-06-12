using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.DTOs;
using NotificationService.Models;
using NotificationService.Hubs;

namespace NotificationService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SolicitudesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<SolicitudesController> _logger;
    private readonly IHubContext<IncidentHub, IIncidentClient> _hubContext;

    public SolicitudesController(
        AppDbContext context, 
        ILogger<SolicitudesController> logger,
        IHubContext<IncidentHub, IIncidentClient> hubContext)
    {
        _context = context;
        _logger = logger;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Enviar una solicitud de unión a un grupo de confianza.
    /// El solicitante invita al destinatario a su grupo.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> EnviarSolicitud([FromBody] CrearSolicitudDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // Verificar que el grupo existe
        var grupoExiste = await _context.GruposConfianza.AnyAsync(g => g.IdGrupo == dto.IdGrupo);
        if (!grupoExiste)
            return NotFound(new { mensaje = $"Grupo {dto.IdGrupo} no encontrado." });

        // Verificar que el destinatario no es ya miembro
        var yaMiembro = await _context.UsuarioGrupos
            .AnyAsync(ug => ug.IdGrupo == dto.IdGrupo && ug.IdUsuario == dto.IdUsuarioDestinatario);
        if (yaMiembro)
            return BadRequest(new { mensaje = "El destinatario ya es miembro de este grupo." });

        // Verificar que no hay una solicitud pendiente igual
        var yaExiste = await _context.SolicitudesGrupo
            .AnyAsync(s => s.IdGrupo == dto.IdGrupo
                && s.IdUsuarioSolicitante == dto.IdUsuarioSolicitante
                && s.IdUsuarioDestinatario == dto.IdUsuarioDestinatario
                && s.Estado == "Pendiente");
        if (yaExiste)
            return BadRequest(new { mensaje = "Ya existe una solicitud pendiente para este usuario en este grupo." });

        var solicitud = new SolicitudGrupo
        {
            IdGrupo = dto.IdGrupo,
            IdUsuarioSolicitante = dto.IdUsuarioSolicitante,
            IdUsuarioDestinatario = dto.IdUsuarioDestinatario,
            Estado = "Pendiente",
            FechaSolicitud = DateTime.Now
        };

        _context.SolicitudesGrupo.Add(solicitud);
        await _context.SaveChangesAsync();

        var grupo = await _context.GruposConfianza.FindAsync(dto.IdGrupo);

        // Notificar al destinatario vía SignalR usando un canal personal
        var groupName = $"usuario-{dto.IdUsuarioDestinatario}";
        await _hubContext.Clients.Group(groupName).RecibirSolicitudGrupo(new SolicitudGrupoSignalRDto
        {
            IdSolicitud = solicitud.IdSolicitud,
            IdGrupo = solicitud.IdGrupo,
            NombreGrupo = grupo?.Nombre ?? "un grupo",
            IdUsuarioSolicitante = dto.IdUsuarioSolicitante,
            Mensaje = $"¡Has recibido una solicitud/invitación para el grupo {grupo?.Nombre}!"
        });

        _logger.LogInformation("Solicitud enviada: Grupo={Grupo}, Solicitante={Sol}, Destinatario={Dest}",
            dto.IdGrupo, dto.IdUsuarioSolicitante, dto.IdUsuarioDestinatario);

        return CreatedAtAction(nameof(ObtenerPendientes), new { idUsuario = dto.IdUsuarioDestinatario }, new
        {
            idSolicitud = solicitud.IdSolicitud,
            idGrupo = solicitud.IdGrupo,
            idUsuarioSolicitante = solicitud.IdUsuarioSolicitante,
            idUsuarioDestinatario = solicitud.IdUsuarioDestinatario,
            estado = solicitud.Estado,
            fechaSolicitud = solicitud.FechaSolicitud,
            mensaje = "Solicitud enviada exitosamente."
        });
    }

    /// <summary>
    /// Obtener las solicitudes PENDIENTES que recibió un usuario (destinatario).
    /// </summary>
    [HttpGet("pendientes/{idUsuario}")]
    public async Task<IActionResult> ObtenerPendientes(int idUsuario)
    {
        var solicitudes = await _context.SolicitudesGrupo
            .Include(s => s.Grupo)
            .Where(s => s.IdUsuarioDestinatario == idUsuario && s.Estado == "Pendiente")
            .Select(s => new
            {
                idSolicitud = s.IdSolicitud,
                idGrupo = s.IdGrupo,
                nombreGrupo = s.Grupo.Nombre,
                descripcionGrupo = s.Grupo.Descripcion,
                idUsuarioSolicitante = s.IdUsuarioSolicitante,
                idUsuarioDestinatario = s.IdUsuarioDestinatario,
                idCreador = s.Grupo.IdCreador,
                estado = s.Estado,
                fechaSolicitud = s.FechaSolicitud
            })
            .OrderByDescending(s => s.fechaSolicitud)
            .ToListAsync();

        return Ok(solicitudes);
    }

    /// <summary>
    /// Obtener las solicitudes PENDIENTES que envió un usuario (solicitante).
    /// </summary>
    [HttpGet("enviadas/{idUsuario}")]
    public async Task<IActionResult> ObtenerEnviadas(int idUsuario)
    {
        var solicitudes = await _context.SolicitudesGrupo
            .Include(s => s.Grupo)
            .Where(s => s.IdUsuarioSolicitante == idUsuario && s.Estado == "Pendiente")
            .Select(s => new
            {
                idSolicitud = s.IdSolicitud,
                idGrupo = s.IdGrupo,
                nombreGrupo = s.Grupo.Nombre,
                descripcionGrupo = s.Grupo.Descripcion,
                idUsuarioSolicitante = s.IdUsuarioSolicitante,
                idUsuarioDestinatario = s.IdUsuarioDestinatario,
                idCreador = s.Grupo.IdCreador,
                estado = s.Estado,
                fechaSolicitud = s.FechaSolicitud
            })
            .OrderByDescending(s => s.fechaSolicitud)
            .ToListAsync();

        return Ok(solicitudes);
    }

    /// <summary>
    /// Responder a una solicitud: Aceptar o Rechazar.
    /// Si se acepta, el destinatario (en invitaciones) o el solicitante (en solicitudes de unión)
    /// se agrega automáticamente como miembro del grupo.
    /// </summary>
    [HttpPut("{idSolicitud}/responder")]
    public async Task<IActionResult> ResponderSolicitud(int idSolicitud, [FromBody] ResponderSolicitudDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var solicitud = await _context.SolicitudesGrupo
            .Include(s => s.Grupo)
            .FirstOrDefaultAsync(s => s.IdSolicitud == idSolicitud);

        if (solicitud == null)
            return NotFound(new { mensaje = $"Solicitud {idSolicitud} no encontrada." });

        if (solicitud.Estado != "Pendiente")
            return BadRequest(new { mensaje = "Esta solicitud ya fue respondida." });

        solicitud.Estado = dto.Estado;
        solicitud.FechaRespuesta = DateTime.Now;

        // Si se acepta, agregar al usuario correspondiente como miembro del grupo
        if (dto.Estado == "Aceptada")
        {
            // Determinar quién debe unirse al grupo:
            // Si el solicitante ya es miembro, el destinatario es el que se une (Invitación).
            // Si el destinatario ya es miembro (es el dueño del grupo), el solicitante se une (Solicitud de unión).
            var solicitanteEsMiembro = await _context.UsuarioGrupos
                .AnyAsync(ug => ug.IdGrupo == solicitud.IdGrupo && ug.IdUsuario == solicitud.IdUsuarioSolicitante);
            var destinatarioEsMiembro = await _context.UsuarioGrupos
                .AnyAsync(ug => ug.IdGrupo == solicitud.IdGrupo && ug.IdUsuario == solicitud.IdUsuarioDestinatario);

            int usuarioAUnir = solicitud.IdUsuarioDestinatario; // Valor por defecto
            if (solicitanteEsMiembro && !destinatarioEsMiembro)
            {
                usuarioAUnir = solicitud.IdUsuarioDestinatario;
            }
            else if (!solicitanteEsMiembro && destinatarioEsMiembro)
            {
                usuarioAUnir = solicitud.IdUsuarioSolicitante;
            }
            else if (!solicitanteEsMiembro && !destinatarioEsMiembro)
            {
                // Si ninguno es miembro, asumimos que es una solicitud de unión del solicitante
                usuarioAUnir = solicitud.IdUsuarioSolicitante;
            }

            var yaEsMiembro = await _context.UsuarioGrupos
                .AnyAsync(ug => ug.IdGrupo == solicitud.IdGrupo && ug.IdUsuario == usuarioAUnir);

            if (!yaEsMiembro)
            {
                _context.UsuarioGrupos.Add(new UsuarioGrupo
                {
                    IdGrupo = solicitud.IdGrupo,
                    IdUsuario = usuarioAUnir,
                    FechaUnion = DateTime.Now
                });
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Solicitud {Id} respondida como {Estado}", idSolicitud, dto.Estado);

        return Ok(new
        {
            idSolicitud = solicitud.IdSolicitud,
            estado = solicitud.Estado,
            fechaRespuesta = solicitud.FechaRespuesta,
            mensaje = dto.Estado == "Aceptada"
                ? "Solicitud aceptada. Miembro agregado al grupo."
                : "Solicitud rechazada."
        });
    }

    /// <summary>
    /// Contar solicitudes pendientes para un usuario (para el badge de notificaciones).
    /// </summary>
    [HttpGet("pendientes/{idUsuario}/count")]
    public async Task<IActionResult> ContarPendientes(int idUsuario)
    {
        var count = await _context.SolicitudesGrupo
            .CountAsync(s => s.IdUsuarioDestinatario == idUsuario && s.Estado == "Pendiente");

        return Ok(new { count });
    }
}
