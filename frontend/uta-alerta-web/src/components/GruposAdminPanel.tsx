import { useState, useEffect, useCallback } from 'react';
import { getGrupos, deleteGrupo, type GrupoConfianza } from '../services/gruposService';
import './GruposAdminPanel.css';

const GruposAdminPanel = () => {
  const [grupos, setGrupos] = useState<GrupoConfianza[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [grupoDetalle, setGrupoDetalle] = useState<GrupoConfianza | null>(null);

  const API_BASE = import.meta.env.VITE_NOTIFICATIONS_URL ?? 'http://localhost:5009';

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try { setGrupos(await getGrupos()); }
    catch { setError('No se pudieron cargar los grupos.'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Eliminar este grupo y todos sus miembros?')) return;
    setError(null); setExito(null);
    try {
      await deleteGrupo(id);
      setExito('Grupo eliminado exitosamente.');
      if (grupoDetalle?.idGrupo === id) setGrupoDetalle(null);
      await cargar();
      setTimeout(() => setExito(null), 3000);
    } catch { setError('Error al eliminar el grupo.'); }
  };

  const eliminarMiembro = async (idGrupo: number, idUsuario: number) => {
    if (!window.confirm('¿Remover este miembro del grupo?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/grupos/${idGrupo}/miembros/${idUsuario}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Error');
      // Actualizar detalle local
      setGrupoDetalle(prev => prev ? {
        ...prev,
        miembros: prev.miembros.filter(m => m.idUsuario !== idUsuario),
        cantidadMiembros: prev.cantidadMiembros - 1,
      } : null);
      setGrupos(prev => prev.map(g => g.idGrupo === idGrupo
        ? { ...g, miembros: g.miembros.filter(m => m.idUsuario !== idUsuario), cantidadMiembros: g.cantidadMiembros - 1 }
        : g
      ));
    } catch { setError('Error al remover el miembro.'); }
  };

  const gruposFiltrados = grupos.filter(g =>
    g.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (g.descripcion || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="grupos-admin-panel">
      {error && <div className="grupo-alert error">{error}</div>}
      {exito && <div className="grupo-alert success">{exito}</div>}
      {/* LISTA DE GRUPOS */}
      <div className="grupos-lista-section">
        <div className="grupos-header-row">
          <h2>Grupos Registrados <span className="count-badge">{gruposFiltrados.length}</span></h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="text" placeholder="🔍 Buscar grupos..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="grupos-busqueda" />
            <button onClick={cargar} className="btn-refresh" disabled={cargando}>🔄</button>
          </div>
        </div>

        {cargando && <div className="grupos-loading"><div className="spinner"></div><p>Cargando grupos...</p></div>}

        {!cargando && gruposFiltrados.length === 0 && (
          <div className="grupos-empty">
            <span style={{ fontSize: '2.5rem' }}>👥</span>
            <p>No hay grupos registrados aún</p>
          </div>
        )}

        <div className="grupos-grid">
          {gruposFiltrados.map(g => (
            <div key={g.idGrupo} className={`grupo-card ${grupoDetalle?.idGrupo === g.idGrupo ? 'selected' : ''}`} onClick={() => setGrupoDetalle(grupoDetalle?.idGrupo === g.idGrupo ? null : g)}>
              <div className="grupo-card-header">
                <div className="grupo-icon">👥</div>
                <div className="grupo-info">
                  <strong>{g.nombre}</strong>
                  <span className="grupo-desc">{g.descripcion || <em>Sin descripción</em>}</span>
                </div>
                <div className="grupo-meta">
                  <span className="miembros-count">{g.cantidadMiembros} miembro{g.cantidadMiembros !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="grupo-card-footer">
                <span className="grupo-fecha">Creado: {new Date(g.fechaCreacion).toLocaleDateString('es-EC')}</span>
                <button
                  onClick={e => { e.stopPropagation(); eliminar(g.idGrupo); }}
                  className="btn-eliminar"
                  title="Eliminar grupo"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PANEL DE DETALLE DE MIEMBROS */}
      {grupoDetalle && (
        <div className="grupo-detalle-panel">
          <div className="detalle-header">
            <div>
              <h3>👥 {grupoDetalle.nombre}</h3>
              <p>{grupoDetalle.descripcion || 'Sin descripción'}</p>
            </div>
            <button onClick={() => setGrupoDetalle(null)} className="btn-cerrar-detalle">✕ Cerrar</button>
          </div>

          <h4 style={{ marginBottom: '12px', color: '#555', fontSize: '0.95rem' }}>Miembros del grupo ({grupoDetalle.miembros.length})</h4>

          {grupoDetalle.miembros.length === 0 && (
            <div className="grupos-empty" style={{ padding: '20px' }}>
              <p>Este grupo no tiene miembros todavía.</p>
            </div>
          )}

          <div className="miembros-lista">
            {grupoDetalle.miembros.map(m => (
              <div key={m.idUsuarioGrupo} className="miembro-item">
                <div className="miembro-avatar">👤</div>
                <div className="miembro-info">
                  <strong>Usuario #{m.idUsuario}</strong>
                  <span>Se unió: {new Date(m.fechaUnion).toLocaleDateString('es-EC')}</span>
                </div>
                <button
                  onClick={() => eliminarMiembro(grupoDetalle.idGrupo, m.idUsuario)}
                  className="btn-eliminar-miembro"
                  title="Remover miembro"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GruposAdminPanel;
