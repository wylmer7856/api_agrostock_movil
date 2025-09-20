import { Context } from "../Dependencies/dependencias.ts";
import { CiudadesModel } from "../Models/CiudadesModel.ts";

export const getCiudades = async (ctx: Context) => {
  try {
    const model = new CiudadesModel();
    const lista = await model.ListarCiudades();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: lista.length > 0 ? "Ciudades encontradas." : "No se encontraron ciudades.",
      data: lista,
    };
  } catch (error) {
    console.error("Error en getCiudades:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};