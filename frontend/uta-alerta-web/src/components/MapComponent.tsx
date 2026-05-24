import { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ZONAS, getCentroPorZona, type Zona } from '../services/zonasService';
import type { AlertaIncidente } from '../services/signalrService';
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

interface MapComponentProps {
  incidentes: AlertaIncidente[];
  onZonaSeleccionada?: (zona: Zona) => void;
}

const MapComponent = ({ incidentes, onZonaSeleccionada }: MapComponentProps) => {
  const [zonaActiva, setZonaActiva] = useState<string | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);

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
            const lat = latBase + offsetLat;
            const long = longBase + offsetLng;

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
        </MapContainer>
      </div>

      {/* Panel de control de zonas */}
      <div className="map-legend">
        <h3>Zonas de la UTA</h3>
        <div className="zonas-list">
          {ZONAS.map(zona => (
            <div
              key={zona.id}
              className={`zona-item ${zonaActiva === zona.id ? 'active' : ''}`}
              onClick={() => handleZonaClick(zona)}
            >
              <div
                className="zona-color"
                style={{ backgroundColor: zona.color }}
              />
              <span className="zona-nombre">{zona.nombre}</span>
              <span className="zona-contador">({getCantidadIncidentes(zona.id)})</span>
            </div>
          ))}
        </div>

        {zonaActiva && (
          <div className="zona-incidentes">
            <h4>Incidentes en {ZONAS.find(z => z.id === zonaActiva)?.nombre}</h4>
            <div className="incidentes-list">
              {(incidentesPorZona[zonaActiva] || [])
                .slice(0, mostrarTodos ? undefined : 20)
                .map(inc => (
                  <div key={inc.idIncidente} className="incidente-item">
                    <strong>{inc.tipoIncidente}</strong>
                    <small>{inc.nombreUsuario} - {new Date(inc.fechaReporte).toLocaleString('es-EC')}</small>
                  </div>
                ))}
              
              {!mostrarTodos && (incidentesPorZona[zonaActiva] || []).length > 20 && (
                <button className="btn-ver-mas" onClick={() => setMostrarTodos(true)}>
                  Ver más ({(incidentesPorZona[zonaActiva] || []).length - 20} ocultos)
                </button>
              )}
              {mostrarTodos && (incidentesPorZona[zonaActiva] || []).length > 20 && (
                <button className="btn-ver-mas" onClick={() => setMostrarTodos(false)}>
                  Ver menos
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
