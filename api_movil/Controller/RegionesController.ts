import { Context } from "../Dependencies/dependencias.ts";
import { RegionesModel } from "../Models/RegionesModel.ts";

export const getRegiones = async (ctx: Context) => {
  try {
    const objRegiones = new RegionesModel();
    const lista = await objRegiones.ListarRegiones();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: lista.length > 0
        ? "Regiones encontradas."
        : "No se encontraron regiones.",
      data: lista,
    };
  } catch (error) {
    console.error("Error en getRegiones:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};
