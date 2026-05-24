import React from 'react';
import { IonContent, IonIcon, IonPage, IonToggle } from '@ionic/react';
import { menuOutline, personCircleOutline } from 'ionicons/icons';
import './Guardia.css';

interface NotificacionGuardia {
  id: number;
  titulo: string;
  nombre: string;
  zona: string;
  hora: string;
}

const notificaciones: NotificacionGuardia[] = [
  { id: 1, titulo: 'Robo', nombre: 'Wilson Pillapa', zona: 'Zona A', hora: '07:53 PM' },
  { id: 2, titulo: 'Secuestro', nombre: 'Andrés Quinga', zona: 'Zona B', hora: '07:54 PM' },
];

const Guardia: React.FC = () => {
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
            <IonToggle checked={false} className="guardia-toggle" />
          </section>

          <main className="guardia-main">
            <h1 className="guardia-titulo">Notificaciones</h1>

            <div className="guardia-lista">
              {notificaciones.map((notificacion) => (
                <article key={notificacion.id} className="guardia-card">
                  <div className="guardia-avatar">
                    <IonIcon icon={personCircleOutline} />
                  </div>

                  <div className="guardia-card-contenido">
                    <div className="guardia-card-top">
                      <strong className="guardia-card-titulo">{notificacion.titulo}</strong>
                      <span className="guardia-card-hora">{notificacion.hora}</span>
                    </div>
                    <p className="guardia-card-nombre">{notificacion.nombre}</p>
                    <p className="guardia-card-zona">{notificacion.zona}</p>
                  </div>
                </article>
              ))}
            </div>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Guardia;