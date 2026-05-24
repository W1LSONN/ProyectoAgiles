# Zonas UTA - Referencia para Backend
## Administración de Cámaras - Tarea #10

### 📍 Zonas Disponibles

El sistema divide la ciudad en 4 zonas UTA. El backend **DEBE** aceptar estos identificadores exactamente:

| ID | Nombre | Color (Mapa) | Coordenadas (Zona) | Descripción |
|----|--------|-------------|------------------|----|
| **zona-norte** | NORTE | Azul | [-1.2380, -78.6200] a [-1.2300, -78.6000] | Zona norte de la ciudad |
| **zona-sur** | SUR | Rojo | [-1.2550, -78.6200] a [-1.2650, -78.6000] | Zona sur de la ciudad |
| **zona-este** | ESTE | Verde | [-1.2450, -78.5950] a [-1.2350, -78.5700] | Zona este de la ciudad |
| **zona-oeste** | OESTE | Amarillo | [-1.2450, -78.6450] a [-1.2350, -78.6250] | Zona oeste de la ciudad |

---

### 🔑 Valores Válidos para el Campo `zona`

En los endpoints del API, el campo `zona` **SIEMPRE** debe ser uno de estos valores (case-insensitive recomendado):

```
zona-norte
zona-sur
zona-este
zona-oeste
```

### ⚙️ Validación en Backend

```csharp
public static class ZonaConstants
{
    public const string ZONA_NORTE = "zona-norte";
    public const string ZONA_SUR = "zona-sur";
    public const string ZONA_ESTE = "zona-este";
    public const string ZONA_OESTE = "zona-oeste";

    public static readonly string[] ZonasValidas = new[]
    {
        ZONA_NORTE,
        ZONA_SUR,
        ZONA_ESTE,
        ZONA_OESTE
    };

    public static bool EsZonaValida(string zona)
    {
        return !string.IsNullOrEmpty(zona) && 
               ZonasValidas.Contains(zona.ToLower());
    }
}

// Validación en API
if (!ZonaConstants.EsZonaValida(request.Zona))
{
    return BadRequest(new { 
        error = "Zona inválida. Debe ser uno de: zona-norte, zona-sur, zona-este, zona-oeste" 
    });
}
```

---

### 🗂️ Almacenamiento en BD

Recomendación: Guardar la zona en la tabla `Cameras` como VARCHAR(50):

```sql
ALTER TABLE Cameras
ADD CONSTRAINT CK_Cameras_Zona CHECK (
    Zona IN ('zona-norte', 'zona-sur', 'zona-este', 'zona-oeste')
);
```

---

### 🧪 Tabla de Prueba Sugerida

Para testing, crear datos de muestra:

```sql
INSERT INTO Cameras (Nombre, Ubicacion, Zona, Estado) VALUES
('Cámara Entrada Norte', 'Puerta principal zona norte', 'zona-norte', 'activa'),
('Cámara Pasillo Sur', 'Pasillo central zona sur', 'zona-sur', 'activa'),
('Cámara Estacionamiento Este', 'Planta baja zona este', 'zona-este', 'inactiva'),
('Cámara Almacén Oeste', 'Almacén zona oeste', 'zona-oeste', 'activa');
```

---

### 📋 Referencia en Código Frontend

El frontend valida zonas contra este array:

```typescript
// src/services/zonasService.ts
const ZONAS = [
  {
    id: 'zona-norte',
    nombre: 'NORTE',
    color: '#3b82f6', // Azul
    coordenadas: [...polygon coordinates...]
  },
  {
    id: 'zona-sur',
    nombre: 'SUR',
    color: '#ef4444', // Rojo
    coordenadas: [...polygon coordinates...]
  },
  {
    id: 'zona-este',
    nombre: 'ESTE',
    color: '#22c55e', // Verde
    coordenadas: [...polygon coordinates...]
  },
  {
    id: 'zona-oeste',
    nombre: 'OESTE',
    color: '#eab308', // Amarillo
    coordenadas: [...polygon coordinates...]
  }
];
```

El campo `id` en el frontend **DEBE COINCIDIR EXACTAMENTE** con el `zona` en el backend.

---

### ✅ Checklist para Backend

- [ ] Crear tabla `Cameras` con columna `Zona` VARCHAR(50)
- [ ] Agregar constraint CHECK para zonas válidas
- [ ] Validar entrada en POST/PUT que `Zona` esté en lista válida
- [ ] Filtrar correctamente en GET `/api/cameras/zona/{zonaId}`
- [ ] Usar IDs exactos: `zona-norte`, `zona-sur`, `zona-este`, `zona-oeste`
- [ ] Retornar `zona` en minúsculas en responses JSON

---

## 📞 Contacto

Para dudas sobre las zonas o sus coordenadas, revisar:
- **Frontend**: `src/services/zonasService.ts`
- **Mapas**: `src/components/MapComponent.tsx`
