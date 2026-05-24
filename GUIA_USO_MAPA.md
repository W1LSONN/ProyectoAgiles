# 🗺️ Guía de Uso: Mapa del Campus UTA

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Backend (AuthService, IncidentService, NotificationService) ejecutándose

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
cd frontend/uta-alerta-web
npm install
```

### 2. Ejecutar en Modo Desarrollo
```bash
npm run dev
# Abrirá en http://localhost:5173
```

### 3. Acceder al Panel Admin
```
URL: http://localhost:5173/admin
Usuario: (verificar credenciales en el sistema)
Contraseña: (verificar credenciales en el sistema)
```

### 4. Navegar a la Sección Mapa
- Click en el botón "Mapa" en el sidebar izquierdo
- Verás el mapa de la UTA con las 4 zonas coloreadas

## 🎮 Funcionalidades Disponibles

### Ver el Mapa
- El mapa muestra la UTA centrada en coordenadas reales
- 4 zonas del campus son visibles como polígonos de colores
- Puedes hacer zoom y pan con el ratón

### Incidentes Activos
- Los incidentes existentes aparecen como marcadores en el mapa
- Cada marcador tiene un color específico para incidentes
- Al hacer click en un marcador, verás un popup con:
  - Tipo de incidente
  - Zona
  - Usuario que reportó
  - Fecha y hora
  - Descripción del incidente

### Seleccionar una Zona
1. Haz click en cualquier polígono de zona en el mapa
   - O click en la zona en el panel derecho ("Zonas de la UTA")
2. La zona se resaltará (mayor opacidad)
3. El panel derecho mostrará:
   - Lista de incidentes en esa zona
   - Detalles de cada incidente

### Información en Tiempo Real
- Si se crea un nuevo incidente en otra sesión:
  - Un marcador nuevo aparecerá automáticamente
  - Si pertenece a la zona seleccionada, se agregará a la lista

## 🔍 Detalles de las Zonas

| Zona | Color | Ubicación |
|------|-------|-----------|
| **Norte** | 🔴 Rojo | Sector norte del campus |
| **Sur** | 🔵 Turquesa | Sector sur del campus |
| **Este** | 🟦 Azul claro | Sector este del campus |
| **Oeste** | 🟠 Naranja | Sector oeste del campus |

Cada zona muestra:
- Polígono con borde punteado (inactivo) o sólido (activo)
- Contador de incidentes activos
- Lista de incidentes al seleccionar

## 📍 Prueba de API - Crear Incidente de Prueba

Para generar un incidente de prueba en el mapa:

```bash
# Usar curl o Postman
POST http://localhost:5008/api/incidents

Body (JSON):
{
  "idUsuario": 1,
  "zona": "Zona Norte",
  "tipoIncidente": "Incidente de Prueba",
  "descripcion": "Esto es un test del mapa"
}
```

El incidente:
- Aparecerá en el mapa en la zona correspondiente
- Se mostrará en el panel lateral
- Se actualizará en tiempo real para todos los usuarios conectados

## 🛠️ Troubleshooting

### El mapa no aparece
- Verifica que el servidor de desarrollo está ejecutándose (`npm run dev`)
- Abre la consola del navegador (F12) para errores
- Verifica que las dependencias se instalaron: `npm list leaflet react-leaflet`

### Los incidentes no aparecen
- Verifica que el IncidentService está en el puerto 5008
- Abre DevTools → Network → observa si se hace GET a `/api/incidents`
- Verifica que hay incidentes en la base de datos

### SignalR no actualiza en tiempo real
- Verifica que el NotificationService está ejecutándose
- Verifica que estás conectado al grupo "Admins" (el código lo hace automáticamente)
- Abre DevTools → Console → verifica mensajes de SignalR

## 🔨 Compilación para Producción

```bash
npm run build
# Genera carpeta 'dist/' lista para deploy
```

## 📊 Flujo de Datos

```
┌─────────────────┐
│  DB (Incidentes)│
└────────┬────────┘
         │
         v
┌─────────────────────────────┐
│  IncidentService (5008)      │
│  GET /api/incidents          │
└────────┬────────────────────┘
         │
         v
┌───────────────────────┐
│  Admin.tsx (página)   │
│  - Carga inicial      │
│  - Actualización real │
└────────┬──────────────┘
         │
         v
┌─────────────────────────────┐
│  MapComponent (renderiza)    │
│  - Polígonos de zonas        │
│  - Marcadores de incidentes  │
│  - Panel lateral             │
└─────────────────────────────┘
```

## 📝 Notas Importantes

1. **Coordenadas de Incidentes**: Actualmente se generan aleatoriamente dentro de cada zona. Para producción, se recomienda utilizar coordenadas reales del incidente.

2. **Centro del Mapa**: Está configurado en `-1.2524, -78.6172` (Campus UTA en Tungurahua, Ecuador)

3. **Zoom**: Iniciado en nivel 15 para ver el campus completo

4. **Tiles**: Se usan tiles de OpenStreetMap (acceso público, sin API key requerida)

## 📞 Soporte

Para reportar problemas o mejoras:
1. Abre una issue en el repositorio
2. Incluye:
   - Screenshot del problema
   - Pasos para reproducir
   - Logs de la consola (DevTools)
   - Navegador y versión

---

**Última actualización**: 2026-05-23  
**Versión**: 1.0.0
