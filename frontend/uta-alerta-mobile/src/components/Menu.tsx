import React, { useEffect, useState } from 'react';
import {
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle
} from '@ionic/react';
import {
  homeOutline,
  timeOutline,
  peopleOutline,
  logOutOutline,
  personCircleOutline
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import './Menu.css';

interface UsuarioData {
  nombre: string;
  correo: string;
  rol: string;
  facultad: string;
}

const Menu: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);

  useEffect(() => {
    // Escuchar cambios de ruta para actualizar el usuario
    const raw = localStorage.getItem('usuario');
    if (raw) {
      try {
        setUsuario(JSON.parse(raw));
      } catch (e) {}
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    history.replace('/login');
  };

  // Solo renderizar el menú si estamos autenticados y NO en la pantalla de login
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
