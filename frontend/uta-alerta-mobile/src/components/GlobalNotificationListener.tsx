import React, { useEffect, useState, useRef } from 'react';
import { IonModal, IonContent, IonButton, IonIcon, useIonToast } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { obtenerGrupos, Grupo, contarSolicitudesPendientes } from '../services/groupService';
import { obtenerDetallesUsuario } from '../services/userService';
import './GlobalNotificationListener.css';

interface AlertaGrupo {
  idIncidente: number;
  idUsuario?: number;
  nombreUsuario: string;
  facultad: string;
  zona: string;
  tipoIncidente: string;
  mensaje: string;
  fechaReporte: string;
  latitud?: number;
  longitud?: number;
  estado?: string;
}

interface ZonaDB {
  idZona: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  coordenadasPoligono?: string;
}

const INCIDENT_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';
const SIGNALR_URL = import.meta.env.VITE_NOTIFICATION_URL ? `${import.meta.env.VITE_NOTIFICATION_URL}/hubs/incident` : 'http://localhost:5009/hubs/incident';

const playSirenSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 2.0;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    
    for (let t = 0.25; t < duration; t += 0.25) {
      osc.frequency.setValueAtTime(t % 0.5 === 0 ? 880 : 660, audioCtx.currentTime + t);
    }

    gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    console.warn('AudioContext playback blocked/failed', err);
  }
};

const GroupIncidentMap: React.FC<{ lat: number; lng: number; zonaNombre?: string; zonasDB: ZonaDB[] }> = ({ lat, lng, zonaNombre, zonasDB }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const incidentIcon = L.divIcon({
      html: '<div style="font-size: 28px; animation: pulse 1.5s infinite; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); text-shadow: 0 0 2px black;">🚨</div>',
      className: 'custom-incident-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([lat, lng], 17);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapRef.current);

      const CAMPUS_ZONES = [
        {
          nombre: 'Zona 1 — Arquitectura / Humanidades',
          color: '#FF4444',
          coordenadas: [
            [-1.266416, -78.625299],
            [-1.266498, -78.624148],
            [-1.268590, -78.624238],
            [-1.268400, -78.625831]
          ]
        },
        {
          nombre: 'Zona 2 — Administración',
          color: '#44FF44',
          coordenadas: [
            [-1.268590, -78.624238],
            [-1.268779, -78.622644],
            [-1.270979, -78.622292],
            [-1.270681, -78.624328]
          ]
        },
        {
          nombre: 'Zona 3 — Ciencias de la Salud',
          color: '#4444FF',
          coordenadas: [
            [-1.266498, -78.624148],
            [-1.266580, -78.622997],
            [-1.268779, -78.622644],
            [-1.268590, -78.624238]
          ]
        },
        {
          nombre: 'Zona 4 — Ingeniería / FCI',
          color: '#FFD700',
          coordenadas: [
            [-1.268400, -78.625831],
            [-1.268590, -78.624238],
            [-1.270681, -78.624328],
            [-1.270384, -78.626364]
          ]
        }
      ];

      CAMPUS_ZONES.forEach(z => {
        L.polygon(z.coordenadas as L.LatLngExpression[], {
          color: z.color,
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.15,
          fillColor: z.color
        }).addTo(mapRef.current!);
      });

      zonasDB.forEach(z => {
        if (!z.coordenadasPoligono) return;
        try {
          const coords = JSON.parse(z.coordenadasPoligono);
          if (Array.isArray(coords) && coords.length >= 3) {
            L.polygon(coords as L.LatLngExpression[], {
              color: '#9b59b6',
              weight: 2,
              opacity: 0.7,
              fillOpacity: 0.15,
              fillColor: '#9b59b6'
            }).addTo(mapRef.current!);
          }
        } catch {}
      });

      L.marker([lat, lng], { icon: incidentIcon })
        .addTo(mapRef.current)
        .bindPopup(`<b>Alerta de tu Grupo:</b><br/>${zonaNombre || 'Ubicación'}`)
        .openPopup();
    } else {
      mapRef.current.setView([lat, lng], 17);
    }

    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 320);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, zonaNombre, zonasDB]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        height: '220px', 
        width: '100%', 
        borderRadius: '12px', 
        marginTop: '12px', 
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
        border: '1px solid #ccc',
        zIndex: 1
      }} 
    />
  );
};

export const GlobalNotificationListener: React.FC = () => {
  const [usuario, setUsuario] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [alerta, setAlerta] = useState<AlertaGrupo | null>(null);
  const [zonasDB, setZonasDB] = useState<ZonaDB[]>([]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [presentToast] = useIonToast();
  const history = useHistory();

  useEffect(() => {
    const checkUser = () => {
      const raw = localStorage.getItem('usuario');
      if (!raw) {
        if (usuario !== null) {
          setUsuario(null);
        }
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (!usuario || usuario.idUsuario !== parsed.idUsuario || usuario.token !== parsed.token) {
          setUsuario(parsed);
        }
      } catch {
        setUsuario(null);
      }
    };

    checkUser();
    const interval = setInterval(checkUser, 1500);
    return () => clearInterval(interval);
  }, [usuario]);

  useEffect(() => {
    if (!usuario?.token) return;
    const cargarZonas = async () => {
      try {
        const res = await fetch(`${INCIDENT_URL}/api/zonas?soloActivas=true`, {
          headers: { Authorization: `Bearer ${usuario.token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setZonasDB(data);
        }
      } catch (e) {
        console.warn('No se pudieron cargar las zonas en listener global', e);
      }
    };
    cargarZonas();
  }, [usuario]);

  useEffect(() => {
    if (!usuario?.token || usuario.rol === 'Guardia') {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      }
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL, {
        accessTokenFactory: () => usuario.token,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true'
        }
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    const manejarAlerta = async (data: AlertaGrupo) => {
      const est = (data.estado ?? 'Activo').toLowerCase();
      if (est === 'activo' && data.idIncidente !== 0 && data.idUsuario !== usuario.idUsuario) {
        let nombreReal = data.nombreUsuario;
        let facultadReal = data.facultad;
        if (data.idUsuario) {
          try {
            const info = await obtenerDetallesUsuario(data.idUsuario);
            nombreReal = info.nombre;
            facultadReal = info.facultad;
          } catch (e) {
            console.warn(e);
          }
        }
        playSirenSound();
        setAlerta({
          ...data,
          nombreUsuario: nombreReal,
          facultad: facultadReal
        });
        setIsOpen(true);
      }
    };

    const manejarSolicitud = (data: any) => {
      presentToast({
        message: data.mensaje || `Has recibido una invitación para el grupo ${data.nombreGrupo}`,
        duration: 5000,
        position: 'top',
        color: 'primary',
        buttons: [
          {
            text: 'Ver',
            handler: () => {
              history.push('/solicitudes');
            }
          }
        ]
      });
    };

    connection.on('RecibirAlertaIncidente', manejarAlerta);
    connection.on('RecibirSolicitudGrupo', manejarSolicitud);

    const conectarYUnirse = async () => {
      try {
        await connection.start();
        console.log('GlobalNotificationListener: Conectado a SignalR');
        
        const todosGrupos = await obtenerGrupos(usuario.token);
        const misGrupos = todosGrupos.filter(g => 
          g.miembros?.some(m => m.idUsuario === usuario.idUsuario)
        );

        const miembrosDeMisGrupos = new Set<number>();
        for (const grupo of misGrupos) {
          const nombreGrupo = `grupo-confianza-${grupo.idGrupo}`;
          await connection.invoke('UnirseAlGrupo', nombreGrupo).catch(e => 
            console.error(`Error al unirse al grupo ${nombreGrupo}:`, e)
          );
          console.log(`GlobalNotificationListener: Unido a ${nombreGrupo}`);

          if (grupo.miembros) {
            for (const m of grupo.miembros) {
              if (m.idUsuario !== usuario.idUsuario) {
                miembrosDeMisGrupos.add(m.idUsuario);
              }
            }
          }
        }

        // Unirse al grupo personal para recibir notificaciones directas (ej: solicitudes)
        const grupoPersonal = `usuario-${usuario.idUsuario}`;
        await connection.invoke('UnirseAlGrupo', grupoPersonal).catch(e => 
            console.error(`Error al unirse al grupo personal ${grupoPersonal}:`, e)
        );
        console.log(`GlobalNotificationListener: Unido a ${grupoPersonal}`);

        // Verificar si hay solicitudes pendientes al iniciar sesión
        const pendientes = await contarSolicitudesPendientes(usuario.idUsuario, usuario.token);
        if (pendientes > 0) {
          presentToast({
            message: `Tienes ${pendientes} solicitud(es) de grupo pendiente(s).`,
            duration: 4000,
            position: 'top',
            color: 'warning',
            buttons: [
              {
                text: 'Ver',
                handler: () => history.push('/solicitudes')
              }
            ]
          });
        }

        // Verificar si hay incidentes activos de miembros de mis grupos
        if (miembrosDeMisGrupos.size > 0) {
          try {
            const resInc = await fetch(`${INCIDENT_URL}/api/incidents?estado=Activo`, {
              headers: { Authorization: `Bearer ${usuario.token}` },
            });
            if (resInc.ok) {
              const todosIncidentes: any[] = await resInc.json();
              // Buscar incidentes de miembros de mis grupos
              const incidenteActivoGrupo = todosIncidentes.find(i => miembrosDeMisGrupos.has(i.idUsuario));
              if (incidenteActivoGrupo) {
                // Obtener detalles del usuario para mostrar su nombre real
                let nombreReal = incidenteActivoGrupo.nombreUsuario ?? `Usuario #${incidenteActivoGrupo.idUsuario}`;
                let facultadReal = incidenteActivoGrupo.facultad ?? '';
                try {
                  const info = await obtenerDetallesUsuario(incidenteActivoGrupo.idUsuario);
                  nombreReal = info.nombre;
                  facultadReal = info.facultad;
                } catch {}

                const alertaCargada: AlertaGrupo = {
                  idIncidente: incidenteActivoGrupo.idIncidente,
                  idUsuario: incidenteActivoGrupo.idUsuario,
                  nombreUsuario: nombreReal,
                  facultad: facultadReal,
                  zona: incidenteActivoGrupo.zona ?? `Zona ${incidenteActivoGrupo.idZona}`,
                  tipoIncidente: incidenteActivoGrupo.tipoIncidente,
                  mensaje: incidenteActivoGrupo.descripcion || incidenteActivoGrupo.mensaje || '',
                  fechaReporte: incidenteActivoGrupo.fechaReporte,
                  latitud: incidenteActivoGrupo.latitud,
                  longitud: incidenteActivoGrupo.longitud,
                  estado: incidenteActivoGrupo.estado
                };

                // Mostrar la alerta
                playSirenSound();
                setAlerta(alertaCargada);
                setIsOpen(true);
              }
            }
          } catch (e) {
            console.warn('Error al cargar incidentes activos de grupo:', e);
          }
        }

      } catch (err) {
        console.error('Error al iniciar SignalR en Listener Global:', err);
      }
    };

    conectarYUnirse();

    return () => {
      connection.off('RecibirAlertaIncidente', manejarAlerta);
      connection.off('RecibirSolicitudGrupo', manejarSolicitud);
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [usuario]);

  const cerrarModal = () => {
    setIsOpen(false);
    setAlerta(null);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={cerrarModal} className="group-alert-modal">
      <IonContent>
        {alerta && (
          <div className="group-alert-container">
            <div className="group-alert-header-section">
              <div className="group-alert-icon-wrapper">
                <IonIcon icon={alertCircleOutline} className="group-alert-icon" />
              </div>
              <h1 className="group-alert-title">¡ALERTA DE GRUPO!</h1>
              <p className="group-alert-subtitle">Un miembro de tu grupo de confianza necesita ayuda</p>
            </div>

            <div className="group-alert-card">
              <div className="group-alert-item">
                <span className="group-alert-label">Persona</span>
                <span className="group-alert-value">{alerta.nombreUsuario}</span>
              </div>
              <div className="group-alert-item">
                <span className="group-alert-label">Carrera / Facultad</span>
                <span className="group-alert-value">{alerta.facultad || 'No especificada'}</span>
              </div>
              <div className="group-alert-item">
                <span className="group-alert-label">Ubicación / Zona</span>
                <span className="group-alert-value">{alerta.zona || 'Desconocida'}</span>
              </div>
              <div className="group-alert-item">
                <span className="group-alert-label">Motivo de Emergencia</span>
                <span className="group-alert-value" style={{ fontWeight: 'bold', color: '#c0392b' }}>
                  {alerta.tipoIncidente}
                </span>
              </div>
              {alerta.mensaje && (
                <div className="group-alert-item">
                  <span className="group-alert-label">Mensaje adicional</span>
                  <div className="group-alert-message-box">"{alerta.mensaje}"</div>
                </div>
              )}
            </div>

            {(() => {
              let lat = alerta.latitud;
              let lng = alerta.longitud;

              if (lat == null || lng == null || lat === 0 || lng === 0) {
                const zStr = String(alerta.zona || '').toLowerCase();
                if (zStr.includes('1')) {
                  lat = -1.267476;
                  lng = -78.624879;
                } else if (zStr.includes('2')) {
                  lat = -1.269757;
                  lng = -78.623375;
                } else if (zStr.includes('3')) {
                  lat = -1.267611;
                  lng = -78.623506;
                } else if (zStr.includes('4')) {
                  lat = -1.269513;
                  lng = -78.625190;
                } else {
                  lat = -1.2688;
                  lng = -78.6248;
                }
              }

              return (
                <div style={{ width: '100%' }}>
                  <span className="group-alert-label" style={{ marginBottom: '6px' }}>📍 Ubicación en Mapa</span>
                  <GroupIncidentMap lat={lat} lng={lng} zonaNombre={alerta.zona} zonasDB={zonasDB} />
                </div>
              );
            })()}

            <IonButton expand="block" className="group-alert-button" onClick={cerrarModal}>
              Entendido / Cerrar
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};
export default GlobalNotificationListener;
