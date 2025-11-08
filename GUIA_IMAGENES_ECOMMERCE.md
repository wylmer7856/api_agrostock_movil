# 📸 Guía de Imágenes - E-commerce AgroStock

## 🎯 Estructura de Imágenes en la Base de Datos

### 1. **Imágenes de Perfil de Usuario**
**Tabla:** `usuarios`  
**Campo:** `foto_perfil` (VARCHAR 500)

```sql
-- Ejemplo de URL almacenada
'https://agrostock.com/uploads/usuarios/perfil_123.jpg'
-- o
'/uploads/usuarios/perfil_123.jpg'
```

**Uso:**
- Foto de perfil del usuario (consumidor, productor, admin)
- Se muestra en: perfil, mensajes, reseñas, pedidos
- Formato recomendado: JPG, PNG, WebP
- Tamaño recomendado: 200x200px a 500x500px

---

### 2. **Imágenes de Productos**

#### **Imagen Principal**
**Tabla:** `productos`  
**Campo:** `imagen_principal` (VARCHAR 500)

```sql
-- Ejemplo
'https://agrostock.com/uploads/productos/producto_456_principal.jpg'
```

**Uso:**
- Imagen principal que se muestra en listados y tarjetas
- Primera imagen visible del producto
- Formato: JPG, PNG, WebP
- Tamaño recomendado: 800x600px o 1200x900px

#### **Imágenes Adicionales**
**Tabla:** `productos`  
**Campo:** `imagenes_adicionales` (JSON)

```sql
-- Ejemplo de estructura JSON
[
  "https://agrostock.com/uploads/productos/producto_456_1.jpg",
  "https://agrostock.com/uploads/productos/producto_456_2.jpg",
  "https://agrostock.com/uploads/productos/producto_456_3.jpg"
]
```

**Uso:**
- Galería de imágenes del producto
- Se muestran en la página de detalle del producto
- Permite múltiples vistas del mismo producto
- Formato: JPG, PNG, WebP
- Tamaño recomendado: 1200x900px

---

### 3. **Imágenes de Categorías**
**Tabla:** `categorias`  
**Campo:** `imagen_url` (VARCHAR 500)

```sql
-- Ejemplo
'https://agrostock.com/uploads/categorias/frutas.jpg'
```

**Uso:**
- Imagen representativa de la categoría
- Se muestra en listados de categorías
- Formato: JPG, PNG, WebP
- Tamaño recomendado: 400x300px

---

## 📁 Estructura de Carpetas Recomendada

```
uploads/
├── usuarios/
│   └── perfil_{id_usuario}.{ext}
├── productos/
│   ├── {id_producto}_principal.{ext}
│   ├── {id_producto}_1.{ext}
│   ├── {id_producto}_2.{ext}
│   └── ...
└── categorias/
    └── {id_categoria}.{ext}
```

---

## 🔧 Implementación en el Backend

### Endpoint de Subida de Imágenes

```typescript
// POST /upload
// Body: FormData con campo 'file'
// Headers: Authorization: Bearer {token}

// Respuesta exitosa:
{
  "success": true,
  "data": {
    "url": "https://agrostock.com/uploads/productos/producto_123_principal.jpg",
    "tipo": "producto", // 'producto', 'usuario', 'categoria'
    "id": 123
  }
}
```

### Validaciones Recomendadas

1. **Tipos permitidos:** JPG, JPEG, PNG, WebP
2. **Tamaño máximo:** 5MB por imagen
3. **Dimensiones:**
   - Perfil: mínimo 200x200px
   - Productos: mínimo 800x600px
   - Categorías: mínimo 400x300px

---

## 💾 Ejemplos de Consultas SQL

### Obtener producto con imágenes
```sql
SELECT 
  id_producto,
  nombre,
  precio,
  imagen_principal,
  imagenes_adicionales,
  disponible
FROM productos
WHERE id_producto = 123;
```

### Actualizar imagen principal de producto
```sql
UPDATE productos 
SET imagen_principal = 'https://agrostock.com/uploads/productos/producto_123.jpg'
WHERE id_producto = 123;
```

### Agregar imágenes adicionales (JSON)
```sql
UPDATE productos 
SET imagenes_adicionales = JSON_ARRAY(
  'https://agrostock.com/uploads/productos/producto_123_1.jpg',
  'https://agrostock.com/uploads/productos/producto_123_2.jpg'
)
WHERE id_producto = 123;
```

### Obtener usuario con foto de perfil
```sql
SELECT 
  id_usuario,
  nombre,
  email,
  foto_perfil,
  rol
FROM usuarios
WHERE id_usuario = 456;
```

---

## 🎨 Mejores Prácticas

1. **Optimización:**
   - Comprimir imágenes antes de subir
   - Usar formatos modernos (WebP) cuando sea posible
   - Generar thumbnails para listados

2. **Nombres de archivo:**
   - Usar IDs únicos: `producto_{id}_{tipo}.{ext}`
   - Evitar espacios y caracteres especiales
   - Mantener extensión original

3. **Almacenamiento:**
   - Opción 1: Sistema de archivos local (`/uploads/`)
   - Opción 2: Servicio cloud (AWS S3, Cloudinary, etc.)
   - Opción 3: CDN para mejor rendimiento

4. **Seguridad:**
   - Validar tipo MIME real del archivo
   - Escanear por malware
   - Limitar tamaño y dimensiones
   - Renombrar archivos para evitar conflictos

---

## 📱 Uso en Frontend

### Mostrar imagen principal
```typescript
<img 
  src={producto.imagen_principal || '/placeholder-producto.jpg'} 
  alt={producto.nombre}
  onError={(e) => {
    e.target.src = '/placeholder-producto.jpg';
  }}
/>
```

### Mostrar galería de imágenes
```typescript
const imagenes = [
  producto.imagen_principal,
  ...(producto.imagenes_adicionales || [])
].filter(Boolean);

{imagenes.map((url, index) => (
  <img key={index} src={url} alt={`${producto.nombre} - ${index + 1}`} />
))}
```

### Mostrar foto de perfil
```typescript
<img 
  src={usuario.foto_perfil || '/placeholder-usuario.jpg'} 
  alt={usuario.nombre}
  className="avatar"
/>
```

---

## ✅ Checklist de Implementación

- [ ] Crear carpeta `uploads/` con subcarpetas
- [ ] Implementar endpoint de subida de imágenes
- [ ] Validar tipos y tamaños de archivo
- [ ] Generar URLs correctas al guardar
- [ ] Implementar eliminación de imágenes antiguas
- [ ] Agregar placeholders para imágenes faltantes
- [ ] Optimizar imágenes (compresión, thumbnails)
- [ ] Configurar CORS para acceso a imágenes
- [ ] Implementar caché de imágenes
- [ ] Agregar manejo de errores en frontend

---

## 🔗 Relaciones con Tablas

```
usuarios.foto_perfil → Imagen de perfil del usuario
productos.imagen_principal → Imagen principal del producto
productos.imagenes_adicionales → Array de imágenes adicionales
categorias.imagen_url → Imagen de la categoría
```

Todas las URLs se almacenan como strings completos o rutas relativas según tu configuración de servidor.


