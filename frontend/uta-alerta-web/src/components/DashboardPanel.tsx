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
  Filler,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import './DashboardPanel.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend, Title, Filler);

const STATS_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';

const COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#34495e', '#e67e22'];

type ZonaStat = { nombre: string; total: number };
type TipoStat = { nombre: string; valor: number };
type HoraStat = { hora: string; total: number };
type GlobalStats = {
  total: number;
  activos: number;
  asumidos: number;
  cerrados: number;
  prev_total: number;
  prev_activos: number;
};

type DashboardStats = {
  globales: GlobalStats;
  porZona: ZonaStat[];
  porTipo: TipoStat[];
  porHora: HoraStat[];
};

const EMPTY_STATS: DashboardStats = {
  globales: { total: 0, activos: 0, asumidos: 0, cerrados: 0, prev_total: 0, prev_activos: 0 },
  porZona: [],
  porTipo: [],
  porHora: Array.from({ length: 24 }, (_, i) => ({ hora: `${String(i).padStart(2, '0')}:00`, total: 0 })),
};

type Periodo = 'dia' | 'semana' | 'mes' | 'custom';

const calculateChange = (current: number, previous: number) => {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, type: current > 0 ? 'increase' : 'neutral' };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral',
  };
};

const DashboardPanel = () => {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mensajeFiltro, setMensajeFiltro] = useState('');
  const [customFilterApplied, setCustomFilterApplied] = useState(false);

  const fetchEstadisticas = async (periodoParam: Periodo, inicio?: string, fin?: string) => {
    setCargando(true);
    setMensajeFiltro('');

    try {
      let url = `${STATS_URL}/api/incidents/stats?periodo=${periodoParam}`;
      if (periodoParam === 'custom' && inicio && fin) {
        url = `${STATS_URL}/api/incidents/stats?periodo=custom&inicio=${inicio}&fin=${fin}`;
      }

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Endpoint no disponible aún');
      }

      const data = await res.json();
      if (data && data.globales) {
        setStats(data);
        if (periodoParam === 'custom' && (data.globales.total ?? 0) === 0) {
          setMensajeFiltro('No hay datos para el rango de fechas seleccionado.');
        }
      } else {
        setStats(EMPTY_STATS);
        if (periodoParam === 'custom') {
          setMensajeFiltro('No hay datos para el rango de fechas seleccionado.');
        }
      }
    } catch (error) {
      console.warn(`Error al cargar estadísticas para el periodo '${periodoParam}'.`, error);
      setStats(EMPTY_STATS);
      if (periodoParam === 'custom') {
        setMensajeFiltro('No hay datos para el rango de fechas seleccionado.');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (periodo !== 'custom') {
      setCustomFilterApplied(false);
      fetchEstadisticas(periodo);
    } else {
      setStats(EMPTY_STATS);
      setCargando(false);
      setMensajeFiltro('');
      setCustomFilterApplied(false);
    }
  }, [periodo]);

  const handleApplyFilters = () => {
    setMensajeFiltro('');

    if (!fechaInicio || !fechaFin) {
      setStats(EMPTY_STATS);
      setCustomFilterApplied(false);
      setMensajeFiltro('Seleccione una fecha de inicio y una fecha de fin.');
      return;
    }

    const inicioDate = new Date(fechaInicio);
    const finDate = new Date(fechaFin);
    if (finDate < inicioDate) {
      setStats(EMPTY_STATS);
      setCustomFilterApplied(false);
      setMensajeFiltro('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
      return;
    }

    setCustomFilterApplied(true);
    fetchEstadisticas('custom', fechaInicio, fechaFin);
  };

  const hayDatosParaGraficos = (stats.globales?.total ?? 0) > 0;

  if (cargando) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  const totalChange = calculateChange(stats.globales?.total ?? 0, stats.globales?.prev_total ?? 0);
  const activeChange = calculateChange(stats.globales?.activos ?? 0, stats.globales?.prev_activos ?? 0);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-filters">
        <button type="button" className={`filter-btn ${periodo === 'dia' ? 'active' : ''}`} onClick={() => { setPeriodo('dia'); setMensajeFiltro(''); }}>
          Hoy
        </button>
        <button type="button" className={`filter-btn ${periodo === 'semana' ? 'active' : ''}`} onClick={() => { setPeriodo('semana'); setMensajeFiltro(''); }}>
          Últimos 7 días
        </button>
        <button type="button" className={`filter-btn ${periodo === 'mes' ? 'active' : ''}`} onClick={() => { setPeriodo('mes'); setMensajeFiltro(''); }}>
          Últimos 30 días
        </button>
        <button type="button" className={`filter-btn ${periodo === 'custom' ? 'active' : ''}`} onClick={() => { setPeriodo('custom'); setMensajeFiltro(''); }}>
          Personalizado
        </button>
      </div>

      {periodo === 'custom' && (
        <div className="custom-date-filter">
          <div className="date-input-group">
            <label htmlFor="fechaInicio">Desde:</label>
            <input type="date" id="fechaInicio" value={fechaInicio} onChange={e => { setFechaInicio(e.target.value); setMensajeFiltro(''); setCustomFilterApplied(false); }} />
          </div>
          <div className="date-input-group">
            <label htmlFor="fechaFin">Hasta:</label>
            <input type="date" id="fechaFin" value={fechaFin} onChange={e => { setFechaFin(e.target.value); setMensajeFiltro(''); setCustomFilterApplied(false); }} />
          </div>
          <div className="date-apply-row">
            <button type="button" className="apply-filters-btn" onClick={handleApplyFilters} disabled={!fechaInicio || !fechaFin}>
              Aplicar filtros
            </button>
          </div>
          {!customFilterApplied && !mensajeFiltro && (
            <div className="dashboard-filter-hint" style={{ marginTop: '12px', color: '#555' }}>
              Selecciona un rango de fechas y pulsa "Aplicar filtros" para ver resultados personalizados.
            </div>
          )}
        </div>
      )}

      {mensajeFiltro && (
        <div className="dashboard-filter-message" style={{ margin: '16px 0', color: '#c0392b', fontWeight: 600 }}>
          {mensajeFiltro}
        </div>
      )}

      {periodo === 'custom' && !customFilterApplied ? (
        <div className="dashboard-empty" style={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          padding: '40px 20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          marginTop: '20px',
          color: '#666',
          border: '1px dashed #ddd',
        }}>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>
            📊 Selecciona un rango de fechas y pulsa "Aplicar filtros" para ver el resultado personalizado.
          </p>
        </div>
      ) : (
        <>
          <div className="stats-cards">
            <div className="stat-card">
              <h3>Total Incidentes</h3>
              <span className="stat-value">{stats.globales?.total ?? 0}</span>
              {totalChange.type !== 'neutral' && <span className={`stat-change ${totalChange.type}`}>{totalChange.type === 'increase' ? '▲' : '▼'} {totalChange.value.toFixed(1)}%</span>}
            </div>
            <div className="stat-card">
              <h3>Incidentes Activos</h3>
              <span className="stat-value text-danger">{stats.globales?.activos ?? 0}</span>
              {activeChange.type !== 'neutral' && <span className={`stat-change ${activeChange.type === 'increase' ? 'increase' : 'decrease'}`}>{activeChange.type === 'increase' ? '▲' : '▼'} {activeChange.value.toFixed(1)}%</span>}
            </div>
            <div className="stat-card">
              <h3>En Atención (Asumidos)</h3>
              <span className="stat-value text-warning">{stats.globales?.asumidos ?? 0}</span>
            </div>
            <div className="stat-card">
              <h3>Casos Cerrados</h3>
              <span className="stat-value text-success">{stats.globales?.cerrados ?? 0}</span>
            </div>
          </div>

          {!cargando && !hayDatosParaGraficos ? (
            <div className="dashboard-empty" style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              marginTop: '20px',
              color: '#666',
              border: '1px dashed #ddd',
            }}>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                📊 No hay datos de incidentes para el periodo seleccionado.
              </p>
            </div>
          ) : (
            <div className="charts-grid">
              <div className="chart-container">
                <div className={`chart-wrapper ${cargando ? 'loading' : ''}`}>
                  <Bar
                    data={{
                      labels: (stats.porZona || []).map((item) => item.nombre),
                      datasets: [
                        {
                          label: 'Incidentes',
                          data: (stats.porZona || []).map((item) => item.total),
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
                          padding: { bottom: 10 },
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

              <div className="chart-container">
                <div className={`chart-wrapper ${cargando ? 'loading' : ''}`}>
                  <Pie
                    data={{
                      labels: (stats.porTipo || []).map((item) => item.nombre),
                      datasets: [
                        {
                          data: (stats.porTipo || []).map((item) => item.valor),
                          backgroundColor: COLORS.slice(0, (stats.porTipo || []).length),
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
                          padding: { bottom: 20 },
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

              <div className="chart-container full-width-chart">
                <div className={`chart-wrapper ${cargando ? 'loading' : ''}`}>
                  <Line
                    data={{
                      labels: (stats.porHora || []).map((item) => item.hora),
                      datasets: [
                        {
                          label: 'Incidentes',
                          data: (stats.porHora || []).map((item) => item.total),
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
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPanel;
