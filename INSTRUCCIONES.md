# Guía de Inicio del Proyecto: Uta Alerta 🚀

Este documento contiene las instrucciones detalladas paso a paso para levantar los **5 servicios** de la aplicación y configurar el entorno de **Android Studio** para la aplicación móvil.

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:
1. **Node.js** (versión 18 o superior recomendada)
2. **.NET SDK 10.0** (o la versión de .NET instalada en tu sistema)
3. **SQL Server Express** (configurado con la instancia predeterminada `localhost\SQLEXPRESS`)
4. **Android Studio** (con el Android SDK y un emulador configurado, o un teléfono físico con depuración USB activa)

---

## 🗄️ Paso 1: Configurar y Actualizar las Bases de Datos

Los 3 servicios del backend utilizan SQL Server Express. Debemos crear y actualizar las bases de datos ejecutando las migraciones de Entity Framework.

1. Abre una terminal de PowerShell (o tu terminal favorita).
2. Si no tienes instaladas las herramientas globales de Entity Framework Core, instálalas con este comando:
   ```bash
   dotnet tool install --global dotnet-ef
   ```
3. Ejecuta las migraciones en cada uno de los 3 servicios del backend:

   * **Servicio de Autenticación (AuthService)**:
     ```powershell
     cd .\backend\AuthService\AuthService\
     dotnet ef database update
     cd ..\..\..\
     ```

   * **Servicio de Incidentes (IncidentService)**:
     ```powershell
     cd .\backend\IncidentService\IncidentService\
     dotnet ef database update
     cd ..\..\..\
     ```

   * **Servicio de Notificaciones (NotificationService)**:
     ```powershell
     cd .\backend\NotificationService\NotificationService\
     dotnet ef database update
     cd ..\..\..\
     ```

---

## 🚦 Paso 2: Cómo Levantar los 5 Servicios

Para levantar toda la solución, te sugerimos abrir terminales independientes (puedes usar pestañas en Windows Terminal o VS Code) para cada servicio.

### 🔹 Servicio 1: AuthService (Backend)
* **Función**: Maneja el registro, inicio de sesión y validación de usuarios (JWT).
* **Comandos**:
  ```powershell
  cd .\backend\AuthService\AuthService\
  dotnet run
  ```

### 🔹 Servicio 2: IncidentService (Backend)
* **Función**: Administra el registro y procesamiento de incidentes de seguridad.
* **Comandos**:
  ```powershell
  cd .\backend\IncidentService\IncidentService\
  dotnet run
  ```

### 🔹 Servicio 3: NotificationService (Backend)
* **Función**: Envía notificaciones push y alertas en tiempo real usando SignalR.
* **Comandos**:
  ```powershell
  cd .\backend\NotificationService\NotificationService\
  dotnet run
  ```

### 🔹 Servicio 4: uta-alerta-web (Frontend Web)
* **Función**: Panel de control administrativo y visualización de incidentes.
* **Comandos**:
  ```powershell
  cd .\frontend\uta-alerta-web\
  npm install
  npm run dev
  ```
* **Acceso**: Abre en tu navegador la dirección que indique la consola (normalmente `http://localhost:5173`).

### 🔹 Servicio 5: uta-alerta-mobile (Frontend Móvil)
* **Función**: Aplicación móvil para los usuarios finales (desarrollada con Ionic/Capacitor).
* **Comandos para probar en navegador**:
  ```powershell
  cd .\frontend\uta-alerta-mobile\
  npm install
  npm run dev
  ```

---

## 📱 Guía para Configurar y Correr en Android Studio

La aplicación móvil utiliza **Capacitor** para empaquetar el frontend en una aplicación nativa de Android. Dado que el proyecto no incluye la carpeta nativa `/android` en el repositorio, debes seguir estos pasos para generarla e iniciar el simulador.

### 0. Instalación y Configuración Básica de Android Studio (Si es tu primera vez)
Si nunca has usado Android Studio, primero debes preparar el entorno:

1. **Descarga e Instala Android Studio**: Ve a [developer.android.com/studio](https://developer.android.com/studio) y descárgalo. Durante la instalación, asegúrate de marcar las casillas para instalar el **Android SDK** y el **Android Virtual Device (AVD)**.
2. **Para usar un Emulador (Teléfono Virtual)**:
   - Abre Android Studio y ve a **Device Manager** (o *Tools > Device Manager*).
   - Haz clic en **Create Device**, elige un modelo (ej. Pixel 6), descarga una versión del sistema (ej. API 33 o superior) y dale a Finalizar.
   - Presiona el botón de "Play" al lado de tu nuevo dispositivo virtual para que se inicie y quede encendido.
3. **Para usar tu Teléfono Físico (Alternativa)**:
   - Ve a los "Ajustes" de tu celular > "Acerca del teléfono" y toca 7 veces seguidas en "Número de compilación" para activar las **Opciones de Desarrollador**.
   - Entra a las "Opciones de Desarrollador" y activa **Depuración por USB**.
   - Conecta tu celular a la PC con un cable USB original (acepta el permiso que salga en tu pantalla).


### 1. Preparar la Aplicación Móvil
En tu terminal, ve a la carpeta del proyecto móvil:
```powershell
cd .\frontend\uta-alerta-mobile\
```


1. **Instalar dependencias de Node**:
   ```powershell
   npm install
   ```

2. **Compilar el proyecto frontend**:
   Esto generará la carpeta `dist` con los archivos web compilados.
   ```powershell
   npm run build
   ```

3. **Agregar la plataforma de Android**:
   Este comando creará la carpeta nativa `android/` en tu directorio local.
   ```powershell
   npx cap add android
   ```

4. **Sincronizar el código compilado con el proyecto nativo**:
   Copia el contenido de `dist/` a la carpeta de Android de forma automática.
   ```powershell
   npx cap sync android
   ```

### 2. Abrir el proyecto en Android Studio
Puedes abrir Android Studio de dos maneras:
* **Forma Automática (Recomendada)**: Ejecuta este comando en la terminal desde `frontend/uta-alerta-mobile`:
  ```powershell
  npx cap open android
  ```
* **Forma Manual**: Abre Android Studio, selecciona **Open project** y busca la carpeta `c:\Users\USER\Desktop\AgilesPRo\ProyectoAgiles\frontend\uta-alerta-mobile\android`.

### 3. Ejecutar la App en el Emulador / Teléfono Físico
Una vez abierto el proyecto en Android Studio:
1. **Espera a que Gradle termine de sincronizar**: Verás una barra de progreso en la parte inferior derecha. Espera a que termine por completo.
2. **Selecciona un dispositivo**: En la barra superior de Android Studio, selecciona tu emulador (por ejemplo, *Pixel 6*) o tu teléfono físico conectado vía USB (debe tener activada la "Depuración USB" en opciones de desarrollador).
3. **Presiona Run**: Haz clic en el botón de **Play** (triángulo verde 🟢) en la barra superior o presiona `Shift + F10`. La aplicación se compilará y se instalará en el dispositivo.

> 💡 **Nota Importante para Desarrollo Activo**:
> Si haces cambios en el código de React/TS de la app móvil y quieres verlos reflejados en el emulador, debes ejecutar en tu terminal:
> ```powershell
> npm run build
> npx cap sync android
> ```
> Y luego volver a presionar **Run** (Play) en Android Studio para redesplegar.

---

## 🌐 Configurar Conectividad Móvil con Ngrok (Opcional)

Si ejecutas la app móvil en un **teléfono físico** que no está en la misma red Wi-Fi que tu computadora (o si tienes problemas con tu IP local), puedes usar **Ngrok** para exponer los servicios backend a Internet de forma segura.

1. **Instala Ngrok**: Descárgalo desde [ngrok.com](https://ngrok.com/) y autentica tu cuenta con el authtoken que te dan en la página:
   ```bash
   ngrok config add-authtoken <TU_TOKEN>
   ```

2. **Exponer los Servicios Backend**:
   Abre tres terminales nuevas y ejecuta un comando en cada una para exponer los puertos de tus servicios:
   
   * Terminal 1 (AuthService):
     ```bash
     ngrok http 5007
     ```
   * Terminal 2 (IncidentService):
     ```bash
     ngrok http 5008
     ```
   * Terminal 3 (NotificationService):
     ```bash
     ngrok http 5009
     ```

3. **Actualizar el archivo `.env` en el frontend móvil**:
   Copia las URLs seguras (`https://....ngrok-free.app`) que te da Ngrok y pégalas en el archivo `frontend/uta-alerta-mobile/.env`. Reemplaza las IPs locales:

   ```env
   VITE_AUTH_URL=https://<id-auth>.ngrok-free.app
   VITE_INCIDENT_URL=https://<id-incident>.ngrok-free.app
   VITE_NOTIFICATION_URL=https://<id-notification>.ngrok-free.app
   VITE_GROUP_URL=https://<id-notification>.ngrok-free.app
   ```

4. **Reconstruir y sincronizar**:
   ```powershell
   cd frontend/uta-alerta-mobile
   npm run build
   npx cap sync android
   ```
   
5. **Vuelve a correr en Android Studio** y la app en tu teléfono ya podrá comunicarse con el backend de tu PC mediante Internet.

