import React, { useEffect, useState, useCallback } from 'react';
import {
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonBadge,
} from '@ionic/react';
import {
  homeOutline,
  timeOutline,
  peopleOutline,
  mailOutline,
  logOutOutline,
  personCircleOutline
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { contarSolicitudesPendientes } from '../services/groupService';
import './Menu.css';

interface UsuarioData {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: string;
  facultad: string;
  token: string;
}

const Menu: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<number>(0);

  useEffect(() => {
    const raw = localStorage.getItem('usuario');
    if (raw) {
      try { setUsuario(JSON.parse(raw)); } catch (e) {}
    }
  }, [location.pathname]);

  // Polling liviano del badge de solicitudes (cada 30s mientras el menú está activo)
  const actualizarBadge = useCallback(async () => {
    try {
      const raw = localStorage.getItem('usuario');
      if (!raw) return;
      const u: UsuarioData = JSON.parse(raw);
      if (!u?.token || !u?.idUsuario) return;
      const count = await contarSolicitudesPendientes(u.idUsuario, u.token);
      setSolicitudesPendientes(count);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    if (!usuario) return;
    actualizarBadge();
    const interval = setInterval(actualizarBadge, 30000);
    return () => clearInterval(interval);
  }, [usuario, actualizarBadge]);

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    history.replace('/login');
  };

  if (location.pathname === '/login' || location.pathname === '/') {
    return null;
  }

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonContent>
        <div className="menu-header-bg">
          <IonIcon icon={personCircleOutline} className="menu-avatar" />
          <h2 className="menu-nombre">{usuario?.nombre || 'Usuario'}</h2>
          <p className="menu-carrera">{usuario?.facultad || 'UTA'}</p>
          <span className="menu-rol">{usuario?.rol || 'Estudiante'}</span>
        </div>

        <IonList className="menu-list">
          <IonMenuToggle autoHide={false}>
            <IonItem className={location.pathname === '/home' ? 'selected' : ''} routerLink="/home" routerDirection="root" lines="none">
              <IonIcon slot="start" icon={homeOutline} />
              <IonLabel>Inicio (Alerta)</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonMenuToggle autoHide={false}>
            <IonItem className={location.pathname === '/historial' ? 'selected' : ''} routerLink="/historial" routerDirection="root" lines="none">
              <IonIcon slot="start" icon={timeOutline} />
              <IonLabel>Historial</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonMenuToggle autoHide={false}>
            <IonItem className={location.pathname === '/grupos' ? 'selected' : ''} routerLink="/grupos" routerDirection="root" lines="none">
              <IonIcon slot="start" icon={peopleOutline} />
              <IonLabel>Grupos de Confianza</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonMenuToggle autoHide={false}>
            <IonItem className={location.pathname === '/solicitudes' ? 'selected' : ''} routerLink="/solicitudes" routerDirection="root" lines="none">
              <IonIcon slot="start" icon={mailOutline} />
              <IonLabel>Solicitudes</IonLabel>
              {solicitudesPendientes > 0 && (
                <IonBadge slot="end" color="danger">{solicitudesPendientes}</IonBadge>
              )}
            </IonItem>
          </IonMenuToggle>

          <IonItem button onClick={handleLogout} lines="none" className="menu-logout">
            <IonIcon slot="start" icon={logOutOutline} />
            <IonLabel>Cerrar Sesión</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
