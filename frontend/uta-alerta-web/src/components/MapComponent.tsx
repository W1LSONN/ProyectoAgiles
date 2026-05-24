import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ZONAS, getCentroPorZona, type Zona } from '../services/zonasService';
import type { AlertaIncidente } from '../services/signalrService';
import './MapComponent.css';

// Icono por defecto de leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.setIcon(defaultIcon);

interface MapComponentProps {
  incidentes: AlertaIncidente[];
  onZonaSeleccionada?: (zona: Zona) => void;
}

const MapComponent = ({ incidentes, onZonaSeleccionada }: MapComponentProps) => {
  const [zonaActiva, setZonaActiva] = useState<string | null>(null);
  const [incidentesPorZona, setIncidentesPorZona] = useState<Map<string, AlertaIncidente[]>>(new Map());

  // Agrupar incidentes por zona
  useEffect(() => {
    const mapa = new Map<string, AlertaIncidente[]>();

    incidentes.forEach(incidente => {
      const zona = incidente.zona;
      if (zona) {
        if (!mapa.has(zona)) {
          mapa.set(zona, []);
        }
        mapa.get(zona)!.push(incidente);
      }
    });

    setIncidentesPorZona(mapa);
  }, [incidentes]);

  const handleZonaClick = (zona: Zona) => {
    setZonaActiva(zonaActiva === zona.id ? null : zona.id);
    onZonaSeleccionada?.(zona);
  };

  const getCantidadIncidentes = (zonaId: string): number => {
    return incidentesPorZona.get(zonaId)?.length ?? 0;
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
            // Generar coordenadas ficticias basadas en la zona
            const zona = ZONAS.find(z => z.id === incidente.zona || z.nombre === incidente.zona);
            if (!zona) return null;

            const [latBase, longBase] = getCentroPorZona(zona.id);
            const lat = latBase + (Math.random() - 0.5) * 0.003;
            const long = longBase + (Math.random() - 0.5) * 0.003;

            return (
              <Marker
                key={`${incidente.idIncidente}-${idx}`}
                position={[lat, long] as L.LatLngExpression}
              >
                <Popup>
                  <div className="popup-incidente">
                    <h5>{incidente.tipoIncidente}</h5>
                    <p><strong>Zona:</strong> {incidente.zona}</p>
                    <p><strong>Usuario:</strong> {incidente.nombreUsuario}</p>
                    <p><strong>Fecha:</strong> {new Date(incidente.fechaReporte).toLocaleString('es-EC')}</p>
                    <p><strong>Descripción:</strong> {incidente.mensaje}</p>
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
              {(incidentesPorZona.get(zonaActiva) || []).map(inc => (
                <div key={inc.idIncidente} className="incidente-item">
                  <strong>{inc.tipoIncidente}</strong>
                  <small>{inc.nombreUsuario} - {new Date(inc.fechaReporte).toLocaleString('es-EC')}</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
