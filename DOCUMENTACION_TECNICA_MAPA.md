# 🔧 Documentación Técnica: Implementación del Mapa

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                  Admin Page (Admin.tsx)                  │
│  - Gestiona estado de incidentes (BD + SignalR)        │
│  - Controla secciones (notificaciones/mapa/customers)  │
└──────────────┬──────────────────────────────────────────┘
               │
               v
      ┌────────────────────┐
      │  MapComponent.tsx   │
      │  - Renderiza mapa   │
      │  - Gestiona zonas   │
      │  - Maneja interacción
      └────────────────────┘
               │
      ┌────────┴────────┐
      v                  v
  ┌──────────────┐  ┌──────────────┐
  │   Leaflet    │  │  zonasService│
  │ (Renderizado)│  │  (Datos)     │
  └──────────────┘  └──────────────┘
```

## Componentes Principales

### 1. MapComponent.tsx

**Responsabilidades**:
- Renderizar el mapa de Leaflet
- Mostrar polígonos de las 4 zonas
- Renderizar marcadores de incidentes
- Manejar interacción de usuario (clicks)
- Mostrar panel lateral con información

**Props**:
```typescript
interface MapComponentProps {
  incidentes: AlertaIncidente[];           // Array de incidentes a mostrar
  onZonaSeleccionada?: (zona: Zona) => void; // Callback cuando se selecciona zona
}
```

**Estados Internos**:
- `zonaActiva`: string | null - ID de la zona actualmente seleccionada
- `incidentesPorZona`: Map<string, AlertaIncidente[]> - Incidentes agrupados por zona

**Funciones Principales**:
- `handleZonaClick(zona: Zona)` - Maneja click en zona
- `getCantidadIncidentes(zonaId: string)` - Cuenta incidentes por zona
- `useEffect` - Agrupa incidentes por zona cuando cambian

### 2. zonasService.ts

**Tipos**:
```typescript
interface Zona {
  id: string;                    // ID único ('zona-norte', etc)
  nombre: string;                // Nombre visible ('Zona Norte', etc)
  color: string;                 // Color HEX (#FF6B6B, etc)
  coordenadas: [number, number][]; // Puntos del polígono [lat, lng]
}
```

**Constantes**:
```typescript
const CENTRO_UTA: [number, number] = [-1.2524, -78.6172];
const ZONAS: Zona[] = [/* 4 zonas */];
```

**Funciones Exportadas**:
- `getCentroPorZona(zonaId: string): [number, number]` - Retorna centro de zona
- `getZonaPorCoordenadas(lat, long): Zona | null` - Detecta zona por coordenadas
- `isPointInPolygon(point, polygon): boolean` - Algoritmo de detección (privado)

### 3. Admin.tsx

**Cambios Realizados**:
- Importa MapComponent y Zona
- Agregado estado `_zonaSeleccionada` para future extensiones
- Callback `onZonaSeleccionada` pasado al MapComponent
- Renderiza MapComponent cuando `seccion === 'mapa'`

**Flujo de Datos**:
```
useSignalR ('Admins')
      ↓ (nuevas alertas en tiempo real)
      ↓ 
Admin.tsx (estado: alertasWS + incidentesDB)
      ↓
MapComponent (recibe array de incidentes)
      ↓
Render (polígonos + marcadores)
```

## Integración de Datos

### Carga Inicial
```typescript
useEffect(() => {
  fetch('http://localhost:5008/api/incidents')
    .then(r => r.json())
    .then((data: any[]) => {
      // Mapea respuesta de API al tipo AlertaIncidente
      const mapeados: AlertaIncidente[] = data.map(i => ({...}));
      setIncidentesDB(mapeados);
    })
}, []);
```

### Actualización en Tiempo Real
```typescript
// En useSignalR.ts
conn.on('RecibirAlertaIncidente', (data: AlertaIncidente) => {
  agregarAlerta(data); // Se agrega al estado
});

// En Admin.tsx
const alertas = [...alertasWS, ...incidentesDB]; // Combinación
```

## Estilos CSS

### Estructura CSS
```
MapComponent.css
├── .map-component          // Contenedor principal (flex)
│   ├── .map-container      // Contenedor del mapa
│   └── .map-legend         // Panel lateral
│       ├── .zonas-list     // Lista de zonas
│       │   └── .zona-item  // Cada zona
│       └── .zona-incidentes // Detalle de zona activa
├── Popups (.popup-zona, .popup-incidente)
├── Marcadores
└── Responsive (@media)
```

### Colores de Zonas
- **Norte**: #FF6B6B (Rojo)
- **Sur**: #4ECDC4 (Turquesa)
- **Este**: #45B7D1 (Azul)
- **Oeste**: #FFA502 (Naranja)

### Estados de Zona
```css
/* Inactivo */
opacity: 0.6;
fillOpacity: 0.2;
dashArray: '5, 5'; /* Línea punteada */

/* Activo */
opacity: 0.9;
fillOpacity: 0.4;
dashArray: undefined; /* Línea sólida */
```

## Algoritmo Point-in-Polygon

Implementado para detectar si un punto está dentro de un polígono:

```typescript
const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) && 
                      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};
```

## Configuración de Leaflet

### MapContainer Props
```jsx
<MapContainer
  center={[-1.2524, -78.6172] as L.LatLngExpression}
  zoom={15}
  style={{ height: '100%', width: '100%' }}
>
```

### TileLayer (OpenStreetMap)
```jsx
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution="&copy; OpenStreetMap contributors"
  maxZoom={19}
/>
```

### Polygon Props
```jsx
<Polygon
  positions={zona.coordenadas}
  pathOptions={{
    color: zona.color,
    weight: 3,
    opacity: zonaActiva === zona.id ? 0.9 : 0.6,
    fillOpacity: zonaActiva === zona.id ? 0.4 : 0.2,
    fillColor: zona.color,
    dashArray: zonaActiva === zona.id ? undefined : '5, 5',
  }}
  eventHandlers={{ click: () => handleZonaClick(zona) }}
>
```

## Extensiones Futuras

### 1. Geolocalización Real
**Cambio Necesario**:
```typescript
// Reemplazar generación aleatoria en MapComponent:
const lat = latBase + (Math.random() - 0.5) * 0.003;
const long = longBase + (Math.random() - 0.5) * 0.003;

// Con coordenadas reales del incidente:
const lat = incidente.latitud;  // Desde API
const long = incidente.longitud; // Desde API
```

### 2. Búsqueda y Filtros
**Agregar a MapComponent**:
```typescript
const [filtroTipo, setFiltroTipo] = useState<string>('');
const incidentesFiltrads = incidentes.filter(i => 
  filtroTipo === '' || i.tipoIncidente === filtroTipo
);
```

### 3. Exportar a PDF
**Librería**: `html2pdf` o `jsPDF`
```bash
npm install jspdf html2canvas
```

### 4. Heatmap
**Librería**: `leaflet-heatmap`
```bash
npm install leaflet-heatmap
```

### 5. Asignación de Guardias
**Componente Nuevo**: `GuardiaAsignmentModal`
- Abrir modal al hacer click-derecho en incidente
- Seleccionar guardia disponible
- Enviar asignación a API

### 6. Historial de Incidentes
**Cambio en API**: Agregar endpoint `GET /api/incidents/zona/{zonaId}/history`
```typescript
const [historial, setHistorial] = useState([]);
useEffect(() => {
  if (zonaActiva) {
    fetch(`/api/incidents/zona/${zonaActiva}/history`)
      .then(r => r.json())
      .then(setHistorial);
  }
}, [zonaActiva]);
```

## Notas de Mantenimiento

### Dependencias Críticas
- **leaflet**: 1.9.4+ (mapa)
- **react-leaflet**: 5.0.0+ (bindings React)
- **@types/leaflet**: Para tipos TypeScript

### Puertos Necesarios
- **5008**: IncidentService (GET /api/incidents)
- **5013**: NotificationService (SignalR para alertas)

### URLs Hardcodeadas
- `http://localhost:5008/api/incidents` - En Admin.tsx línea 20
- Centro mapa: `-1.2524, -78.6172` - En MapComponent.tsx línea 77

### Coordenadas de Zonas
Ubicadas en `zonasService.ts` - Modificar array `ZONAS` para ajustar límites

## Performance

### Optimizaciones Aplicadas
- React.memo() podría usarse para MapComponent si recibe muchos re-renders
- Agrupación de incidentes por zona (Map) evita búsquedas O(n²)

### Posibles Mejoras
```typescript
// Memorizar MapComponent
const MapComponentMemo = React.memo(MapComponent);

// Limitar incidentes mostrados a 100 más recientes
const incidentesVisibles = alertas.slice(0, 100);

// Virtualización para muchos incidentes
import { FixedSizeList } from 'react-window';
```

## Testing

### Unit Tests (Propuesto)
```typescript
// zonasService.test.ts
describe('isPointInPolygon', () => {
  it('debe detectar punto dentro de polígono', () => {
    const zona = ZONAS[0];
    const centro = getCentroPorZona(zona.id);
    expect(isPointInPolygon(centro, zona.coordenadas)).toBe(true);
  });
});

// MapComponent.test.tsx
describe('MapComponent', () => {
  it('debe renderizar 4 zonas', () => {
    const { container } = render(<MapComponent incidentes={[]} />);
    expect(container.querySelectorAll('.leaflet-polygon')).toHaveLength(4);
  });
});
```

### E2E Tests (Propuesto - Cypress)
```typescript
describe('Mapa de Admin', () => {
  beforeEach(() => {
    cy.login('admin');
    cy.visit('/admin');
    cy.contains('Mapa').click();
  });

  it('debe mostrar las 4 zonas', () => {
    cy.get('.leaflet-polygon').should('have.length', 4);
  });

  it('debe mostrar incidentes como marcadores', () => {
    cy.get('.leaflet-marker-icon').should('have.length.greaterThan', 0);
  });

  it('debe filtrar incidentes al hacer click en zona', () => {
    cy.get('.leaflet-polygon').first().click();
    cy.get('.zona-incidentes').should('be.visible');
  });
});
```

## Deployement

### Build
```bash
npm run build  # Genera dist/
```

### Variables de Entorno (Recomendado)
```env
VITE_API_INCIDENTS_URL=http://localhost:5008/api/incidents
VITE_MAP_CENTER_LAT=-1.2524
VITE_MAP_CENTER_LNG=-78.6172
VITE_MAP_ZOOM=15
```

### Actualizar Código
```typescript
// En Admin.tsx
const API_URL = import.meta.env.VITE_API_INCIDENTS_URL || 
                'http://localhost:5008/api/incidents';
fetch(API_URL).then(...)

// En MapComponent.tsx
const MAP_CENTER: L.LatLngExpression = [
  parseFloat(import.meta.env.VITE_MAP_CENTER_LAT || '-1.2524'),
  parseFloat(import.meta.env.VITE_MAP_CENTER_LNG || '-78.6172'),
];
```

---

**Última actualización**: 2026-05-23  
**Versión**: 1.0.0  
**Autor**: Sistema de Alerta UTA
