-- =====================================================
-- 🌾 AGROSTOCK - BASE DE DATOS COMPLETA Y DEFINITIVA
-- Script único para importación completa
-- Versión: 3.0.0 FINAL
-- Fecha: 2025-01-XX
-- =====================================================
-- ⚠️ ESTE ES EL SCRIPT DEFINITIVO - NO SE MODIFICARÁ MÁS
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS agrostock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agrostock;

-- =====================================================
-- TABLAS DE UBICACIÓN
-- =====================================================

-- Tabla: regiones
CREATE TABLE IF NOT EXISTS `regiones` (
  `id_region` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id_region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: departamentos
CREATE TABLE IF NOT EXISTS `departamentos` (
  `id_departamento` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `id_region` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_departamento`),
  KEY `id_region` (`id_region`),
  CONSTRAINT `departamentos_ibfk_1` FOREIGN KEY (`id_region`) REFERENCES `regiones` (`id_region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: ciudades
CREATE TABLE IF NOT EXISTS `ciudades` (
  `id_ciudad` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `id_departamento` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_ciudad`),
  KEY `id_departamento` (`id_departamento`),
  CONSTRAINT `ciudades_ibfk_1` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- TABLAS DE USUARIOS Y AUTENTICACIÓN
-- =====================================================

-- Tabla: usuarios (con todos los campos de seguridad)
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
  `telefono_verificado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `intentos_login` int(11) NOT NULL DEFAULT 0,
  `bloqueado_hasta` timestamp NULL DEFAULT NULL,
  `codigo_verificacion_sms` varchar(10) DEFAULT NULL,
  `codigo_sms_expiracion` timestamp NULL DEFAULT NULL,
  `intentos_sms` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  KEY `id_ciudad` (`id_ciudad`),
  KEY `idx_usuarios_email` (`email`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_activo` (`activo`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_ciudad`) REFERENCES `ciudades` (`id_ciudad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: sesiones_usuario
CREATE TABLE IF NOT EXISTS `sesiones_usuario` (
  `id_sesion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL UNIQUE,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `fecha_inicio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultima_actividad` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_expiracion` timestamp NULL DEFAULT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_sesion`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_activa` (`activa`),
  CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: tokens_verificacion
CREATE TABLE IF NOT EXISTS `tokens_verificacion` (
  `id_token` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `tipo` enum('email', 'password_reset', 'phone') NOT NULL DEFAULT 'email',
  `expiracion` timestamp NOT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_token`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_token` (`token`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_expiracion` (`expiracion`),
  CONSTRAINT `fk_tokens_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: tokens_recuperacion
CREATE TABLE IF NOT EXISTS `tokens_recuperacion` (
  `id_token` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `tipo` enum('password_reset', 'email_verification', 'phone_verification') NOT NULL,
  `metodo` enum('email', 'sms') NOT NULL DEFAULT 'email',
  `usado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` timestamp NOT NULL,
  `fecha_uso` timestamp NULL DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id_token`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_token` (`token`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_expiracion` (`fecha_expiracion`),
  KEY `idx_tokens_recuperacion_completo` (`id_usuario`, `tipo`, `usado`, `fecha_expiracion`),
  CONSTRAINT `fk_tokens_recuperacion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- TABLAS DE ROLES ESPECÍFICOS
-- =====================================================

-- Tabla: productores (datos específicos de productores)
CREATE TABLE IF NOT EXISTS `productores` (
  `id_productor` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `nombre_finca` varchar(255) DEFAULT NULL COMMENT 'Nombre de la finca o asociación',
  `tipo_productor` enum('agricultor', 'ganadero', 'apicultor', 'piscicultor', 'avicultor', 'mixto', 'otro') DEFAULT 'agricultor',
  `id_departamento` int(11) DEFAULT NULL COMMENT 'Departamento donde está ubicada la finca',
  `id_ciudad` int(11) DEFAULT NULL COMMENT 'Ciudad donde está ubicada la finca',
  `vereda` varchar(255) DEFAULT NULL COMMENT 'Vereda o corregimiento',
  `direccion_finca` text DEFAULT NULL COMMENT 'Dirección detallada de la finca',
  `numero_registro_ica` varchar(100) DEFAULT NULL COMMENT 'Número de registro ICA',
  `certificaciones` text DEFAULT NULL COMMENT 'Certificaciones separadas por comas (ej: orgánico, fair trade)',
  `descripcion_actividad` text DEFAULT NULL COMMENT 'Descripción de las actividades productivas',
  `anos_experiencia` int(11) DEFAULT NULL COMMENT 'Años de experiencia en la actividad',
  `hectareas` decimal(10,2) DEFAULT NULL COMMENT 'Hectáreas de producción',
  `metodo_produccion` enum('tradicional', 'organico', 'convencional', 'mixto') DEFAULT 'tradicional',
  `redes_sociales` json DEFAULT NULL COMMENT 'JSON con links de redes sociales',
  `sitio_web` varchar(255) DEFAULT NULL,
  `foto_perfil_finca` varchar(500) DEFAULT NULL COMMENT 'URL de foto de perfil de la finca',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_productor`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  KEY `idx_productor_usuario` (`id_usuario`),
  KEY `idx_productor_tipo` (`tipo_productor`),
  KEY `idx_productor_departamento` (`id_departamento`),
  KEY `idx_productor_ciudad` (`id_ciudad`),
  KEY `idx_productor_activo` (`activo`),
  KEY `idx_productor_registro_ica` (`numero_registro_ica`),
  CONSTRAINT `fk_productor_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_productor_departamento` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`) ON DELETE SET NULL,
  CONSTRAINT `fk_productor_ciudad` FOREIGN KEY (`id_ciudad`) REFERENCES `ciudades` (`id_ciudad`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: consumidores (datos específicos de consumidores)
CREATE TABLE IF NOT EXISTS `consumidores` (
  `id_consumidor` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `preferencias_alimentarias` json DEFAULT NULL COMMENT 'JSON con preferencias (vegetariano, vegano, sin gluten, etc.)',
  `intereses` text DEFAULT NULL COMMENT 'Intereses en productos específicos',
  `frecuencia_compra` enum('diaria', 'semanal', 'quincenal', 'mensual', 'ocasional') DEFAULT 'semanal',
  `presupuesto_promedio` decimal(10,2) DEFAULT NULL COMMENT 'Presupuesto promedio mensual',
  `metodo_pago_preferido` enum('efectivo', 'tarjeta', 'transferencia', 'nequi', 'daviplata', 'pse') DEFAULT 'efectivo',
  `notificaciones_email` tinyint(1) NOT NULL DEFAULT 1,
  `notificaciones_push` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_consumidor`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  KEY `idx_consumidor_usuario` (`id_usuario`),
  CONSTRAINT `fk_consumidor_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: administradores (datos específicos de administradores)
CREATE TABLE IF NOT EXISTS `administradores` (
  `id_administrador` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `nivel_acceso` enum('super_admin', 'admin', 'moderador', 'soporte') DEFAULT 'admin',
  `permisos` json DEFAULT NULL COMMENT 'JSON con permisos específicos',
  `ultima_accion_admin` timestamp NULL DEFAULT NULL,
  `total_acciones` int(11) NOT NULL DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_administrador`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  KEY `idx_admin_usuario` (`id_usuario`),
  KEY `idx_admin_nivel` (`nivel_acceso`),
  CONSTRAINT `fk_admin_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- TABLAS DE PRODUCTOS
-- =====================================================

-- Tabla: categorias
CREATE TABLE IF NOT EXISTS `categorias` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: productos
CREATE TABLE IF NOT EXISTS `productos` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL,
  `stockMinimo` int(11) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `id_ciudad_origen` int(11) DEFAULT NULL,
  `unidadMedida` varchar(20) NOT NULL,
  `pesoAprox` decimal(8,2) NOT NULL,
  `imagenPrincipal` varchar(255) NOT NULL,
  `imagenUrl` varchar(500) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `disponible` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_producto`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_ciudad_origen` (`id_ciudad_origen`),
  KEY `idx_productos_usuario` (`id_usuario`),
  KEY `idx_productos_disponible` (`disponible`),
  KEY `idx_productos_productor_disponible` (`id_usuario`, `disponible`),
  KEY `idx_productos_ciudad_precio` (`id_ciudad_origen`, `precio`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`id_ciudad_origen`) REFERENCES `ciudades` (`id_ciudad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: productos_categorias
CREATE TABLE IF NOT EXISTS `productos_categorias` (
  `id_producto` int(11) NOT NULL,
  `id_categoria` int(11) NOT NULL,
  PRIMARY KEY (`id_producto`, `id_categoria`),
  KEY `id_categoria` (`id_categoria`),
  KEY `idx_producto` (`id_producto`),
  KEY `idx_categoria` (`id_categoria`),
  CONSTRAINT `productos_categorias_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE,
  CONSTRAINT `productos_categorias_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: alertas_stock
CREATE TABLE IF NOT EXISTS `alertas_stock` (
  `id_alerta` int(11) NOT NULL AUTO_INCREMENT,
  `id_producto` int(11) DEFAULT NULL,
  `stock_actual` int(11) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `mensaje` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_alerta`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `alertas_stock_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- TABLAS DE PEDIDOS Y PAGOS
-- =====================================================

-- Tabla: pedidos (crear primero, sin foreign key a pagos todavía)
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `id_consumidor` int(11) DEFAULT NULL,
  `id_productor` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `estado` enum('pendiente','confirmado','comprado', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
  `total` decimal(10,2) NOT NULL,
  `direccionEntrega` text NOT NULL,
  `notas` text NOT NULL,
  `fecha_entrega_estimada` date NOT NULL,
  `metodo_pago` varchar(50) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id_pago` int(11) DEFAULT NULL,
  `estado_pago` enum('pendiente', 'procesando', 'aprobado', 'rechazado', 'cancelado', 'reembolsado') DEFAULT 'pendiente',
  `fecha_pago` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  KEY `id_consumidor` (`id_consumidor`),
  KEY `id_productor` (`id_productor`),
  KEY `idx_pago` (`id_pago`),
  KEY `idx_pedidos_consumidor` (`id_consumidor`),
  KEY `idx_pedidos_productor` (`id_productor`),
  KEY `idx_pedidos_estado` (`estado`),
  KEY `idx_pedidos_estado_fecha` (`estado`, `fecha_creacion`),
  KEY `idx_pedidos_productor_estado` (`id_productor`, `estado`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`id_consumidor`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`id_productor`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: pagos (crear después de pedidos)
CREATE TABLE IF NOT EXISTS `pagos` (
  `id_pago` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `moneda` varchar(3) NOT NULL DEFAULT 'COP',
  `metodo_pago` enum('efectivo', 'tarjeta', 'transferencia', 'nequi', 'daviplata', 'pse') NOT NULL,
  `pasarela_pago` enum('wompi', 'payu', 'mercadopago', 'stripe', 'manual') NOT NULL DEFAULT 'manual',
  `referencia_pago` varchar(255) DEFAULT NULL,
  `estado_pago` enum('pendiente', 'procesando', 'aprobado', 'rechazado', 'cancelado', 'reembolsado') NOT NULL DEFAULT 'pendiente',
  `respuesta_pasarela` json DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_procesamiento` timestamp NULL DEFAULT NULL,
  `fecha_aprobacion` timestamp NULL DEFAULT NULL,
  `motivo_rechazo` text DEFAULT NULL,
  `datos_adicionales` json DEFAULT NULL,
  PRIMARY KEY (`id_pago`),
  KEY `idx_pedido` (`id_pedido`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_estado` (`estado_pago`),
  KEY `idx_referencia` (`referencia_pago`),
  KEY `idx_fecha` (`fecha_creacion`),
  KEY `idx_pagos_completo` (`id_pedido`, `estado_pago`, `fecha_creacion`),
  CONSTRAINT `fk_pagos_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `fk_pagos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Agregar foreign key de pedidos a pagos (después de crear pagos)
ALTER TABLE `pedidos`
ADD CONSTRAINT `fk_pedidos_pago` FOREIGN KEY (`id_pago`) REFERENCES `pagos` (`id_pago`) ON DELETE SET NULL;

-- Tabla: detalle_pedidos
CREATE TABLE IF NOT EXISTS `detalle_pedidos` (
  `id_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) DEFAULT NULL,
  `id_producto` int(11) DEFAULT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `Precio_total` varchar(80) NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `id_pedido` (`id_pedido`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `detalle_pedidos_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`),
  CONSTRAINT `detalle_pedidos_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: transacciones_pago
CREATE TABLE IF NOT EXISTS `transacciones_pago` (
  `id_transaccion` int(11) NOT NULL AUTO_INCREMENT,
  `id_pago` int(11) NOT NULL,
  `tipo_transaccion` enum('pago', 'reembolso', 'reversa') NOT NULL,
  `estado_transaccion` enum('iniciada', 'procesando', 'completada', 'fallida', 'cancelada') NOT NULL,
  `referencia_externa` varchar(255) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `respuesta_pasarela` json DEFAULT NULL,
  `fecha_transaccion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_completada` timestamp NULL DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  PRIMARY KEY (`id_transaccion`),
  KEY `idx_pago` (`id_pago`),
  KEY `idx_estado` (`estado_transaccion`),
  KEY `idx_referencia` (`referencia_externa`),
  CONSTRAINT `fk_transacciones_pago` FOREIGN KEY (`id_pago`) REFERENCES `pagos` (`id_pago`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- TABLAS DE INTERACCIÓN
-- =====================================================

-- Tabla: resenas
CREATE TABLE IF NOT EXISTS `resenas` (
  `id_resena` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `id_producto` int(11) DEFAULT NULL,
  `id_pedido` int(11) NOT NULL,
  `comentario` text DEFAULT NULL,
  `calificacion` int(11) DEFAULT NULL CHECK (`calificacion` between 1 and 5),
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_resena`),
  UNIQUE KEY `id_pedido` (`id_pedido`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `resenas_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `resenas_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `resenas_ibfk_3` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: mensajes
CREATE TABLE IF NOT EXISTS `mensajes` (
  `id_mensaje` int(11) NOT NULL AUTO_INCREMENT,
  `id_remitente` int(11) NOT NULL,
  `id_destinatario` int(11) NOT NULL,
  `id_producto` int(11) DEFAULT NULL,
  `asunto` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha_envio` timestamp NOT NULL DEFAULT current_timestamp(),
  `leido` tinyint(1) NOT NULL DEFAULT 0,
  `tipo_mensaje` enum('consulta','pedido','general') NOT NULL DEFAULT 'consulta',
  PRIMARY KEY (`id_mensaje`),
  KEY `id_remitente` (`id_remitente`),
  KEY `id_destinatario` (`id_destinatario`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `mensajes_ibfk_1` FOREIGN KEY (`id_remitente`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `mensajes_ibfk_2` FOREIGN KEY (`id_destinatario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `mensajes_ibfk_3` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: reportes
CREATE TABLE IF NOT EXISTS `reportes` (
  `id_reporte` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario_reportado` int(11) DEFAULT NULL,
  `id_producto_reportado` int(11) DEFAULT NULL,
  `id_usuario_reportador` int(11) NOT NULL,
  `tipo_reporte` enum('usuario','producto') NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `fecha_reporte` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('pendiente','en_revision','resuelto','rechazado') NOT NULL DEFAULT 'pendiente',
  `accion_tomada` text DEFAULT NULL,
  `fecha_resolucion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_reporte`),
  KEY `id_usuario_reportado` (`id_usuario_reportado`),
  KEY `id_producto_reportado` (`id_producto_reportado`),
  KEY `id_usuario_reportador` (`id_usuario_reportador`),
  CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`id_usuario_reportado`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `reportes_ibfk_2` FOREIGN KEY (`id_producto_reportado`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `reportes_ibfk_3` FOREIGN KEY (`id_usuario_reportador`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- TABLAS DE SISTEMA Y CONFIGURACIÓN
-- =====================================================

-- Tabla: consejos
CREATE TABLE IF NOT EXISTS `consejos` (
  `id_consejo` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `titulo` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_consejo`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `consejos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: estadisticas_usuarios
CREATE TABLE IF NOT EXISTS `estadisticas_usuarios` (
  `id_usuario` int(11) NOT NULL,
  `total_productos` int(11) NOT NULL DEFAULT 0,
  `total_mensajes_recibidos` int(11) NOT NULL DEFAULT 0,
  `total_pedidos_recibidos` int(11) NOT NULL DEFAULT 0,
  `fecha_ultima_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_usuario`),
  CONSTRAINT `estadisticas_usuarios_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: configuracion_sistema
CREATE TABLE IF NOT EXISTS `configuracion_sistema` (
  `id_config` int(11) NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) NOT NULL,
  `valor` text NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_config`),
  UNIQUE KEY `clave` (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: notificaciones
CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id_notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `tipo` enum('success', 'error', 'warning', 'info') NOT NULL DEFAULT 'info',
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_leida` timestamp NULL DEFAULT NULL,
  `datos_extra` json DEFAULT NULL,
  PRIMARY KEY (`id_notificacion`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_leida` (`leida`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  CONSTRAINT `fk_notificaciones_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: auditoria_acciones
CREATE TABLE IF NOT EXISTS `auditoria_acciones` (
  `id_auditoria` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `accion` varchar(100) NOT NULL,
  `tabla_afectada` varchar(50) NOT NULL,
  `id_registro_afectado` int(11) DEFAULT NULL,
  `datos_antes` json DEFAULT NULL,
  `datos_despues` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `fecha_accion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descripcion` text DEFAULT NULL,
  `resultado` enum('exitoso', 'fallido', 'error') NOT NULL DEFAULT 'exitoso',
  `error_message` text DEFAULT NULL,
  PRIMARY KEY (`id_auditoria`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_accion` (`accion`),
  KEY `idx_tabla` (`tabla_afectada`),
  KEY `idx_fecha` (`fecha_accion`),
  KEY `idx_resultado` (`resultado`),
  KEY `idx_auditoria_completo` (`id_usuario`, `tabla_afectada`, `fecha_accion`),
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: bitacora_cambios
CREATE TABLE IF NOT EXISTS `bitacora_cambios` (
  `id_bitacora` int(11) NOT NULL AUTO_INCREMENT,
  `tabla_afectada` varchar(50) NOT NULL,
  `id_registro` int(11) NOT NULL,
  `tipo_cambio` enum('crear', 'actualizar', 'eliminar', 'restaurar') NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `campo_modificado` varchar(100) DEFAULT NULL,
  `valor_anterior` text DEFAULT NULL,
  `valor_nuevo` text DEFAULT NULL,
  `cambios_completos` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `fecha_cambio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `motivo` text DEFAULT NULL,
  PRIMARY KEY (`id_bitacora`),
  KEY `idx_tabla_registro` (`tabla_afectada`, `id_registro`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_tipo` (`tipo_cambio`),
  KEY `idx_fecha` (`fecha_cambio`),
  KEY `idx_bitacora_completo` (`tabla_afectada`, `id_registro`, `fecha_cambio`),
  CONSTRAINT `fk_bitacora_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- VISTAS
-- =====================================================

-- Vista: vista_productores_completa
CREATE OR REPLACE VIEW `vista_productores_completa` AS
SELECT 
  u.id_usuario,
  u.nombre,
  u.email,
  u.telefono,
  u.direccion,
  u.rol,
  u.activo,
  u.email_verificado,
  u.telefono_verificado,
  p.id_productor,
  p.nombre_finca,
  p.tipo_productor,
  p.vereda,
  p.direccion_finca,
  p.numero_registro_ica,
  p.certificaciones,
  p.descripcion_actividad,
  p.anos_experiencia,
  p.hectareas,
  p.metodo_produccion,
  p.redes_sociales,
  p.sitio_web,
  p.foto_perfil_finca,
  c.nombre as ciudad_nombre,
  d.nombre as departamento_nombre,
  r.nombre as region_nombre,
  (SELECT COUNT(*) FROM productos WHERE id_usuario = u.id_usuario AND disponible = 1) as total_productos_activos,
  (SELECT COUNT(*) FROM pedidos WHERE id_productor = u.id_usuario) as total_pedidos_recibidos
FROM usuarios u
INNER JOIN productores p ON u.id_usuario = p.id_usuario
LEFT JOIN ciudades c ON p.id_ciudad = c.id_ciudad
LEFT JOIN departamentos d ON p.id_departamento = d.id_departamento
LEFT JOIN regiones r ON d.id_region = r.id_region
WHERE u.rol = 'productor';

-- Vista: vista_consumidores_completa
CREATE OR REPLACE VIEW `vista_consumidores_completa` AS
SELECT 
  u.id_usuario,
  u.nombre,
  u.email,
  u.telefono,
  u.direccion,
  u.rol,
  u.activo,
  c.id_consumidor,
  c.preferencias_alimentarias,
  c.intereses,
  c.frecuencia_compra,
  c.presupuesto_promedio,
  c.metodo_pago_preferido,
  ci.nombre as ciudad_nombre,
  d.nombre as departamento_nombre,
  (SELECT COUNT(*) FROM pedidos WHERE id_consumidor = u.id_usuario) as total_pedidos_realizados
FROM usuarios u
LEFT JOIN consumidores c ON u.id_usuario = c.id_usuario
LEFT JOIN ciudades ci ON u.id_ciudad = ci.id_ciudad
LEFT JOIN departamentos d ON ci.id_departamento = d.id_departamento
WHERE u.rol = 'consumidor';

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar regiones
INSERT IGNORE INTO `regiones` (`id_region`, `nombre`) VALUES
(1, 'Andina'),
(2, 'Caribe'),
(3, 'Pacífica'),
(4, 'Orinoquía'),
(5, 'Amazonía '),
(6, 'Insular');

-- Insertar departamentos
INSERT IGNORE INTO `departamentos` (`id_departamento`, `nombre`, `id_region`) VALUES
(1, 'Cundinamarca', 1),
(2, 'Boyacá', 1),
(3, 'Tolima', 1),
(4, 'Huila', 1),
(5, 'Antioquia', 1),
(6, 'Caldas', 1),
(7, 'Risaralda', 1),
(8, 'Quindío', 1),
(9, 'Santander', 1),
(10, 'Norte de Santander', 1),
(11, 'Atlántico', 2),
(12, 'Bolívar', 2),
(13, 'Córdoba', 2),
(14, 'Sucre', 2),
(15, 'Magdalena', 2),
(16, 'La Guajira', 2),
(17, 'Cesar', 2),
(18, 'San Andrés y Providencia', 2),
(19, 'Valle del Cauca', 3),
(20, 'Cauca', 3),
(21, 'Nariño', 3),
(22, 'Chocó', 3),
(23, 'Arauca', 4),
(24, 'Casanare', 4),
(25, 'Meta', 4),
(26, 'Vichada', 4),
(27, 'Amazonas', 5),
(28, 'Caquetá', 5),
(29, 'Guainía', 5),
(30, 'Guaviare', 5),
(31, 'Putumayo', 5),
(32, 'Vaupés', 5),
(33, 'Archipiélago de San Andrés, Providencia y Santa Catalina', 6);

-- Insertar ciudades
INSERT IGNORE INTO `ciudades` (`id_ciudad`, `nombre`, `id_departamento`) VALUES
(1, 'Leticia', 27),
(2, 'Medellín', 5),
(3, 'Arauca', 23),
(4, 'Barranquilla', 11),
(5, 'Cartagena', 12),
(6, 'Tunja', 2),
(7, 'Manizales', 6),
(8, 'Florencia', 28),
(9, 'Yopal', 24),
(10, 'Popayán', 20),
(11, 'Valledupar', 17),
(12, 'Quibdó', 22),
(13, 'Montería', 13),
(14, 'Bogotá D.C.', 1),
(15, 'Inírida', 29),
(16, 'San José del Guaviare', 30),
(17, 'Neiva', 4),
(18, 'Riohacha', 16),
(19, 'Santa Marta', 15),
(20, 'Villavicencio', 25),
(21, 'Pasto', 21),
(22, 'Cúcuta', 10),
(23, 'Mocoa', 31),
(24, 'Armenia', 8),
(25, 'Pereira', 7),
(26, 'Bucaramanga', 9),
(27, 'Sincelejo', 14),
(28, 'Ibagué', 3),
(29, 'Cali', 19),
(30, 'Mitú', 32),
(31, 'Puerto Carreño', 26),
(32, 'San Andrés', 33);

-- Insertar categorias
INSERT IGNORE INTO `categorias` (`id_categoria`, `nombre`, `descripcion`, `activa`) VALUES
(1, 'Frutas', 'Productos frutales frescos', 1),
(2, 'Verduras', 'Vegetales y hortalizas', 1),
(3, 'Granos', 'Cereales y legumbres', 1),
(4, 'Artesanías', 'Productos artesanales locales', 1),
(5, 'Lácteos', 'Productos lácteos frescos', 1),
(6, 'Carnes', 'Carnes frescas y procesadas', 1);

-- Insertar configuración del sistema
INSERT IGNORE INTO `configuracion_sistema` (`id_config`, `clave`, `valor`, `descripcion`) VALUES
(1, 'stock_minimo_default', '10', 'Stock mínimo por defecto para productos nuevos'),
(2, 'max_productos_usuario', '50', 'Máximo número de productos por usuario'),
(3, 'max_imagenes_producto', '5', 'Máximo número de imágenes por producto'),
(4, 'tiempo_sesion_horas', '24', 'Tiempo de sesión en horas'),
(5, 'version_api', '3.0.0', 'Versión actual de la API');

-- =====================================================
-- TRIGGERS PARA BITÁCORA AUTOMÁTICA
-- =====================================================

DELIMITER //

-- Eliminar triggers si existen
DROP TRIGGER IF EXISTS bitacora_productos_update//
DROP TRIGGER IF EXISTS bitacora_usuarios_update//
DROP TRIGGER IF EXISTS bitacora_pedidos_update//

-- Trigger para productos
CREATE TRIGGER bitacora_productos_update
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_cambios (
    tabla_afectada, 
    id_registro, 
    tipo_cambio, 
    id_usuario, 
    valor_anterior, 
    valor_nuevo,
    cambios_completos
  ) VALUES (
    'productos',
    NEW.id_producto,
    'actualizar',
    COALESCE(NEW.id_usuario, 0),
    JSON_OBJECT(
      'nombre', OLD.nombre,
      'precio', OLD.precio,
      'stock', OLD.stock,
      'descripcion', OLD.descripcion
    ),
    JSON_OBJECT(
      'nombre', NEW.nombre,
      'precio', NEW.precio,
      'stock', NEW.stock,
      'descripcion', NEW.descripcion
    ),
    JSON_OBJECT(
      'campos_cambiados', JSON_ARRAY(
        IF(OLD.nombre != NEW.nombre, 'nombre', NULL),
        IF(OLD.precio != NEW.precio, 'precio', NULL),
        IF(OLD.stock != NEW.stock, 'stock', NULL),
        IF(OLD.descripcion != NEW.descripcion, 'descripcion', NULL)
      )
    )
  );
END//

-- Trigger para usuarios
CREATE TRIGGER bitacora_usuarios_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_cambios (
    tabla_afectada, 
    id_registro, 
    tipo_cambio, 
    id_usuario, 
    cambios_completos
  ) VALUES (
    'usuarios',
    NEW.id_usuario,
    'actualizar',
    NEW.id_usuario,
    JSON_OBJECT(
      'campos_cambiados', JSON_ARRAY(
        IF(OLD.nombre != NEW.nombre, 'nombre', NULL),
        IF(OLD.email != NEW.email, 'email', NULL),
        IF(OLD.telefono != NEW.telefono, 'telefono', NULL),
        IF(OLD.direccion != NEW.direccion, 'direccion', NULL),
        IF(OLD.activo != NEW.activo, 'activo', NULL)
      )
    )
  );
END//

-- Trigger para pedidos
CREATE TRIGGER bitacora_pedidos_update
AFTER UPDATE ON pedidos
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_cambios (
    tabla_afectada, 
    id_registro, 
    tipo_cambio, 
    id_usuario, 
    cambios_completos
  ) VALUES (
    'pedidos',
    NEW.id_pedido,
    'actualizar',
    COALESCE(NEW.id_consumidor, 0),
    JSON_OBJECT(
      'estado_anterior', OLD.estado,
      'estado_nuevo', NEW.estado,
      'estado_pago_anterior', COALESCE(OLD.estado_pago, 'pendiente'),
      'estado_pago_nuevo', COALESCE(NEW.estado_pago, 'pendiente')
    )
  );
END//

DELIMITER ;

COMMIT;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================

SELECT '✅ Base de datos AgroStock creada exitosamente' as status;
SELECT '📊 Versión: 3.0.0 FINAL' as version;
SELECT '📋 Tablas creadas:' as info;
SHOW TABLES;

SELECT '📈 Vistas creadas:' as info;
SHOW FULL TABLES WHERE Table_type = 'VIEW';

SELECT '🔧 Triggers creados:' as info;
SHOW TRIGGERS;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

