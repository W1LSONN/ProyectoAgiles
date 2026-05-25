import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage, IonContent, IonSelect, IonSelectOption,
  IonText, IonIcon, IonInput, IonButton
} from '@ionic/react';
import { wifiOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Home.css';
import { crearIncidente } from '../services/incidentService';
import {
  obtenerGrupos,
  crearGrupo as apiCrearGrupo,
  unirseGrupo as apiUnirseGrupo,
  salirGrupo as apiSalirGrupo,
  Grupo,
} from '../services/groupService';

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
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [gruposCargando, setGruposCargando] = useState<boolean>(false);
  const [gruposError, setGruposError] = useState<string | null>(null);
  const [nombreGrupo, setNombreGrupo] = useState<string>('');
  const [descripcionGrupo, setDescripcionGrupo] = useState<string>('');
  const [creandoGrupo, setCreandoGrupo] = useState<boolean>(false);
  const [accionGrupos, setAccionGrupos] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      history.replace('/login');
      return;
    }
    setUsuario(JSON.parse(raw));
  }, [history]);

  useEffect(() => {
    const cargarGrupos = async () => {
      if (!usuario) return;
      setGruposCargando(true);
      setGruposError(null);

      try {
        const gruposObtenidos = await obtenerGrupos(usuario.token);
        setGrupos(gruposObtenidos);
      } catch (error) {
        const e = error as Error;
        setGruposError(e.message || 'No se pudieron cargar los grupos');
      } finally {
        setGruposCargando(false);
      }
    };

    cargarGrupos();
  }, [usuario]);

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

  const recargarGrupos = async () => {
    if (!usuario) return;
    setGruposError(null);
    setGruposCargando(true);

    try {
      const gruposObtenidos = await obtenerGrupos(usuario.token);
      setGrupos(gruposObtenidos);
    } catch (error) {
      const e = error as Error;
      setGruposError(e.message || 'No se pudieron cargar los grupos');
    } finally {
      setGruposCargando(false);
    }
  };

  const handleCrearGrupo = async () => {
    if (!usuario) return;
    if (!nombreGrupo.trim() || !descripcionGrupo.trim()) {
      setGruposError('Completa nombre y descripción del grupo');
      return;
    }

    setCreandoGrupo(true);
    setAccionGrupos('Creando grupo...');
    setGruposError(null);

    try {
      const grupoCreado = await apiCrearGrupo({
        nombre: nombreGrupo.trim(),
        descripcion: descripcionGrupo.trim(),
      }, usuario.token);
      setGrupos((prev) => [grupoCreado, ...prev]);
      setNombreGrupo('');
      setDescripcionGrupo('');
    } catch (error) {
      const e = error as Error;
      setGruposError(e.message || 'No se pudo crear el grupo');
    } finally {
      setCreandoGrupo(false);
      setAccionGrupos(null);
    }
  };

  const handleUnirse = async (grupoId: number) => {
    if (!usuario) return;
    setAccionGrupos('Uniendo al grupo...');
    setGruposError(null);

    try {
      const grupoActualizado = await apiUnirseGrupo(grupoId, usuario.token);
      setGrupos((prev) => prev.map((grupo) => (
        grupo.idGrupo === grupoId ? grupoActualizado : grupo
      )));
    } catch (error) {
      const e = error as Error;
      setGruposError(e.message || 'No se pudo unir al grupo');
    } finally {
      setAccionGrupos(null);
    }
  };

  const handleSalir = async (grupoId: number) => {
    if (!usuario) return;
    setAccionGrupos('Saliendo del grupo...');
    setGruposError(null);

    try {
      const grupoActualizado = await apiSalirGrupo(grupoId, usuario.token);
      setGrupos((prev) => prev.map((grupo) => (
        grupo.idGrupo === grupoId ? grupoActualizado : grupo
      )));
    } catch (error) {
      const e = error as Error;
      setGruposError(e.message || 'No se pudo salir del grupo');
    } finally {
      setAccionGrupos(null);
    }
  };

  const estaEnGrupo = (grupo: Grupo) => {
    if (!usuario) return false;
    return grupo.miembros.some((miembro) => miembro.idUsuario === usuario.idUsuario);
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

          <div className="grupo-section">
            <div className="grupo-header">
              <h2>Grupos de confianza</h2>
              <p>Administra los grupos a los que te puedes unir y ver sus miembros.</p>
            </div>

            <div className="grupo-formulario">
              <IonInput
                value={nombreGrupo}
                placeholder="Nombre del grupo"
                onIonInput={(e) => setNombreGrupo(e.detail.value ?? '')}
                className="grupo-input"
              />
              <IonInput
                value={descripcionGrupo}
                placeholder="Descripción breve"
                onIonInput={(e) => setDescripcionGrupo(e.detail.value ?? '')}
                className="grupo-input"
              />
              <IonButton
                expand="block"
                onClick={handleCrearGrupo}
                disabled={creandoGrupo}
                className="grupo-btn"
              >
                {creandoGrupo ? 'Creando grupo...' : 'Crear grupo'}
              </IonButton>
            </div>

            {accionGrupos && (
              <div className="grupo-notice">{accionGrupos}</div>
            )}

            {gruposError && (
              <div className="grupo-error">⚠️ {gruposError}</div>
            )}

            <div className="grupo-lista">
              <div className="grupo-lista-header">
                <span>Grupos disponibles</span>
                <button className="grupo-recargar" onClick={recargarGrupos}>
                  {gruposCargando ? 'Cargando...' : 'Actualizar'}
                </button>
              </div>

              {gruposCargando ? (
                <div className="grupo-loading">Cargando grupos...</div>
              ) : grupos.length === 0 ? (
                <div className="grupo-vacio">No hay grupos disponibles por ahora.</div>
              ) : (
                grupos.map((grupo) => {
                  const enMiGrupo = estaEnGrupo(grupo);

                  return (
                    <div key={grupo.idGrupo} className="grupo-card">
                      <div className="grupo-card-header">
                        <div>
                          <h3>{grupo.nombre}</h3>
                          <p>{grupo.descripcion}</p>
                        </div>
                        <IonButton
                          fill={enMiGrupo ? 'outline' : 'solid'}
                          color={enMiGrupo ? 'medium' : 'primary'}
                          size="small"
                          className="grupo-action"
                          onClick={() => enMiGrupo ? handleSalir(grupo.idGrupo) : handleUnirse(grupo.idGrupo)}
                        >
                          {enMiGrupo ? 'Salir' : 'Unirse'}
                        </IonButton>
                      </div>
                      <div className="grupo-meta">
                        <span>{grupo.miembros.length} miembro{grupo.miembros.length === 1 ? '' : 's'}</span>
                      </div>
                      <div className="grupo-members">
                        {grupo.miembros.length === 0 ? (
                          <span className="grupo-member-empty">Sin miembros aún</span>
                        ) : (
                          grupo.miembros.map((miembro) => (
                            <span key={miembro.idUsuario} className="grupo-member-pill">
                              {miembro.nombre}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
