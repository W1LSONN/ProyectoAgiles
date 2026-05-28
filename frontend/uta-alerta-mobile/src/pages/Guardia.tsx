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
} from '@ionic/react';
import { menuOutline, personCircleOutline } from 'ionicons/icons';
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

const MobileIncidentMap: React.FC<{ lat: number; lng: number; zonaNombre?: string }> = ({ lat, lng, zonaNombre }) => {
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

      CAMPUS_ZONES.forEach(z => {
        L.polygon(z.coordenadas as L.LatLngExpression[], {
          color: z.color,
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.15,
          fillColor: z.color
        }).addTo(mapRef.current!);
      });

      L.marker([lat, lng], { icon: incidentIcon })
        .addTo(mapRef.current)
        .bindPopup(`<b>Incidente:</b><br/>${zonaNombre || 'Ubicación exacta'}`)
        .openPopup();
    } else {
      mapRef.current.setView([lat, lng], 17);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, zonaNombre]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        height: '240px', 
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
  };
};

const Guardia: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<NotificacionGuardia[]>([]);
  const [conectado, setConectado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<NotificacionGuardia | null>(null);
  const [asignando, setAsignando] = useState(false);
  const [segment, setSegment] = useState<'pendientes' | 'mis-casos'>('pendientes');
  const [observacionesCierre, setObservacionesCierre] = useState('');

  const usuarioRaw = localStorage.getItem('usuario');
  const usuarioObj = usuarioRaw ? JSON.parse(usuarioRaw) : null;
  const [disponible, setDisponible] = useState<boolean>(usuarioObj?.disponible ?? true);
  const [actualizandoDisponibilidad, setActualizandoDisponibilidad] = useState(false);

  useEffect(() => {
    const usuarioRaw = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!token || !usuarioRaw) {
      setError('Usuario no autenticado. Vuelve a iniciar sesión.');
      return;
    }

    const usuario = JSON.parse(usuarioRaw);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    let cancelado = false;

    const manejarAlerta = (data: NotificacionGuardia) => {
      setNotificaciones((s) => {
        const sinDuplicados = s.filter((item) => item.idIncidente !== data.idIncidente);
        return [data, ...sinDuplicados].slice(0, 50);
      });
    };

    connection.on('RecibirAlertaIncidente', manejarAlerta);

    const cargarIncidentesIniciales = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [resActivos, resAsumidos] = await Promise.all([
          fetch(`${INCIDENT_URL}/api/incidents?estado=Activo`, { headers }),
          fetch(`${INCIDENT_URL}/api/incidents?estado=Asumido`, { headers }),
        ]);

        if (!resActivos.ok || !resAsumidos.ok) {
          throw new Error(`Error cargando incidentes`);
        }

        const dataActivos: any[] = await resActivos.json();
        const dataAsumidos: any[] = await resAsumidos.json();

        const incidentes = [...dataActivos, ...dataAsumidos]
          .map(mapIncidente)
          .filter((incidente) => {
             const est = (incidente.estado ?? '').toLowerCase();
             return est === 'activo' || est === 'asumido';
          });

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
            }, []).slice(0, 100);
          });
        }
      } catch (error) {
        console.warn('No se pudieron cargar los incidentes iniciales.', error);
      }
    };

    (async () => {
      try {
        await connection.start();
        setConectado(true);
        // Unirse a grupos: Guardias y grupo específico si existe
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

  const abrirDetalle = (n: NotificacionGuardia) => setSeleccionada(n);

  const cerrarDetalle = () => {
    setSeleccionada(null);
    setObservacionesCierre('');
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

      setNotificaciones((s) => s.filter((x) => x.idIncidente !== seleccionada.idIncidente));
      cerrarDetalle();
    } catch (error) {
      const e = error as Error;
      console.error('Error cerrando incidente', e);
      setError(e?.message || 'Error al cerrar incidente');
    } finally {
      setAsignando(false);
    }
  };

  const notificacionesFiltradas = notificaciones.filter(n => {
    if (segment === 'pendientes') {
      return (n.estado ?? 'Activo') === 'Activo';
    } else {
      return n.estado === 'Asumido' && n.guardiaAsignado === usuarioObj?.nombre;
    }
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
      // Revertir el toggle
      setDisponible(!checked);
    } finally {
      setActualizandoDisponibilidad(false);
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
            <span className="guardia-brand">UTA Alerta</span>
          </header>

          <section className="guardia-disponibilidad" aria-label="Disponibilidad del guardia">
            <span className="guardia-disponibilidad-texto">Disponibilidad</span>
            <IonToggle 
              checked={disponible} 
              onIonChange={(e) => {
                // Solo disparamos si es un evento del usuario y diferente al estado actual
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

            <div style={{ padding: '0 16px', marginBottom: '16px' }}>
              <IonSegment value={segment} onIonChange={(e) => setSegment(e.detail.value as any)}>
                <IonSegmentButton value="pendientes">
                  <IonLabel>Pendientes</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="mis-casos">
                  <IonLabel>Mis Casos</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </div>

            <div className="guardia-lista">
              {notificacionesFiltradas.length === 0 ? (
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
                        <span className="guardia-card-hora">{n.fechaReporte ?? ''}</span>
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

        <IonModal isOpen={!!seleccionada} onDidDismiss={cerrarDetalle}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Notificación</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={cerrarDetalle}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <div className="modal-body">
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
                {(() => {
                  let lat = seleccionada.latitud;
                  let lng = seleccionada.longitud;
                  
                  // Si no hay coordenadas exactas de GPS, usar el centro de la zona respectiva
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
                      lng = -78.6248; // Centro de la UTA
                    }
                  }
                  
                  return (
                    <MobileIncidentMap 
                      lat={lat} 
                      lng={lng} 
                      zonaNombre={seleccionada.zona} 
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
                </div>
              </div>
            ) : null}
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Guardia;