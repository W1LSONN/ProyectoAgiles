import { useState, useEffect, useMemo, useCallback } from 'react';
import { type Camera, type CameraFormData, getCameras, createCamera, deleteCamera, updateCamera } from '../services/camerasService';
import { ZONAS, getZonaPorCoordenadas } from '../services/zonasService';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CamerasPanel.css';

const INCIDENT_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';

// ── Subcomponentes de mapa ──

const MapClickSelector = ({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) => {
  useMapEvents({ click(e) { onLocationSelected(e.latlng.lat, e.latlng.lng); } });
  return null;
};

const PanMapToMarker = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom()); }, [lat, lng, map]);
  return null;
};

/** Captura clicks en el mapa para dibujar un polígono de zona */
const PolygonDrawer = ({ onVertexAdded }: { onVertexAdded: (lat: number, lng: number) => void }) => {
  useMapEvents({ click(e) { onVertexAdded(e.latlng.lat, e.latlng.lng); } });
  return null;
};

const blueCameraIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const vertexIcon = L.divIcon({
  html: '<div style="width:12px;height:12px;background:#e74c3c;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  className: 'vertex-icon',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

// ── Tipos ──
interface ZonaDB { idZona: number; nombre: string; descripcion: string; latitud: number; longitud: number; coordenadasPoligono?: string; activa: boolean; }

// ── Componente principal ──
const CamerasPanel = () => {
  const [tab, setTab] = useState<'camaras' | 'zonas'>('camaras');

  // ── ESTADOS DE CÁMARAS ──
  const [camaras, setCamaras] = useState<Camera[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroZona, setFiltroZona] = useState<number | 'todas'>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [formData, setFormData] = useState<CameraFormData>({ nombre: '', latitud: -1.268590, longitud: -78.624238, idZona: 1 });

  // ── ESTADOS DE ZONAS ──
  const [zonasDB, setZonasDB] = useState<ZonaDB[]>([]);
  const [cargandoZonas, setCargandoZonas] = useState(false);
  const [errorZona, setErrorZona] = useState<string | null>(null);
  const [exitoZona, setExitoZona] = useState<string | null>(null);
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const [nombreZona, setNombreZona] = useState('');
  const [descripcionZona, setDescripcionZona] = useState('');
  const [guardandoZona, setGuardandoZona] = useState(false);

  const cargarCamaras = async () => {
    setCargando(true); setError(null);
    try { setCamaras(await getCameras()); }
    catch { setError('No se pudieron cargar las cámaras.'); setCamaras([]); }
    finally { setCargando(false); }
  };

  const cargarZonas = useCallback(async () => {
    setCargandoZonas(true);
    try {
      const res = await fetch(`${INCIDENT_URL}/api/zonas`);
      if (res.ok) setZonasDB(await res.json());
    } catch { /* silencioso */ }
    finally { setCargandoZonas(false); }
  }, []);

  useEffect(() => { cargarCamaras(); }, []);
  useEffect(() => { if (tab === 'zonas') cargarZonas(); }, [tab, cargarZonas]);

  // ── LÓGICA CÁMARAS ──
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? (parseFloat(value) || 0) : (name === 'idZona' ? parseInt(value) || 1 : value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setExito(null);
    if (!formData.nombre.trim()) { setError('El nombre de la cámara es obligatorio'); return; }
    if (formData.latitud === 0 || formData.longitud === 0) { setError('Las coordenadas son obligatorias'); return; }
    setCargando(true);
    try {
      await createCamera(formData);
      setExito('Cámara registrada exitosamente');
      setFormData({ nombre: '', latitud: -1.268590, longitud: -78.624238, idZona: 1 });
      await cargarCamaras();
      setTimeout(() => setExito(null), 3000);
    } catch { setError('Error al registrar la cámara.'); }
    finally { setCargando(false); }
  };

  const handleEliminar = async (id: number | undefined) => {
    if (!id) return;
    if (!window.confirm('¿Eliminar esta cámara?')) return;
    setError(null); setExito(null); setCargando(true);
    try {
      await deleteCamera(id);
      setExito('Cámara eliminada exitosamente');
      await cargarCamaras();
      setTimeout(() => setExito(null), 3000);
    } catch { setError('Error al eliminar la cámara.'); }
    finally { setCargando(false); }
  };

  const handleToggleEstado = async (camera: Camera) => {
    if (!camera.idCamara) return;
    const nuevoEstado = camera.estado === 'inactiva' ? 'activa' : 'inactiva';
    setError(null); setExito(null); setCargando(true);
    try {
      const payload = {
        nombre: camera.nombre,
        latitud: camera.latitud,
        longitud: camera.longitud,
        idZona: camera.idZona || 1,
        estado: nuevoEstado,
        urlStream: camera.urlStream || ''
      };
      await updateCamera(camera.idCamara, payload);
      setExito(`Cámara ${nuevoEstado === 'activa' ? 'activada' : 'desactivada'} exitosamente`);
      await cargarCamaras();
      setTimeout(() => setExito(null), 3000);
    } catch {
      setError('Error al actualizar el estado de la cámara.');
    } finally {
      setCargando(false);
    }
  };

  const getNombreZona = (zonaId: number | undefined) => {
    if (!zonaId) return 'Desconocida';
    return ZONAS.find(z => z.id === `zona ${zonaId}`)?.nombre || `Zona ${zonaId}`;
  };

  const camarasFiltradas = useMemo(() => camaras.filter(camera => {
    const coincideTexto = camera.nombre.toLowerCase().includes(filtroTexto.toLowerCase());
    const coincideZona = filtroZona === 'todas' || camera.idZona === filtroZona;
    const estadoCamara = (camera.estado || 'activa').toLowerCase();
    const coincideEstado = filtroEstado === 'todos' || estadoCamara === filtroEstado.toLowerCase();
    return coincideTexto && coincideZona && coincideEstado;
  }), [camaras, filtroTexto, filtroZona, filtroEstado]);

  const handleFiltroZonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFiltroZona(value === 'todas' ? 'todas' : parseInt(value));
  };

  // ── LÓGICA ZONAS ──
  const agregarVertice = (lat: number, lng: number) => {
    setVertices(prev => [...prev, [lat, lng]]);
  };

  const quitarUltimoVertice = () => setVertices(prev => prev.slice(0, -1));
  const limpiarVertices = () => setVertices([]);

  const guardarZona = async () => {
    if (!nombreZona.trim()) { setErrorZona('El nombre de la zona es obligatorio.'); return; }
    if (vertices.length < 3) { setErrorZona('Necesitas al menos 3 vértices para formar un polígono.'); return; }

    setGuardandoZona(true); setErrorZona(null); setExitoZona(null);
    // Calcular centroide
    const centroLat = vertices.reduce((s, v) => s + v[0], 0) / vertices.length;
    const centroLng = vertices.reduce((s, v) => s + v[1], 0) / vertices.length;

    const payload = {
      nombre: nombreZona.trim(),
      descripcion: descripcionZona.trim() || null,
      latitud: centroLat,
      longitud: centroLng,
      coordenadasPoligono: JSON.stringify(vertices),
      activa: true,
    };

    try {
      const res = await fetch(`${INCIDENT_URL}/api/zonas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.mensaje || `Error ${res.status}`);
      }
      setExitoZona(`Zona "${nombreZona}" guardada exitosamente.`);
      setNombreZona(''); setDescripcionZona(''); setVertices([]);
      await cargarZonas();
      setTimeout(() => setExitoZona(null), 4000);
    } catch (err: any) {
      setErrorZona(err.message || 'Error al guardar la zona.');
    } finally {
      setGuardandoZona(false);
    }
  };

  const eliminarZona = async (id: number) => {
    if (!window.confirm('¿Eliminar esta zona? Si tiene incidentes, se desactivará (soft delete).')) return;
    try {
      const res = await fetch(`${INCIDENT_URL}/api/zonas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      await cargarZonas();
    } catch { setErrorZona('Error al eliminar la zona.'); }
  };

  return (
    <div className="cameras-panel">
      {/* Tabs */}
      <div className="config-tabs">
        <button className={`config-tab ${tab === 'camaras' ? 'active' : ''}`} onClick={() => setTab('camaras')}>
          📹 Cámaras
        </button>
        <button className={`config-tab ${tab === 'zonas' ? 'active' : ''}`} onClick={() => setTab('zonas')}>
          🗺️ Zonas del Campus
        </button>
      </div>

      {/* ── TAB CÁMARAS ── */}
      {tab === 'camaras' && (
        <>
          <div className="cameras-form-section">
            <h2>Registrar Nueva Cámara</h2>
            {error && <div className="alert alert-error">{error}</div>}
            {exito && <div className="alert alert-success">{exito}</div>}

            <form onSubmit={handleSubmit} className="cameras-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
              {/* COLUMNA IZQUIERDA: MAPA GRANDE */}
              <div className="form-left-col">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', display: 'block', color: '#fff' }}>
                    📍 Ubicar en el mapa — haz clic para seleccionar:
                  </label>
                  <div style={{ height: '460px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '2px solid #3498db', zIndex: 1 }}>
                    <MapContainer center={[formData.latitud, formData.longitud]} zoom={17} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                      <Marker position={[formData.latitud, formData.longitud]} icon={blueCameraIcon} />
                      <MapClickSelector onLocationSelected={(lat, lng) => {
                        const zonaDetectada = getZonaPorCoordenadas(lat, lng);
                        const idZonaNum = zonaDetectada ? parseInt(zonaDetectada.id.replace('zona ', '')) || 1 : 1;
                        setFormData(prev => ({ ...prev, latitud: Number(lat.toFixed(7)), longitud: Number(lng.toFixed(7)), idZona: idZonaNum }));
                      }} />
                      {/* Polígonos de zonas existentes para referencia */}
                      {ZONAS.map(zona => (
                        <Polygon key={zona.id} positions={zona.coordenadas} pathOptions={{ color: zona.color, weight: 2, fillOpacity: 0.15, dashArray: '4, 4' }}>
                          <Popup>{zona.nombre}</Popup>
                        </Polygon>
                      ))}
                      {zonasDB.filter(z => z.coordenadasPoligono).map(z => {
                        try {
                          const coords: [number, number][] = JSON.parse(z.coordenadasPoligono!);
                          return (
                            <Polygon key={`db-${z.idZona}`} positions={coords as L.LatLngExpression[]} pathOptions={{ color: '#9b59b6', weight: 2, fillOpacity: 0.15, dashArray: '4, 4' }}>
                              <Popup>🟣 {z.nombre}</Popup>
                            </Polygon>
                          );
                        } catch { return null; }
                      })}
                      <PanMapToMarker lat={formData.latitud} lng={formData.longitud} />
                    </MapContainer>
                  </div>
                  <p style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '6px' }}>
                    Lat: {formData.latitud.toFixed(6)} | Lng: {formData.longitud.toFixed(6)} | Zona detectada: {formData.idZona}
                  </p>
                </div>
              </div>

              {/* COLUMNA DERECHA: DATOS */}
              <div className="form-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '28px' }}>
                <div className="form-group">
                  <label htmlFor="nombre">Nombre de la Cámara *</label>
                  <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Ej: Cámara Entrada Principal" disabled={cargando} />
                </div>
                <div className="form-group">
                  <label htmlFor="idZona">Zona asignada</label>
                  <select id="idZona" name="idZona" value={formData.idZona} onChange={handleInputChange} disabled={cargando}>
                    {ZONAS.map((zona, i) => (<option key={zona.id} value={i + 1}>{zona.nombre}</option>))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={cargando} style={{ padding: '14px', fontSize: '1rem', justifyContent: 'center', marginTop: 'auto' }}>
                  {cargando ? 'Registrando...' : '+ Registrar Cámara'}
                </button>
              </div>
            </form>
          </div>

          {/* TABLA DE CÁMARAS */}
          <div className="cameras-table-section">
            <div className="section-header" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Cámaras Registradas</h2>
                <button onClick={cargarCamaras} className="btn btn-secondary btn-small" disabled={cargando}>🔄 Actualizar</button>
              </div>
              <div className="filters-container" style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <input type="text" placeholder="🔍 Buscar por nombre..." value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} style={{ flex: 2, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }} />
                <select value={filtroZona} onChange={handleFiltroZonaChange} style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }} disabled={cargando}>
                  <option value="todas">Todas las zonas</option>
                  {ZONAS.map((zona, index) => (<option key={zona.id} value={index + 1}>{zona.nombre}</option>))}
                </select>
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }} disabled={cargando}>
                  <option value="todos">Todos los estados</option>
                  <option value="activa">Activas</option>
                  <option value="inactiva">Inactivas</option>
                </select>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: '#666', marginLeft: '5px' }}>{camarasFiltradas.length} de {camaras.length}</span>
              </div>
            </div>

            {cargando && camaras.length === 0 && (<div className="loading-state"><div className="spinner"></div><p>Cargando cámaras...</p></div>)}
            {!cargando && camarasFiltradas.length === 0 && (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                <p>No se encontraron cámaras</p><small>Ajusta los filtros o registra una nueva cámara</small>
              </div>
            )}

            {camarasFiltradas.length > 0 && (
              <div className="tabla-scroll" style={{ overflowX: 'auto' }}>
                <table className="cameras-tabla">
                  <thead>
                    <tr><th>Nombre</th><th>Zona</th><th>Estado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {camarasFiltradas.map((camera, index) => (
                      <tr key={camera.idCamara || `cam-${index}`}>
                        <td className="td-nombre"><strong>{camera.nombre}</strong></td>
                        <td><span className="zona-badge">{camera.nombreZona || getNombreZona(camera.idZona)}</span></td>
                        <td><span className={`estado-badge ${camera.estado?.toLowerCase() || 'activa'}`}>{camera.estado ? camera.estado.charAt(0).toUpperCase() + camera.estado.slice(1) : 'Activa'}</span></td>
                        <td className="td-acciones" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleToggleEstado(camera)}
                            className={`btn-icon ${camera.estado === 'inactiva' ? 'btn-activate' : 'btn-deactivate'}`}
                            title={camera.estado === 'inactiva' ? 'Activar cámara' : 'Desactivar cámara'}
                            disabled={cargando}
                          >
                            {camera.estado === 'inactiva' ? '🟢 Activar' : '🔴 Desactivar'}
                          </button>
                          <button onClick={() => handleEliminar(camera.idCamara)} className="btn-icon btn-delete" title="Eliminar cámara" disabled={cargando}>🗑️ Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB ZONAS ── */}
      {tab === 'zonas' && (
        <div className="zonas-panel">
          <div className="zonas-form-section">
            <h2>Delimitar Nueva Zona</h2>
            <p style={{ color: '#aaa', fontSize: '0.87rem', marginBottom: '16px' }}>
              Haz clic en el mapa para agregar vértices del polígono. Necesitas al menos 3 puntos.
            </p>

            {errorZona && <div className="alert alert-error">{errorZona}</div>}
            {exitoZona && <div className="alert alert-success">{exitoZona}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
              {/* MAPA PARA DIBUJAR */}
              <div>
                <div style={{ height: '480px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '2px solid #27ae60', zIndex: 1 }}>
                  <MapContainer center={[-1.2688, -78.6248]} zoom={17} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    <PolygonDrawer onVertexAdded={agregarVertice} />
                    {/* Polígono actual */}
                    {vertices.length >= 3 && (
                      <Polygon positions={vertices as L.LatLngExpression[]} pathOptions={{ color: '#27ae60', weight: 2, fillOpacity: 0.25 }} />
                    )}
                    {/* Vértices */}
                    {vertices.map((v, i) => (
                      <Marker key={i} position={v as L.LatLngExpression} icon={vertexIcon}>
                        <Popup>Vértice {i + 1}<br />{v[0].toFixed(6)}, {v[1].toFixed(6)}</Popup>
                      </Marker>
                    ))}
                    {/* Zonas predeterminadas (estáticas) */}
                    {ZONAS.map(zona => (
                      <Polygon key={zona.id} positions={zona.coordenadas} pathOptions={{ color: zona.color, weight: 2, fillOpacity: 0.15, dashArray: '4, 4' }}>
                        <Popup>{zona.nombre}</Popup>
                      </Polygon>
                    ))}
                    {/* Zonas dinámicas ya guardadas */}
                    {zonasDB.filter(z => z.coordenadasPoligono).map(z => {
                      try {
                        const coords: [number, number][] = JSON.parse(z.coordenadasPoligono!);
                        return (
                          <Polygon key={z.idZona} positions={coords as L.LatLngExpression[]} pathOptions={{ color: '#9b59b6', weight: 2, fillOpacity: 0.15, dashArray: '4, 4' }}>
                            <Popup><strong>🟣 {z.nombre}</strong></Popup>
                          </Polygon>
                        );
                      } catch { return null; }
                    })}
                  </MapContainer>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <span style={{ color: '#aaa', fontSize: '0.83rem', flex: 1 }}>
                    {vertices.length === 0 ? 'Haz clic en el mapa para agregar vértices' : `${vertices.length} vértice${vertices.length !== 1 ? 's' : ''} agregado${vertices.length !== 1 ? 's' : ''}`}
                  </span>
                  <button onClick={quitarUltimoVertice} disabled={vertices.length === 0} className="btn btn-secondary btn-small">↩ Deshacer</button>
                  <button onClick={limpiarVertices} disabled={vertices.length === 0} className="btn btn-secondary btn-small">🗑️ Limpiar</button>
                </div>
              </div>

              {/* FORMULARIO DE NOMBRE/DESCRIPCIÓN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '12px' }}>
                <div className="form-group">
                  <label htmlFor="nombreZona">Nombre de la Zona *</label>
                  <input type="text" id="nombreZona" value={nombreZona} onChange={e => setNombreZona(e.target.value)} placeholder="Ej: Zona 5 — Biblioteca" />
                </div>
                <div className="form-group">
                  <label htmlFor="descripcionZona">Descripción</label>
                  <input type="text" id="descripcionZona" value={descripcionZona} onChange={e => setDescripcionZona(e.target.value)} placeholder="Ej: Edificio central de la universidad" />
                </div>
                <div style={{ background: '#1a1a2e', borderRadius: '8px', padding: '12px', fontSize: '0.83rem', color: '#aaa' }}>
                  <strong style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>📍 Vértices del polígono:</strong>
                  {vertices.length === 0 && <em>Ninguno aún — haz clic en el mapa</em>}
                  {vertices.map((v, i) => (<div key={i}>V{i + 1}: {v[0].toFixed(5)}, {v[1].toFixed(5)}</div>))}
                </div>
                <button
                  onClick={guardarZona}
                  disabled={guardandoZona || vertices.length < 3 || !nombreZona.trim()}
                  className="btn btn-primary"
                  style={{ padding: '14px', fontSize: '1rem', marginTop: 'auto' }}
                >
                  {guardandoZona ? 'Guardando...' : '✅ Guardar Zona'}
                </button>
              </div>
            </div>
          </div>

          {/* LISTA DE ZONAS EXISTENTES */}
          <div className="cameras-table-section" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2>Zonas del Campus</h2>
              <button onClick={cargarZonas} className="btn btn-secondary btn-small" disabled={cargandoZonas}>🔄 Actualizar</button>
            </div>
            {cargandoZonas && <div className="loading-state"><div className="spinner"></div><p>Cargando zonas...</p></div>}
            {!cargandoZonas && zonasDB.length === 0 && <div className="empty-state"><p>No hay zonas registradas aún.</p></div>}
            {zonasDB.length > 0 && (
              <div className="tabla-scroll">
                <table className="cameras-tabla">
                  <thead>
                    <tr><th>Nombre</th><th>Descripción</th><th>Vértices</th><th>Estado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {zonasDB.map(z => {
                      let verticeCount = 0;
                      try { if (z.coordenadasPoligono) verticeCount = JSON.parse(z.coordenadasPoligono).length; } catch {}
                      return (
                        <tr key={z.idZona}>
                          <td><strong>{z.nombre}</strong></td>
                          <td>{z.descripcion || '—'}</td>
                          <td>{verticeCount > 0 ? `${verticeCount} puntos` : <span style={{ color: '#e67e22' }}>Sin polígono</span>}</td>
                          <td><span className={`estado-badge ${z.activa ? 'activa' : 'inactiva'}`}>{z.activa ? 'Activa' : 'Inactiva'}</span></td>
                          <td>
                            <button onClick={() => eliminarZona(z.idZona)} className="btn-icon btn-delete" title="Eliminar zona">🗑️ Eliminar</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CamerasPanel;
