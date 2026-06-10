import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage, IonContent, IonSelect, IonSelectOption,
  IonText, IonIcon, IonInput, IonButton,
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonList, IonItem, IonLabel, IonMenuButton
} from '@ionic/react';
import { wifiOutline, personCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Home.css';
import { crearIncidente } from '../services/incidentService';
import { crearIncidente } from '../services/incidentService';
import { Geolocation } from '@capacitor/geolocation';

// Tipo para los datos del usuario guardados en localStorage
interface UsuarioData {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: string;
  facultad: string;  // En BD se llama "facultad", lo mostramos como "Carrera"
  token: string;
}

const DURACION_MS = 3000; // 3 segundos de presión sostenida

const Home: React.FC = () => {
  const history = useHistory();

  // ── Datos del usuario ────────────────────────────────────────────
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let watchId: string | null = null;
    const startWatching = async () => {
      try {
        const perms = await Geolocation.requestPermissions();
        if (perms.location === 'granted') {
          // Empezar a seguir la ubicación en segundo plano para que esté lista al instante
          watchId = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 10000 },
            (position) => {
              if (position) {
                setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
              }
            }
          );
        }
      } catch (e) {
        console.warn('Error al iniciar watchPosition', e);
      }
    };
    startWatching();

    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      history.replace('/login');
      return;
    }
    try {
      setUsuario(JSON.parse(raw));
    } catch (error) {
      console.error('Error parseando sesión:', error);
      history.replace('/login');
    }
  }, [history]);

  // ── Selector de motivo ───────────────────────────────────────────
  const [motivo, setMotivo] = useState<string>('Alerta de seguridad');

  // ── Lógica del botón de pánico ───────────────────────────────────
  const [progreso, setProgreso] = useState<number>(0);
  const [activado, setActivado] = useState<boolean>(false);
  const [presionando, setPresionando] = useState<boolean>(false);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorAlerta, setErrorAlerta] = useState<string | null>(null);

  const intervaloRef = useRef<any>(null);
  const progresoRef = useRef<number>(0);

  const iniciarPresion = () => {
    if (activado) return;
    setPresionando(true);
    progresoRef.current = 0;

    intervaloRef.current = setInterval(() => {
      progresoRef.current += (100 / (DURACION_MS / 50));
      setProgreso(Math.min(progresoRef.current, 100));

      if (progresoRef.current >= 100) {
        clearInterval(intervaloRef.current);
        setPresionando(false);
        // setActivado lo maneja ahora dispararAlerta() después del POST exitoso
        dispararAlerta();
      }
    }, 50);
  };

  const cancelarPresion = () => {
    if (enviando || activado || progresoRef.current >= 100) return;
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    setPresionando(false);
    setProgreso(0);
    progresoRef.current = 0;
  };

  const dispararAlerta = async () => {
    if (!usuario) return;
    setEnviando(true);
    setErrorAlerta(null);

    const ejecutarEnvio = async (lat?: number, lng?: number) => {
      try {
        let idZona = 1; // Por defecto Zona 1
        if (lat !== undefined && lng !== undefined) {
          // Coordenadas aproximadas del centro de cada una de las 4 zonas de la UTA
          const centrosZonas = [
            { id: 1, lat: -1.267476, lng: -78.624879 },
            { id: 2, lat: -1.269757, lng: -78.623375 },
            { id: 3, lat: -1.267611, lng: -78.623506 },
            { id: 4, lat: -1.269513, lng: -78.625190 }
          ];
          
          let minDistance = Infinity;
          for (const centro of centrosZonas) {
            // Distancia euclidiana al cuadrado (suficiente para distancias muy cortas)
            const dist = Math.pow(lat - centro.lat, 2) + Math.pow(lng - centro.lng, 2);
            if (dist < minDistance) {
              minDistance = dist;
              idZona = centro.id;
            }
          }
        } else {
          // Fallback robusto por facultad/carrera si la geolocalización no está activa
          const fac = (usuario.facultad || '').toLowerCase();
          if (fac.includes('arquitectura') || fac.includes('humanidades') || fac.includes('diseño')) {
            idZona = 1;
          } else if (fac.includes('administrativas') || fac.includes('administración') || fac.includes('empresa')) {
            idZona = 2;
          } else if (fac.includes('salud') || fac.includes('medicina') || fac.includes('enfermería')) {
            idZona = 3;
          } else if (fac.includes('ingeniería') || fac.includes('sistemas') || fac.includes('fci')) {
            idZona = 4;
          }
        }

        await crearIncidente(
          {
            idUsuario: usuario.idUsuario,
            idZona,
            tipoIncidente: motivo,
            descripcion: `Alerta disparada desde app móvil — motivo: ${motivo}`,
            latitud: lat,
            longitud: lng
          },
          usuario.token
        );
        setActivado(true);
      } catch (error) {
        const e = error as Error;
        setErrorAlerta(e.message || 'No se pudo enviar la alerta. Verifica tu conexión.');
        setActivado(false);
      } finally {
        setEnviando(false);
      }
    };

    const obtenerYEnviar = async () => {
      if (currentLocation) {
        // Optimización: Si ya tenemos la ubicación rastreada, la enviamos al instante
        ejecutarEnvio(currentLocation.lat, currentLocation.lng);
        return;
      }

      try {
        await Geolocation.requestPermissions();
        // Aumentamos el timeout a 10 segundos porque en celulares reales el GPS puede tardar en fijar la señal
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        const { latitude, longitude } = position.coords;
        ejecutarEnvio(latitude, longitude);
      } catch (error) {
        console.warn('Error con alta precisión (GPS), intentando baja precisión (Red/WIFI)...', error);
        try {
          // Si el GPS falla o tarda mucho, intentamos con baja precisión que es más rápida (basada en red)
          const fallbackPosition = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 8000 });
          const { latitude, longitude } = fallbackPosition.coords;
          ejecutarEnvio(latitude, longitude);
        } catch (fallbackError) {
          console.warn('Error al obtener geolocalización nativa, usando fallback por facultad', fallbackError);
          // Le avisamos al usuario en la pantalla que debe prender el GPS
          setErrorAlerta('GPS desactivado o sin señal. Se envió tu alerta usando tu facultad como referencia. Por favor, ENCIENDE LA UBICACIÓN de tu celular para mayor precisión.');
          ejecutarEnvio();
        }
      }
    };

    obtenerYEnviar();
  };

  const resetear = () => {
    setActivado(false);
    setProgreso(0);
    progresoRef.current = 0;
    setMotivo('Alerta de seguridad');
  };

  // ── SVG: cálculo del círculo de progreso ─────────────────────────
  const RADIO = 72;
  const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
  const offset = CIRCUNFERENCIA - (progreso / 100) * CIRCUNFERENCIA;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <IonPage>
      <IonContent className="home-content" fullscreen>

        {/* ── HEADER (fiel al mockup) ── */}
        <div className="home-header">
          <div className="header-top">
            <span className="header-menu">
              <IonMenuButton color="dark" style={{ margin: 0 }} />
            </span>
            <span className="header-titulo">UTA Alerta</span>
          </div>
          <div className="header-datos">
            <div className="dato-fila">
              <span className="dato-label">Nombre:</span>
              <span className="dato-valor">{usuario?.nombre ?? '...'}</span>
            </div>
            <div className="dato-fila">
              <span className="dato-label">Rol:</span>
              <span className="dato-valor rol-texto">{usuario?.rol ?? '...'}</span>
            </div>
            <div className="dato-fila">
              <span className="dato-label">Carrera:</span>
              <span className="dato-valor">{usuario?.facultad ?? 'UTA'}</span>
            </div>
          </div>
          <div className="header-separador" />
        </div>

        {/* ── CUERPO ── */}
        <div className="home-body">

          {/* ── INSTRUCCIÓN ── */}
          <IonText className="instruccion-texto">
            <p>Mantén presionado <strong>3 segundos</strong></p>
          </IonText>

          {/* ── SELECTOR DE MOTIVO ── */}
          <div className="motivo-wrapper">
            <IonSelect
              value={motivo}
              onIonChange={(e) => setMotivo(e.detail.value)}
              interface="action-sheet"
              placeholder="Motivo de la emergencia"
              className="motivo-select"
              disabled={activado}
            >
              <IonSelectOption value="Robo">Robo</IonSelectOption>
              <IonSelectOption value="Arma Blanca">Arma Blanca</IonSelectOption>
              <IonSelectOption value="Emergencia de Salud">Emergencia de Salud</IonSelectOption>
              <IonSelectOption value="Otro">Otro</IonSelectOption>
              <IonSelectOption value="Alerta de seguridad">Alerta de seguridad</IonSelectOption>
            </IonSelect>
          </div>

          {/* Spinner mientras se envía */}
          {enviando && (
            <div style={{ textAlign: 'center', marginTop: 12, color: '#fff', fontSize: 14 }}>
              Enviando alerta...
            </div>
          )}

          {/* Error si el POST falló */}
          {errorAlerta && (
            <div style={{
              background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '10px 16px',
              color: '#fca5a5', fontSize: 13, textAlign: 'center', marginBottom: 12
            }}>
              ⚠️ {errorAlerta}
            </div>
          )}

          {/* ── BOTÓN SOS / ESTADO ACTIVADO ── */}
          {!activado ? (
            <>
              <div className="sos-wrapper">
                <div
                  className={`sos-container ${presionando ? 'presionando' : ''}`}
                  onPointerDown={iniciarPresion}
                  onPointerUp={cancelarPresion}
                  onPointerLeave={cancelarPresion}
                >
                  {/* Círculo de progreso SVG */}
                  <svg className="sos-svg" viewBox="0 0 160 160">
                    <circle
                      cx="80" cy="80" r={RADIO}
                      fill="none"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="80" cy="80" r={RADIO}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={CIRCUNFERENCIA}
                      strokeDashoffset={offset}
                      transform="rotate(-90 80 80)"
                      style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                    />
                  </svg>

                  {/* Contenido interior del botón */}
                  <div className="sos-inner">
                    <IonIcon icon={wifiOutline} className="sos-wifi-icon" />
                    <span className="sos-texto">SOS</span>
                    <span className="sos-subtexto">PÁNICO</span>
                  </div>
                </div>
              </div>

              {/* Texto debajo del botón */}
              <p className="reportar-texto">Reportar incidente</p>
            </>
          ) : (
            /* ── ESTADO ACTIVADO ── */
            <div className="alerta-enviada">
              <div className="check-icon">✓</div>
              <p className="enviada-titulo">¡Alerta enviada!</p>
              <p className="enviada-motivo">Motivo: <strong>{motivo}</strong></p>
              <p className="enviada-sub">
                Los guardias y tu grupo de confianza han sido notificados.
              </p>
              <button className="btn-nueva-alerta" onClick={resetear}>
                Nueva alerta
              </button>
            </div>
          )}

          {/* FIN DEL BOTÓN SOS */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
