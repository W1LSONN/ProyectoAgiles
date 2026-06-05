import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/react';

interface State {
  hasError: boolean;
  error?: Error | null;
}

class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log to console for now — can be extended to reporting services
    // eslint-disable-next-line no-console
    console.error('Captured error in ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Error</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <h2>Ha ocurrido un error</h2>
            <p>{this.state.error?.message ?? 'Error inesperado'}</p>
            <IonButton onClick={() => window.location.reload()}>Recargar</IonButton>
          </IonContent>
        </IonPage>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
