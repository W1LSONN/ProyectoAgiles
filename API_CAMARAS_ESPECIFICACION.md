# Especificación de API - Administración de Cámaras
## Backend - Tarea #10

### 📋 Información General

**Responsable Backend**: [Nombre del compañero]  
**Responsable Frontend**: Completado ✅  
**Base URL**: `http://localhost:5010` (ajustar según tu configuración)  
**Prefijo de API**: `/api/cameras`

---

## 📌 Requisitos

- [ ] Crear tabla `Cameras` en la BD
- [ ] Implementar autenticación JWT (validar token en headers)
- [ ] Conectar endpoint a IncidentService cuando sea necesario

---

## 🗄️ Modelo de Datos

### Tabla: `Cameras`

```sql
CREATE TABLE Cameras (
  IdCamera INT PRIMARY KEY IDENTITY(1,1),
  Nombre NVARCHAR(255) NOT NULL,
  Ubicacion NVARCHAR(500) NOT NULL,
  Zona NVARCHAR(100) NOT NULL,  -- Referencia: 'zona-norte', 'zona-sur', 'zona-este', 'zona-oeste'
  Estado NVARCHAR(50) DEFAULT 'activa', -- 'activa', 'inactiva', 'mantenimiento'
  FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
  FechaActualizacion DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_Cameras_Zona ON Cameras(Zona);
CREATE INDEX idx_Cameras_Estado ON Cameras(Estado);
```

### Clase C#: `Camera`

```csharp
public class Camera
{
    public int IdCamera { get; set; }
    public string Nombre { get; set; }
    public string Ubicacion { get; set; }
    public string Zona { get; set; }
    public string Estado { get; set; } = "activa";
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;
}

public class CreateCameraDto
{
    public string Nombre { get; set; }
    public string Ubicacion { get; set; }
    public string Zona { get; set; }
}

public class UpdateCameraDto
{
    public string Nombre { get; set; }
    public string Ubicacion { get; set; }
    public string Zona { get; set; }
}
```

---

## 🔌 Endpoints

### 1️⃣ GET /api/cameras
**Descripción**: Obtener todas las cámaras  
**Autenticación**: JWT requerido  
**Método**: GET  

#### Request
```http
GET http://localhost:5010/api/cameras
Authorization: Bearer <JWT_TOKEN>
```

#### Response (200 OK)
```json
[
  {
    "idCamera": 1,
    "nombre": "Cámara Entrada Principal",
    "ubicacion": "Puerta principal, planta baja",
    "zona": "zona-norte",
    "estado": "activa",
    "fechaCreacion": "2026-05-24T10:30:00Z"
  },
  {
    "idCamera": 2,
    "nombre": "Cámara Pasillo 2",
    "ubicacion": "Segundo piso, pasillo central",
    "zona": "zona-sur",
    "estado": "inactiva",
    "fechaCreacion": "2026-05-24T11:15:00Z"
  }
]
```

#### Response (401 Unauthorized)
```json
{
  "error": "Token no válido o expirado"
}
```

---

### 2️⃣ POST /api/cameras
**Descripción**: Crear una nueva cámara  
**Autenticación**: JWT requerido  
**Método**: POST  
**Content-Type**: application/json  

#### Request
```http
POST http://localhost:5010/api/cameras
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "nombre": "Cámara Entrada Principal",
  "ubicacion": "Puerta principal, planta baja",
  "zona": "zona-norte"
}
```

#### Request Validations
- `nombre`: No puede estar vacío (max 255 caracteres)
- `ubicacion`: No puede estar vacía (max 500 caracteres)
- `zona`: Debe ser uno de: `zona-norte`, `zona-sur`, `zona-este`, `zona-oeste`

#### Response (201 Created)
```json
{
  "idCamera": 1,
  "nombre": "Cámara Entrada Principal",
  "ubicacion": "Puerta principal, planta baja",
  "zona": "zona-norte",
  "estado": "activa",
  "fechaCreacion": "2026-05-24T10:30:00Z"
}
```

#### Response (400 Bad Request)
```json
{
  "errors": [
    "El nombre de la cámara es obligatorio",
    "La zona debe ser una de: zona-norte, zona-sur, zona-este, zona-oeste"
  ]
}
```

---

### 3️⃣ GET /api/cameras/{id}
**Descripción**: Obtener una cámara por ID  
**Autenticación**: JWT requerido  
**Método**: GET  

#### Request
```http
GET http://localhost:5010/api/cameras/1
Authorization: Bearer <JWT_TOKEN>
```

#### Response (200 OK)
```json
{
  "idCamera": 1,
  "nombre": "Cámara Entrada Principal",
  "ubicacion": "Puerta principal, planta baja",
  "zona": "zona-norte",
  "estado": "activa",
  "fechaCreacion": "2026-05-24T10:30:00Z"
}
```

#### Response (404 Not Found)
```json
{
  "error": "Cámara no encontrada"
}
```

---

### 4️⃣ PUT /api/cameras/{id}
**Descripción**: Actualizar una cámara existente  
**Autenticación**: JWT requerido  
**Método**: PUT  
**Content-Type**: application/json  

#### Request
```http
PUT http://localhost:5010/api/cameras/1
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "nombre": "Cámara Entrada - Actualizada",
  "ubicacion": "Puerta principal nivel 0",
  "zona": "zona-norte"
}
```

#### Response (200 OK)
```json
{
  "idCamera": 1,
  "nombre": "Cámara Entrada - Actualizada",
  "ubicacion": "Puerta principal nivel 0",
  "zona": "zona-norte",
  "estado": "activa",
  "fechaCreacion": "2026-05-24T10:30:00Z"
}
```

#### Response (404 Not Found)
```json
{
  "error": "Cámara no encontrada"
}
```

---

### 5️⃣ DELETE /api/cameras/{id}
**Descripción**: Eliminar una cámara  
**Autenticación**: JWT requerido  
**Método**: DELETE  

#### Request
```http
DELETE http://localhost:5010/api/cameras/1
Authorization: Bearer <JWT_TOKEN>
```

#### Response (204 No Content)
```
(Sin body)
```

#### Response (404 Not Found)
```json
{
  "error": "Cámara no encontrada"
}
```

---

### 6️⃣ GET /api/cameras/zona/{zonaId}
**Descripción**: Obtener todas las cámaras de una zona específica  
**Autenticación**: JWT requerido  
**Método**: GET  

#### Request
```http
GET http://localhost:5010/api/cameras/zona/zona-norte
Authorization: Bearer <JWT_TOKEN>
```

#### Response (200 OK)
```json
[
  {
    "idCamera": 1,
    "nombre": "Cámara Entrada Principal",
    "ubicacion": "Puerta principal, planta baja",
    "zona": "zona-norte",
    "estado": "activa",
    "fechaCreacion": "2026-05-24T10:30:00Z"
  },
  {
    "idCamera": 3,
    "nombre": "Cámara Pasillo Norte",
    "ubicacion": "Pasillo norte, planta 1",
    "zona": "zona-norte",
    "estado": "activa",
    "fechaCreacion": "2026-05-24T12:00:00Z"
  }
]
```

#### Response (400 Bad Request)
```json
{
  "error": "Zona no válida"
}
```

---

## 🔑 Autenticación

Todos los endpoints requieren un token JWT en el header `Authorization`:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Validaciones esperadas**:
- Token presente en el header
- Token no expirado
- Token firmado con la clave correcta
- Usuario autenticado debe tener rol "Admin"

---

## ⚠️ Códigos de Error HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 204 | No Content - Eliminación exitosa |
| 400 | Bad Request - Datos inválidos o incompletos |
| 401 | Unauthorized - Token no válido o ausente |
| 403 | Forbidden - Usuario sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 🧪 Ejemplos de Testing (cURL)

### Crear Cámara
```bash
curl -X POST http://localhost:5010/api/cameras \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Cámara Entrada",
    "ubicacion": "Puerta principal",
    "zona": "zona-norte"
  }'
```

### Obtener todas las cámaras
```bash
curl -X GET http://localhost:5010/api/cameras \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener cámaras de una zona
```bash
curl -X GET http://localhost:5010/api/cameras/zona/zona-norte \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Actualizar Cámara
```bash
curl -X PUT http://localhost:5010/api/cameras/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Cámara Entrada - Actualizada",
    "ubicacion": "Entrada principal piso 1",
    "zona": "zona-norte"
  }'
```

### Eliminar Cámara
```bash
curl -X DELETE http://localhost:5010/api/cameras/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Notas de Implementación

### URL Base
- **Desarrollo**: `http://localhost:5010`
- **Producción**: Se especificará después

Actualiza la URL en `src/services/camerasService.ts` línea 13 si usas un puerto diferente.

### Base de Datos
- Usar SQL Server con Windows Authentication
- Crear la tabla en la BD de IncidentService o CamerasService (decidir)

### Validaciones
El backend DEBE validar:
- ✅ Token JWT válido
- ✅ Campos requeridos no vacíos
- ✅ Zona válida (zona-norte, zona-sur, zona-este, zona-oeste)
- ✅ ID de cámara existe antes de actualizar/eliminar

### Respuestas de Error
Usar formato consistente:
```json
{
  "error": "Mensaje descriptivo del error"
}
```

---

## 🔄 Integraciones Futuras

- [ ] Integración con sistema de grabación de cámaras
- [ ] Webhook cuando una cámara se desconecta
- [ ] Histórico de cambios de estado de cámara
- [ ] Email de notificación cuando una cámara falla

---

## 📞 Contacto

**Frontend**: Completado - CamerasPanel.tsx  
**Backend**: [Nombre del compañero] - [Email]

**Documentación Frontend**: Ver `src/components/CamerasPanel.tsx` y `src/services/camerasService.ts`

---

**Fecha de Creación**: 2026-05-24  
**Última Actualización**: 2026-05-24  
**Estado**: 🟢 Frontend Listo para Integración
