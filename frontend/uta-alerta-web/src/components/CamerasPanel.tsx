import { useState, useEffect } from 'react';
import { getCameras, createCamera, deleteCamera, type Camera, type CameraFormData } from '../services/camerasService';
import { ZONAS } from '../services/zonasService';
import './CamerasPanel.css';

const CamerasPanel = () => {
  const [camaras, setCamaras] = useState<Camera[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Estado del formulario
  const [formData, setFormData] = useState<CameraFormData>({
    nombre: '',
    ubicacion: '',
    zona: ZONAS[0]?.id || 'zona-norte',
  });

  // Cargar cámaras al montar el componente
  useEffect(() => {
    cargarCamaras();
  }, []);

  const cargarCamaras = async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await getCameras();
      setCamaras(datos);
    } catch (err) {
      setError('No se pudieron cargar las cámaras. Verifica que el servidor esté activo.');
      setCamaras([]);
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    // Validación básica
    if (!formData.nombre.trim()) {
      setError('El nombre de la cámara es obligatorio');
      return;
    }
    if (!formData.ubicacion.trim()) {
      setError('La ubicación es obligatoria');
      return;
    }

    setCargando(true);
    try {
      await createCamera(formData);
      setExito('Cámara registrada exitosamente');
      setFormData({
        nombre: '',
        ubicacion: '',
        zona: ZONAS[0]?.id || 'zona-norte',
      });
      await cargarCamaras();

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setExito(null), 3000);
    } catch (err) {
      setError('Error al registrar la cámara. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id: number | undefined) => {
    if (!id) {
      setError('ID de cámara inválido');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta cámara?')) {
      return;
    }

    setError(null);
    setExito(null);
    setCargando(true);

    try {
      await deleteCamera(id);
      setExito('Cámara eliminada exitosamente');
      await cargarCamaras();

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setExito(null), 3000);
    } catch (err) {
      setError('Error al eliminar la cámara. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const getNombreZona = (zonaId: string) => {
    return ZONAS.find(z => z.id === zonaId)?.nombre || zonaId;
  };

  return (
    <div className="cameras-panel">
      {/* SECCIÓN: FORMULARIO DE REGISTRO */}
      <div className="cameras-form-section">
        <h2>Registrar Nueva Cámara</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {exito && <div className="alert alert-success">{exito}</div>}

        <form onSubmit={handleSubmit} className="cameras-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre de la Cámara *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Cámara Entrada Principal"
              disabled={cargando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ubicacion">Ubicación *</label>
            <input
              type="text"
              id="ubicacion"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleInputChange}
              placeholder="Ej: Segundo piso, pasillo principal"
              disabled={cargando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="zona">Zona Asignada *</label>
            <select
              id="zona"
              name="zona"
              value={formData.zona}
              onChange={handleInputChange}
              disabled={cargando}
            >
              {ZONAS.map(zona => (
                <option key={zona.id} value={zona.id}>
                  {zona.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={cargando}
          >
            {cargando ? 'Registrando...' : '+ Registrar Cámara'}
          </button>
        </form>
      </div>

      {/* SECCIÓN: TABLA DE CÁMARAS */}
      <div className="cameras-table-section">
        <div className="section-header">
          <h2>Cámaras Registradas</h2>
          <button
            onClick={cargarCamaras}
            className="btn btn-secondary btn-small"
            disabled={cargando}
          >
            🔄 Actualizar
          </button>
        </div>

        {cargando && camaras.length === 0 && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando cámaras...</p>
          </div>
        )}

        {!cargando && camaras.length === 0 && (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <p>No hay cámaras registradas</p>
            <small>Registra la primera cámara usando el formulario anterior</small>
          </div>
        )}

        {camaras.length > 0 && (
          <div className="tabla-scroll">
            <table className="cameras-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Ubicación</th>
                  <th>Zona</th>
                  <th>Estado</th>
                  <th>Fecha de Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {camaras.map((camera) => (
                  <tr key={camera.idCamera || Math.random()}>
                    <td className="td-nombre">
                      <strong>{camera.nombre}</strong>
                    </td>
                    <td>{camera.ubicacion}</td>
                    <td>
                      <span className="zona-badge">
                        {getNombreZona(camera.zona)}
                      </span>
                    </td>
                    <td>
                      <span className={`estado-badge ${camera.estado || 'activa'}`}>
                        {camera.estado ? camera.estado.charAt(0).toUpperCase() + camera.estado.slice(1) : 'Activa'}
                      </span>
                    </td>
                    <td className="td-fecha">
                      {camera.fechaCreacion 
                        ? new Date(camera.fechaCreacion).toLocaleDateString('es-EC')
                        : '—'
                      }
                    </td>
                    <td className="td-acciones">
                      <button
                        onClick={() => handleEliminar(camera.idCamera)}
                        className="btn-icon btn-delete"
                        title="Eliminar cámara"
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

      {/* INFO: Documentación de API */}
      <div className="api-docs-hint">
        <details>
          <summary>📋 Ver documentación de API esperada para el backend</summary>
          <div className="api-docs">
            <h3>Endpoints requeridos:</h3>
            <pre>{`GET /api/cameras
  Retorna: Camera[]

POST /api/cameras
  Body: { nombre: string, ubicacion: string, zona: string }
  Retorna: Camera

DELETE /api/cameras/{id}
  Retorna: { success: boolean }

PUT /api/cameras/{id}
  Body: { nombre: string, ubicacion: string, zona: string }
  Retorna: Camera

GET /api/cameras/zona/{zonaId}
  Retorna: Camera[]

Modelo Camera:
{
  idCamera: number,
  nombre: string,
  ubicacion: string,
  zona: string,
  estado: 'activa' | 'inactiva' | 'mantenimiento',
  fechaCreacion: string (ISO)
}`}</pre>
          </div>
        </details>
      </div>
    </div>
  );
};

export default CamerasPanel;
