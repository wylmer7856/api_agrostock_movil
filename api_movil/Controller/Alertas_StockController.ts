import { Context, RouterContext, z } from "../Dependencies/dependencias.ts";
import { AlertasModel } from "../Models/Alertas_StockModel.ts";

const alertaSchema = z.object({
  id_producto: z.number().int().positive("ID de producto inválido."),
  stock_actual: z.number().int().min(0),
  fecha: z.string().min(1),
  mensaje: z.string().min(1),
});

export const getAlertas = async (ctx: Context) => {
  try {
    const model = new AlertasModel();
    const lista = await model.ListarAlertas();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: lista.length > 0 ? "Alertas encontradas." : "No se encontraron alertas.",
      data: lista,
    };
  } catch (error) {
    console.error("Error en getAlertas:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const postAlerta = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = alertaSchema.parse(body);

    const data = {
      id_alerta: null,
      ...validated,
    };

    const model = new AlertasModel(data);
    const result = await model.AgregarAlerta();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.alerta,
    };
  } catch (error) {
    console.error("Error en postAlerta:", error);
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos inválidos" : "Error al agregar la alerta."
    };
  }
};

export const deleteAlerta = async (ctx: RouterContext<"/alertas/:id">) => {
  try {
    const id_alerta = Number(ctx.params.id);
    if (isNaN(id_alerta) || id_alerta <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de alerta inválido.",
      };
      return;
    }

    const model = new AlertasModel();
    const result = await model.EliminarAlerta(id_alerta);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en deleteAlerta:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};
