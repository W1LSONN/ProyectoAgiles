import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonInput, IonButton,
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonList, IonItem, IonLabel, IonIcon, IonMenuButton
} from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import {
  obtenerGrupos,
  crearGrupo as apiCrearGrupo,
  unirseGrupo as apiUnirseGrupo,
  salirGrupo as apiSalirGrupo,
  obtenerGrupoDetalle,
  Grupo,
} from '../services/groupService';
import { obtenerDetallesUsuario } from '../services/userService';
import './Home.css'; // Podemos reusar los mismos estilos

interface UsuarioData {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: string;
  facultad: string;
  token: string;
}

const Grupos: React.FC = () => {
  const history = useHistory();
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [gruposCargando, setGruposCargando] = useState<boolean>(false);
  const [gruposError, setGruposError] = useState<string | null>(null);
  const [nombreGrupo, setNombreGrupo] = useState<string>('');
  const [descripcionGrupo, setDescripcionGrupo] = useState<string>('');
  const [creandoGrupo, setCreandoGrupo] = useState<boolean>(false);
  const [accionGrupos, setAccionGrupos] = useState<string | null>(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Grupo | null>(null);
  const [detallesUsuarios, setDetallesUsuarios] = useState<Record<number, { nombre: string; facultad: string }>>({});

  useEffect(() => {
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      history.replace('/login');
      return;
    }
    try {
      setUsuario(JSON.parse(raw));
    } catch (error) {
      history.replace('/login');
    }
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

  useEffect(() => {
    if (grupoSeleccionado?.miembros) {
      const cargarDetalles = async () => {
        const nuevosDetalles = { ...detallesUsuarios };
        let huboCambios = false;

        for (const miembro of grupoSeleccionado?.miembros || []) {
          if (!nuevosDetalles[miembro.idUsuario]) {
            const info = await obtenerDetallesUsuario(miembro.idUsuario);
            nuevosDetalles[miembro.idUsuario] = info;
            huboCambios = true;
          }
        }

        if (huboCambios) {
          setDetallesUsuarios(nuevosDetalles);
        }
      };
      cargarDetalles();
    }
  }, [grupoSeleccionado]);

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
        idCreador: usuario.idUsuario,
      }, usuario.token);
      
      const grupoCompleto = await obtenerGrupoDetalle(grupoCreado.idGrupo, usuario.token);
      
      setGrupos((prev) => [grupoCompleto, ...prev]);
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
      await apiUnirseGrupo(grupoId, usuario.idUsuario, usuario.token);
      await recargarGrupos();
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
      await apiSalirGrupo(grupoId, usuario.idUsuario, usuario.token);
      await recargarGrupos();
    } catch (error) {
      const e = error as Error;
      setGruposError(e.message || 'No se pudo salir del grupo');
    } finally {
      setAccionGrupos(null);
    }
  };

  const estaEnGrupo = (grupo: Grupo) => {
    if (!usuario || !grupo.miembros) return false;
    return grupo.miembros.some((miembro) => miembro.idUsuario === usuario.idUsuario);
  };

  return (
    <IonPage>
      {/* ── HEADER CON BOTON DE MENU ── */}
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Grupos de Confianza</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="home-content ion-padding" fullscreen>
        <div className="grupo-section" style={{ marginTop: 0 }}>
          <div className="grupo-header">
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
                      <span>{grupo.miembros?.length ?? 0} miembro{(grupo.miembros?.length ?? 0) === 1 ? '' : 's'}</span>
                    </div>
                    <div className="grupo-members">
                      <IonButton fill="clear" size="small" onClick={() => setGrupoSeleccionado(grupo)}>
                        Ver lista de miembros
                      </IonButton>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── MODAL: LISTADO DE MIEMBROS ── */}
        <IonModal isOpen={!!grupoSeleccionado} onDidDismiss={() => setGrupoSeleccionado(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Miembros del Grupo</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setGrupoSeleccionado(null)}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <h2 style={{ marginTop: 0 }}>{grupoSeleccionado?.nombre}</h2>
            <p style={{ color: '#666', marginBottom: 20 }}>{grupoSeleccionado?.descripcion}</p>

            <IonList>
              {(!grupoSeleccionado?.miembros || grupoSeleccionado.miembros.length === 0) && (
                <IonItem><IonLabel color="medium">No hay miembros en este grupo.</IonLabel></IonItem>
              )}
              {grupoSeleccionado?.miembros?.map((m) => (
                <IonItem key={m.idUsuarioGrupo}>
                  <IonIcon icon={personCircleOutline} slot="start" size="large" color="medium" />
                  <IonLabel>
                    <h2>{detallesUsuarios[m.idUsuario]?.nombre || `Cargando... (ID: ${m.idUsuario})`}</h2>
                    <p>{detallesUsuarios[m.idUsuario]?.facultad || 'Obteniendo carrera...'}</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Grupos;
