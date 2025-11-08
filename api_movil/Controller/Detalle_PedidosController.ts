import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { DetallePedidosModel } from "../Models/Detalle_PedidosModel.ts";

const detalleSchema = z.object({
  id_pedido: z.number().int().positive(),
  id_producto: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().nonnegative(),
  precio_total: z.number().nonnegative(),
});

export const getDetalles = async (ctx: Context) => {
  try {
    const model = new DetallePedidosModel();
    const detalles = await model.ListarDetalles();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: detalles.length > 0
        ? "Detalles encontrados."
        : "No se encontraron detalles.",
      data: detalles,
    };
  } catch (error) {
    console.error("Error en getDetalles:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const postDetalle = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = detalleSchema.parse(body);

    const data = {
      id_detalle: null,
      ...validated,
      subtotal: validated.precio_total, // subtotal es igual a precio_total
    };

    const model = new DetallePedidosModel(data);
    const result = await model.AgregarDetalle();

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.detalle,
    };
  } catch (error) {
    console.error("Error en postDetalle:", error);
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos" : "Error al agregar el detalle"
    };
  }
};

export const deleteDetalle = async (ctx: RouterContext<"/detalle_pedidos/:id">) => {
  try {
    const id_detalle = Number(ctx.params.id);
    if (isNaN(id_detalle) || id_detalle <= 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "ID invalido.",
      };
      return;
    }

    const model = new DetallePedidosModel();
    const result = await model.EliminarDetalle(id_detalle);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en deleteDetalle:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};
