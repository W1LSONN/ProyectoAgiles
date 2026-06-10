import { useState, useEffect, useCallback } from 'react';
import './UsersPanel.css';

const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:5007';

interface Usuario {
  idUsuario: number;
  nombre: string;
  correo: string;
  facultad: string | null;
  rol: string;
  estado: string;
  disponible: boolean;
  fechaRegistro: string;
}

const ROLES_COLORES: Record<string, string> = {
  Admin: 'badge-admin',
  Guardia: 'badge-guardia',
  Estudiante: 'badge-estudiante',
};

const UsersPanel = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [cambiando, setCambiando] = useState<number | null>(null);
  const [usuarioDetalle, setUsuarioDetalle] = useState<Usuario | null>(null);

  const token = JSON.parse(localStorage.getItem('usuario') || '{}')?.token ?? '';

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`${AUTH_URL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status} al cargar usuarios`);
      const data: Usuario[] = await res.json();
      setUsuarios(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

  const toggleEstado = async (u: Usuario) => {
    const nuevoEstado = u.estado === 'Activo' ? 'Inactivo' : 'Activo';
    setCambiando(u.idUsuario);
    try {
      const res = await fetch(`${AUTH_URL}/api/usuarios/${u.idUsuario}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setUsuarios(prev =>
        prev.map(x => x.idUsuario === u.idUsuario ? { ...x, estado: nuevoEstado } : x)
      );
      if (usuarioDetalle?.idUsuario === u.idUsuario) {
        setUsuarioDetalle(prev => prev ? { ...prev, estado: nuevoEstado } : prev);
      }
    } catch (e) {
      setError(`No se pudo cambiar el estado: ${(e as Error).message}`);
    } finally {
      setCambiando(null);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideBusqueda =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (u.facultad ?? '').toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol = filtroRol === 'todos' || u.rol === filtroRol;
    const coincideEstado = filtroEstado === 'todos' || u.estado === filtroEstado;
    return coincideBusqueda && coincideRol && coincideEstado;
  });

  const totalActivos = usuarios.filter(u => u.estado === 'Activo').length;
  const totalInactivos = usuarios.filter(u => u.estado === 'Inactivo').length;
  const totalGuardias = usuarios.filter(u => u.rol === 'Guardia').length;

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });

  const initials = (nombre: string) => {
    const parts = nombre.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : nombre.slice(0, 2).toUpperCase();
  };

  return (
    <div className="users-panel">

      {/* ── STATS RÁPIDAS ── */}
      <div className="users-stats">
        <div className="ustat-card ustat-total">
          <span className="ustat-value">{usuarios.length}</span>
          <span className="ustat-label">Total usuarios</span>
        </div>
        <div className="ustat-card ustat-activos">
          <span className="ustat-value">{totalActivos}</span>
          <span className="ustat-label">Activos</span>
        </div>
        <div className="ustat-card ustat-inactivos">
          <span className="ustat-value">{totalInactivos}</span>
          <span className="ustat-label">Desactivados</span>
        </div>
        <div className="ustat-card ustat-guardias">
          <span className="ustat-value">{totalGuardias}</span>
          <span className="ustat-label">Guardias</span>
        </div>
      </div>

      {/* ── BARRA DE FILTROS ── */}
      <div className="users-toolbar">
        <div className="users-search-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            id="users-search"
            className="users-search"
            type="text"
            placeholder="Buscar por nombre, correo o carrera..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className="search-clear" onClick={() => setBusqueda('')}>×</button>
          )}
        </div>

        <div className="users-filters">
          <select id="filtro-rol" className="filter-select" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
            <option value="todos">Todos los roles</option>
            <option value="Estudiante">Estudiante</option>
            <option value="Guardia">Guardia</option>
            <option value="Admin">Admin</option>
          </select>

          <select id="filtro-estado" className="filter-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Desactivados</option>
          </select>

          <button className="btn-refresh" onClick={cargarUsuarios} title="Actualizar lista">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        </div>
      </div>

      {error && <div className="users-error">⚠️ {error}</div>}

      {cargando ? (
        <div className="users-loading">
          <div className="loading-spinner" />
          <span>Cargando usuarios...</span>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="users-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <p>No se encontraron usuarios con esos filtros.</p>
        </div>
      ) : (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Carrera / Facultad</th>
                <th>Rol</th>
                <th>Registro</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(u => {
                const activo = u.estado === 'Activo';
                const cargandoEste = cambiando === u.idUsuario;
                return (
                  <tr key={u.idUsuario} className={activo ? '' : 'row-inactivo'}>
                    <td>
                      <button className="user-info-btn" onClick={() => setUsuarioDetalle(u)}>
                        <div className={`user-avatar-sm ${activo ? '' : 'avatar-inactivo'}`}>
                          {initials(u.nombre)}
                        </div>
                        <span className="user-nombre-cell">{u.nombre}</span>
                      </button>
                    </td>
                    <td className="td-correo">{u.correo}</td>
                    <td>{u.facultad ?? <span className="text-muted">—</span>}</td>
                    <td>
                      <span className={`role-badge ${ROLES_COLORES[u.rol] ?? ''}`}>{u.rol}</span>
                    </td>
                    <td className="td-fecha">{formatFecha(u.fechaRegistro)}</td>
                    <td>
                      <span className={`estado-badge ${activo ? 'estado-activo' : 'estado-inactivo'}`}>
                        {activo ? '● Activo' : '○ Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button
                        id={`toggle-user-${u.idUsuario}`}
                        className={`toggle-btn ${activo ? 'toggle-desactivar' : 'toggle-activar'}`}
                        onClick={() => toggleEstado(u)}
                        disabled={cargandoEste}
                        title={activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                      >
                        {cargandoEste ? '...' : activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="users-count">Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios</p>
        </div>
      )}

      {/* ── MODAL DE DETALLE ── */}
      {usuarioDetalle && (
        <div className="user-modal-overlay" onClick={() => setUsuarioDetalle(null)}>
          <div className="user-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setUsuarioDetalle(null)}>×</button>

            <div className={`modal-avatar ${usuarioDetalle.estado === 'Activo' ? '' : 'avatar-inactivo'}`}>
              {initials(usuarioDetalle.nombre)}
            </div>

            <h2 className="modal-nombre">{usuarioDetalle.nombre}</h2>
            <span className={`role-badge ${ROLES_COLORES[usuarioDetalle.rol] ?? ''}`} style={{ marginBottom: 16 }}>
              {usuarioDetalle.rol}
            </span>

            <div className="modal-datos">
              <div className="modal-dato">
                <span className="dato-label">Correo</span>
                <span className="dato-valor">{usuarioDetalle.correo}</span>
              </div>
              <div className="modal-dato">
                <span className="dato-label">Carrera / Facultad</span>
                <span className="dato-valor">{usuarioDetalle.facultad ?? '—'}</span>
              </div>
              <div className="modal-dato">
                <span className="dato-label">Fecha de registro</span>
                <span className="dato-valor">{formatFecha(usuarioDetalle.fechaRegistro)}</span>
              </div>
              <div className="modal-dato">
                <span className="dato-label">Estado de la cuenta</span>
                <span className={`estado-badge ${usuarioDetalle.estado === 'Activo' ? 'estado-activo' : 'estado-inactivo'}`}>
                  {usuarioDetalle.estado === 'Activo' ? '● Activo' : '○ Inactivo'}
                </span>
              </div>
              {usuarioDetalle.rol === 'Guardia' && (
                <div className="modal-dato">
                  <span className="dato-label">Disponibilidad de turno</span>
                  <span className={`estado-badge ${usuarioDetalle.disponible ? 'estado-activo' : 'estado-inactivo'}`}>
                    {usuarioDetalle.disponible ? '● En turno' : '○ Fuera de turno'}
                  </span>
                </div>
              )}
            </div>

            <button
              className={`toggle-btn modal-toggle ${usuarioDetalle.estado === 'Activo' ? 'toggle-desactivar' : 'toggle-activar'}`}
              onClick={() => toggleEstado(usuarioDetalle)}
              disabled={cambiando === usuarioDetalle.idUsuario}
            >
              {cambiando === usuarioDetalle.idUsuario
                ? 'Procesando...'
                : usuarioDetalle.estado === 'Activo'
                  ? '🔒 Desactivar cuenta'
                  : '🔓 Reactivar cuenta'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPanel;
