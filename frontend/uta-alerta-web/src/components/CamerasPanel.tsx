import { useState, useEffect } from 'react';
import { type Camera, type CameraFormData, getCameras, createCamera, deleteCamera } from '../services/camerasService';
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
    latitud: -1.268590, // Por defecto el centro de la universidad
    longitud: -78.624238,
    idZona: 1, // idZona numérico
  });

  const cargarCamaras = async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await getCameras();
      setCamaras(datos);
    } catch {
      setError('No se pudieron cargar las cámaras. Verifica que el servidor esté activo.');
      setCamaras([]);
    } finally {
      setCargando(false);
    }
  };

  // Cargar cámaras al montar el componente
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCamaras();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseFloat(value) || 0) : (name === 'idZona' ? parseInt(value) || 1 : value),
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
    if (formData.latitud === 0 || formData.longitud === 0) {
      setError('Las coordenadas son obligatorias');
      return;
    }

    setCargando(true);
    try {
      await createCamera(formData);

      setExito('Cámara registrada exitosamente');
      setFormData({
        nombre: '',
        latitud: -1.268590,
        longitud: -78.624238,
        idZona: 1,
      });
      await cargarCamaras();

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setExito(null), 3000);
    } catch {
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

    if (!window.confirm('¿Estás seguro de que quieres eliminar esta cámara?')) {
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
    } catch {
      setError('Error al eliminar la cámara. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const getNombreZona = (zonaId: number | undefined) => {
    if (!zonaId) return 'Desconocida';
    // Mapear el ID numérico al ID string de ZONAS (ej: 1 -> 'zona 1')
    return ZONAS.find(z => z.id === `zona ${zonaId}`)?.nombre || `Zona ${zonaId}`;
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

          <div className="form-group-row" style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="latitud">Latitud *</label>
              <input
                type="number"
                step="0.0000001"
                id="latitud"
                name="latitud"
                value={formData.latitud}
                onChange={handleInputChange}
                disabled={cargando}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="longitud">Longitud *</label>
              <input
                type="number"
                step="0.0000001"
                id="longitud"
                name="longitud"
                value={formData.longitud}
                onChange={handleInputChange}
                disabled={cargando}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="idZona">Zona Asignada *</label>
            <select
              id="idZona"
              name="idZona"
              value={formData.idZona}
              onChange={handleInputChange}
              disabled={cargando}
            >
              {ZONAS.map((zona, index) => (
                <option key={zona.id} value={index + 1}>
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
          <div className="tabla-scroll" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="cameras-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Coordenadas</th>
                  <th>Zona</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {camaras.map((camera, index) => (
                  <tr key={camera.idCamara || `cam-${index}`}>
                    <td className="td-nombre">
                      <strong>{camera.nombre}</strong>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{camera.latitud}, {camera.longitud}</td>
                    <td>
                      <span className="zona-badge">
                        {camera.nombreZona || getNombreZona(camera.idZona)}
                      </span>
                    </td>
                    <td>
                      <span className={`estado-badge ${camera.estado?.toLowerCase() || 'activa'}`}>
                        {camera.estado ? camera.estado.charAt(0).toUpperCase() + camera.estado.slice(1) : 'Activa'}
                      </span>
                    </td>
                    <td className="td-acciones">
                      <button
                        onClick={() => handleEliminar(camera.idCamara)}
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

      {/* INFO: Documentación de API eliminada ya que el backend real existe */}
    </div>
  );
};

export default CamerasPanel;
