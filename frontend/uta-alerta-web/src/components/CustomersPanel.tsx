import { useState, useEffect } from 'react';
import { getGrupos, deleteGrupo, type GrupoConfianza } from '../services/gruposService';
import './CustomersPanel.css';

const CustomersPanel = () => {
  const [grupos, setGrupos] = useState<GrupoConfianza[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [expandidos, setExpandidos] = useState<Record<number, boolean>>({});

  const cargarGrupos = async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await getGrupos();
      setGrupos(datos);
    } catch {
      setError('No se pudieron cargar los grupos. Verifica que NotificationService esté activo (puerto 5009).');
      setGrupos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarGrupos();
  }, []);

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres ELIMINAR este grupo de confianza? Esta acción es irreversible.')) {
      return;
    }

    setError(null);
    setExito(null);
    setCargando(true);

    try {
      await deleteGrupo(id);
      setExito('Grupo eliminado exitosamente');
      await cargarGrupos();
      setTimeout(() => setExito(null), 3000);
    } catch {
      setError('Error al eliminar el grupo. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const toggleMiembros = (id: number) => {
    setExpandidos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="customers-panel">
      {/* SECCIÓN: TABLA DE GRUPOS */}
      <div className="customers-table-section">
        <div className="section-header">
          <h2>Grupos de Confianza Registrados</h2>
          <button
            onClick={cargarGrupos}
            className="btn btn-secondary btn-small"
            disabled={cargando}
          >
            🔄 Actualizar
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ margin: '16px' }}>{error}</div>}
        {exito && <div className="alert alert-success" style={{ margin: '16px' }}>{exito}</div>}

        {cargando && grupos.length === 0 && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando grupos de confianza...</p>
          </div>
        )}

        {!cargando && grupos.length === 0 && !error && (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p>No hay grupos de confianza registrados</p>
            <small>Los estudiantes pueden crear grupos desde la aplicación móvil</small>
          </div>
        )}

        {grupos.length > 0 && (
          <div className="tabla-scroll">
            <table className="customers-tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Grupo</th>
                  <th>Descripción</th>
                  <th>Creador</th>
                  <th>Miembros</th>
                  <th>Fecha de Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <tr key={grupo.idGrupo}>
                    <td>#{grupo.idGrupo}</td>
                    <td className="td-nombre">
                      <strong>{grupo.nombre}</strong>
                    </td>
                    <td>{grupo.descripcion || '—'}</td>
                    <td>
                      Usuario #{grupo.idCreador}
                    </td>
                    <td>
                      <span className="miembros-badge">
                        {grupo.cantidadMiembros} miembros
                      </span>
                      {grupo.cantidadMiembros > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <button 
                            className="btn-icon btn-toggle" 
                            onClick={() => toggleMiembros(grupo.idGrupo)}
                          >
                            {expandidos[grupo.idGrupo] ? 'Ocultar ▲' : 'Ver IDs ▼'}
                          </button>
                        </div>
                      )}
                      
                      {expandidos[grupo.idGrupo] && grupo.miembros && (
                        <div className="miembros-lista">
                          {grupo.miembros.map(m => (
                            <span 
                              key={m.idUsuarioGrupo} 
                              className={`miembro-chip ${m.idUsuario === grupo.idCreador ? 'creador-chip' : ''}`}
                              title={`Unido el: ${new Date(m.fechaUnion).toLocaleDateString()}`}
                            >
                              Usuario #{m.idUsuario}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="td-fecha">
                      {new Date(grupo.fechaCreacion).toLocaleString('es-EC')}
                    </td>
                    <td className="td-acciones">
                      <button
                        onClick={() => handleEliminar(grupo.idGrupo)}
                        className="btn-icon btn-delete"
                        title="Eliminar grupo por contenido inapropiado"
                        disabled={cargando}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPanel;
