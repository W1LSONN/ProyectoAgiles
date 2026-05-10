import React, { useState } from 'react';
import {
    IonPage, IonContent, IonInput, IonButton,
    IonItem, IonLabel, IonIcon, IonText, IonSpinner
} from '@ionic/react';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const history = useHistory();

    const handleLogin = async () => {
        if (!correo || !contrasena) {
            setError('Por favor completa todos los campos');
            return;
        }

        setCargando(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_AUTH_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contrasena })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.mensaje || 'Credenciales incorrectas');
                return;
            }

            // Guardar token y datos del usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data));

            // Redirigir según el rol
            if (data.rol === 'Guardia') {
                history.push('/guardia');
            } else if (data.rol === 'Admin') {
                history.push('/admin');
            } else {
                history.push('/home');
            }

        } catch (e) {
            setError('Error de conexión. Verifica tu internet.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <IonPage>
            <IonContent className="login-content" fullscreen>
                <div className="login-container">

                    <h1 className="login-titulo">Ingresar</h1>

                    <div className="login-form">
                        <div className="input-grupo">
                            <IonLabel className="input-label">Email</IonLabel>
                            <IonInput
                                type="email"
                                placeholder="example@email.com"
                                value={correo}
                                onIonInput={(e) => setCorreo(e.detail.value!)}
                                className="login-input"
                            />
                            <div className="input-linea" />
                        </div>

                        <div className="input-grupo">
                            <IonLabel className="input-label">Password</IonLabel>
                            <div className="password-wrapper">
                                <IonInput
                                    type={mostrarPassword ? 'text' : 'password'}
                                    placeholder="••••••••••"
                                    value={contrasena}
                                    onIonInput={(e) => setContrasena(e.detail.value!)}
                                    className="login-input"
                                />
                                <IonIcon
                                    icon={mostrarPassword ? eyeOffOutline : eyeOutline}
                                    className="ojo-icon"
                                    onClick={() => setMostrarPassword(!mostrarPassword)}
                                />
                            </div>
                            <div className="input-linea" />
                        </div>

                        {error && (
                            <IonText color="danger">
                                <p className="error-msg">{error}</p>
                            </IonText>
                        )}

                        <IonButton
                            expand="block"
                            className="btn-signin"
                            onClick={handleLogin}
                            disabled={cargando}
                        >
                            {cargando ? <IonSpinner name="crescent" /> : 'Sign in'}
                        </IonButton>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default Login;
