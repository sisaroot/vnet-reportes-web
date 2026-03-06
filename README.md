# 📊 Reporte de Pagos VNET

Un sistema web moderno y responsivo para el registro, verificación y control de pagos recibidos por asesores de ventas o cobranza. Desarrollado con el stack React + Vite para el frontend, y Supabase como backend as-a-service (BaaS) para la gestión de base de datos, autenticación y almacenamiento en la nube.

> **Visualizado en Múltiples Dispositivos:** La interfaz está completamente optimizada tanto para asesores en la calle desde sus teléfonos móviles (Dark Mode UI), como para el panel de administración en pantallas grandes de oficina.

---

## 🚀 Características Principales

### Para los Asesores (Usuarios Regulares)
*   **Formulario Dinámico y a Prueba de Errores:** Interfaz simple para subir transferencias, captura de pago móvil o recibos, evitando ambigüedades en la recolección de datos (Cédula del contrato, número telefónico y fecha).
*   **Buscador y Autocompletado de Clientes:** Carga ultra rápida integrada. Al escribir la cédula (con o sin `V-`/`J-`), el sistema autocompleta instantáneamente el nombre completo del cliente utilizando un motor de búsqueda JSON local ultraligero (+3000 clientes) para aligerar peticiones al servidor.
*   **Estados de Pago (En tiempo real):**
    *   🟡 **Pendiente:** Enviado y a la espera de revisión.
    *   🔴 **Devueltos:** Pagos rechazados por la administración. Incluye observaciones del Admin y el `Capture` original que se subió, todo con opciones directas de descarga para enviar por WhatsApp al cliente el motivo del rechazo.
    *   🟢 **Aprobados:** Pagos procesados en sistema. Permite descargar el comprobante adjunto del Admin para dárselo de alta al cliente.
*   **Cargas Inteligentes (Smart Upload):** Al subir la imagen del pago, el sistema renombra el archivo intrínsecamente usando el formato `[Nombre_Cliente]_[Cedula].jpg` para un control exhaustivo en la nube antes de enviarlo al *Storage bucket*.
*   **Observaciones Extra:** Campo de texto opcional para dejar anotaciones específicas sobre el pago ("contrato de la Av. principal", "pago por 2 meses", etc).

### Para el Administrador (Super Usuario)
*   **Dashboard Intuitivo (Clean UI):** Panel de control robusto pero minimalista con contadores y vistas previas instantáneas de pagos *Pendientes* y *Procesados*.
*   **Aprobaciones y Devoluciones a un clic:** Evalúa la imagen adjunta en línea (visor directo) y procesa o rechaza el requerimiento adjuntándole si se requiere otra imagen de confirmación/error para el Asesor.
*   **Buscador In-App:** Barra de búsqueda en tiempo real de reportes por número de cédula del titular del contrato.
*   **Control de Gestores (Panel de Asesores):** Listado completo de los empleados / agentes activos en la plataforma.
    *   🔪 **Borrado Definitivo:** Opción de dar de baja la cuenta (eliminar de la DB) de un asesor retirado.
    *   🔑 **Restablecimiento de Contraseñas:** Permite forzar el cambio de clave de un empleado si olvidan la suya (Acceso rápido de administrador).

---

## 🛠 Tecnologías Utilizadas
<div align="center">

| Frontend | Backend / Database / Storage | Entorno | Hosting |
|:---:|:---:|:---:|:---:|
| React (Vite) | Supabase (PostgreSQL) | Node.js | Vercel |
| Lucide Icons | Supabase Auth | npm | |
| CSS Vainilla / Glassmorphism UI | | | |

</div>

---

## 🏗️ Requisitos e Instalación Local

Clona este repositorio e instala sus dependencias para correrlo en modo desarrollador localmente:

```bash
# 1. Clonar el repositorio
git clone https://github.com/sisaroot/vnet-reportes-web.git

# 2. Entrar a la app principal
cd vnet-reportes-web/web-app

# 3. Instalar depencias
npm install
```

### Configuración del `.env` Local
Crea un archivo llamado `.env` en la raíz de `web-app` (al lado de `package.json`) y agrega las credenciales públicas de Supabase para que el cliente web se logre comunicar con la base de datos:

```env
VITE_SUPABASE_URL=tu_url_de_supabase_aqui
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase_aqui
```
*(Nota: Nunca debes comprometer o subir este archivo a repositorios públicos).*

### Levantar el Proyecto

```bash
# Correr el entorno local
npm run dev
```

---

## 🗄 Estructura de Supabase

Este proyecto depende enteramente de las siguientes tablas maestras y un Bucket de almacenamiento en la plataforma en la nube Supabase.

### 1. Tablas SQL

*   **`usuarios`**: Manejo de autenticación, nombres de usuario únicos, credenciales encriptadas y el campo para el control de la llave de roles (`admin` o `asesor`). 
*   **`reportes`**: Entidad macro para el requerimiento total de un "Adelanto/Pago". Engloba el estado en espera/procesado/devuelto, titular del internet, fechas y comentarios del admin u asesor.
*   **`pagos_asociados`**: Por la propia naturaleza del negocio, *1 solo reporte* de Internet puede tener asociados *n* transferencias bancarias o capturas adjuntas, este modelo se registra aquí anclado al `id` del reporte como clave foránea con borrado en cascada `ON DELETE CASCADE`.

### 2. Supabase Storage (Buckets)

Es necesario crear un *Bucket* nombrado **`comprobantes`** en Supabase, el cual, este Front-End automáticamente organizará construyendo carpetas con la siguiente taxonomía de directorios de ser necesario según su función de API:
*   `/asesor` - *Viene del endpoint AsesorView.jsx*
*   `/admin` - *Viene del endpoint AdminView.jsx*

## 🌐 Despliegue en Vercel
La aplicación ya fue blindada y empaquetada con un `vercel.json` pre-configurado para soportar react-router sobre las infraestructuras _Serverless_, resolviendo proactivamente conflictos HTTP 404 al refrescar las pantallas secundarias de control y navegación.

*Desarrollado para resolver cuellos de botella mediante Inteligencia y Automatización.*
