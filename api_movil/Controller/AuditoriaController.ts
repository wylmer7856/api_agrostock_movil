// 📋 CONTROLADOR DE AUDITORÍA

import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { AuditoriaService } from "../Services/AuditoriaService.ts";

export class AuditoriaController {
  
  /**
   * Obtener historial de auditoría del usuario actual
   */
  static async obtenerMiHistorial(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "No autenticado",
          message: "Debes estar autenticado"
        };
        return;
      }

      const limite = parseInt(ctx.request.url.searchParams.get("limite") || "50");
      const historial = await AuditoriaService.obtenerHistorialUsuario(user.id, limite);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: historial,
        total: historial.length
      };
    } catch (error) {
      console.error("Error obteniendo historial:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al obtener historial"
      };
    }
  }

  /**
   * Obtener bitácora de cambios de un registro
   */
  static async obtenerBitacoraRegistro(ctx: RouterContext<"/auditoria/bitacora/:tabla/:id">) {
    try {
      const user = ctx.state.user;
      if (!user || user.rol !== 'admin') {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          error: "No autorizado",
          message: "Solo administradores pueden ver bitácoras"
        };
        return;
      }

      const { tabla, id } = ctx.params;
      
      if (!tabla || !id) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Parámetros requeridos",
          message: "Tabla e ID son requeridos"
        };
        return;
      }

      const bitacora = await AuditoriaService.obtenerBitacoraRegistro(tabla, parseInt(id));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: bitacora,
        total: bitacora.length
      };
    } catch (error) {
      console.error("Error obteniendo bitácora:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al obtener bitácora"
      };
    }
  }

  /**
   * Obtener todas las acciones de auditoría (solo admin)
   */
  static async obtenerTodasLasAcciones(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user || user.rol !== 'admin') {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          error: "No autorizado",
          message: "Solo administradores pueden ver todas las acciones"
        };
        return;
      }

      const filtros: {
        id_usuario?: number;
        accion?: string;
        tabla_afectada?: string;
        fecha_desde?: Date;
        fecha_hasta?: Date;
        resultado?: string;
      } = {};
      const params = ctx.request.url.searchParams;

      if (params.get("id_usuario")) {
        filtros.id_usuario = parseInt(params.get("id_usuario")!);
      }
      if (params.get("accion")) {
        filtros.accion = params.get("accion") || undefined;
      }
      if (params.get("tabla")) {
        filtros.tabla_afectada = params.get("tabla") || undefined;
      }
      if (params.get("fecha_desde")) {
        filtros.fecha_desde = new Date(params.get("fecha_desde")!);
      }
      if (params.get("fecha_hasta")) {
        filtros.fecha_hasta = new Date(params.get("fecha_hasta")!);
      }
      if (params.get("resultado")) {
        filtros.resultado = params.get("resultado") || undefined;
      }

      const limite = parseInt(params.get("limite") || "100");
      const acciones = await AuditoriaService.obtenerTodasLasAcciones(filtros, limite);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: acciones,
        total: acciones.length,
        filtros
      };
    } catch (error) {
      console.error("Error obteniendo acciones:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al obtener acciones"
      };
    }
  }
}




