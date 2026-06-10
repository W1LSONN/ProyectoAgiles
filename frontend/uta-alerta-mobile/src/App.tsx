import React from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

import Login from './pages/Login';
import Home from './pages/Home';
import Guardia from './pages/Guardia';
import Historial from './pages/Historial';

setupIonicReact();

import ErrorBoundary from './components/ErrorBoundary';

import Menu from './components/Menu';
import Grupos from './pages/Grupos';

const App: React.FC = () => (
  <IonApp>
    <ErrorBoundary>
      <IonReactRouter>
        <Menu />
        <IonRouterOutlet id="main-content">
          <Route exact path="/login" component={Login} />
          <Route exact path="/home" component={Home} />
          <Route exact path="/guardia" component={Guardia} />
          <Route exact path="/historial" component={Historial} />
          <Route exact path="/grupos" component={Grupos} />
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </ErrorBoundary>
  </IonApp>
);

export default App;
