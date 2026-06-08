import { useState, useEffect, useMemo } from 'react';
import { type Camera, type CameraFormData, getCameras, createCamera, deleteCamera } from '../services/camerasService';
import { ZONAS } from '../services/zonasService';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CamerasPanel.css';

// Componente para capturar clics en el mapa e interactuar
const MapClickSelector = ({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Componente para mover el mapa si cambian las coordenadas manuales
const PanMapToMarker = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

// Icono personalizado para cámara a registrar
const blueCameraIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const CamerasPanel = () => {
  const [camaras, setCamaras] = useState<Camera[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Estados de filtrado
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroZona, setFiltroZona] = useState<number | 'todas'>('todas');

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

      setExito('Cámara registrada exitosamente');
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
    return ZONAS.find(z => z.id === `zona ${zonaId}`)?.nombre || `Zona ${zonaId}`;
  };

  // Extraer zonas únicas dinámicamente de los datos de cámaras (no hardcoded)
  const zonasDisponibles = useMemo(() => {
    const zonasMap = new Map<number, string>();
    camaras.forEach(cam => {
      if (cam.idZona) {
        const nombre = cam.nombreZona || getNombreZona(cam.idZona);
        zonasMap.set(cam.idZona, nombre);
      }
    });
    return Array.from(zonasMap.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.id - b.id);
  }, [camaras]);

  // Filtrado de cámaras local por texto y zona
  const camarasFiltradas = useMemo(() => {
    return camaras.filter(camera => {
      const coincideTexto = camera.nombre.toLowerCase().includes(filtroTexto.toLowerCase());
      const coincideZona = filtroZona === 'todas' || camera.idZona === filtroZona;
      return coincideTexto && coincideZona;
    });
  }, [camaras, filtroTexto, filtroZona]);

  const handleFiltroZonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFiltroZona(value === 'todas' ? 'todas' : parseInt(value));
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

          {/* MAPA INTERACTIVO DE UBICACIÓN */}
          <div className="form-group" style={{ marginTop: '5px', marginBottom: '15px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '6px', display: 'block', color: '#444' }}>
              📍 Ubicar en el mapa (Haz clic para seleccionar la posición):
            </label>
            <div style={{ height: '220px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc', zIndex: 1 }}>
              <MapContainer
                center={[formData.latitud, formData.longitud]}
                zoom={17}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <Marker position={[formData.latitud, formData.longitud]} icon={blueCameraIcon} />
                <MapClickSelector
                  onLocationSelected={(lat, lng) => {
                    setFormData(prev => ({
                      ...prev,
                      latitud: Number(lat.toFixed(7)),
                      longitud: Number(lng.toFixed(7))
                    }));
                  }}
                />
                <PanMapToMarker lat={formData.latitud} lng={formData.longitud} />
              </MapContainer>
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
        <div className="section-header" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Cámaras Registradas</h2>
            <button
              onClick={cargarCamaras}
              className="btn btn-secondary btn-small"
              disabled={cargando}
            >
              🔄 Actualizar
            </button>
          </div>

          {/* FILTROS DE BÚSQUEDA */}
          <div className="filters-container" style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o edificio..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              style={{ flex: 2, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
            />
            <select
              value={filtroZona}
              onChange={handleFiltroZonaChange}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
              disabled={cargando}
            >
              <option value="todas">Todas las zonas</option>
              {ZONAS.map((zona, index) => (
                <option key={zona.id} value={index + 1}>
                  {zona.nombre}
                </option>
              ))}
            </select>
            <span className="filtro-zona-count" style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: '#666', marginLeft: '5px' }}>
              {camarasFiltradas.length} de {camaras.length}
            </span>
          </div>
        </div>
        </div>

        {cargando && camaras.length === 0 && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando cámaras...</p>
          </div>
        )}

        {!cargando && camarasFiltradas.length === 0 && (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <p>No se encontraron cámaras</p>
            <small>Ajusta los filtros o registra una nueva cámara usando el formulario</small>
          </div>
        )}

        {camarasFiltradas.length > 0 && (
          <div className="tabla-scroll" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {camarasFiltradas.length === 0 && filtroZona !== 'todas' ? (
              <div className="empty-state">
                <p>No hay cámaras en la zona seleccionada</p>
                <small>Selecciona otra zona o elige "Todas las zonas"</small>
              </div>
            ) : (
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
                {camarasFiltradas.map((camera, index) => (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CamerasPanel;
