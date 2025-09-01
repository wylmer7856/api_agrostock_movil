import { conexion } from "./Conexion.ts";

interface AlertaData {
  id_alerta: number | null;
  id_producto: number;
  stock_actual: number;
  fecha: string;
  mensaje: string;
}

export class AlertasModel {
  public _objAlerta: AlertaData | null;

  constructor(objAlerta: AlertaData | null = null) {
    this._objAlerta = objAlerta;
  }

  public async ListarAlertas(): Promise<AlertaData[]> {
    try {
      const result = await conexion.query("SELECT * FROM alertas_stock");
      return result as AlertaData[];
    } catch (error) {
      console.error("Error al listar alertas:", error);
      throw new Error("Error al listar alertas.");
    }
  }

  public async AgregarAlerta(): Promise<{ success: boolean; message: string; alerta?: AlertaData }> {
    try {
      if (!this._objAlerta) throw new Error("No se proporcionó un objeto de alerta.");

      const { id_producto, stock_actual, fecha, mensaje } = this._objAlerta;

      if (!id_producto || stock_actual === undefined || !fecha || !mensaje) {
        throw new Error("Faltan campos obligatorios.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("INSERT INTO alertas_stock (id_producto, stock_actual, fecha, mensaje) VALUES (?, ?, ?, ?)",
        [id_producto, stock_actual, fecha, mensaje]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const queryResult = await conexion.query("SELECT * FROM alertas_stock ORDER BY id_alerta DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Alerta agregada exitosamente.",
          alerta: queryResult?.[0] as AlertaData,
        };
      } else {
        await conexion.execute("ROLLBACK");
        return { 
            success: false,
            message: "No se pudo agregar la alerta"
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al agregar alerta:", error);
      return { success: false, message: "Error al agregar alerta." };
    }
  }

  public async EliminarAlerta(id_alerta: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM alertas_stock WHERE id_alerta = ?", [id_alerta]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Alerta eliminada exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo eliminar la alerta.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al eliminar alerta:", error);
      return {
        success: false,
        message: "Error al eliminar la alerta.",
      };
    }
  }
}
