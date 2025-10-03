import { conexion } from "./Conexion.ts";

export interface ReporteData {
  id_reporte: number;
  id_usuario_reportado?: number;
  id_producto_reportado?: number;
  id_usuario_reportador: number;
  tipo_reporte: 'usuario' | 'producto';
  motivo: string;
  descripcion: string;
  fecha_reporte: Date;
  estado: 'pendiente' | 'en_revision' | 'resuelto' | 'rechazado';
  accion_tomada?: string;
  fecha_resolucion?: Date;
}

export interface ReporteCreateData {
  id_usuario_reportado?: number;
  id_producto_reportado?: number;
  id_usuario_reportador: number;
  tipo_reporte: 'usuario' | 'producto';
  motivo: string;
  descripcion: string;
}

export class ReportesModel {
  public _objReporte: ReporteCreateData | null;

  constructor(objReporte: ReporteCreateData | null = null) {
    this._objReporte = objReporte;
  }

  // 📌 Crear nuevo reporte
  public async CrearReporte(): Promise<{ success: boolean; message: string; reporte?: ReporteData }> {
    try {
      if (!this._objReporte) {
        throw new Error("No se ha proporcionado un objeto de reporte válido.");
      }

      const { id_usuario_reportado, id_producto_reportado, id_usuario_reportador, tipo_reporte, motivo, descripcion } = this._objReporte;

      if (!id_usuario_reportador || !tipo_reporte || !motivo || !descripcion) {
        throw new Error("Faltan campos requeridos para crear el reporte.");
      }

      if (tipo_reporte === 'usuario' && !id_usuario_reportado) {
        throw new Error("Debe especificar el usuario reportado.");
      }

      if (tipo_reporte === 'producto' && !id_producto_reportado) {
        throw new Error("Debe especificar el producto reportado.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "INSERT INTO reportes (id_usuario_reportado, id_producto_reportado, id_usuario_reportador, tipo_reporte, motivo, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
        [id_usuario_reportado || null, id_producto_reportado || null, id_usuario_reportador, tipo_reporte, motivo, descripcion]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [nuevoReporte] = await conexion.query("SELECT * FROM reportes ORDER BY id_reporte DESC LIMIT 1");
        
        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Reporte creado exitosamente.",
          reporte: nuevoReporte as ReporteData,
        };
      } else {
        throw new Error("No se pudo crear el reporte.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Obtener todos los reportes (solo administradores)
  public async ObtenerTodosLosReportes(): Promise<ReporteData[]> {
    try {
      const result = await conexion.query(`
        SELECT r.*, 
               u_reportador.nombre as nombre_reportador,
               u_reportador.email as email_reportador,
               u_reportado.nombre as nombre_usuario_reportado,
               u_reportado.email as email_usuario_reportado,
               p.nombre as nombre_producto_reportado
        FROM reportes r
        LEFT JOIN usuarios u_reportador ON r.id_usuario_reportador = u_reportador.id_usuario
        LEFT JOIN usuarios u_reportado ON r.id_usuario_reportado = u_reportado.id_usuario
        LEFT JOIN productos p ON r.id_producto_reportado = p.id_producto
        ORDER BY r.fecha_reporte DESC
      `);
      
      return result as ReporteData[];
    } catch (error) {
      console.error("Error al obtener todos los reportes:", error);
      return [];
    }
  }

  // 📌 Obtener reportes por estado
  public async ObtenerReportesPorEstado(estado: string): Promise<ReporteData[]> {
    try {
      const result = await conexion.query(`
        SELECT r.*, 
               u_reportador.nombre as nombre_reportador,
               u_reportador.email as email_reportador,
               u_reportado.nombre as nombre_usuario_reportado,
               u_reportado.email as email_usuario_reportado,
               p.nombre as nombre_producto_reportado
        FROM reportes r
        LEFT JOIN usuarios u_reportador ON r.id_usuario_reportador = u_reportador.id_usuario
        LEFT JOIN usuarios u_reportado ON r.id_usuario_reportado = u_reportado.id_usuario
        LEFT JOIN productos p ON r.id_producto_reportado = p.id_producto
        WHERE r.estado = ?
        ORDER BY r.fecha_reporte DESC
      `, [estado]);
      
      return result as ReporteData[];
    } catch (error) {
      console.error("Error al obtener reportes por estado:", error);
      return [];
    }
  }

  // 📌 Obtener reportes por tipo
  public async ObtenerReportesPorTipo(tipo: string): Promise<ReporteData[]> {
    try {
      const result = await conexion.query(`
        SELECT r.*, 
               u_reportador.nombre as nombre_reportador,
               u_reportador.email as email_reportador,
               u_reportado.nombre as nombre_usuario_reportado,
               u_reportado.email as email_usuario_reportado,
               p.nombre as nombre_producto_reportado
        FROM reportes r
        LEFT JOIN usuarios u_reportador ON r.id_usuario_reportador = u_reportador.id_usuario
        LEFT JOIN usuarios u_reportado ON r.id_usuario_reportado = u_reportado.id_usuario
        LEFT JOIN productos p ON r.id_producto_reportado = p.id_producto
        WHERE r.tipo_reporte = ?
        ORDER BY r.fecha_reporte DESC
      `, [tipo]);
      
      return result as ReporteData[];
    } catch (error) {
      console.error("Error al obtener reportes por tipo:", error);
      return [];
    }
  }

  // 📌 Actualizar estado del reporte
  public async ActualizarEstadoReporte(id_reporte: number, estado: string, accion_tomada?: string): Promise<{ success: boolean; message: string }> {
    try {
      const fecha_resolucion = estado === 'resuelto' || estado === 'rechazado' ? new Date() : null;
      
      const result = await conexion.execute(
        "UPDATE reportes SET estado = ?, accion_tomada = ?, fecha_resolucion = ? WHERE id_reporte = ?",
        [estado, accion_tomada || null, fecha_resolucion, id_reporte]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        return {
          success: true,
          message: "Estado del reporte actualizado correctamente.",
        };
      } else {
        return {
          success: false,
          message: "No se pudo actualizar el estado del reporte.",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Eliminar reporte resuelto
  public async EliminarReporteResuelto(id_reporte: number): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar que el reporte esté resuelto
      const reporte = await conexion.query(
        "SELECT estado FROM reportes WHERE id_reporte = ?",
        [id_reporte]
      );

      if (reporte.length === 0) {
        return {
          success: false,
          message: "El reporte no existe.",
        };
      }

      if (reporte[0].estado !== 'resuelto') {
        return {
          success: false,
          message: "Solo se pueden eliminar reportes resueltos.",
        };
      }

      const result = await conexion.execute(
        "DELETE FROM reportes WHERE id_reporte = ?",
        [id_reporte]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        return {
          success: true,
          message: "Reporte eliminado correctamente.",
        };
      } else {
        return {
          success: false,
          message: "No se pudo eliminar el reporte.",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Obtener estadísticas de reportes
  public async ObtenerEstadisticasReportes(): Promise<{
    total: number;
    pendientes: number;
    en_revision: number;
    resueltos: number;
    rechazados: number;
    por_tipo: { usuarios: number; productos: number };
  }> {
    try {
      const total = await conexion.query("SELECT COUNT(*) as total FROM reportes");
      const pendientes = await conexion.query("SELECT COUNT(*) as total FROM reportes WHERE estado = 'pendiente'");
      const en_revision = await conexion.query("SELECT COUNT(*) as total FROM reportes WHERE estado = 'en_revision'");
      const resueltos = await conexion.query("SELECT COUNT(*) as total FROM reportes WHERE estado = 'resuelto'");
      const rechazados = await conexion.query("SELECT COUNT(*) as total FROM reportes WHERE estado = 'rechazado'");
      const usuarios = await conexion.query("SELECT COUNT(*) as total FROM reportes WHERE tipo_reporte = 'usuario'");
      const productos = await conexion.query("SELECT COUNT(*) as total FROM reportes WHERE tipo_reporte = 'producto'");

      return {
        total: total[0]?.total || 0,
        pendientes: pendientes[0]?.total || 0,
        en_revision: en_revision[0]?.total || 0,
        resueltos: resueltos[0]?.total || 0,
        rechazados: rechazados[0]?.total || 0,
        por_tipo: {
          usuarios: usuarios[0]?.total || 0,
          productos: productos[0]?.total || 0,
        },
      };
    } catch (error) {
      console.error("Error al obtener estadísticas de reportes:", error);
      return {
        total: 0,
        pendientes: 0,
        en_revision: 0,
        resueltos: 0,
        rechazados: 0,
        por_tipo: { usuarios: 0, productos: 0 },
      };
    }
  }
}
