-- =====================================================
-- 🌾 AGROSTOCK - BASE DE DATOS SIMPLIFICADA Y PROFESIONAL
-- Versión: 2.0.0 SIMPLIFICADA
-- Fecha: 2025-01-XX
-- =====================================================
-- Base de datos optimizada, simple pero completa
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS agrostock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agrostock;

-- =====================================================
-- 1. UBICACIONES (Regiones, Departamentos, Ciudades)
-- =====================================================

CREATE TABLE IF NOT EXISTS `regiones` (
  `id_region` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id_region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `departamentos` (
  `id_departamento` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `id_region` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_departamento`),
  KEY `id_region` (`id_region`),
  CONSTRAINT `departamentos_ibfk_1` FOREIGN KEY (`id_region`) REFERENCES `regiones` (`id_region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `ciudades` (
  `id_ciudad` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `id_departamento` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_ciudad`),
  KEY `id_departamento` (`id_departamento`),
  CONSTRAINT `ciudades_ibfk_1` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- 2. USUARIOS (Simplificado pero completo)
-- =====================================================

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `id_ciudad` int(11) DEFAULT NULL,
  `rol` enum('admin','consumidor','productor') NOT NULL DEFAULT 'consumidor',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `email_verificado` tinyint(1) NOT NULL DEFAULT 0,
  `foto_perfil` varchar(500) DEFAULT NULL COMMENT 'URL de foto de perfil',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  KEY `id_ciudad` (`id_ciudad`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_activo` (`activo`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_ciudad`) REFERENCES `ciudades` (`id_ciudad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- 3. CATEGORÍAS
-- =====================================================

CREATE TABLE IF NOT EXISTS `categorias` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- 4. PRODUCTOS (Simplificado pero funcional)
-- =====================================================

CREATE TABLE IF NOT EXISTS `productos` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `stock_minimo` int(11) NOT NULL DEFAULT 5,
  `unidad_medida` varchar(20) NOT NULL DEFAULT 'kg',
  `id_usuario` int(11) NOT NULL COMMENT 'Productor que vende',
  `id_categoria` int(11) DEFAULT NULL,
  `id_ciudad_origen` int(11) DEFAULT NULL,
  `imagen_url` varchar(500) DEFAULT NULL,
  `disponible` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_producto`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_categoria` (`id_categoria`),
  KEY `id_ciudad_origen` (`id_ciudad_origen`),
  KEY `idx_productos_disponible` (`disponible`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`),
  CONSTRAINT `productos_ibfk_3` FOREIGN KEY (`id_ciudad_origen`) REFERENCES `ciudades` (`id_ciudad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- 5. CARRITO DE COMPRAS (E-commerce esencial)
-- =====================================================

CREATE TABLE IF NOT EXISTS `carrito` (
  `id_carrito` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL COMMENT 'Consumidor',
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `fecha_agregado` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_carrito`),
  UNIQUE KEY `usuario_producto` (`id_usuario`, `id_producto`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `carrito_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `carrito_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- 6. PEDIDOS (Simple pero completo)
-- =====================================================

CREATE TABLE IF NOT EXISTS `pedidos` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `id_consumidor` int(11) NOT NULL,
  `id_productor` int(11) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `estado` enum('pendiente','confirmado','en_preparacion','en_camino','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `direccion_entrega` varchar(255) NOT NULL,
  `id_ciudad_entrega` int(11) DEFAULT NULL,
  `metodo_pago` enum('efectivo','transferencia','nequi','daviplata','pse') DEFAULT 'efectivo',
  `notas` text DEFAULT NULL,
  `fecha_pedido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_entrega` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  KEY `id_consumidor` (`id_consumidor`),
  KEY `id_productor` (`id_productor`),
  KEY `id_ciudad_entrega` (`id_ciudad_entrega`),
  KEY `idx_pedidos_estado` (`estado`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`id_consumidor`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`id_productor`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `pedidos_ibfk_3` FOREIGN KEY (`id_ciudad_entrega`) REFERENCES `ciudades` (`id_ciudad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- 7. DETALLE DE PEDIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS `detalle_pedidos` (
  `id_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `id_pedido` (`id_pedido`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `detalle_pedidos_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `detalle_pedidos_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- 8. MENSAJES (Sistema de comunicación)
-- =====================================================

CREATE TABLE IF NOT EXISTS `mensajes` (
  `id_mensaje` int(11) NOT NULL AUTO_INCREMENT,
  `id_remitente` int(11) NOT NULL,
  `id_destinatario` int(11) NOT NULL,
  `id_producto` int(11) DEFAULT NULL COMMENT 'Producto relacionado si aplica',
  `asunto` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `tipo_mensaje` enum('consulta','pedido','general') DEFAULT 'consulta',
  `leido` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_envio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_mensaje`),
  KEY `id_remitente` (`id_remitente`),
  KEY `id_destinatario` (`id_destinatario`),
  KEY `id_producto` (`id_producto`),
  KEY `idx_mensajes_leido` (`leido`),
  CONSTRAINT `mensajes_ibfk_1` FOREIGN KEY (`id_remitente`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `mensajes_ibfk_2` FOREIGN KEY (`id_destinatario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `mensajes_ibfk_3` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- 9. RESEÑAS (Sistema de calificaciones)
-- =====================================================

CREATE TABLE IF NOT EXISTS `reseñas` (
  `id_resena` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_consumidor` int(11) NOT NULL,
  `id_productor` int(11) NOT NULL,
  `calificacion` int(11) NOT NULL COMMENT '1-5 estrellas',
  `comentario` text DEFAULT NULL,
  `fecha_resena` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_resena`),
  KEY `id_pedido` (`id_pedido`),
  KEY `id_producto` (`id_producto`),
  KEY `id_consumidor` (`id_consumidor`),
  KEY `id_productor` (`id_productor`),
  CONSTRAINT `reseñas_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`),
  CONSTRAINT `reseñas_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `reseñas_ibfk_3` FOREIGN KEY (`id_consumidor`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `reseñas_ibfk_4` FOREIGN KEY (`id_productor`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- 10. REPORTES (Sistema de moderación simple)
-- =====================================================

CREATE TABLE IF NOT EXISTS `reportes` (
  `id_reporte` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario_reportante` int(11) NOT NULL,
  `tipo_reporte` enum('producto_inapropiado','usuario_inapropiado','contenido_ofensivo','spam','fraude','otro') NOT NULL,
  `id_elemento_reportado` int(11) DEFAULT NULL COMMENT 'ID del producto o usuario reportado',
  `tipo_elemento` enum('producto','usuario') DEFAULT 'producto',
  `descripcion` text NOT NULL,
  `estado` enum('pendiente','en_revision','resuelto','rechazado') NOT NULL DEFAULT 'pendiente',
  `accion_tomada` text DEFAULT NULL,
  `fecha_reporte` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_resolucion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_reporte`),
  KEY `id_usuario_reportante` (`id_usuario_reportante`),
  KEY `idx_reportes_estado` (`estado`),
  CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`id_usuario_reportante`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- 11. TOKENS (Solo para recuperación de contraseña)
-- =====================================================

CREATE TABLE IF NOT EXISTS `tokens_recuperacion` (
  `id_token` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `usado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` timestamp NOT NULL,
  PRIMARY KEY (`id_token`),
  KEY `id_usuario` (`id_usuario`),
  KEY `idx_token` (`token`),
  CONSTRAINT `tokens_recuperacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar regiones principales
INSERT INTO `regiones` (`id_region`, `nombre`) VALUES
(1, 'Región Andina'),
(2, 'Región Caribe'),
(3, 'Región Pacífica'),
(4, 'Región Orinoquía'),
(5, 'Región Amazonía');

-- Insertar departamentos principales
INSERT INTO `departamentos` (`id_departamento`, `nombre`, `id_region`) VALUES
(1, 'Cundinamarca', 1),
(2, 'Antioquia', 1),
(3, 'Valle del Cauca', 1),
(4, 'Atlántico', 2),
(5, 'Bolívar', 2),
(6, 'Boyacá', 1),
(7, 'Santander', 1);

-- Insertar ciudades principales
INSERT INTO `ciudades` (`id_ciudad`, `nombre`, `id_departamento`) VALUES
(1, 'Bogotá D.C.', 1),
(2, 'Medellín', 2),
(3, 'Cali', 3),
(4, 'Barranquilla', 4),
(5, 'Cartagena', 5),
(6, 'Tunja', 6),
(7, 'Bucaramanga', 7);

-- Insertar categorías principales
INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`, `activa`) VALUES
(1, 'Frutas', 'Frutas frescas del campo', 1),
(2, 'Verduras', 'Verduras y hortalizas frescas', 1),
(3, 'Granos', 'Granos y cereales', 1),
(4, 'Lácteos', 'Productos lácteos frescos', 1),
(5, 'Carnes', 'Carnes frescas', 1),
(6, 'Artesanías', 'Productos artesanales', 1);

-- Insertar usuario administrador por defecto
-- Password: admin123 (debe ser hasheado en producción)
INSERT INTO `usuarios` (`id_usuario`, `nombre`, `email`, `password`, `telefono`, `direccion`, `id_ciudad`, `rol`, `activo`, `email_verificado`) VALUES
(1, 'Administrador', 'admin@agrostock.com', '$2b$10$EjemploHashPasswordAdmin123', '3001234567', 'Calle Principal 123', 1, 'admin', 1, 1);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

