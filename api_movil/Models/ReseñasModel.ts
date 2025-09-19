import { conexion } from "./Conexion.ts";

interface ResenaData {
  id_resena: number | null;
  id_usuario: number;     // FK a usuario
  id_producto: number;    // FK a producto (o servicio)
  calificacion: number;   // Por ejemplo: 1 a 5
  comentario: string;
  fecha: Date;
}

export class Resena {
  public _objResena: ResenaData | null;

  constructor(objResena: ResenaData | null = null) {
    this._objResena = objResena;
  }

  // 📌 Listar todas las reseñas
  public async ListarResenas(): Promise<ResenaData[]> {
    try {
      const result = await conexion.execute("SELECT * FROM resenas");
      if (!result || !result.rows) {
        return [];
      }
      return result.rows;
    } catch (error) {
      console.error("Error al consultar las reseñas: ", error);
      throw new Error("No se pudieron obtener las reseñas.");
    }
  }

  // 📌 Insertar reseña
  public async InsertarResena(): Promise<{ success: boolean; message: string; resena?: Record<string, unknown> }> {
    try {
      if (!this._objResena) {
        throw new Error("No se ha proporcionado un objeto válido.");
      }

      const { id_usuario, id_producto, calificacion, comentario, fecha } = this._objResena;

      if (!id_usuario || !id_producto || !calificacion || !comentario || !fecha) {
        throw new Error("Faltan campos requeridos para insertar reseña.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "INSERT INTO resenas (id_usuario, id_producto, calificacion, comentario, fecha) VALUES (?, ?, ?, ?, ?)",
        [id_usuario, id_producto, calificacion, comentario, fecha]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [resena] = await conexion.query("SELECT * FROM resenas ORDER BY id_resena DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Reseña insertada con éxito.",
          resena: resena,
        };
      } else {
        throw new Error("No se pudo insertar la reseña.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Eliminar reseña
  public async EliminarResena(id_resena: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM resenas WHERE id_resena = ?", [id_resena]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Reseña eliminada correctamente.",
        };
      } else {
        throw new Error("No se encontró la reseña a eliminar.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Editar reseña
  public async EditarResena(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objResena || !this._objResena.id_resena) {
        throw new Error("No se ha proporcionado una reseña válida con ID.");
      }

      const { id_resena, id_usuario, id_producto, calificacion, comentario, fecha } = this._objResena;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "UPDATE resenas SET id_usuario = ?, id_producto = ?, calificacion = ?, comentario = ?, fecha = ? WHERE id_resena = ?",
        [id_usuario, id_producto, calificacion, comentario, fecha, id_resena]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Reseña actualizada correctamente.",
        };
      } else {
        throw new Error("No se pudo actualizar la reseña o no se encontró.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Buscar reseñas de un producto
  public async BuscarPorProducto(id_producto: number): Promise<ResenaData[]> {
    try {
      const result = await conexion.query("SELECT * FROM resenas WHERE id_producto = ?", [id_producto]);
      return result as ResenaData[];
    } catch (error) {
      console.error("Error al buscar reseñas por producto: ", error);
      return [];
    }
  }
}
