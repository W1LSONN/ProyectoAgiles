// Copia ligera de zonasService desde la versión web para mapear zonas en la imagen
export interface Zona {
  id: string;
  nombre: string;
  color: string;
  coordenadas: [number, number][];
}

const CENTRO_UTA: [number, number] = [-1.2688, -78.6248];

export const ZONAS: Zona[] = [
  { id: 'zona 1', nombre: 'Zona 1', color: '#FF4444', coordenadas: [[-1.266416, -78.625299],[-1.266498, -78.624148],[-1.268590, -78.624238],[-1.268400, -78.625831],[-1.266416, -78.625299]] },
  { id: 'zona 2', nombre: 'Zona 2', color: '#44FF44', coordenadas: [[-1.268590, -78.624238],[-1.268779, -78.622644],[-1.270979, -78.622292],[-1.270681, -78.624328],[-1.268590, -78.624238]] },
  { id: 'zona 3', nombre: 'Zona 3', color: '#4444FF', coordenadas: [[-1.266498, -78.624148],[-1.266580, -78.622997],[-1.268779, -78.622644],[-1.268590, -78.624238],[-1.266498, -78.624148]] },
  { id: 'zona 4', nombre: 'Zona 4', color: '#FFD700', coordenadas: [[-1.268400, -78.625831],[-1.268590, -78.624238],[-1.270681, -78.624328],[-1.270384, -78.626364],[-1.268400, -78.625831]] },
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
