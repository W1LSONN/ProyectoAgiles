// Definición de las 4 zonas de la UTA con sus polígonos
// Coordenadas ficticias pero realistas para la región de Tungurahua, Ecuador

export interface Zona {
  id: string;
  nombre: string;
  color: string;
  coordenadas: [number, number][]; // [latitud, longitud]
}

// Centro del Campus Huachi UTA
const CENTRO_UTA: [number, number] = [-1.2688, -78.6248];

export const ZONAS: Zona[] = [
  {
    id: 'zona 1',
    nombre: 'Zona 1',
    color: '#FF4444', // Rojo
    coordenadas: [
      [-1.266416, -78.625299], // Esquina Noroeste
      [-1.266498, -78.624148], // Medio Superior
      [-1.268590, -78.624238], // Centro Absoluto
      [-1.268400, -78.625831], // Medio Izquierdo
      [-1.266416, -78.625299], // Cierre
    ],
  },
  {
    id: 'zona 2',
    nombre: 'Zona 2',
    color: '#44FF44', // Verde
    coordenadas: [
      [-1.268590, -78.624238], // Centro Absoluto
      [-1.268779, -78.622644], // Medio Derecho
      [-1.270979, -78.622292], // Esquina Sureste
      [-1.270681, -78.624328], // Medio Inferior
      [-1.268590, -78.624238], // Cierre
    ],
  },
  {
    id: 'zona 3',
    nombre: 'Zona 3',
    color: '#4444FF', // Azul
    coordenadas: [
      [-1.266498, -78.624148], // Medio Superior
      [-1.266580, -78.622997], // Esquina Noreste
      [-1.268779, -78.622644], // Medio Derecho
      [-1.268590, -78.624238], // Centro Absoluto
      [-1.266498, -78.624148], // Cierre
    ],
  },
  {
    id: 'zona 4',
    nombre: 'Zona 4',
    color: '#FFD700', // Amarillo
    coordenadas: [
      [-1.268400, -78.625831], // Medio Izquierdo
      [-1.268590, -78.624238], // Centro Absoluto
      [-1.270681, -78.624328], // Medio Inferior
      [-1.270384, -78.626364], // Esquina Suroeste
      [-1.268400, -78.625831], // Cierre
    ],
  },
];

export const getCentroPorZona = (zonaId: string): [number, number] => {
  const centros: Record<string, [number, number]> = {
    'zona 1': [-1.267476, -78.624879],
    'zona 2': [-1.269757, -78.623375],
    'zona 3': [-1.267611, -78.623506],
    'zona 4': [-1.269513, -78.625190],
  };
  return centros[zonaId] || CENTRO_UTA;
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
