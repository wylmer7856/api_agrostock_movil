import { conexion } from "./Conexion.ts";

interface DepartamentoData {
  id_departamento: number | null;
  nombre: string;
  id_region: number;
}

export class DepartamentosModel {
  public _objDepartamento: DepartamentoData | null;

  constructor(objDepartamento: DepartamentoData | null = null) {
    this._objDepartamento = objDepartamento;
  }

  public async ListarDepartamentos(): Promise<DepartamentoData[]> {
    try {
      const result = await conexion.query("SELECT * FROM departamentos");
      return result as DepartamentoData[];
    } catch (error) {
      console.error("Error al listar departamentos:", error);
      throw new Error("Error al listar departamentos.");
    }
  }

  public async AgregarDepartamento(): Promise<{ success: boolean; message: string; departamento?: DepartamentoData }> {
    try {
      if (!this._objDepartamento) throw new Error("No se proporciono un objeto de departamento.");
      
      const { nombre, id_region } = this._objDepartamento;

      if (!nombre || !id_region) throw new Error("Faltan campos obligatorios.");

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("INSERT INTO departamentos (nombre, id_region) VALUES (?, ?)",
        [nombre, id_region]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const queryResult = await conexion.query("SELECT * FROM departamentos ORDER BY id_departamento DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Departamento agregado exitosamente.",
          departamento: queryResult?.[0] as DepartamentoData,
        };
      } else {
        await conexion.execute("ROLLBACK");
        return { 
          success: false,
          message: "No se pudo agregar el departamento."
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al agregar departamento:", error);
      return { success: false, message: "Error al agregar departamento." };
    }
  }

  public async EditarDepartamento(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objDepartamento || !this._objDepartamento.id_departamento) {
        throw new Error("No se proporciono un objeto de departamento valido para editar.");
      }

      const { id_departamento, nombre, id_region } = this._objDepartamento;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("UPDATE departamentos SET nombre = ?, id_region = ? WHERE id_departamento = ?",
        [nombre, id_region, id_departamento]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Departamento editado exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo editar el departamento.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al editar departamento:", error);
      return {
        success: false,
        message: "Error al editar el departamento.",
      };
    }
  }

  public async EliminarDepartamento(id_departamento: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM departamentos WHERE id_departamento = ?", [id_departamento]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Departamento eliminado exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo eliminar el departamento.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al eliminar departamento:", error);
      return {
        success: false,
        message: "Error al eliminar el departamento.",
      };
    }
  }
}
