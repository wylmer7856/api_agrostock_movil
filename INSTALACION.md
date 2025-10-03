# 🚀 AgroStock API - Guía de Instalación y Uso

## 📋 Requisitos Previos

### Software Necesario
- **Deno** 1.40+ ([Descargar aquí](https://deno.land/))
- **MySQL/MariaDB** 10.4+ ([Descargar MySQL](https://dev.mysql.com/downloads/) | [Descargar MariaDB](https://mariadb.org/download/))
- **Git** (opcional, para clonar el repositorio)

### Verificar Instalación
```bash
# Verificar Deno
deno --version

# Verificar MySQL/MariaDB
mysql --version
```

## 🛠️ Instalación Paso a Paso

### 1. Preparar la Base de Datos

```sql
-- Crear la base de datos
CREATE DATABASE agrostock CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Crear usuario (opcional)
CREATE USER 'agrostock_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON agrostock.* TO 'agrostock_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar el archivo .env con tus datos
nano .env
```

**Configuración mínima requerida:**
```env
JWT_SECRET=tu_clave_secreta_super_segura_aqui
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=agrostock
```

### 3. Importar la Base de Datos

```bash
# Importar el esquema y datos
mysql -u root -p agrostock < agrostock.sql
```

### 4. Instalar Dependencias

```bash
# Navegar al directorio de la API
cd api_agrostock_movil/api_movil

# Instalar dependencias (Deno las descarga automáticamente)
deno cache app.ts
```

### 5. Ejecutar la Aplicación

```bash
# Modo desarrollo (con recarga automática)
deno task dev

# Modo producción
deno task start
```

## 🧪 Verificar la Instalación

### 1. Probar la Conexión
```bash
# Ejecutar las pruebas básicas
deno task test
```

### 2. Probar la API
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:8000/productos

# Deberías ver una respuesta JSON con la lista de productos
```

### 3. Probar Autenticación
```bash
# Crear un usuario de prueba
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agrostock.com","password":"admin123"}'
```

## 📱 Uso de la API

### 🔐 Autenticación

```javascript
// Login
const response = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'password123'
  })
});

const { token, usuario } = await response.json();

// Usar el token en requests posteriores
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### 🛍️ Gestión de Productos

```javascript
// Listar productos (público)
const productos = await fetch('http://localhost:8000/productos');

// Buscar productos
const busqueda = await fetch('http://localhost:8000/productos/buscar?nombre=tomate&categoria=2');

// Crear producto (requiere autenticación)
const nuevoProducto = await fetch('http://localhost:8000/productos', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    nombre: 'Tomates Orgánicos',
    descripcion: 'Tomates frescos cultivados sin pesticidas',
    precio: 5000,
    stock: 100,
    id_usuario: 1,
    id_ciudad_origen: 14,
    unidadMedida: 'kg',
    pesoAprox: 1.0
  })
});
```

### 💬 Sistema de Mensajes

```javascript
// Enviar mensaje
const mensaje = await fetch('http://localhost:8000/mensajes/enviar', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    id_destinatario: 2,
    id_producto: 1,
    asunto: 'Consulta sobre producto',
    mensaje: 'Hola, me interesa este producto...',
    tipo_mensaje: 'consulta'
  })
});

// Contactar productor (sin login)
const contacto = await fetch('http://localhost:8000/mensajes/contactar-productor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id_producto: 1,
    nombre_contacto: 'Juan Pérez',
    email_contacto: 'juan@ejemplo.com',
    telefono_contacto: '3221234567',
    mensaje: 'Me interesa este producto...'
  })
});
```

### 📊 Administración

```javascript
// Obtener estadísticas (solo admin)
const estadisticas = await fetch('http://localhost:8000/admin/estadisticas', {
  headers: headers
});

// Gestionar reportes
const reportes = await fetch('http://localhost:8000/admin/reportes', {
  headers: headers
});
```

## 🔧 Configuración Avanzada

### Variables de Entorno Completas

```env
# 🔐 JWT
JWT_SECRET=clave_super_segura_de_64_caracteres_minimo
JWT_EXPIRES_IN=24h

# 🗄️ Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=agrostock_user
DB_PASSWORD=password_seguro
DB_NAME=agrostock
DB_POOL_SIZE=10
DB_IDLE_TIMEOUT=60000

# 🌐 Servidor
PORT=8000
HOST=0.0.0.0
NODE_ENV=production

# 📁 Archivos
UPLOADS_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# 🔒 Seguridad
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# 🌍 CORS
CORS_ORIGIN=https://tu-dominio.com,https://www.tu-dominio.com
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization
```

### Configuración de Producción

1. **Usar HTTPS** en producción
2. **Configurar CORS** con dominios específicos
3. **Usar variables de entorno** para credenciales
4. **Configurar logs** apropiados
5. **Implementar rate limiting**
6. **Usar un proxy reverso** (nginx/Apache)

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales
mysql -u root -p

# Verificar que la base de datos existe
SHOW DATABASES;
```

### Error de Permisos Deno
```bash
# Ejecutar con permisos completos
deno run --allow-all app.ts
```

### Error de Puerto en Uso
```bash
# Cambiar puerto en .env
PORT=8001

# O matar proceso que usa el puerto
sudo lsof -ti:8000 | xargs kill -9
```

### Error de Dependencias
```bash
# Limpiar cache de Deno
deno cache --reload app.ts

# Verificar conexión a internet
ping deno.land
```

## 📈 Monitoreo y Logs

### Verificar Estado del Servidor
```bash
# Verificar que esté corriendo
curl http://localhost:8000/productos

# Ver logs en tiempo real
tail -f logs/app.log
```

### Métricas de Rendimiento
```bash
# Verificar estadísticas de conexión
curl http://localhost:8000/admin/estadisticas
```

## 🔄 Actualizaciones

### Actualizar la Aplicación
```bash
# Hacer backup de la base de datos
mysqldump -u root -p agrostock > backup_$(date +%Y%m%d).sql

# Actualizar código
git pull origin main

# Actualizar dependencias
deno cache --reload app.ts

# Reiniciar aplicación
deno task start
```

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs** del servidor
2. **Verificar configuración** de variables de entorno
3. **Probar conexión** a base de datos
4. **Ejecutar pruebas** básicas
5. **Contactar soporte** técnico

---

**¡Tu API AgroStock está lista para usar! 🎉**

Para más información, consulta la documentación completa en `README.md`.
