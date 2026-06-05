import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import './DashboardPanel.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend, Title);

const STATS_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';

// Colores para los gráficos
const COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#34495e', '#e67e22'];

// Datos de prueba que se mostrarán hasta que el backend esté listo
const MOCK_STATS = {
  globales: {
    total: 44,
    activos: 12,
    asumidos: 8,
    cerrados: 24,
    // Datos del periodo anterior para comparar
    prev_total: 38,
    prev_activos: 15,
  },
  porZona: [
    { nombre: 'Zona 1', total: 15 },
    { nombre: 'Zona 2', total: 10 },
    { nombre: 'Zona 3', total: 12 },
    { nombre: 'Zona 4', total: 7 },
  ],
  porTipo: [
    { nombre: 'Robo', valor: 18 },
    { nombre: 'Emergencia Médica', valor: 10 },
    { nombre: 'Arma Blanca', valor: 5 },
    { nombre: 'Acoso', valor: 6 },
    { nombre: 'Otro', valor: 5 },
  ],
  porHora: [
    { hora: '00:00', total: 2 }, { hora: '01:00', total: 3 }, { hora: '02:00', total: 1 },
    { hora: '03:00', total: 0 }, { hora: '04:00', total: 0 }, { hora: '05:00', total: 1 },
    { hora: '06:00', total: 2 }, { hora: '07:00', total: 5 }, { hora: '08:00', total: 8 },
    { hora: '09:00', total: 6 }, { hora: '10:00', total: 4 }, { hora: '11:00', total: 7 },
    { hora: '12:00', total: 9 }, { hora: '13:00', total: 5 }, { hora: '14:00', total: 4 },
    { hora: '15:00', total: 3 }, { hora: '16:00', total: 5 }, { hora: '17:00', total: 6 },
    { hora: '18:00', total: 8 }, { hora: '19:00', total: 7 }, { hora: '20:00', total: 5 },
    { hora: '21:00', total: 4 }, { hora: '22:00', total: 3 }, { hora: '23:00', total: 2 },
  ]
};

type Periodo = 'dia' | 'semana' | 'mes' | 'custom';

/**
 * Calcula el cambio porcentual entre dos números.
 * @param current - El valor actual.
 * @param previous - El valor del periodo anterior.
 * @returns Un objeto con el valor del cambio y si es un aumento o disminución.
 */
const calculateChange = (current: number, previous: number) => {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, type: current > 0 ? 'increase' : 'neutral' };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    type: change > 0 ? 'increase' : (change < 0 ? 'decrease' : 'neutral'),
  };
};

const DashboardPanel = () => {
  const [stats, setStats] = useState(MOCK_STATS);
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    const cargarEstadisticas = async () => {
      setCargando(true);
      try {
        let url = `${STATS_URL}/api/incidents/stats?periodo=${periodo}`;
        if (periodo === 'custom' && fechaInicio && fechaFin) {
          url = `${STATS_URL}/api/incidents/stats?inicio=${fechaInicio}&fin=${fechaFin}`;
        }
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Endpoint no disponible aún');
        }
        const data = await res.json();

        // Si el backend devuelve los datos correctamente, los seteamos
        if (data && data.globales) {
          setStats(data);
        }
      } catch (err) {
        console.warn(`Backend de estadísticas no listo para el periodo '${periodo}'. Usando datos de prueba (Mock).`, err);
        // En caso de error, dejamos que use MOCK_STATS
        setStats(MOCK_STATS);
      } finally {
        setCargando(false);
      }
    };

    cargarEstadisticas();
  }, [periodo, fechaInicio, fechaFin]);

  if (cargando) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  const totalChange = calculateChange(stats.globales.total, stats.globales.prev_total);
  const activeChange = calculateChange(stats.globales.activos, stats.globales.prev_activos);

  return (
    <div className="dashboard-panel">
      {/* FILTROS DE PERIODO */}
      <div className="dashboard-filters">
        <button className={`filter-btn ${periodo === 'dia' ? 'active' : ''}`} onClick={() => setPeriodo('dia')}>
          Hoy
        </button>
        <button className={`filter-btn ${periodo === 'semana' ? 'active' : ''}`} onClick={() => setPeriodo('semana')}>
          Últimos 7 días
        </button>
        <button className={`filter-btn ${periodo === 'mes' ? 'active' : ''}`} onClick={() => setPeriodo('mes')}>
          Últimos 30 días
        </button>
        <button className={`filter-btn ${periodo === 'custom' ? 'active' : ''}`} onClick={() => setPeriodo('custom')}>
          Personalizado
        </button>
      </div>

      {periodo === 'custom' && (
        <div className="custom-date-filter">
          <div className="date-input-group">
            <label htmlFor="fechaInicio">Desde:</label>
            <input type="date" id="fechaInicio" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          </div>
          <div className="date-input-group">
            <label htmlFor="fechaFin">Hasta:</label>
            <input type="date" id="fechaFin" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          </div>
        </div>
      )}

      {/* TARJETAS DE MÉTRICAS GLOBALES */}
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Incidentes</h3>
          <span className="stat-value">{stats.globales.total}</span>
          {totalChange.type !== 'neutral' && (
            <span className={`stat-change ${totalChange.type}`}>
              {totalChange.type === 'increase' ? '▲' : '▼'} {totalChange.value.toFixed(1)}%
            </span>
          )}
        </div>
        <div className="stat-card">
          <h3>Incidentes Activos</h3>
          <span className="stat-value text-danger">{stats.globales.activos}</span>
          {activeChange.type !== 'neutral' && (
            // Para incidentes activos, un 'decrease' es bueno (verde) y un 'increase' es malo (rojo)
            <span className={`stat-change ${activeChange.type === 'increase' ? 'increase' : 'decrease'}`}>
              {activeChange.type === 'increase' ? '▲' : '▼'} {activeChange.value.toFixed(1)}%
            </span>
          )}
        </div>
        <div className="stat-card">
          <h3>En Atención (Asumidos)</h3>
          <span className="stat-value text-warning">{stats.globales.asumidos}</span>
        </div>
        <div className="stat-card">
          <h3>Casos Cerrados</h3>
          <span className="stat-value text-success">{stats.globales.cerrados}</span>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="charts-grid">
        {/* GRÁFICO DE BARRAS: Incidentes por Zona */}
          <div className="chart-container">
          <div className={`chart-wrapper ${cargando ? 'loading' : ''}`}>
            <Bar
              data={{
                labels: stats.porZona.map((item) => item.nombre),
                datasets: [
                  {
                    label: 'Incidentes',
                    data: stats.porZona.map((item) => item.total),
                    backgroundColor: '#3498db',
                    borderRadius: 8,
                    maxBarThickness: 40,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: {
                    display: true,
                    text: 'Incidentes por Zona',
                    font: { size: 16 },
                    color: '#444',
                    padding: {
                      bottom: 10,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: (context: TooltipItem<'bar'>) => {
                        const parsed = context.parsed;
                        const value = typeof parsed === 'object' ? parsed.y : parsed ?? 0;
                        return `${value} incidentes`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: '#666' },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.08)' },
                    ticks: { color: '#666', precision: 0 },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* GRÁFICO DE PASTEL: Incidentes por Tipo */}
        <div className="chart-container">
          <div className={`chart-wrapper ${cargando ? 'loading' : ''}`}>
            <Pie
              data={{
                labels: stats.porTipo.map((item) => item.nombre),
                datasets: [
                  {
                    data: stats.porTipo.map((item) => item.valor),
                    backgroundColor: COLORS.slice(0, stats.porTipo.length),
                    hoverOffset: 8,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: 'Tipos de Emergencia',
                    font: { size: 16 },
                    color: '#444',
                    padding: {
                      bottom: 20,
                    },
                  },
                  legend: {
                    position: 'right',
                    labels: { color: '#666', boxWidth: 12, padding: 20 },
                  },
                  tooltip: {
                    callbacks: {
                      label: (context: TooltipItem<'pie'>) => {
                        const value = context.parsed ?? 0;
                        const label = context.label ?? '';
                        return `${label}: ${value}`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* GRÁFICO DE LÍNEA: Incidentes por Hora */}
        <div className="chart-container full-width-chart">
          <div className={`chart-wrapper ${cargando ? 'loading' : ''}`}>
            <Line
              data={{
                labels: stats.porHora.map((item) => item.hora),
                datasets: [
                  {
                    label: 'Incidentes',
                    data: stats.porHora.map((item) => item.total),
                    fill: true,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: '#3498db',
                    tension: 0.4,
                    pointBackgroundColor: '#3498db',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: {
                    display: true,
                    text: 'Distribución de Incidentes por Hora del Día',
                    font: { size: 16 },
                    color: '#444',
                    padding: { bottom: 20 },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;