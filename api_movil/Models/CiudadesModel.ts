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
}
