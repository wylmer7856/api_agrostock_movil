import { Context } from "../Dependencies/dependencias.ts";
import { DepartamentosModel } from "../Models/DepartamentosModel.ts";


export const getDepartamentos = async (ctx: Context) => {
  try {
    const model = new DepartamentosModel();
    const lista = await model.ListarDepartamentos();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: lista.length > 0 ? "Departamentos encontrados." : "No se encontraron departamentos.",
      data: lista,
    };
  } catch (error) {
    console.error("Error en getDepartamentos:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};