import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonMenuButton, IonButton, IonSpinner, IonBadge,
  IonIcon, IonRefresher, IonRefresherContent,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { checkmarkCircleOutline, closeCircleOutline, peopleOutline } from 'ionicons/icons';
import {
  obtenerSolicitudesPendientes,
  responderSolicitud,
  type SolicitudGrupo,
} from '../services/groupService';
import { obtenerDetallesUsuario } from '../services/userService';
import './Solicitudes.css';

interface UsuarioData {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: string;
  token: string;
}

const tiempoRelativo = (fechaStr: string): string => {
  const diff = Date.now() - new Date(fechaStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
};

const Solicitudes: React.FC = () => {
  const history = useHistory();
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudGrupo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [detallesUsuarios, setDetallesUsuarios] = useState<Record<number, { nombre: string; facultad: string }>>({});

  useEffect(() => {
    const raw = localStorage.getItem('usuario');
    if (!raw) { history.replace('/login'); return; }
    try { setUsuario(JSON.parse(raw)); } catch { history.replace('/login'); }
  }, [history]);

  useEffect(() => {
    if (solicitudes.length > 0) {
      const cargarDetalles = async () => {
        const nuevosDetalles = { ...detallesUsuarios };
        let huboCambios = false;
        for (const s of solicitudes) {
          if (!nuevosDetalles[s.idUsuarioSolicitante]) {
            try {
              const info = await obtenerDetallesUsuario(s.idUsuarioSolicitante);
              nuevosDetalles[s.idUsuarioSolicitante] = info;
              huboCambios = true;
            } catch { /* silencioso */ }
          }
        }
        if (huboCambios) {
          setDetallesUsuarios(nuevosDetalles);
        }
      };
      cargarDetalles();
    }
  }, [solicitudes]);

  const cargar = useCallback(async () => {
    if (!usuario) return;
    setCargando(true); setError(null);
    try {
      const data = await obtenerSolicitudesPendientes(usuario.idUsuario, usuario.token);
      setSolicitudes(data);
    } catch (e) {
      setError('No se pudieron cargar las solicitudes.');
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => { cargar(); }, [cargar]);

  const responder = async (idSolicitud: number, estado: 'Aceptada' | 'Rechazada') => {
    if (!usuario) return;
    setProcesando(idSolicitud); setError(null); setExito(null);
    try {
      const res = await responderSolicitud(idSolicitud, estado, usuario.token);
      setExito(res.mensaje || (estado === 'Aceptada' ? 'Solicitud aceptada ✓' : 'Solicitud rechazada'));
      // Quitar la solicitud respondida de la lista
      setSolicitudes(prev => prev.filter(s => s.idSolicitud !== idSolicitud));
      setTimeout(() => setExito(null), 4000);
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'Error al responder la solicitud.');
    } finally {
      setProcesando(null);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await cargar();
    (event.target as HTMLIonRefresherElement).complete();
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="sol-toolbar">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Solicitudes de Grupo</IonTitle>
          {solicitudes.length > 0 && (
            <IonBadge slot="end" color="danger" style={{ marginRight: '16px' }}>
              {solicitudes.length}
            </IonBadge>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="sol-content" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="sol-container">

          {/* CABECERA */}
          <div className="sol-header">
            <IonIcon icon={peopleOutline} className="sol-icon-big" />
            <h1>Solicitudes pendientes</h1>
            <p>Aquí verás las invitaciones que otros usuarios te enviaron para unirte a sus grupos de confianza.</p>
          </div>

          {/* MENSAJES DE ESTADO */}
          {error && (
            <div className="sol-alert error">⚠️ {error}</div>
          )}
          {exito && (
            <div className="sol-alert success">✓ {exito}</div>
          )}

          {/* LOADING */}
          {cargando && solicitudes.length === 0 && (
            <div className="sol-loading">
              <IonSpinner name="crescent" />
              <p>Cargando solicitudes...</p>
            </div>
          )}

          {/* VACÍO */}
          {!cargando && solicitudes.length === 0 && !error && (
            <div className="sol-empty">
              <div className="sol-empty-icon">📭</div>
              <h3>Sin solicitudes pendientes</h3>
              <p>No tienes solicitudes de grupos en este momento. Cuando alguien te invite, aparecerá aquí.</p>
              <IonButton fill="outline" onClick={() => history.push('/grupos')} className="sol-btn-grupos">
                Ver grupos disponibles
              </IonButton>
            </div>
          )}

          {/* LISTA DE SOLICITUDES */}
          {solicitudes.length > 0 && (
            <div className="sol-lista">
              {solicitudes.map(s => (
                <div key={s.idSolicitud} className="sol-card">
                  <div className="sol-card-top">
                    <div className="sol-grupo-icon">👥</div>
                    <div className="sol-card-info">
                      <h3 className="sol-grupo-nombre">{s.nombreGrupo}</h3>
                      {s.descripcionGrupo && (
                        <p className="sol-grupo-desc">{s.descripcionGrupo}</p>
                      )}
                      <p className="sol-invitador">
                        {Number(s.idCreador) === Number(usuario?.idUsuario) ? (
                          <>Solicita unirse: <strong>{detallesUsuarios[s.idUsuarioSolicitante]?.nombre || `Usuario #${s.idUsuarioSolicitante}`}</strong></>
                        ) : (
                          <>Invitado por: <strong>{detallesUsuarios[s.idUsuarioSolicitante]?.nombre || `Usuario #${s.idUsuarioSolicitante}`}</strong></>
                        )}
                      </p>
                      <span className="sol-tiempo">{tiempoRelativo(s.fechaSolicitud)}</span>
                    </div>
                  </div>

                  <div className="sol-actions">
                    <IonButton
                      expand="block"
                      color="success"
                      className="sol-btn sol-btn-aceptar"
                      onClick={() => responder(s.idSolicitud, 'Aceptada')}
                      disabled={procesando === s.idSolicitud}
                    >
                      {procesando === s.idSolicitud
                        ? <IonSpinner name="dots" />
                        : <><IonIcon icon={checkmarkCircleOutline} slot="start" /> Aceptar</>
                      }
                    </IonButton>
                    <IonButton
                      expand="block"
                      color="medium"
                      fill="outline"
                      className="sol-btn sol-btn-rechazar"
                      onClick={() => responder(s.idSolicitud, 'Rechazada')}
                      disabled={procesando === s.idSolicitud}
                    >
                      {procesando === s.idSolicitud
                        ? <IonSpinner name="dots" />
                        : <><IonIcon icon={closeCircleOutline} slot="start" /> Rechazar</>
                      }
                    </IonButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Solicitudes;
