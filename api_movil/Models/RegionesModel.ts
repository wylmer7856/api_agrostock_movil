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
}