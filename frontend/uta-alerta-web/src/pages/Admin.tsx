import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignalR } from '../hooks/useSignalR';
import MapComponent from '../components/MapComponent';
import CamerasPanel from '../components/CamerasPanel';
import type { AlertaIncidente } from '../services/signalrService';
import type { Zona } from '../services/zonasService';
import './Admin.css';

const ITEMS_POR_PAGINA = 10;

const Admin = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const { alertas: alertasWS, error } = useSignalR('Admins');
  const [incidentesDB, setIncidentesDB] = useState<AlertaIncidente[]>([]);
  const [pagina, setPagina] = useState(1);
  const [seccion, setSeccion] = useState<'notificaciones' | 'mapa' | 'camaras' | 'customers'>('notificaciones');
  const [_zonaSeleccionada, setZonaSeleccionada] = useState<Zona | null>(null);

  // Cargar incidentes existentes desde la BD al abrir la página
  useEffect(() => {
    fetch('http://localhost:5008/api/incidents')
      .then(r => r.json())
      .then((data: any[]) => {
        const mapeados: AlertaIncidente[] = data.map(i => {
          const rawIdZona = i.idZona || i.IdZona;
          const rawZona = i.zona || i.Zona;
          return {
            idIncidente: i.idIncidente || i.IdIncidente,
            nombreUsuario: `Usuario #${i.idUsuario || i.IdUsuario || '?'}`,
            facultad: i.facultad || i.Facultad || rawZona || '—',
            zona: rawIdZona ? `Zona ${rawIdZona}` : (rawZona || '—'),
            tipoIncidente: i.tipoIncidente || i.TipoIncidente,
            mensaje: i.descripcion || i.Descripcion || i.mensaje || i.Mensaje || i.tipoIncidente || i.TipoIncidente,
            fechaReporte: i.fechaReporte || i.FechaReporte
          };
        });
        setIncidentesDB(mapeados);
      })
      .catch(() => console.warn('IncidentService no disponible (puerto 5008)'));
  }, []);

  // Unir datos de BD + nuevas alertas SignalR (las nuevas van primero)
  const alertas = [
    ...alertasWS.map((i, idx) => {
      const rawIdZona = (i as any).idZona || (i as any).IdZona;
      const rawZona = i.zona || (i as any).Zona;
      return {
        ...i,
        idIncidente: i.idIncidente || (i as any).IdIncidente || -(idx + 1),
        nombreUsuario: i.nombreUsuario || (i as any).NombreUsuario || `Usuario #${(i as any).idUsuario || (i as any).IdUsuario || '?'}`,
        facultad: (i as any).facultad || (i as any).Facultad || rawZona || '—',
        zona: rawIdZona ? `Zona ${rawIdZona}` : (rawZona || '—'),
        mensaje: (i as any).descripcion || (i as any).Descripcion || i.mensaje || (i as any).Mensaje || i.tipoIncidente || (i as any).TipoIncidente,
        fechaReporte: i.fechaReporte || (i as any).FechaReporte || new Date().toISOString()
      };
    }) as AlertaIncidente[],
    ...incidentesDB
  ];

  if (!usuario?.token) { navigate('/login'); return null; }

  const totalPaginas = Math.max(1, Math.ceil(alertas.length / ITEMS_POR_PAGINA));
  const alertasPagina = alertas.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA);

  const formatFecha = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('es-EC')} ${d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Paginación con ellipsis: 1 2 3 4 5 ... 20
  const getPaginas = () => {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1, 2, 3, 4, 5, '...', totalPaginas];
    return pages;
  };

  const initials = (nombre: string) => {
    const parts = nombre.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : nombre.slice(0, 2).toUpperCase();
  };

  return (
    <div className="admin-layout">

      {/* ── SIDEBAR ── */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <span className="logo-at">@</span>
          <span className="logo-text">UTA Alerta</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${seccion === 'mapa' ? 'activo' : ''}`}
            onClick={() => setSeccion('mapa')}
          >
            <span className="nav-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg>
            </span>
            Mapa
          </button>

          <button
            className={`nav-item ${seccion === 'notificaciones' ? 'activo' : ''}`}
            onClick={() => setSeccion('notificaciones')}
          >
            <span className="nav-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            </span>
            Notificaciones
          </button>

          <button
            className={`nav-item ${seccion === 'camaras' ? 'activo' : ''}`}
            onClick={() => setSeccion('camaras')}
          >
            <span className="nav-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            </span>
            Cámaras
          </button>

          <button
            className={`nav-item ${seccion === 'customers' ? 'activo' : ''}`}
            onClick={() => setSeccion('customers')}
          >
            <span className="nav-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </span>
            Customers
          </button>
        </nav>

        <div className="sidebar-footer">
          <hr className="sidebar-hr" />
          <button
            className="nav-item logout"
            onClick={() => { localStorage.clear(); navigate('/login'); }}
          >
            <span className="nav-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </span>
            Log out
          </button>
          <button className="sidebar-collapse">‹</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="admin-main">

        {/* TOPBAR */}
        <div className="admin-topbar">
          <h1 className="admin-titulo">
            {seccion === 'notificaciones' && 'Notificaciones'}
            {seccion === 'mapa' && 'Mapa'}
            {seccion === 'camaras' && (
              <>
                Administración de Cámaras
                <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '10px', fontWeight: 'normal' }}>
                  (listado con datos simulados de prueba para cuando backend este listo)
                </span>
              </>
            )}
            {seccion === 'customers' && 'Customers'}
          </h1>

          <div className="topbar-right">
            {/* Bell */}
            <div className="bell-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              {alertas.length > 0 && (
                <span className="bell-badge">{alertas.length > 99 ? '99+' : alertas.length}</span>
              )}
            </div>

            {/* Usuario */}
            <div className="topbar-user">
              <div className="user-avatar">{initials(usuario.nombre || 'Admin')}</div>
              <div className="user-info">
                <span className="user-nombre">{usuario.nombre}</span>
                <span className="user-rol">{usuario.rol}</span>
              </div>
            </div>
          </div>
        </div>


        {error && <div className="error-banner">{error}</div>}

        {/* CONTENIDO */}
        <div className="content-card">

          {seccion === 'notificaciones' && (
            <>
              <div className="tabla-scroll">
                <table className="notif-tabla">
                  <thead>
                    <tr>
                      <th>Nombre del afectado</th>
                      <th>Rol</th>
                      <th>Carrera</th>
                      <th>Zona</th>
                      <th>Motivo</th>
                      <th>Fecha y hora</th>
                      <th>Estado</th>
                      <th>Guardia asignado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertasPagina.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="tabla-vacia">
                          Sin incidentes registrados. Esperando alertas en tiempo real...
                        </td>
                      </tr>
                    ) : (
                      alertasPagina.map((a) => (
                        <tr key={a.idIncidente}>
                      <td className="td-nombre">{a.nombreUsuario || `Usuario #${(a as any).idUsuario || '?'}`}</td>
                          <td>Estudiante</td>
                      <td>{a.facultad}</td>
                      <td>{a.zona}</td>
                          <td>{a.tipoIncidente}</td>
                          <td className="td-fecha">{formatFecha(a.fechaReporte)}</td>
                          <td><span className="badge-activo">Activo</span></td>
                      <td className="td-guardia">{(a as any).guardiaAsignado ?? '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINACIÓN */}
              {totalPaginas > 1 && (
                <div className="paginacion">
                  {getPaginas().map((n, i) =>
                    n === '...' ? (
                      <span key={`ellipsis-${i}`} className="pag-ellipsis">...</span>
                    ) : (
                      <button
                        key={n}
                        className={`pag-btn ${n === pagina ? 'activa' : ''}`}
                        onClick={() => setPagina(n as number)}
                      >
                        {n}
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {seccion === 'mapa' && (
            <MapComponent 
              incidentes={alertas}
              onZonaSeleccionada={setZonaSeleccionada}
            />
          )}

          {seccion === 'camaras' && (
            <CamerasPanel />
          )}

          {seccion === 'customers' && (
            <div className="seccion-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              <p>Gestión de usuarios — próximamente</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Admin;