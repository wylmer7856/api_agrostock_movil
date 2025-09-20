import { conexion } from "./Conexion.ts";

interface ConsejoData {
  id_consejo: number | null;
  id_usuario: number;   // FK a usuario
  titulo: string;
  contenido: string;
  fecha: Date;
}

export class Consejo {
  public _objConsejo: ConsejoData | null;

  constructor(objConsejo: ConsejoData | null = null) {
    this._objConsejo = objConsejo;
  }

  // 📌 Listar todos los consejos
  public async ListarConsejos(): Promise<ConsejoData[]> {
    try {
      const result = await conexion.execute("SELECT * FROM consejos");
      if (!result || !result.rows) {
        return [];
      }
      return result.rows;
    } catch (error) {
      console.error("Error al consultar los consejos: ", error);
      throw new Error("No se pudieron obtener los consejos.");
    }
  }

  // 📌 Insertar consejo
  public async InsertarConsejo(): Promise<{ success: boolean; message: string; consejo?: Record<string, unknown> }> {
    try {
      if (!this._objConsejo) {
        throw new Error("No se ha proporcionado un objeto válido.");
      }

      const { id_usuario, titulo, contenido, fecha } = this._objConsejo;

      if (!id_usuario || !titulo || !contenido || !fecha) {
        throw new Error("Faltan campos requeridos para insertar consejo.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "INSERT INTO consejos (id_usuario, titulo, contenido, fecha) VALUES (?, ?, ?, ?)",
        [id_usuario, titulo, contenido, fecha]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [consejo] = await conexion.query("SELECT * FROM consejos ORDER BY id_consejo DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Consejo insertado con éxito.",
          consejo: consejo,
        };
      } else {
        throw new Error("No se pudo insertar el consejo.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Eliminar consejo
  public async EliminarConsejo(id_consejo: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM consejos WHERE id_consejo = ?", [id_consejo]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Consejo eliminado correctamente.",
        };
      } else {
        throw new Error("No se encontró el consejo a eliminar.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Editar consejo
  public async EditarConsejo(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objConsejo || !this._objConsejo.id_consejo) {
        throw new Error("No se ha proporcionado un consejo válido con ID.");
      }

      const { id_consejo, id_usuario, titulo, contenido, fecha } = this._objConsejo;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "UPDATE consejos SET id_usuario = ?, titulo = ?, contenido = ?, fecha = ? WHERE id_consejo = ?",
        [id_usuario, titulo, contenido, fecha, id_consejo]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Consejo actualizado correctamente.",
        };
      } else {
        throw new Error("No se pudo actualizar el consejo o no se encontró.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Buscar consejos por usuario
  public async BuscarPorUsuario(id_usuario: number): Promise<ConsejoData[]> {
    try {
      const result = await conexion.query("SELECT * FROM consejos WHERE id_usuario = ?", [id_usuario]);
      return result as ConsejoData[];
    } catch (error) {
      console.error("Error al buscar consejos por usuario: ", error);
      return [];
    }
  }
}
