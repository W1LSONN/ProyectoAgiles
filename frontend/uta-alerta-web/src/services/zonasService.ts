// Definición de las 4 zonas de la UTA con sus polígonos
// Coordenadas ficticias pero realistas para la región de Tungurahua, Ecuador

export interface Zona {
  id: string;
  nombre: string;
  color: string;
  coordenadas: [number, number][]; // [latitud, longitud]
}

// Centro aproximado de la UTA: -1.2524° (latitud), -78.6172° (longitud)
const CENTRO_UTA: [number, number] = [-1.2524, -78.6172];

export const ZONAS: Zona[] = [
  {
    id: 'zona-norte',
    nombre: 'Zona Norte',
    color: '#FF6B6B', // Rojo
    coordenadas: [
      [-1.2400, -78.6250],
      [-1.2400, -78.6100],
      [-1.2500, -78.6100],
      [-1.2500, -78.6250],
    ],
  },
  {
    id: 'zona-sur',
    nombre: 'Zona Sur',
    color: '#4ECDC4', // Turquesa
    coordenadas: [
      [-1.2600, -78.6250],
      [-1.2600, -78.6100],
      [-1.2700, -78.6100],
      [-1.2700, -78.6250],
    ],
  },
  {
    id: 'zona-este',
    nombre: 'Zona Este',
    color: '#45B7D1', // Azul
    coordenadas: [
      [-1.2500, -78.6000],
      [-1.2500, -78.5850],
      [-1.2600, -78.5850],
      [-1.2600, -78.6000],
    ],
  },
  {
    id: 'zona-oeste',
    nombre: 'Zona Oeste',
    color: '#FFA502', // Naranja
    coordenadas: [
      [-1.2500, -78.6350],
      [-1.2500, -78.6200],
      [-1.2600, -78.6200],
      [-1.2600, -78.6350],
    ],
  },
];

export const getCentroPorZona = (zonaId: string): [number, number] => {
  const zona = ZONAS.find(z => z.id === zonaId);
  if (!zona) return CENTRO_UTA;

  const lats = zona.coordenadas.map(([lat]) => lat);
  const longs = zona.coordenadas.map(([, long]) => long);

  const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const avgLong = longs.reduce((a, b) => a + b, 0) / longs.length;

  return [avgLat, avgLong];
};

export const getZonaPorCoordenadas = (lat: number, long: number): Zona | null => {
  // Verificar si las coordenadas están dentro de alguna zona usando algoritmo point-in-polygon simple
  for (const zona of ZONAS) {
    if (isPointInPolygon([lat, long], zona.coordenadas)) {
      return zona;
    }
  }
  return null;
};

// Algoritmo point-in-polygon (ray casting)
const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};
