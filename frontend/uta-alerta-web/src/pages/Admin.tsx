import { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignalR } from '../hooks/useSignalR';
import type { AlertaIncidente } from '../services/signalrService';
import type { Zona } from '../services/zonasService';
import './Admin.css';

const DashboardPanel = lazy(() => import('../components/DashboardPanel'));
const MapComponent = lazy(() => import('../components/MapComponent'));
const CamerasPanel = lazy(() => import('../components/CamerasPanel'));
const CustomersPanel = lazy(() => import('../components/CustomersPanel'));
const UsersPanel = lazy(() => import('../components/UsersPanel'));
const GruposAdminPanel = lazy(() => import('../components/GruposAdminPanel'));
const ReportesAdminPanel = lazy(() => import('../components/ReportesAdminPanel'));
const TurnosAdminPanel = lazy(() => import('../components/TurnosAdminPanel'));

const ITEMS_POR_PAGINA = 10;
const INCIDENTS_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';

const Admin = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [incidentesError, setIncidentesError] = useState<string | null>(null);
  const [incidentesDB, setIncidentesDB] = useState<AlertaIncidente[]>([]);
  const [pagina, setPagina] = useState(1);
  const [seccion, setSeccion] = useState<'dashboard' | 'notificaciones' | 'mapa' | 'camaras' | 'customers' | 'usuarios' | 'grupos' | 'reportes' | 'turnos'>('dashboard');

  // Estados para filtros de notificaciones
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroZona, setFiltroZona] = useState<string>('todas');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');
  const [_zonaSeleccionada, setZonaSeleccionada] = useState<Zona | null>(null);
  const [incidenteFoco, setIncidenteFoco] = useState<AlertaIncidente | null>(null);

  const [toasts, setToasts] = useState<{ id: number; data: AlertaIncidente }[]>([]);

  const playAlertSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.85);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.85);
    } catch (e) {
      console.warn("AudioContext bloqueado por política de autoplay del navegador", e);
    }
  }, []);

  const handleNewAlerta = useCallback((alerta: AlertaIncidente) => {
    console.log("Disparando toast para nuevo incidente:", alerta);
    playAlertSound();
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, data: alerta }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, [playAlertSound]);

  const handleToastClick = (toastId: number, alerta: AlertaIncidente) => {
    setSeccion('mapa');
    setIncidenteFoco(alerta);
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  const { alertas: alertasWS, error } = useSignalR('Admins', handleNewAlerta);

  const cargarIncidentes = async () => {
    const response = await fetch(`${INCIDENTS_URL}/api/incidents`);
    if (!response.ok) {
      throw new Error(`Error ${response.status} al cargar incidentes`);
    }

    const data: any[] = await response.json();
    const mapeados: AlertaIncidente[] = data.map((i) => {
      const rawIdZona = i.idZona || i.IdZona;
      const rawZona = i.zona || i.Zona;
      return {
        idIncidente: i.idIncidente || i.IdIncidente,
        nombreUsuario: i.nombreUsuario || `Usuario #${i.idUsuario || i.IdUsuario || '?'}`,
        facultad: i.facultad || i.Facultad || rawZona || '—',
        zona: rawIdZona ? `Zona ${rawIdZona}` : (rawZona || '—'),
        tipoIncidente: i.tipoIncidente || i.TipoIncidente,
        mensaje: i.descripcion || i.Descripcion || i.mensaje || i.Mensaje || i.tipoIncidente || i.TipoIncidente,
        fechaReporte: i.fechaReporte || i.FechaReporte,
        estado: i.estado || i.Estado || 'Activo',
        guardiaAsignado: i.guardiaAsignado || i.GuardiaAsignado || '—'
      };
    });

    setIncidentesDB(mapeados);
  };

  // Cargar incidentes existentes desde la BD al abrir la página
  useEffect(() => {
    cargarIncidentes().catch((e) => {
      // Mostrar banner de error y escribir en consola
      console.warn('IncidentService no disponible (puerto 5008)', e);
      setIncidentesError('IncidentService no disponible (puerto 5008)');
    });
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
  ].reduce<AlertaIncidente[]>((acumuladas, alerta) => {
    const existente = acumuladas.findIndex((item) => item.idIncidente === alerta.idIncidente);
    if (existente >= 0) {
      // Priorizar datos de WebSockets (acumuladas[existente]) sobre base de datos antigua (alerta)
      acumuladas[existente] = { ...alerta, ...acumuladas[existente] };
      return acumuladas;
    }

    acumuladas.push(alerta);
    return acumuladas;
  }, []);

  // Filtrado local de notificaciones
  const alertasFiltradas = useMemo(() => {
    return alertas.filter(a => {
      const estado = (a.estado ?? 'Activo').toLowerCase();
      const tipo = (a.tipoIncidente ?? '').toLowerCase();
      const zona = (a.zona ?? '').toLowerCase();
      const nombre = (a.nombreUsuario ?? '').toLowerCase();

      if (filtroEstado !== 'todos' && estado !== filtroEstado.toLowerCase()) return false;
      if (filtroTipo !== 'todos' && tipo !== filtroTipo.toLowerCase()) return false;
      if (filtroZona !== 'todas' && !zona.includes(filtroZona.toLowerCase())) return false;
      if (filtroBusqueda && !nombre.includes(filtroBusqueda.toLowerCase())) return false;
      return true;
    });
  }, [alertas, filtroEstado, filtroTipo, filtroZona, filtroBusqueda]);

  useEffect(() => {
    if (!usuario?.token) {
      navigate('/login');
    }
  }, [usuario?.token, navigate]);

  if (!usuario?.token) { return null; }

  const totalPaginas = Math.max(1, Math.ceil(alertasFiltradas.length / ITEMS_POR_PAGINA));
  const alertasPagina = alertasFiltradas.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA);

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
            className={`nav-item ${seccion === 'dashboard' ? 'activo' : ''}`}
            onClick={() => setSeccion('dashboard')}
          >
            <span className="nav-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
            </span>
            Dashboard
          </button>

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
            Config. Mapa
          </button>

          <button
            className={`nav-item ${seccion === 'grupos' ? 'activo' : ''}`}
            onClick={() => setSeccion('grupos')}
          >
            <span className="nav-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </span>
            Grupos
          </button>

          <button
            className={`nav-item ${seccion === 'reportes' ? 'activo' : ''}`}
            onClick={() => setSeccion('reportes')}
          >
            <span className="nav-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </span>
            Reportes
          </button>

          <button
            className={`nav-item ${seccion === 'turnos' ? 'activo' : ''}`}
            onClick={() => setSeccion('turnos')}
          >
            <span className="nav-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </span>
            Turnos
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

          <button
            className={`nav-item ${seccion === 'usuarios' ? 'activo' : ''}`}
            onClick={() => setSeccion('usuarios')}
          >
            <span className="nav-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            Usuarios
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
            {seccion === 'dashboard' && 'Dashboard y Estadísticas'}
            {seccion === 'notificaciones' && 'Notificaciones'}
            {seccion === 'mapa' && 'Mapa'}
            {seccion === 'camaras' && 'Configuración de Mapa'}
            {seccion === 'customers' && 'Customers'}
            {seccion === 'usuarios' && 'Gestión de Usuarios'}
            {seccion === 'grupos' && 'Grupos de Confianza'}
            {seccion === 'reportes' && 'Reportes de Guardia'}
            {seccion === 'turnos' && 'Turnos de Guardia'}
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


        {(error || incidentesError) && <div className="error-banner">{error || incidentesError}</div>}

        {/* CONTENIDO */}
        <div className="content-card">

          {seccion === 'dashboard' && (
            <Suspense fallback={<div className="loading-panel">Cargando panel...</div>}>
              <DashboardPanel />
            </Suspense>
          )}

          {seccion === 'notificaciones' && (
            <>
              {/* BARRA DE FILTROS */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre..."
                  value={filtroBusqueda}
                  onChange={e => { setFiltroBusqueda(e.target.value); setPagina(1); }}
                  style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem', minWidth: '180px' }}
                />
                <select
                  value={filtroEstado}
                  onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }}
                  style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem' }}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="asumido">Asumido</option>
                  <option value="cerrado">Cerrado</option>
                </select>
                <select
                  value={filtroTipo}
                  onChange={e => { setFiltroTipo(e.target.value); setPagina(1); }}
                  style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem' }}
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="robo">Robo</option>
                  <option value="arma blanca">Arma Blanca</option>
                  <option value="emergencia de salud">Emergencia de Salud</option>
                  <option value="alerta de seguridad">Alerta de seguridad</option>
                  <option value="otro">Otro</option>
                </select>
                <select
                  value={filtroZona}
                  onChange={e => { setFiltroZona(e.target.value); setPagina(1); }}
                  style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem' }}
                >
                  <option value="todas">Todas las zonas</option>
                  <option value="zona 1">Zona 1</option>
                  <option value="zona 2">Zona 2</option>
                  <option value="zona 3">Zona 3</option>
                  <option value="zona 4">Zona 4</option>
                </select>
                <span style={{ fontSize: '0.85rem', color: '#888', marginLeft: 'auto' }}>
                  {alertasFiltradas.length} resultado{alertasFiltradas.length !== 1 ? 's' : ''}
                </span>
              </div>

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
                      alertasPagina.map((a) => {
                        const estado = a.estado ?? 'Activo';
                        const asumido = estado.toLowerCase() === 'asumido';

                        return (
                          <tr key={a.idIncidente}>
                            <td className="td-nombre">{a.nombreUsuario || `Usuario #${(a as any).idUsuario || '?'}`}</td>
                            <td>Estudiante</td>
                            <td>{a.facultad}</td>
                            <td>{a.zona}</td>
                            <td>{a.tipoIncidente}</td>
                            <td className="td-fecha">{formatFecha(a.fechaReporte)}</td>
                            <td><span className={asumido ? 'badge-asumido' : 'badge-activo'}>{estado}</span></td>
                            <td className="td-guardia">{(a as any).guardiaAsignado ?? '—'}</td>
                          </tr>
                        );
                      })
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
            <Suspense fallback={<div className="loading-panel">Cargando mapa...</div>}>
              <MapComponent 
                incidentes={alertas}
                onZonaSeleccionada={setZonaSeleccionada}
                focoIncidente={incidenteFoco}
              />
            </Suspense>
          )}

          {seccion === 'camaras' && (
            <Suspense fallback={<div className="loading-panel">Cargando cámaras...</div>}>
              <CamerasPanel />
            </Suspense>
          )}

          {seccion === 'grupos' && (
            <Suspense fallback={<div className="loading-panel">Cargando grupos...</div>}>
              <GruposAdminPanel />
            </Suspense>
          )}

          {seccion === 'reportes' && (
            <Suspense fallback={<div className="loading-panel">Cargando reportes...</div>}>
              <ReportesAdminPanel />
            </Suspense>
          )}

          {seccion === 'turnos' && (
            <Suspense fallback={<div className="loading-panel">Cargando turnos...</div>}>
              <TurnosAdminPanel />
            </Suspense>
          )}

          {seccion === 'customers' && (
            <Suspense fallback={<div className="loading-panel">Cargando clientes...</div>}>
              <CustomersPanel />
            </Suspense>
          )}

          {seccion === 'usuarios' && (
            <Suspense fallback={<div className="loading-panel">Cargando gestión de usuarios...</div>}>
              <UsersPanel />
            </Suspense>
          )}

        </div>
      </main>

      {/* ── TOASTS DE NOTIFICACIÓN FLOTANTES ── */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast-notification" onClick={() => handleToastClick(toast.id, toast.data)}>
            <div className="toast-icon">🚨</div>
            <div className="toast-content">
              <h4>Nuevo Incidente: {toast.data.tipoIncidente}</h4>
              <p>{toast.data.facultad} - {toast.data.zona}</p>
              <small>{toast.data.mensaje}</small>
            </div>
            <button className="toast-close" onClick={(e) => { e.stopPropagation(); setToasts(prev => prev.filter(t => t.id !== toast.id)); }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;