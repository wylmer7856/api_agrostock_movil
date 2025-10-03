import { conexion } from "./Conexion.ts";

export interface EstadisticasData {
  total_usuarios: number;
  total_productores: number;
  total_consumidores: number;
  total_productos: number;
  total_pedidos: number;
  total_mensajes: number;
  total_reportes: number;
  productos_por_categoria: Array<{ categoria: string; cantidad: number }>;
  usuarios_por_region: Array<{ region: string; cantidad: number }>;
  actividad_reciente: {
    usuarios_nuevos_ultimo_mes: number;
    productos_nuevos_ultimo_mes: number;
    pedidos_ultimo_mes: number;
    mensajes_ultimo_mes: number;
  };
}

export class EstadisticasModel {
  
  // 📌 Obtener estadísticas generales del sistema
  public async ObtenerEstadisticasGenerales(): Promise<EstadisticasData> {
    try {
      // Estadísticas básicas
      const totalUsuarios = await conexion.query("SELECT COUNT(*) as total FROM usuarios");
      const totalProductores = await conexion.query("SELECT COUNT(*) as total FROM usuarios WHERE rol = 'productor'");
      const totalConsumidores = await conexion.query("SELECT COUNT(*) as total FROM usuarios WHERE rol = 'consumidor'");
      const totalProductos = await conexion.query("SELECT COUNT(*) as total FROM productos");
      const totalPedidos = await conexion.query("SELECT COUNT(*) as total FROM pedidos");
      const totalMensajes = await conexion.query("SELECT COUNT(*) as total FROM mensajes");
      const totalReportes = await conexion.query("SELECT COUNT(*) as total FROM reportes");

      // Productos por categoría
      const productosPorCategoria = await conexion.query(`
        SELECT c.nombre as categoria, COUNT(pc.id_producto) as cantidad
        FROM categorias c
        LEFT JOIN productos_categorias pc ON c.id_categoria = pc.id_categoria
        WHERE c.activa = 1
        GROUP BY c.id_categoria, c.nombre
        ORDER BY cantidad DESC
      `);

      // Usuarios por región
      const usuariosPorRegion = await conexion.query(`
        SELECT r.nombre as region, COUNT(u.id_usuario) as cantidad
        FROM regiones r
        LEFT JOIN departamentos d ON r.id_region = d.id_region
        LEFT JOIN ciudades c ON d.id_departamento = c.id_departamento
        LEFT JOIN usuarios u ON c.id_ciudad = u.id_ciudad
        GROUP BY r.id_region, r.nombre
        ORDER BY cantidad DESC
      `);

      // Actividad reciente (último mes)
      const fechaUnMesAtras = new Date();
      fechaUnMesAtras.setMonth(fechaUnMesAtras.getMonth() - 1);

      const usuariosNuevosUltimoMes = await conexion.query(`
        SELECT COUNT(*) as total FROM usuarios 
        WHERE DATE_FORMAT(NOW(), '%Y-%m') = DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m')
      `);

      const productosNuevosUltimoMes = await conexion.query(`
        SELECT COUNT(*) as total FROM productos 
        WHERE DATE_FORMAT(NOW(), '%Y-%m') = DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m')
      `);

      const pedidosUltimoMes = await conexion.query(`
        SELECT COUNT(*) as total FROM pedidos 
        WHERE DATE_FORMAT(fecha, '%Y-%m') = DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m')
      `);

      const mensajesUltimoMes = await conexion.query(`
        SELECT COUNT(*) as total FROM mensajes 
        WHERE DATE_FORMAT(fecha_envio, '%Y-%m') = DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m')
      `);

      return {
        total_usuarios: totalUsuarios[0]?.total || 0,
        total_productores: totalProductores[0]?.total || 0,
        total_consumidores: totalConsumidores[0]?.total || 0,
        total_productos: totalProductos[0]?.total || 0,
        total_pedidos: totalPedidos[0]?.total || 0,
        total_mensajes: totalMensajes[0]?.total || 0,
        total_reportes: totalReportes[0]?.total || 0,
        productos_por_categoria: productosPorCategoria as Array<{ categoria: string; cantidad: number }>,
        usuarios_por_region: usuariosPorRegion as Array<{ region: string; cantidad: number }>,
        actividad_reciente: {
          usuarios_nuevos_ultimo_mes: usuariosNuevosUltimoMes[0]?.total || 0,
          productos_nuevos_ultimo_mes: productosNuevosUltimoMes[0]?.total || 0,
          pedidos_ultimo_mes: pedidosUltimoMes[0]?.total || 0,
          mensajes_ultimo_mes: mensajesUltimoMes[0]?.total || 0,
        },
      };
    } catch (error) {
      console.error("Error al obtener estadísticas generales:", error);
      return {
        total_usuarios: 0,
        total_productores: 0,
        total_consumidores: 0,
        total_productos: 0,
        total_pedidos: 0,
        total_mensajes: 0,
        total_reportes: 0,
        productos_por_categoria: [],
        usuarios_por_region: [],
        actividad_reciente: {
          usuarios_nuevos_ultimo_mes: 0,
          productos_nuevos_ultimo_mes: 0,
          pedidos_ultimo_mes: 0,
          mensajes_ultimo_mes: 0,
        },
      };
    }
  }

  // 📌 Obtener estadísticas de un usuario específico
  public async ObtenerEstadisticasUsuario(id_usuario: number): Promise<{
    total_productos: number;
    total_mensajes_recibidos: number;
    total_pedidos_recibidos: number;
    productos_por_categoria: Array<{ categoria: string; cantidad: number }>;
    mensajes_por_mes: Array<{ mes: string; cantidad: number }>;
    pedidos_por_mes: Array<{ mes: string; cantidad: number }>;
  }> {
    try {
      // Verificar si existe registro de estadísticas
      let estadisticas = await conexion.query(
        "SELECT * FROM estadisticas_usuarios WHERE id_usuario = ?",
        [id_usuario]
      );

      if (estadisticas.length === 0) {
        // Crear registro inicial
        await conexion.execute(
          "INSERT INTO estadisticas_usuarios (id_usuario) VALUES (?)",
          [id_usuario]
        );
        estadisticas = await conexion.query(
          "SELECT * FROM estadisticas_usuarios WHERE id_usuario = ?",
          [id_usuario]
        );
      }

      // Productos por categoría del usuario
      const productosPorCategoria = await conexion.query(`
        SELECT c.nombre as categoria, COUNT(pc.id_producto) as cantidad
        FROM categorias c
        LEFT JOIN productos_categorias pc ON c.id_categoria = pc.id_categoria
        LEFT JOIN productos p ON pc.id_producto = p.id_producto
        WHERE p.id_usuario = ? AND c.activa = 1
        GROUP BY c.id_categoria, c.nombre
        ORDER BY cantidad DESC
      `, [id_usuario]);

      // Mensajes por mes (últimos 6 meses)
      const mensajesPorMes = await conexion.query(`
        SELECT DATE_FORMAT(fecha_envio, '%Y-%m') as mes, COUNT(*) as cantidad
        FROM mensajes
        WHERE id_destinatario = ? 
          AND fecha_envio >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(fecha_envio, '%Y-%m')
        ORDER BY mes DESC
      `, [id_usuario]);

      // Pedidos por mes (últimos 6 meses)
      const pedidosPorMes = await conexion.query(`
        SELECT DATE_FORMAT(fecha, '%Y-%m') as mes, COUNT(*) as cantidad
        FROM pedidos
        WHERE id_productor = ? 
          AND fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(fecha, '%Y-%m')
        ORDER BY mes DESC
      `, [id_usuario]);

      return {
        total_productos: estadisticas[0]?.total_productos || 0,
        total_mensajes_recibidos: estadisticas[0]?.total_mensajes_recibidos || 0,
        total_pedidos_recibidos: estadisticas[0]?.total_pedidos_recibidos || 0,
        productos_por_categoria: productosPorCategoria as Array<{ categoria: string; cantidad: number }>,
        mensajes_por_mes: mensajesPorMes as Array<{ mes: string; cantidad: number }>,
        pedidos_por_mes: pedidosPorMes as Array<{ mes: string; cantidad: number }>,
      };
    } catch (error) {
      console.error("Error al obtener estadísticas del usuario:", error);
      return {
        total_productos: 0,
        total_mensajes_recibidos: 0,
        total_pedidos_recibidos: 0,
        productos_por_categoria: [],
        mensajes_por_mes: [],
        pedidos_por_mes: [],
      };
    }
  }

  // 📌 Actualizar estadísticas de un usuario
  public async ActualizarEstadisticasUsuario(id_usuario: number): Promise<{ success: boolean; message: string }> {
    try {
      // Contar productos del usuario
      const totalProductos = await conexion.query(
        "SELECT COUNT(*) as total FROM productos WHERE id_usuario = ?",
        [id_usuario]
      );

      // Contar mensajes recibidos
      const totalMensajes = await conexion.query(
        "SELECT COUNT(*) as total FROM mensajes WHERE id_destinatario = ?",
        [id_usuario]
      );

      // Contar pedidos recibidos
      const totalPedidos = await conexion.query(
        "SELECT COUNT(*) as total FROM pedidos WHERE id_productor = ?",
        [id_usuario]
      );

      // Verificar si existe registro
      const existe = await conexion.query(
        "SELECT id_usuario FROM estadisticas_usuarios WHERE id_usuario = ?",
        [id_usuario]
      );

      if (existe.length === 0) {
        // Crear registro
        await conexion.execute(
          "INSERT INTO estadisticas_usuarios (id_usuario, total_productos, total_mensajes_recibidos, total_pedidos_recibidos) VALUES (?, ?, ?, ?)",
          [id_usuario, totalProductos[0]?.total || 0, totalMensajes[0]?.total || 0, totalPedidos[0]?.total || 0]
        );
      } else {
        // Actualizar registro
        await conexion.execute(
          "UPDATE estadisticas_usuarios SET total_productos = ?, total_mensajes_recibidos = ?, total_pedidos_recibidos = ? WHERE id_usuario = ?",
          [totalProductos[0]?.total || 0, totalMensajes[0]?.total || 0, totalPedidos[0]?.total || 0, id_usuario]
        );
      }

      return {
        success: true,
        message: "Estadísticas actualizadas correctamente.",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Obtener actividad reciente del sistema
  public async ObtenerActividadReciente(): Promise<{
    usuarios_nuevos: Array<{ fecha: string; cantidad: number }>;
    productos_nuevos: Array<{ fecha: string; cantidad: number }>;
    pedidos_nuevos: Array<{ fecha: string; cantidad: number }>;
    mensajes_nuevos: Array<{ fecha: string; cantidad: number }>;
  }> {
    try {
      // Actividad de los últimos 30 días
      const usuariosNuevos = await conexion.query(`
        SELECT DATE(fecha_registro) as fecha, COUNT(*) as cantidad
        FROM usuarios
        WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(fecha_registro)
        ORDER BY fecha DESC
        LIMIT 30
      `);

      const productosNuevos = await conexion.query(`
        SELECT DATE(fecha_creacion) as fecha, COUNT(*) as cantidad
        FROM productos
        WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(fecha_creacion)
        ORDER BY fecha DESC
        LIMIT 30
      `);

      const pedidosNuevos = await conexion.query(`
        SELECT DATE(fecha) as fecha, COUNT(*) as cantidad
        FROM pedidos
        WHERE fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(fecha)
        ORDER BY fecha DESC
        LIMIT 30
      `);

      const mensajesNuevos = await conexion.query(`
        SELECT DATE(fecha_envio) as fecha, COUNT(*) as cantidad
        FROM mensajes
        WHERE fecha_envio >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(fecha_envio)
        ORDER BY fecha DESC
        LIMIT 30
      `);

      return {
        usuarios_nuevos: usuariosNuevos as Array<{ fecha: string; cantidad: number }>,
        productos_nuevos: productosNuevos as Array<{ fecha: string; cantidad: number }>,
        pedidos_nuevos: pedidosNuevos as Array<{ fecha: string; cantidad: number }>,
        mensajes_nuevos: mensajesNuevos as Array<{ fecha: string; cantidad: number }>,
      };
    } catch (error) {
      console.error("Error al obtener actividad reciente:", error);
      return {
        usuarios_nuevos: [],
        productos_nuevos: [],
        pedidos_nuevos: [],
        mensajes_nuevos: [],
      };
    }
  }
}
