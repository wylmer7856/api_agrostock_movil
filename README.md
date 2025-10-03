# 🌾 AgroStock API - Documentación

## 📋 Descripción
API REST para la plataforma AgroStock, un sistema de comercio electrónico que conecta productores agrícolas y artesanales con consumidores. La plataforma permite la gestión de productos, pedidos, mensajes y reportes con un sistema de roles robusto.

## 🚀 Características Principales

### 🔐 Sistema de Autenticación
- Autenticación JWT con roles (admin, productor, consumidor)
- Middleware de autorización por roles
- Sesiones seguras con expiración configurable

### 👥 Gestión de Usuarios
- **Administradores**: Control total del sistema
- **Productores**: Gestión de productos y comunicación con consumidores
- **Consumidores**: Navegación, búsqueda y contacto con productores

### 🛍️ Gestión de Productos
- CRUD completo de productos
- Sistema de categorías
- Subida de imágenes
- Búsqueda avanzada por múltiples criterios
- Gestión de stock y alertas

### 💬 Sistema de Comunicación
- Mensajes internos entre usuarios
- Contacto directo con productores (sin login)
- Notificaciones de mensajes no leídos
- Historial de conversaciones

### 📊 Sistema de Reportes
- Reportes de usuarios y productos
- Gestión de reportes por administradores
- Estados de reportes (pendiente, en revisión, resuelto, rechazado)

### 📈 Estadísticas y Analytics
- Estadísticas generales del sistema
- Estadísticas por usuario
- Actividad reciente
- Métricas de productos y usuarios

## 🌐 Endpoints Principales

### 🔐 Autenticación
```
POST /auth/login
```

### 🛍️ Productos
```
GET    /productos                    # Lista pública de productos
GET    /productos/buscar             # Búsqueda avanzada
GET    /productos/:id                # Ver producto individual
GET    /productos/:id/detalle        # Ver producto detallado
GET    /productos/productor/:id      # Productos de un productor
POST   /productos                    # Crear producto (auth)
PUT    /productos/:id                # Actualizar producto (auth)
DELETE /productos/:id                # Eliminar producto (auth)
```

### 📂 Categorías
```
GET    /categorias                   # Lista de categorías activas
GET    /categorias/:id               # Obtener categoría por ID
GET    /categorias/:id/productos     # Productos por categoría
```

### 💬 Mensajes
```
POST   /mensajes/enviar              # Enviar mensaje (auth)
GET    /mensajes/recibidos           # Mensajes recibidos (auth)
GET    /mensajes/enviados            # Mensajes enviados (auth)
PUT    /mensajes/:id/leer            # Marcar como leído (auth)
DELETE /mensajes/:id                 # Eliminar mensaje (auth)
POST   /mensajes/contactar-productor # Contactar productor (público)
```

### 📊 Reportes
```
POST   /reportes/crear               # Crear reporte (auth)
POST   /reportes/reportar-usuario    # Reportar usuario (auth)
POST   /reportes/reportar-producto   # Reportar producto (auth)
```

### 👨‍💼 Administración
```
GET    /admin/usuarios               # Todos los usuarios (admin)
POST   /admin/usuarios/crear         # Crear usuario (admin)
PUT    /admin/usuarios/:id           # Editar usuario (admin)
DELETE /admin/usuarios/:id           # Eliminar usuario (admin)
GET    /admin/productos              # Todos los productos (admin)
DELETE /admin/productos/:id/inapropiado # Eliminar producto inapropiado (admin)
GET    /admin/reportes               # Todos los reportes (admin)
PUT    /admin/reportes/:id/resolver  # Resolver reporte (admin)
GET    /admin/estadisticas           # Estadísticas generales (admin)
```

### 📈 Estadísticas
```
GET    /estadisticas/generales       # Estadísticas generales (admin)
GET    /estadisticas/usuario/:id     # Estadísticas de usuario (auth)
GET    /estadisticas/actividad-reciente # Actividad reciente (admin)
```

### 🌍 Ubicaciones
```
GET    /regiones                     # Lista de regiones
GET    /departamentos                # Lista de departamentos
GET    /ciudades                     # Lista de ciudades
```

## 🔧 Configuración

### Variables de Entorno
```env
JWT_SECRET=tu_clave_secreta_aqui
DB_HOST=localhost
DB_USER=usuario_db
DB_PASSWORD=password_db
DB_NAME=agrostock
```

### Instalación
```bash
# Instalar dependencias
deno install

# Ejecutar en modo desarrollo
deno task dev

# Ejecutar en producción
deno run --allow-net app.ts
```

## 📊 Base de Datos

### Tablas Principales
- `usuarios` - Información de usuarios
- `productos` - Catálogo de productos
- `categorias` - Categorías de productos
- `mensajes` - Sistema de mensajería
- `reportes` - Sistema de reportes
- `pedidos` - Gestión de pedidos
- `resenas` - Reseñas de productos
- `estadisticas_usuarios` - Estadísticas por usuario

## 🛡️ Seguridad

### Autenticación
- Tokens JWT con expiración
- Validación de roles en cada endpoint
- Middleware de autenticación centralizado

### Validación
- Validación de datos con Zod
- Sanitización de entradas
- Validación de tipos de archivo para imágenes

### CORS
- Configuración CORS para desarrollo y producción
- Headers de seguridad apropiados

## 📱 Funcionalidades por Rol

### 👨‍💼 Administrador
- Ver todos los usuarios y productos
- Crear, editar y eliminar usuarios
- Eliminar productos inapropiados
- Gestionar reportes
- Ver estadísticas generales
- Acceder a todos los paneles

### 🌾 Productor
- Crear, editar y eliminar productos
- Subir imágenes de productos
- Ver lista de productos publicados
- Recibir mensajes de consumidores
- Editar perfil personal
- Ver estadísticas personales

### 🛒 Consumidor
- Navegar productos sin login
- Buscar productos por múltiples criterios
- Ver detalle de productos
- Ver perfil público del productor
- Contactar productores
- Editar perfil personal

## 🔄 Flujo de Trabajo

### Para Consumidores
1. Navegar productos públicamente
2. Buscar productos por criterios
3. Ver detalles del producto y productor
4. Contactar al productor (con o sin login)
5. Registrarse para funcionalidades avanzadas

### Para Productores
1. Registrarse como productor
2. Crear productos con imágenes
3. Asociar productos con categorías
4. Recibir y responder mensajes
5. Gestionar stock y alertas

### Para Administradores
1. Supervisar toda la plataforma
2. Gestionar usuarios y productos
3. Resolver reportes
4. Analizar estadísticas
5. Mantener la integridad del sistema

## 📈 Métricas y Analytics

### Estadísticas Generales
- Total de usuarios por rol
- Total de productos por categoría
- Distribución de usuarios por región
- Actividad reciente del sistema

### Estadísticas por Usuario
- Productos publicados (productores)
- Mensajes recibidos
- Pedidos gestionados
- Actividad mensual

## 🚀 Despliegue

### Requisitos
- Deno 1.40+
- MySQL/MariaDB 10.4+
- Node.js (opcional para herramientas)

### Pasos
1. Clonar el repositorio
2. Configurar variables de entorno
3. Ejecutar script SQL de base de datos
4. Instalar dependencias con Deno
5. Ejecutar la aplicación

## 📞 Soporte

Para soporte técnico o consultas sobre la API, contactar al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Licencia**: Propietaria