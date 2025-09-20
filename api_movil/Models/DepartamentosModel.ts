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
}
