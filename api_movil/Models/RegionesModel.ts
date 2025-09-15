import { conexion } from "./Conexion.ts";

interface RegionData {
  id_region: number | null;
  nombre: string;
}

export class RegionesModel {
  public _objRegion: RegionData | null;

  constructor(objRegion: RegionData | null = null) {
    this._objRegion = objRegion;
  }

  public async ListarRegiones(): Promise<RegionData[]> {
    try {
      const result = await conexion.query("SELECT * FROM regiones");
      return result as RegionData[];
    } catch (error) {
      console.error("Error al listar regiones:", error);
      throw new Error("Error al listar regiones.");
    }
  }

  public async AgregarRegion(): Promise<{ success: boolean; message: string; region?: RegionData }> {
    try {
      if (!this._objRegion) {
        throw new Error("No se proporciono un objeto de region.");
      }

      const { nombre } = this._objRegion;

      if (!nombre || nombre.trim() === "") {
        throw new Error("El nombre de la region es obligatorio.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("INSERT INTO regiones (nombre) VALUES (?)",
        [nombre]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const queryResult = await conexion.query(
          "SELECT * FROM regiones ORDER BY id_region DESC LIMIT 1"
        );

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Region agregada exitosamente.",
          region: queryResult?.[0] as RegionData,
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo agregar la region.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al agregar region:", error);
      return {
        success: false,
        message: "Error al agregar region.",
      };
    }
  }

  public async EditarRegion(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objRegion || !this._objRegion.id_region) {
        throw new Error("No se proporciono un objeto de region valido.");
      }

      const { id_region, nombre } = this._objRegion;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("UPDATE regiones SET nombre = ? WHERE id_region = ?",
        [nombre, id_region]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Region editada exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo editar la region.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al editar region:", error);
      return {
        success: false,
        message: "Error al editar la region.",
      };
    }
  }

  public async EliminarRegion(id_region: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM regiones WHERE id_region = ?",
        [id_region]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Region eliminada exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo eliminar la region.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al eliminar region:", error);
      return {
        success: false,
        message: "Error al eliminar la region.",
      };
    }
  }
}