import { conexion } from "./Conexion.ts";

export interface MensajeData {
  id_mensaje: number;
  id_remitente: number;
  id_destinatario: number;
  id_producto?: number;
  asunto: string;
  mensaje: string;
  fecha_envio: Date;
  leido: boolean;
  tipo_mensaje: 'consulta' | 'pedido' | 'general';
}

export interface MensajeCreateData {
  id_remitente: number;
  id_destinatario: number;
  id_producto?: number;
  asunto: string;
  mensaje: string;
  tipo_mensaje?: 'consulta' | 'pedido' | 'general';
}

export class MensajesModel {
  public _objMensaje: MensajeCreateData | null;

  constructor(objMensaje: MensajeCreateData | null = null) {
    this._objMensaje = objMensaje;
  }

  // 📌 Crear nuevo mensaje
  public async CrearMensaje(): Promise<{ success: boolean; message: string; mensaje?: MensajeData }> {
    try {
      if (!this._objMensaje) {
        throw new Error("No se ha proporcionado un objeto de mensaje válido.");
      }

      const { id_remitente, id_destinatario, id_producto, asunto, mensaje, tipo_mensaje } = this._objMensaje;

      if (!id_remitente || !id_destinatario || !asunto || !mensaje) {
        throw new Error("Faltan campos requeridos para crear el mensaje.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "INSERT INTO mensajes (id_remitente, id_destinatario, id_producto, asunto, mensaje, tipo_mensaje) VALUES (?, ?, ?, ?, ?, ?)",
        [id_remitente, id_destinatario, id_producto || null, asunto, mensaje, tipo_mensaje || 'consulta']
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [nuevoMensaje] = await conexion.query("SELECT * FROM mensajes ORDER BY id_mensaje DESC LIMIT 1");
        
        // Actualizar estadísticas del destinatario
        await this.actualizarEstadisticasDestinatario(id_destinatario);

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Mensaje enviado exitosamente.",
          mensaje: nuevoMensaje as MensajeData,
        };
      } else {
        throw new Error("No se pudo crear el mensaje.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Obtener mensajes recibidos por usuario
  public async ObtenerMensajesRecibidos(id_usuario: number): Promise<MensajeData[]> {
    try {
      const result = await conexion.query(`
        SELECT m.*, 
               u_remitente.nombre as nombre_remitente,
               u_remitente.email as email_remitente,
               p.nombre as nombre_producto
        FROM mensajes m
        LEFT JOIN usuarios u_remitente ON m.id_remitente = u_remitente.id_usuario
        LEFT JOIN productos p ON m.id_producto = p.id_producto
        WHERE m.id_destinatario = ?
        ORDER BY m.fecha_envio DESC
      `, [id_usuario]);
      
      return result as MensajeData[];
    } catch (error) {
      console.error("Error al obtener mensajes recibidos:", error);
      return [];
    }
  }

  // 📌 Obtener mensajes enviados por usuario
  public async ObtenerMensajesEnviados(id_usuario: number): Promise<MensajeData[]> {
    try {
      const result = await conexion.query(`
        SELECT m.*, 
               u_destinatario.nombre as nombre_destinatario,
               u_destinatario.email as email_destinatario,
               p.nombre as nombre_producto
        FROM mensajes m
        LEFT JOIN usuarios u_destinatario ON m.id_destinatario = u_destinatario.id_usuario
        LEFT JOIN productos p ON m.id_producto = p.id_producto
        WHERE m.id_remitente = ?
        ORDER BY m.fecha_envio DESC
      `, [id_usuario]);
      
      return result as MensajeData[];
    } catch (error) {
      console.error("Error al obtener mensajes enviados:", error);
      return [];
    }
  }

  // 📌 Marcar mensaje como leído
  public async MarcarComoLeido(id_mensaje: number): Promise<{ success: boolean; message: string }> {
    try {
      const result = await conexion.execute(
        "UPDATE mensajes SET leido = 1 WHERE id_mensaje = ?",
        [id_mensaje]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        return {
          success: true,
          message: "Mensaje marcado como leído.",
        };
      } else {
        return {
          success: false,
          message: "No se pudo marcar el mensaje como leído.",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Eliminar mensaje
  public async EliminarMensaje(id_mensaje: number): Promise<{ success: boolean; message: string }> {
    try {
      const result = await conexion.execute(
        "DELETE FROM mensajes WHERE id_mensaje = ?",
        [id_mensaje]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        return {
          success: true,
          message: "Mensaje eliminado correctamente.",
        };
      } else {
        return {
          success: false,
          message: "No se encontró el mensaje a eliminar.",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Obtener mensajes no leídos
  public async ObtenerMensajesNoLeidos(id_usuario: number): Promise<number> {
    try {
      const result = await conexion.query(
        "SELECT COUNT(*) as total FROM mensajes WHERE id_destinatario = ? AND leido = 0",
        [id_usuario]
      );
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error("Error al obtener mensajes no leídos:", error);
      return 0;
    }
  }

  // 📌 Obtener conversación entre dos usuarios
  public async ObtenerConversacion(id_usuario1: number, id_usuario2: number): Promise<MensajeData[]> {
    try {
      const result = await conexion.query(`
        SELECT m.*, 
               u_remitente.nombre as nombre_remitente,
               u_destinatario.nombre as nombre_destinatario,
               p.nombre as nombre_producto
        FROM mensajes m
        LEFT JOIN usuarios u_remitente ON m.id_remitente = u_remitente.id_usuario
        LEFT JOIN usuarios u_destinatario ON m.id_destinatario = u_destinatario.id_usuario
        LEFT JOIN productos p ON m.id_producto = p.id_producto
        WHERE (m.id_remitente = ? AND m.id_destinatario = ?) 
           OR (m.id_remitente = ? AND m.id_destinatario = ?)
        ORDER BY m.fecha_envio ASC
      `, [id_usuario1, id_usuario2, id_usuario2, id_usuario1]);
      
      return result as MensajeData[];
    } catch (error) {
      console.error("Error al obtener conversación:", error);
      return [];
    }
  }

  // 📌 Actualizar estadísticas del destinatario
  private async actualizarEstadisticasDestinatario(id_usuario: number): Promise<void> {
    try {
      // Verificar si existe registro de estadísticas
      const existe = await conexion.query(
        "SELECT id_usuario FROM estadisticas_usuarios WHERE id_usuario = ?",
        [id_usuario]
      );

      if (existe.length === 0) {
        // Crear registro inicial
        await conexion.execute(
          "INSERT INTO estadisticas_usuarios (id_usuario, total_mensajes_recibidos) VALUES (?, 1)",
          [id_usuario]
        );
      } else {
        // Actualizar contador
        await conexion.execute(
          "UPDATE estadisticas_usuarios SET total_mensajes_recibidos = total_mensajes_recibidos + 1 WHERE id_usuario = ?",
          [id_usuario]
        );
      }
    } catch (error) {
      console.error("Error al actualizar estadísticas:", error);
    }
  }
}
