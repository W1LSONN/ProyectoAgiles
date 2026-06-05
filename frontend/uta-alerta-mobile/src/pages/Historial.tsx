import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonText,
  IonSpinner,
} from '@ionic/react';
import {
  alertCircleOutline,
  checkmarkDoneOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { obtenerIncidentesPorUsuario, IncidenteResumen } from '../services/incidentService';
import { useHistory } from 'react-router-dom';
import './Historial.css';

const estadoIcono = (estado: string) => {
  const estadoNormalizado = estado?.toLowerCase() ?? '';
  if (estadoNormalizado === 'activo') {
    return alertCircleOutline;
  }
  if (estadoNormalizado === 'asumido') {
    return checkmarkDoneOutline;
  }
  return checkmarkCircleOutline;
};

const estadoColor = (estado: string) => {
  const estadoNormalizado = estado?.toLowerCase() ?? '';
  if (estadoNormalizado === 'activo') return 'danger';
  if (estadoNormalizado === 'asumido') return 'primary';
  return 'success';
};

const estadoTexto = (estado: string) => {
  const estadoNormalizado = estado?.toLowerCase() ?? '';
  if (estadoNormalizado === 'activo') return 'Activo';
  if (estadoNormalizado === 'asumido') return 'Asumido';
  return 'Cerrado';
};

const formatearFecha = (fecha?: string) => {
  if (!fecha) return 'Fecha no disponible';
  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return fecha;
  return fechaObj.toLocaleString('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const Historial: React.FC = () => {
  const history = useHistory();
  const [incidentes, setIncidentes] = useState<IncidenteResumen[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const usuarioRaw = localStorage.getItem('usuario');
    if (!usuarioRaw) {
      history.replace('/login');
      return;
    }

    const usuario = JSON.parse(usuarioRaw) as { idUsuario: number; token: string };
    if (!usuario?.idUsuario || !usuario?.token) {
      history.replace('/login');
      return;
    }

    const cargarHistorial = async () => {
      try {
        setCargando(true);
        const data = await obtenerIncidentesPorUsuario(usuario.idUsuario, usuario.token);
        setIncidentes(data || []);
      } catch (err) {
        const e = err as Error;
        setError(e.message || 'No se pudo cargar el historial de incidentes.');
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, [history]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Historial</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="historial-content" fullscreen>
        <div className="historial-header">
          <IonText>
            <h2>Tus incidentes</h2>
            <p>Consulta el estado y descripción de cada reporte.</p>
          </IonText>
        </div>

        {cargando ? (
          <div className="historial-cargando">
            <IonSpinner name="crescent" />
            <span>Cargando historial...</span>
          </div>
        ) : error ? (
          <div className="historial-error">⚠️ {error}</div>
        ) : incidentes.length === 0 ? (
          <div className="historial-vacio">No se encontraron incidentes registrados.</div>
        ) : (
          <IonList className="historial-lista">
            {incidentes.map((incidente) => (
              <IonItem key={incidente.idIncidente} className="historial-item">
                <IonIcon
                  icon={estadoIcono(incidente.estado)}
                  slot="start"
                  className="historial-icon"
                  color={estadoColor(incidente.estado)}
                />
                <IonLabel>
                  <h3>{incidente.tipoIncidente ?? 'Incidente'}</h3>
                  <p>{incidente.mensaje ?? 'Sin descripción'}</p>
                  <div className="historial-meta">
                    <span>{formatearFecha(incidente.fechaReporte)}</span>
                    <IonBadge color={estadoColor(incidente.estado)}>{estadoTexto(incidente.estado)}</IonBadge>
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Historial;
