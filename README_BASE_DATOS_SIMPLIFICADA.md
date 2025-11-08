# 🌾 Base de Datos Simplificada - AgroStock

## 📋 Resumen

Esta es una versión **simplificada pero profesional** de la base de datos de AgroStock. Mantiene toda la funcionalidad esencial pero con una estructura más limpia y fácil de mantener.

## ✨ Características

- ✅ **10 tablas principales** (vs 20+ en la versión completa)
- ✅ **Campos esenciales** pero funcionales
- ✅ **Sin redundancias** - Una sola tabla de usuarios con roles
- ✅ **Estructura profesional** - Relaciones bien definidas
- ✅ **Fácil de mantener** - Menos complejidad, más claridad

## 📊 Estructura de Tablas

### 1. **Ubicaciones** (3 tablas)
- `regiones` - Regiones de Colombia
- `departamentos` - Departamentos por región
- `ciudades` - Ciudades por departamento

### 2. **Usuarios** (1 tabla)
- `usuarios` - Todos los usuarios (admin, consumidor, productor)
  - ✅ Un solo lugar para todos los usuarios
  - ✅ Rol define el tipo de usuario
  - ✅ Campos esenciales: nombre, email, password, teléfono, dirección, ciudad
  - ✅ Campos de seguridad: activo, email_verificado, foto_perfil

### 3. **Productos** (2 tablas)
- `categorias` - Categorías de productos
- `productos` - Productos con todos los campos necesarios
  - ✅ Información básica: nombre, descripción, precio
  - ✅ Control de stock: stock, stock_minimo
  - ✅ Ubicación: ciudad_origen
  - ✅ Relaciones: usuario (productor), categoría

### 4. **Pedidos** (2 tablas)
- `pedidos` - Pedidos principales
  - ✅ Estados claros: pendiente → confirmado → en_preparacion → en_camino → entregado
  - ✅ Información de entrega: dirección, ciudad
  - ✅ Método de pago: efectivo, transferencia, nequi, daviplata, pse
- `detalle_pedidos` - Detalle de productos en cada pedido

### 5. **Comunicación** (1 tabla)
- `mensajes` - Sistema de mensajería
  - ✅ Entre usuarios (remitente/destinatario)
  - ✅ Puede estar relacionado con un producto
  - ✅ Tipos: consulta, pedido, general
  - ✅ Control de lectura

### 6. **Calificaciones** (1 tabla)
- `reseñas` - Reseñas y calificaciones
  - ✅ Calificación 1-5 estrellas
  - ✅ Comentario opcional
  - ✅ Relacionado con pedido, producto, consumidor y productor

### 7. **Moderación** (1 tabla)
- `reportes` - Sistema de reportes
  - ✅ Tipos: producto_inapropiado, usuario_inapropiado, contenido_ofensivo, spam, fraude, otro
  - ✅ Estados: pendiente → en_revision → resuelto/rechazado
  - ✅ Acción tomada por admin

### 8. **Seguridad** (1 tabla)
- `tokens_recuperacion` - Solo para recuperación de contraseña
  - ✅ Simple y directo
  - ✅ Control de expiración y uso

## 🗑️ Tablas Eliminadas (Simplificación)

### Eliminadas por redundancia:
- ❌ `productores` - Info ahora en `usuarios` con rol='productor'
- ❌ `consumidores` - Info ahora en `usuarios` con rol='consumidor'
- ❌ `administradores` - Info ahora en `usuarios` con rol='admin'
- ❌ `productos_categorias` - Relación directa en `productos.id_categoria`
- ❌ `alertas_stock` - Se puede calcular dinámicamente

### Eliminadas por complejidad innecesaria:
- ❌ `sesiones_usuario` - JWT maneja sesiones
- ❌ `tokens_verificacion` - Simplificado a solo recuperación
- ❌ `pagos` y `transacciones_pago` - Simplificado en `pedidos.metodo_pago`
- ❌ `estadisticas_usuarios` - Se puede calcular con queries
- ❌ `notificaciones` - Se puede manejar en frontend
- ❌ `auditoria_acciones` - Opcional para producción
- ❌ `bitacora_cambios` - Opcional para producción
- ❌ `configuracion_sistema` - Se puede usar variables de entorno
- ❌ `consejos` - Feature opcional

## 📝 Campos Simplificados

### Usuarios
- ✅ Solo campos esenciales
- ✅ `foto_perfil` en lugar de múltiples campos de perfil
- ✅ Sin campos de verificación SMS complejos
- ✅ Sin campos de bloqueo por intentos (se puede manejar en código)

### Productos
- ✅ `id_categoria` directo (sin tabla intermedia)
- ✅ `imagen_url` único (sin múltiples campos de imagen)
- ✅ `stock_minimo` en lugar de alertas separadas

### Pedidos
- ✅ Estados simplificados pero completos
- ✅ Método de pago en el pedido (sin tabla separada)
- ✅ Sin campos de pasarela de pago complejos

## 🔄 Migración desde BD Completa

Si tienes la BD completa y quieres migrar:

1. **Exportar datos esenciales** de las tablas principales
2. **Mapear datos**:
   - `productores` → `usuarios` (mantener rol='productor')
   - `consumidores` → `usuarios` (mantener rol='consumidor')
   - `administradores` → `usuarios` (mantener rol='admin')
3. **Simplificar productos**: usar solo `id_categoria` principal
4. **Simplificar pedidos**: consolidar información de pago

## 🚀 Ventajas de esta Estructura

1. **Más fácil de entender** - Menos tablas, relaciones claras
2. **Más rápida** - Menos JOINs, queries más simples
3. **Más fácil de mantener** - Menos código, menos bugs
4. **Escalable** - Fácil agregar campos cuando se necesiten
5. **Profesional** - Mantiene todas las funcionalidades esenciales

## 📌 Notas Importantes

- ✅ **Funcionalidad completa**: Todas las features principales funcionan
- ✅ **Relaciones correctas**: Foreign keys bien definidas
- ✅ **Índices optimizados**: Para búsquedas rápidas
- ✅ **Datos iniciales**: Regiones, departamentos, ciudades y categorías incluidas
- ✅ **Usuario admin**: Creado por defecto (cambiar password en producción)

## 🔐 Seguridad

- ✅ Passwords hasheados (usar bcrypt en producción)
- ✅ Email único
- ✅ Foreign keys con CASCADE donde corresponde
- ✅ Índices para búsquedas rápidas

## 📊 Comparación

| Aspecto | BD Completa | BD Simplificada |
|---------|-------------|-----------------|
| Tablas | 20+ | 10 |
| Complejidad | Alta | Media |
| Mantenimiento | Difícil | Fácil |
| Funcionalidad | Completa | Completa |
| Performance | Buena | Mejor |
| Escalabilidad | Media | Alta |

## 🎯 Conclusión

Esta base de datos simplificada es **perfecta para**:
- ✅ Desarrollo rápido
- ✅ Proyectos pequeños/medianos
- ✅ Equipos pequeños
- ✅ MVP y prototipos
- ✅ Aprendizaje

Y puede **escalarse fácilmente** agregando tablas cuando se necesiten features avanzadas.


