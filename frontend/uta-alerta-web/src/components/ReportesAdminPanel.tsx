import { useState, useEffect } from 'react';
import './ReportesAdminPanel.css';
import { signalRService, type ReporteGuardia } from '../services/signalrService';

const INCIDENT_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';

const ReportesAdminPanel = () => {
    const [reportes, setReportes] = useState<ReporteGuardia[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteGuardia | null>(null);

    const cargarReportes = async () => {
        try {
            setCargando(true);
            const res = await fetch(`${INCIDENT_URL}/api/reportes`);
            if (res.ok) {
                const data = await res.json();
                setReportes(data);
            }
        } catch (error) {
            console.error("Error cargando reportes", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarReportes();

        // Escuchar nuevos reportes
        const conn = signalRService.getConnection();
        if (conn) {
            const handleNuevoReporte = (nuevoReporte: ReporteGuardia) => {
                setReportes(prev => [nuevoReporte, ...prev.filter(r => r.idReporte !== nuevoReporte.idReporte)]);
            };
            conn.on('RecibirNuevoReporte', handleNuevoReporte);
            
            return () => {
                conn.off('RecibirNuevoReporte', handleNuevoReporte);
            };
        }
    }, []);

    const cambiarEstado = async (idReporte: number, nuevoEstado: string) => {
        try {
            const res = await fetch(`${INCIDENT_URL}/api/reportes/${idReporte}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (res.ok) {
                setReportes(prev => prev.map(r => r.idReporte === idReporte ? { ...r, estado: nuevoEstado } : r));
                if (reporteSeleccionado?.idReporte === idReporte) {
                    setReporteSeleccionado({ ...reporteSeleccionado, estado: nuevoEstado });
                }
            }
        } catch (error) {
            console.error("Error cambiando estado", error);
        }
    };

    const reportesFiltrados = reportes.filter(r => {
        const cumpleEstado = filtroEstado === 'todos' || (r.estado || 'Enviado').toLowerCase() === filtroEstado.toLowerCase();
        const cumpleTipo = filtroTipo === 'todos' || (r.tipoReporte || '').toLowerCase() === filtroTipo.toLowerCase();
        const cumplePrioridad = filtroPrioridad === 'todos' || (r.prioridad || '').toLowerCase() === filtroPrioridad.toLowerCase();
        
        let cumpleFecha = true;
        if (fechaDesde || fechaHasta) {
            const fReporte = new Date(r.fechaCreacion);
            if (fechaDesde) {
                const fDesde = new Date(fechaDesde);
                fDesde.setHours(0, 0, 0, 0);
                if (fReporte < fDesde) cumpleFecha = false;
            }
            if (fechaHasta) {
                const fHasta = new Date(fechaHasta);
                fHasta.setHours(23, 59, 59, 999);
                if (fReporte > fHasta) cumpleFecha = false;
            }
        }

        return cumpleEstado && cumpleTipo && cumplePrioridad && cumpleFecha;
    });

    const formatFecha = (iso: string) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return `${d.toLocaleDateString('es-EC')} ${d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div className="reportes-panel">
            <div className="reportes-header">
                <h2>Gestión de Reportes de Guardia</h2>
                <div className="filtros-avanzados" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="todos">Todos los estados</option>
                        <option value="enviado">Enviados</option>
                        <option value="leído">Leídos</option>
                        <option value="resuelto">Resueltos</option>
                    </select>
                    
                    <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="todos">Todos los tipos</option>
                        <option value="seguridad">Seguridad</option>
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="incidente médico">Incidente Médico</option>
                        <option value="otro">Otro</option>
                    </select>

                    <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="todos">Cualquier prioridad</option>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <label style={{ fontSize: '0.85rem', color: '#555' }}>Desde:</label>
                        <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <label style={{ fontSize: '0.85rem', color: '#555' }}>Hasta:</label>
                        <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>

                    <button onClick={cargarReportes} className="btn-refresh" style={{ marginLeft: 'auto' }}>↻ Refrescar</button>
                </div>
            </div>

            <div className="reportes-layout">
                <div className="reportes-lista">
                    {cargando ? (
                        <div className="loading">Cargando reportes...</div>
                    ) : reportesFiltrados.length === 0 ? (
                        <div className="empty">No hay reportes que coincidan con los filtros.</div>
                    ) : (
                        <table className="tabla-reportes">
                            <thead>
                                <tr>
                                    <th>Nº Reporte</th>
                                    <th>Fecha</th>
                                    <th>Guardia</th>
                                    <th>Tipo</th>
                                    <th>Prioridad</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportesFiltrados.map(r => (
                                    <tr 
                                        key={r.idReporte} 
                                        className={reporteSeleccionado?.idReporte === r.idReporte ? 'selected' : ''}
                                        onClick={() => setReporteSeleccionado(r)}
                                    >
                                        <td><strong>{r.numeroReporte}</strong></td>
                                        <td>{formatFecha(r.fechaCreacion)}</td>
                                        <td>{r.nombreGuardia}</td>
                                        <td>{r.tipoReporte}</td>
                                        <td><span className={`prio-badge prio-${r.prioridad.toLowerCase()}`}>{r.prioridad}</span></td>
                                        <td><span className={`estado-badge estado-${(r.estado || 'Enviado').toLowerCase()}`}>{r.estado || 'Enviado'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {reporteSeleccionado && (
                    <div className="reporte-detalle">
                        <h3>Detalle del Reporte</h3>
                        <div className="detalle-header">
                            <span className="numero">{reporteSeleccionado.numeroReporte}</span>
                            <span className={`estado-badge estado-${(reporteSeleccionado.estado || 'Enviado').toLowerCase()}`}>
                                {reporteSeleccionado.estado || 'Enviado'}
                            </span>
                        </div>
                        
                        <div className="detalle-info">
                            <div className="info-group">
                                <label>Título</label>
                                <p>{reporteSeleccionado.titulo}</p>
                            </div>
                            <div className="info-row">
                                <div className="info-group half">
                                    <label>Guardia</label>
                                    <p>{reporteSeleccionado.nombreGuardia}</p>
                                </div>
                                <div className="info-group half">
                                    <label>Turno</label>
                                    <p>{(reporteSeleccionado as any).turnoNombre || '—'}</p>
                                </div>
                            </div>
                            <div className="info-row">
                                <div className="info-group half">
                                    <label>Zona</label>
                                    <p>{reporteSeleccionado.zona || '—'}</p>
                                </div>
                                <div className="info-group half">
                                    <label>Hora del Incidente</label>
                                    <p>{formatFecha(reporteSeleccionado.horaIncidente)}</p>
                                </div>
                            </div>
                            <div className="info-group">
                                <label>Descripción Completa</label>
                                <p className="desc-box">{reporteSeleccionado.descripcion}</p>
                            </div>
                        </div>

                        <div className="detalle-acciones">
                            <h4>Cambiar Estado</h4>
                            <div className="btn-group">
                                <button 
                                    className={`btn-estado ${reporteSeleccionado.estado === 'Leído' ? 'active' : ''}`}
                                    onClick={() => cambiarEstado(reporteSeleccionado.idReporte, 'Leído')}
                                >
                                    Marcar como Leído
                                </button>
                                <button 
                                    className={`btn-estado resuelto ${reporteSeleccionado.estado === 'Resuelto' ? 'active' : ''}`}
                                    onClick={() => cambiarEstado(reporteSeleccionado.idReporte, 'Resuelto')}
                                >
                                    Marcar como Resuelto
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportesAdminPanel;
