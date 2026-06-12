import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonIcon,
  IonPage,
  IonToggle,
  IonModal,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonText,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonToast,
} from '@ionic/react';
import { menuOutline, personCircleOutline, closeOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { Geolocation, type Position } from '@capacitor/geolocation';
import './Guardia.css';
import * as signalR from '@microsoft/signalr';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface NotificacionGuardia {
  idIncidente: number;
  tipoIncidente: string;
  nombreReportado?: string;
  rol?: string;
  carrera?: string;
  facultad?: string;
  zona?: string;
  fechaReporte?: string;
  mensaje?: string;
  mapaUrl?: string;
  estado?: string;
  guardiaAsignado?: string;
  latitud?: number;
  longitud?: number;
  observacionesCierre?: string;
  fechaCierre?: string;
}

const tiempoRelativo = (fechaStr?: string): string => {
  if (!fechaStr) return '';
  const diff = Date.now() - new Date(fechaStr).getTime();
  if (isNaN(diff)) return fechaStr;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} hora${hrs > 1 ? 's' : ''}`;
  const dias = Math.floor(hrs / 24);
  return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
};


interface ZonaDB {
  idZona: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  coordenadasPoligono?: string;
}

const INCIDENT_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';
const SIGNALR_URL = import.meta.env.VITE_NOTIFICATION_URL ? `${import.meta.env.VITE_NOTIFICATION_URL}/hubs/incident` : 'http://localhost:5009/hubs/incident';
const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:5007';

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

const incidentIcon = L.divIcon({
  html: '<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); text-shadow: 0 0 2px black;">🚨</div>',
  className: 'custom-incident-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

// Componente para mapa pequeño de detalles
const MobileIncidentMap: React.FC<{ lat: number; lng: number; zonaNombre?: string; zonasDB: ZonaDB[] }> = ({ lat, lng, zonaNombre, zonasDB }) => {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);

  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([lat, lng], 17);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapRef.current);

      // Dibujar zonas estáticas
      CAMPUS_ZONES.forEach(z => {
        L.polygon(z.coordenadas as L.LatLngExpression[], {
          color: z.color,
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.15,
          fillColor: z.color
        }).addTo(mapRef.current!);
      });

      // Dibujar zonas dinámicas desde BD
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
        .bindPopup(`<b>Incidente:</b><br/>${zonaNombre || 'Ubicación exacta'}`)
        .openPopup();
    } else {
      mapRef.current.setView([lat, lng], 17);
    }

    // Bugfix Leaflet: invalidar tamaño tras renderizado en el modal
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
        height: '55vh', 
        maxHeight: '450px',
        minHeight: '280px',
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

// Componente para mapa ampliado a pantalla completa
const MobileIncidentMapFullscreen: React.FC<{ lat: number; lng: number; zonaNombre?: string; zonasDB: ZonaDB[] }> = ({ lat, lng, zonaNombre, zonasDB }) => {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);

  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([lat, lng], 17);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapRef.current);

      // Dibujar zonas estáticas
      CAMPUS_ZONES.forEach(z => {
        L.polygon(z.coordenadas as L.LatLngExpression[], {
          color: z.color,
          weight: 2.5,
          opacity: 0.7,
          fillOpacity: 0.2,
          fillColor: z.color
        }).addTo(mapRef.current!);
      });

      // Dibujar zonas dinámicas desde BD
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
        .bindPopup(`<b>Incidente:</b><br/>${zonaNombre || 'Ubicación exacta'}`)
        .openPopup();
    } else {
      mapRef.current.setView([lat, lng], 17);
    }

    // Bugfix Leaflet: invalidar tamaño tras renderizado en el modal
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
        height: '100%', 
        width: '100%', 
        zIndex: 1
      }} 
    />
  );
};

const mapIncidente = (incidente: any): NotificacionGuardia => {
  const rawIdIncidente = incidente.idIncidente ?? incidente.IdIncidente ?? incidente.id ?? incidente.ID;
  const idIncidente = Number(rawIdIncidente);
  const rol = incidente.rol ?? incidente.Rol;
  const carrera = incidente.carrera ?? incidente.Carrera;
  const facultad = incidente.facultad ?? incidente.Facultad ?? carrera ?? rol;
  const rawZona = incidente.zona ?? incidente.Zona;
  const rawIdZona = incidente.idZona ?? incidente.IdZona;

  return {
    idIncidente: Number.isNaN(idIncidente) ? Date.now() : idIncidente,
    tipoIncidente: incidente.tipoIncidente ?? incidente.TipoIncidente ?? 'Incidente',
    nombreReportado: incidente.nombreReportado ?? incidente.NombreReportado ?? incidente.nombreUsuario ?? incidente.NombreUsuario ?? `Usuario #${incidente.idUsuario ?? incidente.IdUsuario ?? '?'}`,
    rol,
    carrera,
    facultad,
    zona: rawIdZona ? `Zona ${rawIdZona}` : (rawZona ?? '—'),
    fechaReporte: incidente.fechaReporte ?? incidente.FechaReporte ?? new Date().toISOString(),
    mensaje: incidente.mensaje ?? incidente.Mensaje ?? incidente.descripcion ?? incidente.Descripcion,
    mapaUrl: incidente.mapaUrl ?? incidente.MapaUrl,
    estado: incidente.estado ?? incidente.Estado ?? 'Activo',
    guardiaAsignado: incidente.guardiaAsignado ?? incidente.GuardiaAsignado,
    latitud: incidente.latitud ?? incidente.Latitud,
    longitud: incidente.longitud ?? incidente.Longitud,
    observacionesCierre: incidente.observacionesCierre ?? incidente.ObservacionesCierre,
    fechaCierre: incidente.fechaCierre ?? incidente.FechaCierre,
  };
};

const Guardia: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<NotificacionGuardia[]>([]);
  const [conectado, setConectado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<NotificacionGuardia | null>(null);
  const [asignando, setAsignando] = useState(false);
  const [segment, setSegment] = useState<'pendientes' | 'mis-casos' | 'historial' | 'nuevo-reporte'>('pendientes');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [zonaFiltro, setZonaFiltro] = useState<string>('todas');
  const [zonasDB, setZonasDB] = useState<ZonaDB[]>([]);
  const connectionRef = React.useRef<signalR.HubConnection | null>(null);
  
  // Nuevos estados para filtros e interactividad
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [mostrarMapaAmpliado, setMostrarMapaAmpliado] = useState(false);
  const [alertaEntrante, setAlertaEntrante] = useState<NotificacionGuardia | null>(null);

  // Estados para nuevo reporte
  const [turnoActivo, setTurnoActivo] = useState<any>(null);
  const [reporteForm, setReporteForm] = useState({
    titulo: '',
    descripcion: '',
    tipoReporte: 'Seguridad',
    prioridad: 'Media',
    zona: 'Ninguna'
  });
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  // Parseo seguro para evitar que un JSON inválido deje la pantalla en negro
  const getUsuarioSeguro = () => {
    try {
      const raw = localStorage.getItem('usuario');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const usuarioObj = getUsuarioSeguro();
  const [disponible, setDisponible] = useState<boolean>(usuarioObj?.disponible ?? true);
  const [actualizandoDisponibilidad, setActualizandoDisponibilidad] = useState(false);

  useEffect(() => {
    const usuarioRaw = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!token || !usuarioRaw) {
      setError('Usuario no autenticado. Vuelve a iniciar sesión.');
      return;
    }

    let usuario;
    try {
      usuario = JSON.parse(usuarioRaw);
    } catch (e) {
      setError('Error en los datos de sesión. Intenta de nuevo.');
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL, {
        accessTokenFactory: () => token,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true'
        }
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    let cancelado = false;

    const playAlarmBeep = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.frequency.setValueAtTime(660, audioCtx.currentTime); // E5
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc1.type = 'sawtooth';
        osc2.type = 'sine';

        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 1.2);
        osc2.stop(audioCtx.currentTime + 1.2);
      } catch {}
    };

    const manejarAlerta = (data: NotificacionGuardia) => {
      // Si la alerta es activa y es real, sonar la alarma y mostrar banner
      const est = (data.estado ?? 'Activo').toLowerCase();
      if (est === 'activo' && data.idIncidente !== 0) {
        playAlarmBeep();
        setAlertaEntrante(data);
      }

      setNotificaciones((s) => {
        const sinDuplicados = s.filter((item) => item.idIncidente !== data.idIncidente);
        return [data, ...sinDuplicados].slice(0, 150);
      });
    };

    connection.on('RecibirAlertaIncidente', manejarAlerta);

    const cargarIncidentesIniciales = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [resActivos, resAsumidos, resCerrados] = await Promise.all([
          fetch(`${INCIDENT_URL}/api/incidents?estado=Activo`, { headers }),
          fetch(`${INCIDENT_URL}/api/incidents?estado=Asumido`, { headers }),
          fetch(`${INCIDENT_URL}/api/incidents?estado=Cerrado`, { headers }),
        ]);

        if (!resActivos.ok || !resAsumidos.ok || !resCerrados.ok) {
          throw new Error(`Error cargando incidentes`);
        }

        const dataActivos: any[] = await resActivos.json();
        const dataAsumidos: any[] = await resAsumidos.json();
        const dataCerrados: any[] = await resCerrados.json();

        const incidentes = [...dataActivos, ...dataAsumidos, ...dataCerrados]
          .map(mapIncidente);

        if (!cancelado) {
          setNotificaciones((s) => {
            const combinadas = [...incidentes, ...s];
            return combinadas.reduce<NotificacionGuardia[]>((acumuladas, incidente) => {
              const existente = acumuladas.findIndex((item) => item.idIncidente === incidente.idIncidente);

              if (existente >= 0) {
                acumuladas[existente] = { ...acumuladas[existente], ...incidente };
                return acumuladas;
              }

              acumuladas.push(incidente);
              return acumuladas;
            }, []).slice(0, 150);
          });
        }
      } catch (error) {
        console.warn('No se pudieron cargar los incidentes iniciales.', error);
      }
    };
    const cargarTurnoActivo = async () => {
      try {
        const user = getUsuarioSeguro();
        if (user && user.idUsuario) {
          const res = await fetch(`${INCIDENT_URL}/api/turnos/activo?idGuardia=${user.idUsuario}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.idTurno) {
              setTurnoActivo(data);
            } else {
              setTurnoActivo(null);
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar turno activo', error);
      }
    };

    (async () => {
      try {
        await cargarTurnoActivo();
        await connection.start();
        setConectado(true);
        await connection.invoke('UnirseAlGrupo', 'Guardias').catch(() => {});
        if (usuario.grupo) {
          await connection.invoke('UnirseAlGrupo', usuario.grupo).catch(() => {});
        }

        await cargarIncidentesIniciales();
      } catch (e) {
        console.error('Error conectando SignalR móvil', e);
        setError('No se pudo conectar con las notificaciones en tiempo real.');
        setConectado(false);
      }
    })();

    return () => {
      cancelado = true;
      connection.off('RecibirAlertaIncidente', manejarAlerta);
      connection.invoke('SalirDelGrupo', 'Guardias').catch(() => {});
      connection.stop().catch(() => {});
    };
  }, []);

  // Cargar zonas desde la base de datos
  useEffect(() => {
    const cargarZonas = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${INCIDENT_URL}/api/zonas?soloActivas=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: ZonaDB[] = await res.json();
          setZonasDB(data);
        }
      } catch (e) {
        console.warn('No se pudieron cargar las zonas', e);
      }
    };
    cargarZonas();
  }, []);

  // Efecto para enviar la geolocalización del guardia al backend
  useEffect(() => {
    let watchId: string | null = null; // En Capacitor watchId es un string

    const startWatchingLocation = async () => {
      try {
        // Pedir permisos explícitamente en Android/iOS
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted') {
            setError("Permisos de ubicación denegados.");
            return;
          }
        }

        // Inicia el seguimiento de la posición usando Capacitor Geolocation
        watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 30000, // Más tiempo para lugares cerrados
            maximumAge: 10000 // Aceptar ubicaciones de hace 10s
          },
          (position: Position | null, err?: any) => {
            if (err) {
              console.error("Error de geolocalización Capacitor:", err);
              // FALLBACK para pruebas en HTTP (porque Chrome bloquea GPS en HTTP)
              const conn = connectionRef.current;
              const user = getUsuarioSeguro();
              if (conn && conn.state === signalR.HubConnectionState.Connected && user) {
                console.log("Usando GPS simulado (Campus UTA) por fallo de permisos/HTTP");
                conn.invoke('ActualizarUbicacionGuardia', String(user.idUsuario), user.nombre, -1.2688, -78.6248)
                  .catch(e => console.error("Error al enviar ubicación simulada:", e));
              }
              return;
            }
            if (position) {
              const { latitude, longitude } = position.coords;
              const conn = connectionRef.current;
              const user = getUsuarioSeguro();

              if (conn && conn.state === signalR.HubConnectionState.Connected && user) {
                const payload = {
                  UserId: String(user.idUsuario),
                  Nombre: user.nombre,
                  Lat: latitude,
                  Lon: longitude,
                };
                
                conn.invoke('ActualizarUbicacionGuardia', payload.UserId, payload.Nombre, payload.Lat, payload.Lon)
                  .catch(err => console.error("Error al enviar ubicación del guardia:", err));
              }
            }
          }
        );

        // RESPALDO EXTRA: Si después de 3 segundos no ha detectado GPS (ej: emuladores), mandar uno simulado
        setTimeout(() => {
          const conn = connectionRef.current;
          const user = getUsuarioSeguro();
          if (conn && conn.state === signalR.HubConnectionState.Connected && user) {
            console.log("Enviando GPS simulado por timeout...");
            conn.invoke('ActualizarUbicacionGuardia', String(user.idUsuario), user.nombre, -1.2688, -78.6248).catch(() => {});
          }
        }, 3000);

      } catch (err) {
        console.error("Error inicializando GPS:", err);
        setError("Error al encender GPS. Revisa permisos.");
        
        // Fallback catch general
        const conn = connectionRef.current;
        const user = getUsuarioSeguro();
        if (conn && conn.state === signalR.HubConnectionState.Connected && user) {
           conn.invoke('ActualizarUbicacionGuardia', String(user.idUsuario), user.nombre, -1.2688, -78.6248).catch(() => {});
        }
      }
    };

    const stopWatchingLocation = () => {
      if (watchId !== null) {
        Geolocation.clearWatch({ id: watchId });
        watchId = null;
      }
      
      // Avisar al backend que ya no estamos disponibles (para que nos quite del mapa admin)
      const conn = connectionRef.current;
      const user = getUsuarioSeguro();
      if (conn && conn.state === signalR.HubConnectionState.Connected && user) {
        conn.invoke('ActualizarUbicacionGuardia', String(user.idUsuario), user.nombre, 0, 0)
          .catch(err => console.error("Error al enviar desconexión del guardia:", err));
      }
    };

    if (disponible && conectado) {
      startWatchingLocation();
    } else {
      stopWatchingLocation();
    }

    // Limpieza al desmontar el componente o cambiar las dependencias
    return () => {
      stopWatchingLocation();
    };
  }, [disponible, conectado]); // Se activa/desactiva con la disponibilidad y conexión

  const abrirDetalle = (n: NotificacionGuardia) => setSeleccionada(n);

  const cerrarDetalle = () => {
    setSeleccionada(null);
    setObservacionesCierre('');
    setMostrarMapaAmpliado(false);
  };

  const asumirIncidente = async () => {
    if (!seleccionada) return;
    const token = localStorage.getItem('token');
    if (!token || !usuarioObj) {
      setError('Usuario no autenticado');
      return;
    }

    setAsignando(true);
    try {
      const res = await fetch(`${INCIDENT_URL}/api/incidents/${seleccionada.idIncidente}/asignar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ guardiaAsignado: usuarioObj.nombre }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.mensaje || `Error ${res.status}`);
      }

      setNotificaciones((s) => s.map((x) => 
        x.idIncidente === seleccionada.idIncidente 
          ? { ...x, estado: 'Asumido', guardiaAsignado: usuarioObj.nombre } 
          : x
      ));
      cerrarDetalle();
    } catch (error) {
      const e = error as Error;
      console.error('Error asignando incidente', e);
      setError(e?.message || 'Error al asignar incidente');
    } finally {
      setAsignando(false);
    }
  };

  const cerrarIncidente = async () => {
    if (!seleccionada) return;
    if (!observacionesCierre.trim()) {
      setError('Las observaciones son obligatorias.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    setAsignando(true);
    try {
      const res = await fetch(`${INCIDENT_URL}/api/incidents/${seleccionada.idIncidente}/cerrar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ observaciones: observacionesCierre }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.mensaje || `Error ${res.status}`);
      }

      // Evitamos la eliminación local al cerrarlos, en su lugar lo marcamos como Cerrado con sus observaciones
      setNotificaciones((s) => s.map((x) => 
        x.idIncidente === seleccionada.idIncidente 
          ? { ...x, estado: 'Cerrado', observacionesCierre: observacionesCierre, fechaCierre: new Date().toISOString() } 
          : x
      ));
      
      cerrarDetalle();
      setSuccessMsg('Caso cerrado correctamente');
      
      setTimeout(() => {
        setSegment('pendientes');
      }, 300);

    } catch (error) {
      const e = error as Error;
      console.error('Error cerrando incidente', e);
      setError(e?.message || 'Error al cerrar incidente');
    } finally {
      setAsignando(false);
    }
  };

  // Filtrar notificaciones por segmento y zona seleccionada
  const notificacionesFiltradas = notificaciones.filter(n => {
    // Filtro por segmento (pendientes / mis-casos / historial)
    const cumpleSegmento = segment === 'pendientes'
      ? (n.estado ?? 'Activo') === 'Activo'
      : segment === 'mis-casos'
      ? n.estado === 'Asumido' && n.guardiaAsignado === usuarioObj?.nombre
      : n.estado === 'Cerrado';

    // Filtro por zona (desde IonSelect)
    const cumpleZona = zonaFiltro === 'todas'
      || (n.zona ?? '').toLowerCase().includes(zonaFiltro.toLowerCase());

    // Filtro por tipo de incidente
    const cumpleTipo = filtroTipo === 'todos'
      || n.tipoIncidente === filtroTipo;

    return cumpleSegmento && cumpleZona && cumpleTipo;
  });

  const handleToggleDisponibilidad = async (checked: boolean) => {
    const token = localStorage.getItem('token');
    if (!token || !usuarioObj?.idUsuario) return;
    
    setActualizandoDisponibilidad(true);
    
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/usuarios/${usuarioObj.idUsuario}/disponibilidad`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ disponible: checked })
      });

      if (!res.ok) {
        throw new Error('Error al actualizar disponibilidad');
      }

      setDisponible(checked);
      const updatedUsuario = { ...usuarioObj, disponible: checked };
      localStorage.setItem('usuario', JSON.stringify(updatedUsuario));
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar la disponibilidad');
      setDisponible(!checked);
    } finally {
      setActualizandoDisponibilidad(false);
    }
  };

  const enviarReporte = async () => {
    if (!reporteForm.titulo.trim() || !reporteForm.descripcion.trim()) {
      alert("El título y descripción son obligatorios");
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token || !usuarioObj?.nombre) return;

    setEnviandoReporte(true);
    try {
      // Intentar obtener IdZona buscando en zonasDB según el nombre seleccionado
      const zonaObj = zonasDB.find(z => z.nombre === reporteForm.zona);

      const payload = {
        idGuardia: usuarioObj.idUsuario,
        nombreGuardia: usuarioObj.nombre,
        idTurno: turnoActivo ? turnoActivo.idTurno : null,
        titulo: reporteForm.titulo,
        descripcion: reporteForm.descripcion,
        tipoReporte: reporteForm.tipoReporte,
        prioridad: reporteForm.prioridad,
        idZona: zonaObj ? zonaObj.idZona : null,
        zona: reporteForm.zona
      };

      const res = await fetch(`${INCIDENT_URL}/api/reportes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error enviando reporte");

      alert("Reporte enviado exitosamente");
      setReporteForm({
        titulo: '',
        descripcion: '',
        tipoReporte: 'Seguridad',
        prioridad: 'Media',
        zona: 'Ninguna'
      });
      setSegment('pendientes');
    } catch (e) {
      console.error(e);
      alert("No se pudo enviar el reporte");
    } finally {
      setEnviandoReporte(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="guardia-content" fullscreen>
        <div className="guardia-shell">
          <header className="guardia-header">
            <button className="guardia-menu" type="button" aria-label="Abrir menú">
              <IonIcon icon={menuOutline} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <span className="guardia-brand">UTA Alerta</span>
              {usuarioObj?.nombre && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '2px' }}>
                    👮 {usuarioObj.nombre}
                  </span>
                  <div style={{ marginTop: '4px' }}>
                    {turnoActivo ? (
                      <IonBadge color="success" style={{ fontSize: '0.65rem' }}>
                        Turno: {turnoActivo.nombreTurno}
                      </IonBadge>
                    ) : (
                      <IonBadge color="danger" style={{ fontSize: '0.65rem' }}>Fuera de Turno</IonBadge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>

          <section className="guardia-disponibilidad" aria-label="Disponibilidad del guardia">
            <span className="guardia-disponibilidad-texto">Disponibilidad</span>
            <IonToggle 
              checked={disponible} 
              onIonChange={(e) => {
                if (e.detail.checked !== disponible) {
                  handleToggleDisponibilidad(e.detail.checked);
                }
              }}
              disabled={actualizandoDisponibilidad}
              className="guardia-toggle" 
            />
          </section>

          <main className="guardia-main">
            <h1 className="guardia-titulo">Notificaciones</h1>

            <div className="guardia-status-line">
              {conectado ? (
                <IonText color="success">Conectado a notificaciones</IonText>
              ) : error ? (
                <IonText color="danger">{error}</IonText>
              ) : (
                <IonText color="medium">Conectando...</IonText>
              )}
            </div>

            {/* SEGMENTOS Y FILTRO DE ZONAS */}
            <div style={{ padding: '0 16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <IonSegment value={segment} onIonChange={(e) => setSegment(e.detail.value as any)}>
                <IonSegmentButton value="pendientes">
                  <IonLabel>Pendientes</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="mis-casos">
                  <IonLabel>
                    Mis Casos
                    {notificaciones.filter(n => n.estado === 'Asumido' && n.guardiaAsignado === usuarioObj?.nombre).length > 0 && (
                      <IonBadge color="danger" style={{ marginLeft: '6px', fontSize: '0.7rem', verticalAlign: 'middle' }}>
                        {notificaciones.filter(n => n.estado === 'Asumido' && n.guardiaAsignado === usuarioObj?.nombre).length}
                      </IonBadge>
                    )}
                  </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="historial">
                  <IonLabel>Historial</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="nuevo-reporte">
                  <IonLabel>+ Reporte</IonLabel>
                </IonSegmentButton>
              </IonSegment>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {/* SELECTOR DE FILTRO DE ZONAS */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '8px', padding: '4px 12px', border: '1px solid #ddd' }}>
                  <select
                    value={zonaFiltro}
                    onChange={(e) => setZonaFiltro(e.target.value)}
                    style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', color: '#333', padding: '6px 0', fontWeight: '500' }}
                  >
                    <option value="todas">📍 Todas las zonas</option>
                    {zonasDB.map((z) => (
                      <option key={z.idZona} value={z.nombre}>
                        {z.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SELECTOR DE TIPO DE INCIDENTE */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '8px', padding: '4px 12px', border: '1px solid #ddd' }}>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', color: '#333', padding: '6px 0', fontWeight: '500' }}
                  >
                    <option value="todos">🚨 Todos los tipos</option>
                    <option value="Alerta de seguridad">Alerta de seguridad</option>
                    <option value="Emergencia médica">Emergencia médica</option>
                    <option value="Robo o asalto">Robo o asalto</option>
                    <option value="Arma blanca">Arma blanca</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="guardia-lista">
              {segment === 'nuevo-reporte' ? (
                <div className="nuevo-reporte-container" style={{ padding: '20px', background: '#fff', borderRadius: '12px', margin: '0 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <h2 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>Crear Reporte de Novedad</h2>
                  
                  {!turnoActivo ? (
                    <div style={{ padding: '15px', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffcdd2', fontSize: '0.9rem' }}>
                      <strong>⚠️ Acceso Restringido</strong><br/>
                      No puedes emitir reportes de novedad porque actualmente <b>no tienes un turno activo</b> asignado en el sistema.
                    </div>
                  ) : (
                    <div style={{ padding: '10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c8e6c9', fontSize: '0.85rem' }}>
                      Registrando novedad bajo el turno: <strong>{turnoActivo.nombreTurno}</strong>
                    </div>
                  )}

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem', color: '#555' }}>Título del reporte</label>
                    <input 
                      type="text" 
                      value={reporteForm.titulo}
                      onChange={e => setReporteForm({...reporteForm, titulo: e.target.value})}
                      placeholder="Ej. Novedad en puerta principal"
                      disabled={!turnoActivo}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: !turnoActivo ? '#f5f5f5' : '#fff' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem', color: '#555' }}>Tipo de Novedad</label>
                    <select 
                      value={reporteForm.tipoReporte}
                      onChange={e => setReporteForm({...reporteForm, tipoReporte: e.target.value})}
                      disabled={!turnoActivo}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: !turnoActivo ? '#f5f5f5' : '#fff' }}
                    >
                      <option value="Seguridad">Seguridad</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Incidente Médico">Incidente Médico</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem', color: '#555' }}>Prioridad</label>
                    <select 
                      value={reporteForm.prioridad}
                      onChange={e => setReporteForm({...reporteForm, prioridad: e.target.value})}
                      disabled={!turnoActivo}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: !turnoActivo ? '#f5f5f5' : '#fff' }}
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem', color: '#555' }}>Zona Relacionada</label>
                    <select 
                      value={reporteForm.zona}
                      onChange={e => setReporteForm({...reporteForm, zona: e.target.value})}
                      disabled={!turnoActivo}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: !turnoActivo ? '#f5f5f5' : '#fff' }}
                    >
                      <option value="Ninguna">Ninguna / General</option>
                      <option value="Zona 1">Zona 1 (Arqui/Humanidades)</option>
                      <option value="Zona 2">Zona 2 (Administración)</option>
                      <option value="Zona 3">Zona 3 (Salud)</option>
                      <option value="Zona 4">Zona 4 (Ingeniería)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem', color: '#555' }}>Descripción Detallada</label>
                    <IonTextarea 
                      value={reporteForm.descripcion}
                      onIonChange={e => setReporteForm({...reporteForm, descripcion: e.detail.value!})}
                      placeholder="Describe lo sucedido detalladamente..."
                      rows={5}
                      disabled={!turnoActivo}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: !turnoActivo ? '#f5f5f5' : '#fff', '--padding-start': '0' }}
                    />
                  </div>

                  <IonButton 
                    expand="block" 
                    onClick={enviarReporte}
                    disabled={!turnoActivo || enviandoReporte || !reporteForm.titulo.trim() || !reporteForm.descripcion.trim()}
                    style={{ '--background': !turnoActivo ? '#ccc' : '#4f46e5', '--border-radius': '8px', fontWeight: 'bold' }}
                  >
                    {enviandoReporte ? <IonSpinner name="crescent" /> : 'Enviar Reporte a Admin'}
                  </IonButton>
                </div>
              ) : notificacionesFiltradas.length === 0 ? (
                <div className="guardia-empty">
                  <IonText>No hay notificaciones para mostrar.</IonText>
                </div>
              ) : (
                notificacionesFiltradas.map((n) => (
                  <article key={n.idIncidente} className="guardia-card" onClick={() => abrirDetalle(n)}>
                    <div className="guardia-avatar">
                      <IonIcon icon={personCircleOutline} />
                    </div>

                    <div className="guardia-card-contenido">
                      <div className="guardia-card-top">
                        <strong className="guardia-card-titulo">{n.tipoIncidente}</strong>
                        <span className="guardia-card-hora" title={n.fechaReporte}>{tiempoRelativo(n.fechaReporte)}</span>
                      </div>
                      <p className="guardia-card-nombre">{n.nombreReportado}</p>
                      {(n.rol || n.carrera) && (
                        <p className="guardia-card-zona">
                          {n.rol && <span>Rol: {n.rol}</span>}
                          {n.rol && n.carrera ? ' · ' : ''}
                          {n.carrera && <span>Carrera: {n.carrera}</span>}
                        </p>
                      )}
                      <p className="guardia-card-zona">{n.zona}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </main>
        </div>

        {/* DETALLE DEL INCIDENTE MODAL */}
        <IonModal isOpen={!!seleccionada} onDidDismiss={cerrarDetalle}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Notificación</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={cerrarDetalle}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {seleccionada ? (
              <div>
                <h2>{seleccionada.tipoIncidente}</h2>
                <p><strong>Nombre:</strong> {seleccionada.nombreReportado}</p>
                {(seleccionada.rol || seleccionada.carrera) && (
                  <p>
                    <strong>Perfil:</strong>{' '}
                    {seleccionada.rol && <span>Rol: {seleccionada.rol}</span>}
                    {seleccionada.rol && seleccionada.carrera ? ' · ' : ''}
                    {seleccionada.carrera && <span>Carrera: {seleccionada.carrera}</span>}
                  </p>
                )}
                <p><strong>Motivo:</strong> {seleccionada.tipoIncidente}</p>
                <p><strong>Zona:</strong> {seleccionada.zona}</p>
                
                {seleccionada.estado === 'Cerrado' && (
                  <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', margin: '12px 0', borderLeft: '4px solid #7f8c8d' }}>
                    <p style={{ margin: '0 0 6px 0' }}><strong>Estado:</strong> <IonBadge color="medium">Cerrado</IonBadge></p>
                    {seleccionada.fechaCierre && (
                      <p style={{ margin: '0 0 6px 0' }}><strong>Fecha de Cierre:</strong> {new Date(seleccionada.fechaCierre).toLocaleString()}</p>
                    )}
                    {seleccionada.observacionesCierre && (
                      <p style={{ margin: 0 }}><strong>Observaciones de Cierre:</strong> {seleccionada.observacionesCierre}</p>
                    )}
                  </div>
                )}
                
                {/* CABECERA DE MAPA CON BOTÓN DE AMPLIACIÓN */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#555' }}>📍 Mapa de Ubicación:</span>
                  <IonButton 
                    fill="clear" 
                    size="small" 
                    onClick={() => setMostrarMapaAmpliado(true)}
                    style={{ '--padding-start': '0', '--padding-end': '0', margin: 0, fontWeight: 'bold', fontSize: '0.85rem' }}
                  >
                    🖥️ Ampliar Mapa
                  </IonButton>
                </div>

                {(() => {
                  let lat = seleccionada.latitud;
                  let lng = seleccionada.longitud;
                  
                  if (lat == null || lng == null || lat === 0 || lng === 0) {
                    const zStr = String(seleccionada.zona || '').toLowerCase();
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
                    <MobileIncidentMap 
                      lat={lat} 
                      lng={lng} 
                      zonaNombre={seleccionada.zona} 
                      zonasDB={zonasDB}
                    />
                  );
                })()}

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  {seleccionada.estado === 'Activo' && (
                    <>
                      <IonButton color="success" onClick={asumirIncidente} disabled={asignando}>
                        {asignando ? <IonSpinner /> : 'Asumir'}
                      </IonButton>
                      <IonButton color="light" onClick={cerrarDetalle}>Cerrar</IonButton>
                    </>
                  )}
                  {seleccionada.estado === 'Asumido' && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <IonTextarea
                        placeholder="Escribe las observaciones de cierre (Obligatorio)"
                        value={observacionesCierre}
                        onIonChange={e => setObservacionesCierre(e.detail.value!)}
                        autoGrow
                        style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '8px', '--padding-start': '8px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <IonButton color="light" onClick={cerrarDetalle}>Cancelar</IonButton>
                        <IonButton color="danger" onClick={cerrarIncidente} disabled={asignando || !observacionesCierre.trim()}>
                          {asignando ? <IonSpinner /> : 'Cerrar Caso'}
                        </IonButton>
                      </div>
                    </div>
                  )}
                  {seleccionada.estado === 'Cerrado' && (
                    <IonButton color="light" onClick={cerrarDetalle} expand="block">Cerrar</IonButton>
                  )}
                </div>
              </div>
            ) : null}
          </IonContent>
        </IonModal>

        {/* MODAL DE MAPA AMPLIADO A PANTALLA COMPLETA */}
        <IonModal isOpen={mostrarMapaAmpliado} onDidDismiss={() => setMostrarMapaAmpliado(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Mapa de Guardia Ampliado</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setMostrarMapaAmpliado(false)} style={{ fontWeight: 'bold' }}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
            {seleccionada && (() => {
              let lat = seleccionada.latitud;
              let lng = seleccionada.longitud;
              
              if (lat == null || lng == null || lat === 0 || lng === 0) {
                const zStr = String(seleccionada.zona || '').toLowerCase();
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
                <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                  <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000, background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', pointerEvents: 'none', fontWeight: 'bold' }}>
                    🚨 {seleccionada.tipoIncidente} — {seleccionada.zona}
                  </div>
                  <div style={{ height: '100%', width: '100%' }}>
                    <MobileIncidentMapFullscreen 
                      lat={lat} 
                      lng={lng} 
                      zonaNombre={seleccionada.zona} 
                      zonasDB={zonasDB}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </IonModal>

        {/* Toast para Errores */}
        <IonToast
          isOpen={!!error}
          message={error || ''}
          duration={3000}
          onDidDismiss={() => setError(null)}
          color="danger"
          position="top"
        />

        {/* Toast para Éxito */}
        <IonToast
          isOpen={!!successMsg}
          message={successMsg || ''}
          duration={3000}
          onDidDismiss={() => setSuccessMsg(null)}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Guardia;