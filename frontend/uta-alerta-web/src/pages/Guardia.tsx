import { useNavigate } from 'react-router-dom';
import { useSignalR } from '../hooks/useSignalR';

const Guardia = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const { alertas, conectado: _conectado } = useSignalR('Guardias');

  if (!usuario?.token) { navigate('/login'); return null; }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '32px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 8 }}>Panel del Guardia</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Bienvenido, <strong>{usuario.nombre}</strong>
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alertas.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#aaa' }}>
            Sin alertas activas. Esperando notificaciones...
          </div>
        ) : (
          alertas.map(a => (
            <div key={a.idIncidente} style={{
              background: '#fff', borderRadius: 12, padding: '16px 20px',
              borderLeft: '4px solid #e74c3c',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: '#1a1a2e' }}>🚨 {a.tipoIncidente}</span>
                <span style={{ fontSize: '0.78rem', color: '#888' }}>
                  {new Date(a.fechaReporte).toLocaleTimeString('es-EC')}
                </span>
              </div>
              <p style={{ margin: 0, color: '#444', fontSize: '0.88rem' }}>
                <strong>{a.nombreUsuario}</strong> — {a.facultad}
              </p>
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.82rem' }}>
                📍 {a.zona}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Guardia;
