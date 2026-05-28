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
}

const INCIDENT_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';
const SIGNALR_URL = import.meta.env.VITE_NOTIFICATION_URL ? `${import.meta.env.VITE_NOTIFICATION_URL}/hubs/incident` : 'http://localhost:5009/hubs/incident';
const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:5007';

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
                {seleccionada.mapaUrl ? (
                  <img src={seleccionada.mapaUrl} alt="Mapa" className="guardia-mapa" />
                ) : (
                  <div className="guardia-mapa placeholder">Mapa no disponible</div>
                )}

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