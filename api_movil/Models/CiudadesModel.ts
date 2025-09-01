import { conexion } from "./Conexion.ts";

interface CiudadData {
  id_ciudad: number | null;
  nombre: string;
  id_departamento: number;
}

export class CiudadesModel {
  public _objCiudad: CiudadData | null;

  constructor(objCiudad: CiudadData | null = null) {
    this._objCiudad = objCiudad;
  }

  public async ListarCiudades(): Promise<CiudadData[]> {
    try {
      const result = await conexion.query("SELECT * FROM ciudades");
      return result as CiudadData[];
    } catch (error) {
      console.error("Error al listar ciudades:", error);
      throw new Error("Error al listar ciudades.");
    }
  }

  public async AgregarCiudad(): Promise<{ success: boolean; message: string; ciudad?: CiudadData }> {
    try {
      if (!this._objCiudad) throw new Error("No se proporciono un objeto de ciudad.");

      const { nombre, id_departamento } = this._objCiudad;

      if (!nombre || !id_departamento) throw new Error("Faltan campos obligatorios.");

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("INSERT INTO ciudades (nombre, id_departamento) VALUES (?, ?)",
        [nombre, id_departamento]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const queryResult = await conexion.query("SELECT * FROM ciudades ORDER BY id_ciudad DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Ciudad agregada exitosamente.",
          ciudad: queryResult?.[0] as CiudadData,
        };
      } else {
        await conexion.execute("ROLLBACK");
        return { success: false, message: "No se pudo agregar la ciudad." };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al agregar ciudad:", error);
      return { success: false, message: "Error al agregar ciudad." };
    }
  }

  public async EditarCiudad(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objCiudad || !this._objCiudad.id_ciudad) {
        throw new Error("No se proporciono un objeto de ciudad valido.");
      }

      const { id_ciudad, nombre, id_departamento } = this._objCiudad;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("UPDATE ciudades SET nombre = ?, id_departamento = ? WHERE id_ciudad = ?",
        [nombre, id_departamento, id_ciudad]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Ciudad editada exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo editar la ciudad.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al editar ciudad:", error);
      return {
        success: false,
        message: "Error al editar la ciudad.",
      };
    }
  }

  public async EliminarCiudad(id_ciudad: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM ciudades WHERE id_ciudad = ?", [id_ciudad]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Ciudad eliminada exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo eliminar la ciudad.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al eliminar ciudad:", error);
      return {
        success: false,
        message: "Error al eliminar la ciudad.",
      };
    }
  }
}
