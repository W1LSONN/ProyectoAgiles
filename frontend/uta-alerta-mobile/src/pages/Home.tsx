import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage, IonContent, IonSelect, IonSelectOption,
  IonText, IonIcon
} from '@ionic/react';
import { wifiOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Home.css';
import { crearIncidente } from '../services/incidentService';

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

  useEffect(() => {
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      history.replace('/login');
      return;
    }
    setUsuario(JSON.parse(raw));
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

    try {
      await crearIncidente(
        {
          idUsuario: usuario.idUsuario,
          idZona: 1,
          tipoIncidente: motivo,
          descripcion: `Alerta disparada desde app móvil — motivo: ${motivo}`,
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
            <span className="header-menu">☰</span>
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

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
