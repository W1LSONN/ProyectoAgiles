import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import * as signalR from '@microsoft/signalr';
import { ZONAS, getCentroPorZona, type Zona } from '../services/zonasService';
import type { AlertaIncidente } from '../services/signalrService';
import { type Camera, getCameras } from '../services/camerasService';
import './MapComponent.css';

const INCIDENT_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';

// URL del Hub de SignalR (debe coincidir con el backend)
const SIGNALR_URL = import.meta.env.VITE_NOTIFICATION_URL
  ? `${import.meta.env.VITE_NOTIFICATION_URL}/hubs/incident`
  : (import.meta.env.VITE_NOTIFICATIONS_URL
      ? `${import.meta.env.VITE_NOTIFICATIONS_URL}/hubs/incident`
      : 'http://localhost:5009/hubs/incident');

// Icono rojo personalizado para incidentes
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  className: 'pulsating-incident',
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Icono personalizado para guardias
const guardIcon = L.divIcon({
  html: '<div style="font-size: 20px; background: #2980b9; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">🛡️</div>',
  className: 'guard-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Tipos para la ubicación de los guardias
interface GuardiaLocation {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
}

interface MapComponentProps {
  incidentes: AlertaIncidente[];
  onZonaSeleccionada?: (zona: Zona) => void;
  focoIncidente?: AlertaIncidente | null;
}

// Componente para la capa de guardias con clustering
const GuardiasLayer = ({ guardias }: { guardias: Record<string, GuardiaLocation> }) => {
  const map = useMap();
  // Se usa L.MarkerClusterGroup para el ref, ya que la librería expose este tipo correcto.
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    // La librería leaflet.markercluster extiende el objeto `L` globalmente en lugar de exportar
    // el módulo, por lo que el tipo MarkerClusterGroup se encuentra disponible.
    clusterRef.current = L.markerClusterGroup({
      // Opciones de personalización del cluster
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="background:rgba(41,128,185,0.95);color:#fff;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-weight:700;box-shadow:0 2px 8px rgba(41,128,185,0.5);border:2px solid #fff;font-size:0.95rem;">🛡️${count}</div>`,
          className: '',
          iconSize: new L.Point(42, 42)
        });
      }
    });
    map.addLayer(clusterRef.current);

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [map]);

  useEffect(() => {
    if (!clusterRef.current) return;

    clusterRef.current.clearLayers();
    const markers: L.Marker[] = [];
    Object.values(guardias).forEach(guardia => {
      const marker = L.marker([guardia.lat, guardia.lon], { icon: guardIcon })
        .bindPopup(`<b>Guardia:</b> ${guardia.nombre || guardia.id}`);
      markers.push(marker);
    });
    clusterRef.current.addLayers(markers);
  }, [guardias]);

  return null;
  return null;
};

// Componente para la capa de incidentes con clustering
const IncidentesLayer = ({ incidentes, encontrarZona }: { incidentes: AlertaIncidente[]; encontrarZona: (inc: any) => Zona | undefined }) => {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    clusterRef.current = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="background:rgba(231,76,60,0.85);color:#fff;border-radius:50%;width:${count < 10 ? 36 : 44}px;height:${count < 10 ? 36 : 44}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;box-shadow:0 2px 8px rgba(231,76,60,0.5);border:2px solid #fff;"><span>${count}</span></div>`,
          className: '',
          iconSize: new L.Point(44, 44),
        });
      },
    });
    map.addLayer(clusterRef.current);
    return () => { if (clusterRef.current) map.removeLayer(clusterRef.current); };
  }, [map]);

  useEffect(() => {
    if (!clusterRef.current) return;
    clusterRef.current.clearLayers();
    const markers: L.Marker[] = [];
    incidentes.forEach((incidente, idx) => {
      const zona = encontrarZona(incidente);
      if (!zona) return;
      const [latBase, longBase] = getCentroPorZona(zona.id);
      let idNum = idx;
      const incId = incidente.idIncidente as any;
      if (typeof incId === 'number' && incId !== 0) idNum = incId;
      else if (typeof incId === 'string') idNum = incId.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
      idNum = idNum + (idx * 37);
      const lat = (incidente.latitud != null && incidente.latitud !== 0) ? incidente.latitud : (latBase + ((idNum * 13) % 100 - 50) * 0.000004);
      const long = (incidente.longitud != null && incidente.longitud !== 0) ? incidente.longitud : (longBase + ((idNum * 17) % 100 - 50) * 0.000004);
      const marker = L.marker([lat, long], { icon: redIcon })
        .bindPopup(`<div class="popup-incidente"><h5>${incidente.tipoIncidente}</h5><p><strong>Zona:</strong> ${zona.nombre}</p><p><strong>Usuario:</strong> ${incidente.nombreUsuario || `#${(incidente as any).idUsuario}`}</p><p><strong>Fecha:</strong> ${new Date(incidente.fechaReporte).toLocaleString('es-EC')}</p></div>`);
      markers.push(marker);
    });
    clusterRef.current.addLayers(markers);
  }, [incidentes, encontrarZona]);

  return null;
};

const MapFlyTo = ({ focoIncidente, encontrarZona }: { focoIncidente?: AlertaIncidente | null, encontrarZona: (inc: any) => Zona | undefined }) => {
  const map = useMap();
  useEffect(() => {
    if (focoIncidente) {
      let lat = focoIncidente.latitud;
      let lng = focoIncidente.longitud;
      
      if (!lat || !lng || lat === 0 || lng === 0) {
        const zona = encontrarZona(focoIncidente);
        if (zona) {
          const [latBase, longBase] = getCentroPorZona(zona.id);
          lat = latBase;
          lng = longBase;
        }
      }
      
      if (lat && lng) {
        map.flyTo([lat, lng], 19, { animate: true, duration: 1.5 });
      }
    }
  }, [focoIncidente, map, encontrarZona]);
  return null;
};

const MapComponent = ({ incidentes, onZonaSeleccionada, focoIncidente }: MapComponentProps) => {
  const [zonaActiva, setZonaActiva] = useState<string | null>(null);
  
  // Estado para zonas dinámicas desde BD
  const [zonasDB, setZonasDB] = useState<{ id: number; nombre: string; coordenadasPoligono?: string }[]>([]);

  // Estado para T-11: Cámaras
  const [camaras, setCamaras] = useState<Camera[]>([]);
  const [mostrarCamaras, setMostrarCamaras] = useState(true);
  
  // Filtros unificados
  const [filtroZona, setFiltroZona] = useState<number | 'todas'>('todas');
  const [filtroTipoIncidente, setFiltroTipoIncidente] = useState<string>('todos');

  // Estado para T-10: Ubicación de guardias
  const [guardias, setGuardias] = useState<Record<string, GuardiaLocation>>({});
  const [mostrarGuardias, setMostrarGuardias] = useState(true);

  // Cargar zonas desde la BD
  useEffect(() => {
    fetch(`${INCIDENT_URL}/api/zonas?soloActivas=true`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setZonasDB(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);


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



  // Conexión a SignalR para ubicación de guardias
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true'
        }
      })
      .withAutomaticReconnect()
      .build();

    // El backend enviará un objeto con esta forma: { userId: string, nombre: string, lat: number, lon: number }
    // El nombre del método 'RecibirActualizacionUbicacion' debe coincidir con el que se defina en el backend (T-8).
    // El backend puede enviar propiedades en PascalCase (Lat, Lon) o camelCase (lat, lon). Se manejan ambos casos.
    connection.on('RecibirActualizacionUbicacion', (data: any) => {
      const userId = data.userId || data.UserId;
      const nombre = data.nombre || data.Nombre;
      const lat = data.lat ?? data.Lat ?? data.latitud ?? data.Latitud;
      const lon = data.lon ?? data.Lon ?? data.longitud ?? data.Longitud;

      // Validar que los datos recibidos son correctos (admitiendo tanto strings como números para userId)
      if (data && userId != null && typeof lat === 'number' && typeof lon === 'number') {
        const userIdStr = String(userId);
        if (lat === 0 && lon === 0) {
          // El guardia se desconectó o ya no está disponible
          console.log(`[MapComponent] Guardia ${userIdStr} desconectado`);
          setGuardias(prev => {
            const next = { ...prev };
            delete next[userIdStr];
            return next;
          });
        } else {
          console.log(`[MapComponent] GPS recibido de Guardia ${userIdStr}:`, lat, lon);
          setGuardias(prev => ({
            ...prev,
            [userIdStr]: {
              id: userIdStr,
              nombre: nombre || `Guardia ${userIdStr}`,
              lat: lat,
              lon: lon,
            },
          }));
        }
      } else {
        console.warn('[MapComponent] Payload GPS inválido:', data);
      }
    });

    const startConnection = async () => {
      try {
        await connection.start();
        console.log('SignalR conectado para ubicaciones de guardias.');
        // El panel de admin se une al grupo "Admins" para recibir notificaciones
        await connection.invoke('UnirseAlGrupo', 'Admins');
      } catch (err) {
        console.error('Error al conectar con SignalR para ubicaciones:', err);
        // Reintentar conexión tras 5 segundos
        setTimeout(startConnection, 5000);
      }
    };

    startConnection();

    return () => {
      connection.stop();
    };
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
    onZonaSeleccionada?.(zona);
  };

  return (
    <div className="map-component">
      {/* Control flotante para la capa de cámaras y guardias */}
      <div className="layer-controls" style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, background: 'white', padding: '12px 16px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
        
        {/* Filtros Generales */}
        <div>
          <label style={{ display: 'block', margin: '0 0 4px 0', fontWeight: 'bold', color: '#333', fontSize: '0.85rem' }}>Filtro de Zona</label>
          <select
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value === 'todas' ? 'todas' : parseInt(e.target.value))}
            style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem', outline: 'none' }}
          >
            <option value="todas">Todas las zonas</option>
            {ZONAS.map((zona, index) => (
              <option key={zona.id} value={index + 1}>
                {zona.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', margin: '0 0 4px 0', fontWeight: 'bold', color: '#333', fontSize: '0.85rem' }}>Tipo de Incidente</label>
          <select
            value={filtroTipoIncidente}
            onChange={(e) => setFiltroTipoIncidente(e.target.value)}
            style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem', outline: 'none' }}
          >
            <option value="todos">Todos los motivos</option>
            <option value="Alerta de seguridad">Alerta de seguridad</option>
            <option value="Emergencia médica">Emergencia médica</option>
            <option value="Robo o asalto">Robo o asalto</option>
            <option value="Arma blanca">Arma blanca</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #eee' }} />

        {/* Capas adicionales */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 'bold', color: '#333', fontSize: '0.85rem' }}>
          <input 
            type="checkbox" 
            checked={mostrarCamaras} 
            onChange={(e) => setMostrarCamaras(e.target.checked)} 
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          📹 Capa de cámaras
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 'bold', color: '#333', fontSize: '0.85rem' }}>
          <input
            type="checkbox"
            checked={mostrarGuardias}
            onChange={(e) => setMostrarGuardias(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          🛡️ Mostrar Guardias ({Object.keys(guardias).length})
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
          <MapFlyTo focoIncidente={focoIncidente} encontrarZona={encontrarZona} />

          {/* Capa de guardias con clustering */}
          {mostrarGuardias && <GuardiasLayer guardias={guardias} />}

          {/* Capa de incidentes con clustering automático */}
          <IncidentesLayer
            incidentes={incidentes.filter(i => {
              const estadoStr = (i.estado || (i as any).Estado || '').toLowerCase();
              if (estadoStr === 'cerrado' || estadoStr === 'resuelto' || estadoStr === 'falsa alarma') return false;
              if (filtroZona !== 'todas') {
                const zonaIdTarget = `zona ${filtroZona}`;
                const zonaAsignada = encontrarZona(i);
                if (!zonaAsignada || zonaAsignada.id !== zonaIdTarget) return false;
              }
              if (filtroTipoIncidente !== 'todos') {
                const tipoIncidente = i.tipoIncidente || (i as any).TipoIncidente || '';
                if (tipoIncidente !== filtroTipoIncidente) return false;
              }
              return true;
            })}
            encontrarZona={encontrarZona}
          />


          {/* Polígonos de las zonas fijas (hardcoded) */}
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
              eventHandlers={{ click: () => handleZonaClick(zona) }}
            >
              <Popup><div className="popup-zona"><h4>{zona.nombre}</h4></div></Popup>
            </Polygon>
          ))}

          {/* Polígonos de zonas dinámicas desde BD */}
          {zonasDB.filter(z => z.coordenadasPoligono).map(z => {
            let coords: [number, number][] = [];
            try { coords = JSON.parse(z.coordenadasPoligono!); } catch { return null; }
            if (coords.length < 3) return null;
            return (
              <Polygon
                key={`db-${z.id}`}
                positions={coords as L.LatLngExpression[]}
                pathOptions={{ color: '#9b59b6', weight: 2, opacity: 0.7, fillOpacity: 0.15, dashArray: '8, 4' }}
              >
                <Popup><div className="popup-zona"><h4>🟣 {z.nombre}</h4><small>Zona personalizada</small></div></Popup>
              </Polygon>
            );
          })}



          {/* Marcadores de cámaras (CCTV) */}

          {mostrarCamaras && Array.isArray(camaras) && (() => {
            // Diccionario para contar cuántas cámaras están en las mismas coordenadas
            const coordCount: Record<string, number> = {};
            
            const camarasFiltradas = camaras.filter(camara => 
              filtroZona === 'todas' || camara.idZona === filtroZona
            );

            return camarasFiltradas.map((camara) => {
              if (camara.latitud == null || camara.longitud == null) return null;

              
              const coordKey = `${camara.latitud},${camara.longitud}`;
              const count = coordCount[coordKey] || 0;
              coordCount[coordKey] = count + 1;

              // Desplazamiento en diagonal (aprox 4 metros) por cada cámara superpuesta
              const latOffset = count * 0.00004;
              const lngOffset = count * 0.00004;

              const esInactiva = camara.estado === 'inactiva';
              const cameraIcon = L.divIcon({
                html: `<div style="font-size: 20px; background: ${esInactiva ? '#e74c3c' : '#2c3e50'}; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.5); border: 2px solid ${esInactiva ? '#f1948a' : '#3498db'};">${esInactiva ? '❌' : '📹'}</div>`,
                className: 'cctv-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16],
                popupAnchor: [0, -16],
              });

              return (
            <Marker
              key={`camara-${camara.idCamara || Math.random()}`}
              position={[camara.latitud + latOffset, camara.longitud + lngOffset] as L.LatLngExpression}
              icon={cameraIcon}
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