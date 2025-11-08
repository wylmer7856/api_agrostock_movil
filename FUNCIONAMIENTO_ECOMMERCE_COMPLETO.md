# 🛒 Funcionamiento E-commerce Completo - AgroStock

## 📋 Resumen

Base de datos profesional optimizada para e-commerce con todas las funcionalidades esenciales:
- ✅ Carrito de compras
- ✅ Sistema de pedidos completo
- ✅ Gestión de imágenes (productos, perfil, categorías)
- ✅ Reseñas y calificaciones
- ✅ Mensajería entre usuarios
- ✅ Sistema de reportes
- ✅ Pagos integrados

---

## 🎯 Flujo Completo de E-commerce

### 1. **Registro y Autenticación**
```
Usuario se registra → Se crea en tabla `usuarios`
→ Puede subir foto de perfil → Se guarda en `usuarios.foto_perfil`
→ Puede iniciar sesión → JWT token
```

### 2. **Exploración de Productos**
```
Usuario navega categorías → `categorias` (con imagen)
→ Ve productos → `productos` (con imagen_principal e imagenes_adicionales)
→ Filtra por: categoría, ciudad, precio, disponibilidad
→ Ve detalles del producto con galería de imágenes
```

### 3. **Carrito de Compras** 🛒
```
Usuario agrega producto → Se inserta en `carrito`
→ Puede modificar cantidad → UPDATE `carrito.cantidad`
→ Puede eliminar producto → DELETE de `carrito`
→ Ve resumen del carrito con totales
```

**Tabla `carrito`:**
- `id_usuario` - Consumidor
- `id_producto` - Producto agregado
- `cantidad` - Cantidad deseada
- `fecha_agregado` - Cuándo se agregó

### 4. **Proceso de Compra (Checkout)**
```
Usuario revisa carrito → Selecciona productos
→ Ingresa dirección de entrega → Se guarda en `pedidos.direccion_entrega`
→ Selecciona método de pago → `pedidos.metodo_pago`
→ Confirma pedido → Se crea registro en `pedidos`
→ Se crean registros en `detalle_pedidos` (uno por producto)
→ Se vacía el carrito → DELETE de `carrito` para ese usuario
```

**Tabla `pedidos`:**
- `id_consumidor` - Quien compra
- `id_productor` - Quien vende
- `total` - Total del pedido
- `estado` - pendiente → confirmado → en_preparacion → en_camino → entregado
- `metodo_pago` - efectivo, transferencia, nequi, daviplata, pse, tarjeta
- `estado_pago` - pendiente, pagado, reembolsado
- `direccion_entrega` - Dónde entregar
- `fecha_pedido` - Cuándo se hizo

**Tabla `detalle_pedidos`:**
- `id_pedido` - Pedido al que pertenece
- `id_producto` - Producto comprado
- `cantidad` - Cuántos
- `precio_unitario` - Precio al momento de compra (histórico)
- `subtotal` - cantidad × precio_unitario

### 5. **Gestión de Pedidos**

#### **Para el Consumidor:**
- Ve sus pedidos en estado "pendiente", "confirmado", etc.
- Puede cancelar si está en "pendiente"
- Puede dejar reseña cuando está "entregado"

#### **Para el Productor:**
- Ve pedidos recibidos
- Confirma pedidos (cambia estado a "confirmado")
- Actualiza estado: "en_preparacion" → "en_camino" → "entregado"
- Marca pago como recibido

### 6. **Reseñas y Calificaciones** ⭐
```
Pedido entregado → Consumidor puede dejar reseña
→ Se crea en `reseñas`
→ Calificación 1-5 estrellas
→ Comentario opcional
→ Se muestra en producto y perfil del productor
```

**Tabla `reseñas`:**
- `id_pedido` - Pedido relacionado (único, solo una reseña por pedido)
- `id_producto` - Producto calificado
- `id_consumidor` - Quien califica
- `id_productor` - Quien recibe la calificación
- `calificacion` - 1 a 5 estrellas
- `comentario` - Texto opcional

### 7. **Mensajería** 💬
```
Consumidor tiene dudas → Envía mensaje al productor
→ Se crea en `mensajes`
→ Productor responde
→ Ambos pueden ver conversación
```

**Tabla `mensajes`:**
- `id_remitente` - Quien envía
- `id_destinatario` - Quien recibe
- `id_producto` - Producto relacionado (opcional)
- `asunto` - Título del mensaje
- `mensaje` - Contenido
- `tipo_mensaje` - consulta, pedido, general
- `leido` - Si fue leído o no

---

## 📊 Estructura de Datos por Funcionalidad

### **E-commerce Core**
1. `carrito` - Carrito de compras
2. `pedidos` - Pedidos principales
3. `detalle_pedidos` - Detalle de cada producto en el pedido

### **Catálogo**
1. `categorias` - Categorías de productos (con imagen)
2. `productos` - Productos (con imagen principal y adicionales)

### **Usuarios**
1. `usuarios` - Todos los usuarios (con foto de perfil)
2. `tokens_recuperacion` - Recuperación de contraseña

### **Interacción**
1. `mensajes` - Sistema de mensajería
2. `reseñas` - Calificaciones y comentarios
3. `reportes` - Sistema de moderación

### **Ubicaciones**
1. `regiones` - Regiones de Colombia
2. `departamentos` - Departamentos
3. `ciudades` - Ciudades

---

## 🔄 Flujos de Trabajo Completos

### **Flujo de Compra Completo**

```
1. Usuario navega productos
   ↓
2. Agrega productos al carrito (INSERT en `carrito`)
   ↓
3. Revisa carrito (SELECT de `carrito` con JOIN a `productos`)
   ↓
4. Procede al checkout
   ↓
5. Ingresa dirección y método de pago
   ↓
6. Confirma compra
   ↓
7. Se crea pedido (INSERT en `pedidos`)
   ↓
8. Se crean detalles (INSERT múltiple en `detalle_pedidos`)
   ↓
9. Se vacía carrito (DELETE de `carrito` para ese usuario)
   ↓
10. Productor recibe notificación
   ↓
11. Productor confirma pedido (UPDATE `pedidos.estado`)
   ↓
12. Productor prepara y envía (UPDATE estados)
   ↓
13. Pedido entregado (UPDATE `pedidos.estado` = 'entregado')
   ↓
14. Consumidor puede dejar reseña (INSERT en `reseñas`)
```

### **Flujo de Gestión de Productos**

```
1. Productor inicia sesión
   ↓
2. Crea nuevo producto (INSERT en `productos`)
   ↓
3. Sube imagen principal → Se guarda en `productos.imagen_principal`
   ↓
4. Sube imágenes adicionales → Se guardan en `productos.imagenes_adicionales` (JSON)
   ↓
5. Producto visible en catálogo
   ↓
6. Puede editar producto (UPDATE en `productos`)
   ↓
7. Puede actualizar stock (UPDATE `productos.stock`)
   ↓
8. Puede desactivar producto (UPDATE `productos.disponible` = 0)
```

---

## 💡 Características Clave

### ✅ **Carrito de Compras**
- Un producto por usuario (UNIQUE KEY)
- Si agrega el mismo producto, se actualiza cantidad
- Se mantiene hasta que se hace el pedido
- Se puede modificar o eliminar

### ✅ **Pedidos**
- Un pedido puede tener múltiples productos (detalle_pedidos)
- Estados claros y secuenciales
- Precio histórico guardado (no cambia aunque el producto cambie de precio)
- Método de pago y estado de pago separados

### ✅ **Imágenes**
- **Perfil:** Una imagen por usuario
- **Productos:** Una principal + múltiples adicionales (JSON array)
- **Categorías:** Una imagen por categoría
- Todas las URLs se guardan como strings

### ✅ **Reseñas**
- Solo una reseña por pedido (UNIQUE KEY)
- Calificación obligatoria (1-5)
- Comentario opcional
- Relacionada con pedido, producto, consumidor y productor

### ✅ **Mensajería**
- Conversaciones entre usuarios
- Puede estar relacionada con un producto
- Control de lectura
- Tipos: consulta, pedido, general

---

## 📈 Consultas Útiles

### Obtener carrito con productos
```sql
SELECT 
  c.id_carrito,
  c.cantidad,
  p.id_producto,
  p.nombre,
  p.precio,
  p.imagen_principal,
  (c.cantidad * p.precio) as subtotal
FROM carrito c
INNER JOIN productos p ON c.id_producto = p.id_producto
WHERE c.id_usuario = ?
AND p.disponible = 1;
```

### Obtener pedido con detalles
```sql
SELECT 
  ped.*,
  u_consumidor.nombre as nombre_consumidor,
  u_productor.nombre as nombre_productor,
  dp.id_detalle,
  dp.cantidad,
  dp.precio_unitario,
  dp.subtotal,
  pr.nombre as nombre_producto,
  pr.imagen_principal
FROM pedidos ped
INNER JOIN usuarios u_consumidor ON ped.id_consumidor = u_consumidor.id_usuario
INNER JOIN usuarios u_productor ON ped.id_productor = u_productor.id_usuario
INNER JOIN detalle_pedidos dp ON ped.id_pedido = dp.id_pedido
INNER JOIN productos pr ON dp.id_producto = pr.id_producto
WHERE ped.id_pedido = ?;
```

### Calcular promedio de calificaciones
```sql
SELECT 
  p.id_producto,
  p.nombre,
  AVG(r.calificacion) as promedio_calificacion,
  COUNT(r.id_resena) as total_resenas
FROM productos p
LEFT JOIN reseñas r ON p.id_producto = r.id_producto
GROUP BY p.id_producto;
```

---

## 🎯 Ventajas de esta Estructura

1. **Completa:** Tiene todo lo necesario para un e-commerce funcional
2. **Simple:** Sin tablas innecesarias, solo lo esencial
3. **Profesional:** Estructura bien diseñada con relaciones correctas
4. **Escalable:** Fácil agregar funcionalidades sin romper lo existente
5. **Optimizada:** Índices en campos clave para búsquedas rápidas
6. **Imágenes:** Soporte completo para imágenes en todos los lugares necesarios

---

## ✅ Checklist de Funcionalidades

- [x] Registro y autenticación de usuarios
- [x] Perfiles de usuario con foto
- [x] Catálogo de productos con imágenes
- [x] Categorías con imágenes
- [x] Carrito de compras funcional
- [x] Sistema de pedidos completo
- [x] Detalle de pedidos con precios históricos
- [x] Estados de pedidos claros
- [x] Métodos de pago
- [x] Reseñas y calificaciones
- [x] Mensajería entre usuarios
- [x] Sistema de reportes
- [x] Recuperación de contraseña
- [x] Gestión de stock
- [x] Ubicaciones (regiones, departamentos, ciudades)

---

## 🚀 Listo para Producción

Esta base de datos está **lista para usar en producción** con:
- ✅ Todas las funcionalidades esenciales de e-commerce
- ✅ Soporte completo para imágenes
- ✅ Estructura profesional y optimizada
- ✅ Sin campos innecesarios
- ✅ Fácil de mantener y escalar


