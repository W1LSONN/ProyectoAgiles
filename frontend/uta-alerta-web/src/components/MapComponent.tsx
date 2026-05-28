import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ZONAS, getCentroPorZona, type Zona } from '../services/zonasService';
import type { AlertaIncidente } from '../services/signalrService';
import { type Camera, getCameras } from '../services/camerasService';
import './MapComponent.css';

// Icono rojo personalizado para incidentes
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Icono personalizado para cámaras (CCTV)
const cctvIcon = L.divIcon({
  html: '<div style="font-size: 20px; background: #333; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">📹</div>',
  className: 'cctv-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface MapComponentProps {
  incidentes: AlertaIncidente[];
  onZonaSeleccionada?: (zona: Zona) => void;
}

const MapComponent = ({ incidentes, onZonaSeleccionada }: MapComponentProps) => {
  const [zonaActiva, setZonaActiva] = useState<string | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  
  // Estado para T-11: Cámaras
  const [camaras, setCamaras] = useState<Camera[]>([]);
  const [mostrarCamaras, setMostrarCamaras] = useState(true);

  // Cargar cámaras al inicializar
  useEffect(() => {
    const fetchCamaras = async () => {
      try {
        const data = await getCameras();
        setCamaras(data);
      } catch (err) {
        console.error('Error al cargar cámaras en el mapa', err);
      }
    };
    fetchCamaras();
  }, []);

  // Ayudante ultra robusto para ubicar la zona correcta sin importar cómo venga de la base de datos
  const encontrarZona = (inc: any): Zona | undefined => {
    const str = String(inc.zona || inc.idZona || inc.IdZona || '').toLowerCase().trim();
    if (!str || str === '—') return undefined;

    return ZONAS.find(z => {
      const id = z.id.toLowerCase();
      const numMatch = str.match(/\d+/);
      const num = numMatch ? numMatch[0] : null;
      
      if (id === str || z.nombre.toLowerCase() === str) return true;
      if (num && id.includes(num)) return true;
      if (str.includes('norte') && id.includes('1')) return true;
      if (str.includes('sur') && id.includes('2')) return true;
      if (str.includes('este') && id.includes('3')) return true;
      if (str.includes('oeste') && id.includes('4')) return true;
      return false;
    });
  };

  // Agrupar incidentes por zona (Calculado en tiempo real sin usar useEffect)
  const incidentesPorZona: Record<string, AlertaIncidente[]> = {};

  incidentes.forEach(incidente => {
    const zonaMatch = encontrarZona(incidente);

    if (zonaMatch) {
      if (!incidentesPorZona[zonaMatch.id]) {
        incidentesPorZona[zonaMatch.id] = [];
      }
      incidentesPorZona[zonaMatch.id].push(incidente);
    }
  });

  const handleZonaClick = (zona: Zona) => {
    setZonaActiva(zonaActiva === zona.id ? null : zona.id);
    setMostrarTodos(false);
    onZonaSeleccionada?.(zona);
  };

  const getCantidadIncidentes = (zonaId: string): number => {
    return incidentesPorZona[zonaId]?.length ?? 0;
  };

  return (
    <div className="map-component">
      {/* Control flotante para la capa de cámaras */}
      <div className="layer-controls" style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, background: 'white', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 'bold', color: '#333' }}>
          <input 
            type="checkbox" 
            checked={mostrarCamaras} 
            onChange={(e) => setMostrarCamaras(e.target.checked)} 
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          📹 Mostrar capa de cámaras
        </label>
      </div>
      <div className="map-container">
        <MapContainer
          center={[-1.2688, -78.6248] as L.LatLngExpression}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            maxZoom={19}
          />

          {/* Polígonos de las zonas */}
          {ZONAS.map(zona => (
            <Polygon
              key={zona.id}
              positions={zona.coordenadas}
              pathOptions={{
                color: zona.color,
                weight: 3,
                opacity: zonaActiva === zona.id ? 0.9 : 0.6,
                fillOpacity: zonaActiva === zona.id ? 0.4 : 0.2,
                fillColor: zona.color,
                dashArray: zonaActiva === zona.id ? undefined : '5, 5',
              }}
              eventHandlers={{
                click: () => handleZonaClick(zona),
              }}
            >
              <Popup>
                <div className="popup-zona">
                  <h4>{zona.nombre}</h4>
                  <p>Incidentes activos: <strong>{getCantidadIncidentes(zona.id)}</strong></p>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* Marcadores de incidentes */}
          {incidentes.map((incidente, idx) => {
            const zona = encontrarZona(incidente);
            if (!zona) return null;

            const [latBase, longBase] = getCentroPorZona(zona.id);
            
            // Coordenadas semi-aleatorias FIJAS basadas en el ID para evitar que los pines se borren
            let idNum = idx;
            const incId = incidente.idIncidente as any;
            if (typeof incId === 'number' && incId !== 0) {
              idNum = incId;
            } else if (typeof incId === 'string') {
              idNum = incId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            }
            
            // Mezclar con el índice para asegurar que los marcadores NUNCA se encimen exactamente
            idNum = idNum + (idx * 37);

            const offsetLat = ((idNum * 13) % 100 - 50) * 0.000004;
            const offsetLng = ((idNum * 17) % 100 - 50) * 0.000004;
            const lat = (incidente.latitud != null && incidente.latitud !== 0) ? incidente.latitud : (latBase + offsetLat);
            const long = (incidente.longitud != null && incidente.longitud !== 0) ? incidente.longitud : (longBase + offsetLng);

            // Obtener el nombre descriptivo que viene desde la BD
            const nombreBd = (incidente as any).facultad;
            const textoZonaPopup = (nombreBd && nombreBd !== '—')
              ? (nombreBd.toLowerCase().includes('zona') ? nombreBd : `${zona.nombre} — ${nombreBd}`)
              : zona.nombre;

            return (
              <Marker
                key={`${incidente.idIncidente}-${idx}`}
                position={[lat, long] as L.LatLngExpression}
                icon={redIcon}
              >
                <Popup>
                  <div className="popup-incidente">
                    <h5>{incidente.tipoIncidente}</h5>
                      <p><strong>Zona:</strong> {textoZonaPopup}</p>
                      <p><strong>Usuario:</strong> {incidente.nombreUsuario || `Usuario #${(incidente as any).idUsuario || '?'}`}</p>
                    <p><strong>Fecha:</strong> {new Date(incidente.fechaReporte).toLocaleString('es-EC')}</p>
                      <p><strong>Descripción:</strong> {incidente.mensaje || (incidente as any).descripcion}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcadores de cámaras (CCTV) */}
          {mostrarCamaras && Array.isArray(camaras) && (() => {
            // Diccionario para contar cuántas cámaras están en las mismas coordenadas
            const coordCount: Record<string, number> = {};
            
            return camaras.map((camara) => {
              if (camara.latitud == null || camara.longitud == null) return null;
              
              const coordKey = `${camara.latitud},${camara.longitud}`;
              const count = coordCount[coordKey] || 0;
              coordCount[coordKey] = count + 1;

              // Desplazamiento en diagonal (aprox 4 metros) por cada cámara superpuesta
              const latOffset = count * 0.00004;
              const lngOffset = count * 0.00004;

              return (
            <Marker
              key={`camara-${camara.idCamara || Math.random()}`}
              position={[camara.latitud + latOffset, camara.longitud + lngOffset] as L.LatLngExpression}
              icon={cctvIcon}
            >
              <Popup>
                <div className="popup-camara">
                  <h5 style={{ margin: '0 0 5px 0', color: '#333' }}>📹 {camara.nombre}</h5>
                  <p style={{ margin: '3px 0', fontSize: '0.9rem' }}><strong>Ubicación:</strong> {Number(camara.latitud).toFixed(5)}, {Number(camara.longitud).toFixed(5)}</p>
                  <p style={{ margin: '3px 0', fontSize: '0.9rem' }}>
                    <strong>Estado:</strong> 
                    <span style={{ color: camara.estado === 'inactiva' ? 'red' : 'green', fontWeight: 'bold', marginLeft: '5px' }}>
                      {camara.estado ? camara.estado.charAt(0).toUpperCase() + camara.estado.slice(1) : 'Activa'}
                    </span>
                  </p>
                </div>
              </Popup>
            </Marker>
            );
            });
          })()}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapComponent;