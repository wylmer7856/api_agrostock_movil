import { Context } from "../Dependencies/dependencias.ts";
import { Usuario } from "../Models/UsuariosModel.ts";
import { ProductosModel } from "../Models/ProductosModel.ts";
import { ReportesModel } from "../Models/ReportesModel.ts";
import { EstadisticasModel } from "../Models/EstadisticasModel.ts";

export class AdminController {
  
  // 📌 Obtener todos los usuarios
  static async ObtenerTodosLosUsuarios(ctx: Context) {
    try {
      const { rol, ciudad, departamento, region } = ctx.request.url.searchParams;
      const usuarioModel = new Usuario();

      let usuarios;
      if (rol) {
        usuarios = await usuarioModel.ListarUsuarios();
        usuarios = usuarios.filter(u => u.rol === rol);
      } else if (ciudad) {
        usuarios = await usuarioModel.FiltrarPorCiudad(parseInt(ciudad));
      } else if (departamento) {
        usuarios = await usuarioModel.FiltrarPorDepartamento(parseInt(departamento));
      } else if (region) {
        usuarios = await usuarioModel.FiltrarPorRegion(parseInt(region));
      } else {
        usuarios = await usuarioModel.ListarUsuarios();
      }

      // Obtener información adicional de cada usuario
      const { conexion } = await import("../Models/Conexion.ts");
      const usuariosConInfo = await Promise.all(usuarios.map(async (usuario) => {
        const ciudad = await conexion.query(`
          SELECT c.nombre as ciudad, d.nombre as departamento, r.nombre as region
          FROM ciudades c
          INNER JOIN departamentos d ON c.id_departamento = d.id_departamento
          INNER JOIN regiones r ON d.id_region = r.id_region
          WHERE c.id_ciudad = ?
        `, [usuario.id_ciudad]);

        const estadisticas = await conexion.query(`
          SELECT 
            COUNT(p.id_producto) as total_productos,
            COUNT(m.id_mensaje) as total_mensajes_recibidos,
            COUNT(ped.id_pedido) as total_pedidos_recibidos
          FROM usuarios u
          LEFT JOIN productos p ON u.id_usuario = p.id_usuario
          LEFT JOIN mensajes m ON u.id_usuario = m.id_destinatario
          LEFT JOIN pedidos ped ON u.id_usuario = ped.id_productor
          WHERE u.id_usuario = ?
        `, [usuario.id_usuario]);

        return {
          ...usuario,
          ubicacion: ciudad[0] || null,
          estadisticas: estadisticas[0] || { total_productos: 0, total_mensajes_recibidos: 0, total_pedidos_recibidos: 0 }
        };
      }));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        usuarios: usuariosConInfo,
        total: usuariosConInfo.length
      };
    } catch (error) {
      console.error("Error en ObtenerTodosLosUsuarios:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Crear usuario manualmente
  static async CrearUsuario(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { nombre, email, password, telefono, direccion, id_ciudad, rol } = body;

      if (!nombre || !email || !password || !telefono || !direccion || !id_ciudad || !rol) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Faltan campos requeridos" };
        return;
      }

      const rolesValidos = ['admin', 'consumidor', 'productor'];
      if (!rolesValidos.includes(rol)) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Rol inválido" };
        return;
      }

      const usuarioData = {
        id_usuario: null,
        nombre,
        email,
        password,
        telefono,
        direccion,
        id_ciudad: parseInt(id_ciudad),
        rol
      };

      const usuarioModel = new Usuario(usuarioData);
      const result = await usuarioModel.InsertarUsuario();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en CrearUsuario:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Editar usuario
  static async EditarUsuario(ctx: Context) {
    try {
      const { id_usuario } = ctx.params;
      const body = await ctx.request.body.json();
      const { nombre, email, password, telefono, direccion, id_ciudad, rol } = body;

      if (!id_usuario) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del usuario requerido" };
        return;
      }

      const rolesValidos = ['admin', 'consumidor', 'productor'];
      if (rol && !rolesValidos.includes(rol)) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Rol inválido" };
        return;
      }

      const usuarioData = {
        id_usuario: parseInt(id_usuario),
        nombre,
        email,
        password,
        telefono,
        direccion,
        id_ciudad: id_ciudad ? parseInt(id_ciudad) : undefined,
        rol
      };

      const usuarioModel = new Usuario(usuarioData);
      const result = await usuarioModel.EditarUsuario();

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EditarUsuario:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Eliminar usuario
  static async EliminarUsuario(ctx: Context) {
    try {
      const { id_usuario } = ctx.params;

      if (!id_usuario) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del usuario requerido" };
        return;
      }

      const usuarioModel = new Usuario();
      const result = await usuarioModel.EliminarUsuario(parseInt(id_usuario));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarUsuario:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener todos los productos
  static async ObtenerTodosLosProductos(ctx: Context) {
    try {
      const { conexion } = await import("../Models/Conexion.ts");
      
      const productos = await conexion.query(`
        SELECT 
          p.*,
          u.nombre as nombre_productor,
          u.email as email_productor,
          u.telefono as telefono_productor,
          c.nombre as ciudad_origen,
          d.nombre as departamento_origen,
          r.nombre as region_origen
        FROM productos p
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        INNER JOIN ciudades c ON p.id_ciudad_origen = c.id_ciudad
        INNER JOIN departamentos d ON c.id_departamento = d.id_departamento
        INNER JOIN regiones r ON d.id_region = r.id_region
        ORDER BY p.id_producto DESC
      `);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        productos,
        total: productos.length
      };
    } catch (error) {
      console.error("Error en ObtenerTodosLosProductos:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Eliminar producto inapropiado
  static async EliminarProductoInapropiado(ctx: Context) {
    try {
      const { id_producto } = ctx.params;
      const body = await ctx.request.body.json();
      const { motivo } = body;

      if (!id_producto) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del producto requerido" };
        return;
      }

      const productosModel = new ProductosModel();
      const result = await productosModel.EliminarProducto(parseInt(id_producto));

      if (result.success) {
        // Registrar la acción en los logs del sistema
        const { conexion } = await import("../Models/Conexion.ts");
        await conexion.execute(`
          INSERT INTO configuracion_sistema (clave, valor, descripcion) 
          VALUES (?, ?, ?)
        `, [
          `producto_eliminado_${id_producto}`,
          motivo || 'Producto eliminado por administrador',
          `Producto eliminado el ${new Date().toISOString()}`
        ]);

        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Producto eliminado correctamente",
          motivo: motivo || 'Producto eliminado por administrador'
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarProductoInapropiado:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener todos los reportes
  static async ObtenerTodosLosReportes(ctx: Context) {
    try {
      const reportesModel = new ReportesModel();
      const reportes = await reportesModel.ObtenerTodosLosReportes();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        reportes,
        total: reportes.length
      };
    } catch (error) {
      console.error("Error en ObtenerTodosLosReportes:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Resolver reporte
  static async ResolverReporte(ctx: Context) {
    try {
      const { id_reporte } = ctx.params;
      const body = await ctx.request.body.json();
      const { estado, accion_tomada } = body;

      if (!id_reporte || !estado) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del reporte y estado son requeridos" };
        return;
      }

      const estadosValidos = ['pendiente', 'en_revision', 'resuelto', 'rechazado'];
      if (!estadosValidos.includes(estado)) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Estado inválido" };
        return;
      }

      const reportesModel = new ReportesModel();
      const result = await reportesModel.ActualizarEstadoReporte(parseInt(id_reporte), estado, accion_tomada);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ResolverReporte:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Eliminar reporte resuelto
  static async EliminarReporteResuelto(ctx: Context) {
    try {
      const { id_reporte } = ctx.params;

      if (!id_reporte) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del reporte requerido" };
        return;
      }

      const reportesModel = new ReportesModel();
      const result = await reportesModel.EliminarReporteResuelto(parseInt(id_reporte));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarReporteResuelto:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener estadísticas generales
  static async ObtenerEstadisticasGenerales(ctx: Context) {
    try {
      const estadisticasModel = new EstadisticasModel();
      const estadisticas = await estadisticasModel.ObtenerEstadisticasGenerales();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        estadisticas
      };
    } catch (error) {
      console.error("Error en ObtenerEstadisticasGenerales:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener actividad reciente
  static async ObtenerActividadReciente(ctx: Context) {
    try {
      const estadisticasModel = new EstadisticasModel();
      const actividad = await estadisticasModel.ObtenerActividadReciente();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        actividad
      };
    } catch (error) {
      console.error("Error en ObtenerActividadReciente:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Acceder a panel de productor (simular)
  static async AccederPanelProductor(ctx: Context) {
    try {
      const { id_usuario } = ctx.params;

      if (!id_usuario) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del usuario requerido" };
        return;
      }

      // Verificar que el usuario sea productor
      const { conexion } = await import("../Models/Conexion.ts");
      const usuario = await conexion.query("SELECT rol FROM usuarios WHERE id_usuario = ?", [id_usuario]);

      if (usuario.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Usuario no encontrado" };
        return;
      }

      if (usuario[0].rol !== 'productor') {
        ctx.response.status = 400;
        ctx.response.body = { error: "El usuario no es un productor" };
        return;
      }

      // Obtener datos del panel de productor
      const productos = await conexion.query("SELECT * FROM productos WHERE id_usuario = ?", [id_usuario]);
      const mensajes = await conexion.query("SELECT COUNT(*) as total FROM mensajes WHERE id_destinatario = ?", [id_usuario]);
      const pedidos = await conexion.query("SELECT COUNT(*) as total FROM pedidos WHERE id_productor = ?", [id_usuario]);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Acceso al panel de productor autorizado",
        datos: {
          usuario_id: id_usuario,
          total_productos: productos.length,
          total_mensajes: mensajes[0]?.total || 0,
          total_pedidos: pedidos[0]?.total || 0
        }
      };
    } catch (error) {
      console.error("Error en AccederPanelProductor:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Acceder a panel de consumidor (simular)
  static async AccederPanelConsumidor(ctx: Context) {
    try {
      const { id_usuario } = ctx.params;

      if (!id_usuario) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del usuario requerido" };
        return;
      }

      // Verificar que el usuario sea consumidor
      const { conexion } = await import("../Models/Conexion.ts");
      const usuario = await conexion.query("SELECT rol FROM usuarios WHERE id_usuario = ?", [id_usuario]);

      if (usuario.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Usuario no encontrado" };
        return;
      }

      if (usuario[0].rol !== 'consumidor') {
        ctx.response.status = 400;
        ctx.response.body = { error: "El usuario no es un consumidor" };
        return;
      }

      // Obtener datos del panel de consumidor
      const mensajes = await conexion.query("SELECT COUNT(*) as total FROM mensajes WHERE id_remitente = ?", [id_usuario]);
      const pedidos = await conexion.query("SELECT COUNT(*) as total FROM pedidos WHERE id_consumidor = ?", [id_usuario]);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Acceso al panel de consumidor autorizado",
        datos: {
          usuario_id: id_usuario,
          total_mensajes_enviados: mensajes[0]?.total || 0,
          total_pedidos: pedidos[0]?.total || 0
        }
      };
    } catch (error) {
      console.error("Error en AccederPanelConsumidor:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }
}
