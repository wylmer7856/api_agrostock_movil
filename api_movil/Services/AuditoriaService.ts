// 📋 SERVICIO DE AUDITORÍA Y TRAZABILIDAD

import { conexion } from "../Models/Conexion.ts";
import type { Context } from "../Dependencies/dependencias.ts";

export interface AuditoriaData {
  id_usuario: number;
  accion: string;
  tabla_afectada: string;
  id_registro_afectado?: number;
  datos_antes?: Record<string, unknown>;
  datos_despues?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  descripcion?: string;
  resultado?: 'exitoso' | 'fallido' | 'error';
  error_message?: string;
}

export class AuditoriaService {
  
  /**
   * Registrar acción en auditoría
   */
  static async registrarAccion(
    data: AuditoriaData,
    ctx?: Context
  ): Promise<void> {
    try {
      // Obtener IP de forma segura
      let ip_address = data.ip_address || null;
      try {
        if (ctx?.request?.ip) {
          ip_address = ctx.request.ip;
        }
      } catch (_error) {
        ip_address = ctx?.request?.headers?.get('x-forwarded-for') || 
                     ctx?.request?.headers?.get('x-real-ip') || 
                     data.ip_address || 
                     null;
      }
      const user_agent = ctx?.request.headers.get('user-agent') || data.user_agent || null;

      await conexion.execute(
        `INSERT INTO auditoria_acciones 
         (id_usuario, accion, tabla_afectada, id_registro_afectado, 
          datos_antes, datos_despues, ip_address, user_agent, descripcion, resultado, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id_usuario,
          data.accion,
          data.tabla_afectada,
          data.id_registro_afectado || null,
          data.datos_antes ? JSON.stringify(data.datos_antes) : null,
          data.datos_despues ? JSON.stringify(data.datos_despues) : null,
          ip_address,
          user_agent,
          data.descripcion || null,
          data.resultado || 'exitoso',
          data.error_message || null
        ]
      );
    } catch (error) {
      console.error("Error registrando auditoría:", error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Registrar cambio en bitácora
   */
  static async registrarCambio(
    tabla: string,
    id_registro: number,
    tipo_cambio: 'crear' | 'actualizar' | 'eliminar' | 'restaurar',
    id_usuario: number,
    cambios: {
      campo?: string;
      valor_anterior?: unknown;
      valor_nuevo?: unknown;
      cambios_completos?: Record<string, unknown>;
    },
    ctx?: Context,
    motivo?: string
  ): Promise<void> {
    try {
      // Obtener IP de forma segura
      let ip_address = null;
      try {
        if (ctx?.request?.ip) {
          ip_address = ctx.request.ip;
        }
      } catch (_error) {
        ip_address = ctx?.request?.headers?.get('x-forwarded-for') || 
                     ctx?.request?.headers?.get('x-real-ip') || 
                     null;
      }

      await conexion.execute(
        `INSERT INTO bitacora_cambios 
         (tabla_afectada, id_registro, tipo_cambio, id_usuario, 
          campo_modificado, valor_anterior, valor_nuevo, cambios_completos, ip_address, motivo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tabla,
          id_registro,
          tipo_cambio,
          id_usuario,
          cambios.campo || null,
          cambios.valor_anterior ? String(cambios.valor_anterior) : null,
          cambios.valor_nuevo ? String(cambios.valor_nuevo) : null,
          cambios.cambios_completos ? JSON.stringify(cambios.cambios_completos) : null,
          ip_address,
          motivo || null
        ]
      );
    } catch (error) {
      console.error("Error registrando bitácora:", error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Obtener historial de auditoría de un usuario
   */
  static async obtenerHistorialUsuario(
    id_usuario: number,
    limite: number = 50
  ): Promise<Record<string, unknown>[]> {
    try {
      const result = await conexion.query(
        `SELECT 
          aa.*,
          u.nombre as nombre_usuario,
          u.email as email_usuario
         FROM auditoria_acciones aa
         INNER JOIN usuarios u ON aa.id_usuario = u.id_usuario
         WHERE aa.id_usuario = ?
         ORDER BY aa.fecha_accion DESC
         LIMIT ?`,
        [id_usuario, limite]
      );
      return result;
    } catch (error) {
      console.error("Error obteniendo historial:", error);
      return [];
    }
  }

  /**
   * Obtener bitácora de cambios de un registro
   */
  static async obtenerBitacoraRegistro(
    tabla: string,
    id_registro: number
  ): Promise<Record<string, unknown>[]> {
    try {
      const result = await conexion.query(
        `SELECT 
          bc.*,
          u.nombre as nombre_usuario,
          u.email as email_usuario
         FROM bitacora_cambios bc
         INNER JOIN usuarios u ON bc.id_usuario = u.id_usuario
         WHERE bc.tabla_afectada = ? AND bc.id_registro = ?
         ORDER BY bc.fecha_cambio DESC`,
        [tabla, id_registro]
      );
      return result;
    } catch (error) {
      console.error("Error obteniendo bitácora:", error);
      return [];
    }
  }

  /**
   * Obtener todas las acciones de auditoría (solo admin)
   */
  static async obtenerTodasLasAcciones(
    filtros?: {
      id_usuario?: number;
      accion?: string;
      tabla_afectada?: string;
      fecha_desde?: Date;
      fecha_hasta?: Date;
      resultado?: string;
    },
    limite: number = 100
  ): Promise<Record<string, unknown>[]> {
    try {
      let query = `
        SELECT 
          aa.*,
          u.nombre as nombre_usuario,
          u.email as email_usuario
        FROM auditoria_acciones aa
        INNER JOIN usuarios u ON aa.id_usuario = u.id_usuario
        WHERE 1=1
      `;
      const params: unknown[] = [];

      if (filtros?.id_usuario) {
        query += ` AND aa.id_usuario = ?`;
        params.push(filtros.id_usuario);
      }

      if (filtros?.accion) {
        query += ` AND aa.accion = ?`;
        params.push(filtros.accion);
      }

      if (filtros?.tabla_afectada) {
        query += ` AND aa.tabla_afectada = ?`;
        params.push(filtros.tabla_afectada);
      }

      if (filtros?.fecha_desde) {
        query += ` AND aa.fecha_accion >= ?`;
        params.push(filtros.fecha_desde);
      }

      if (filtros?.fecha_hasta) {
        query += ` AND aa.fecha_accion <= ?`;
        params.push(filtros.fecha_hasta);
      }

      if (filtros?.resultado) {
        query += ` AND aa.resultado = ?`;
        params.push(filtros.resultado);
      }

      query += ` ORDER BY aa.fecha_accion DESC LIMIT ?`;
      params.push(limite);

      const result = await conexion.query(query, params);
      return result;
    } catch (error) {
      console.error("Error obteniendo acciones:", error);
      return [];
    }
  }
}




