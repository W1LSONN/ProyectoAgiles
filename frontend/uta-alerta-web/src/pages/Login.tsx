import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

interface LoginResponse {
  token: string;
  nombre: string;
  correo: string;
  rol: string;
  facultad: string;
}

const Login = () => {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!correo || !contrasena) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5007/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data: LoginResponse = await res.json();

      if (!res.ok) {
        setError((data as any).mensaje || 'Credenciales incorrectas.');
        return;
      }

      // Guardar sesión en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data));

      // Redirigir según rol
      if (data.rol === 'Admin') {
        navigate('/admin');
      } else if (data.rol === 'Guardia') {
        navigate('/guardia');
      } else {
        navigate('/home');
      }

    } catch {
      setError('Error de conexión. Verifica que el servidor esté activo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo / Título */}
        <div className="login-brand">
          <span className="brand-icon"></span>
          <span className="brand-name">UTA Alerta</span>
        </div>

        <h1 className="login-titulo">Ingresar</h1>
        <p className="login-subtitulo">Sistema de Gestión de Incidentes de Seguridad</p>

        <form className="login-form" onSubmit={handleLogin} noValidate>
          {/* Email */}
          <div className="campo-grupo">
            <label className="campo-label" htmlFor="correo">Email</label>
            <input
              id="correo"
              type="email"
              className="campo-input"
              placeholder="example@uta.edu.ec"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="campo-grupo">
            <label className="campo-label" htmlFor="contrasena">Password</label>
            <div className="password-wrapper">
              <input
                id="contrasena"
                type={mostrarPassword ? 'text' : 'password'}
                className="campo-input"
                placeholder="••••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="ojo-btn"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                aria-label="Mostrar/ocultar contraseña"
              >
                {mostrarPassword ? 'Hide ' : 'Show'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <p className="login-error">{error}</p>}

          {/* Botón */}
          <button
            type="submit"
            className="btn-signin"
            disabled={cargando}
          >
            {cargando ? (
              <span className="spinner" />
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="login-footer">
          Universidad Técnica de Ambato · DITIC
        </p>
      </div>
    </div>
  );
};

export default Login;
