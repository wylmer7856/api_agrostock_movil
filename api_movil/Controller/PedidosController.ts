import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { PedidosModel } from "../Models/PedidosModel.ts";

const pedidoSchema = z.object({
  id_consumidor: z.number().int().positive(),
  id_productor: z.number().int().positive(),
  fecha: z.string().refine((date) => !isNaN(Date.parse(date)), {}).transform((date) => new Date(date)),
  estado: z.enum(["pendiente", "confirmado", "comprado"], {}),
  total: z.number().positive(),
  direccionEntrega: z.string().min(5),
  notas: z.string().optional(),
  fecha_entrega_estimada: z.string().refine((date) => !isNaN(Date.parse(date)), {}).transform((date) => new Date(date)),
  metodo_pago: z.string().min(1),
});

const pedidoSchemaUpdate = pedidoSchema.extend({
  id_pedido: z.number().int().positive(),
});

export const getPedidos = async (ctx: Context) => {
  try {
    const objPedido = new PedidosModel();
    const lista = await objPedido.ListarPedidos();

    ctx.response.status = lista.length > 0 ? 200 : 404;
    ctx.response.body = {
      success: lista.length > 0,
      message: lista.length > 0 ? "Pedidos encontrados." : "No se encontraron pedidos.",
      data: lista,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const postPedido = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = pedidoSchema.parse(body);

    const pedidoData = {
      id_pedido: null,
      ...validated,
    };

    const objPedido = new PedidosModel(pedidoData);
    const result = await objPedido.AgregarPedido();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.pedido,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos inválidos." : "Error al crear el pedido.",
    };
  }
};

export const putPedido = async (ctx: RouterContext<"/Pedido/:id">) => {
  try {
    const id_pedido = Number(ctx.params.id);
    if (isNaN(id_pedido) || id_pedido <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de pedido inválido.",
      };
      return;
    }

    const body = await ctx.request.body.json();
    const validated = pedidoSchemaUpdate.parse(body);

    const pedidoData = {
      ...validated,
    };

    const objPedido = new PedidosModel(pedidoData);
    const result = await objPedido.EditarPedido(id_pedido);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos inválidos." : "Error al actualizar el pedido.",
    };
  }
};

export const deletePedido = async (ctx: RouterContext<"/Pedido/:id">) => {
  try {
    const id_pedido = Number(ctx.params.id);
    if (isNaN(id_pedido) || id_pedido <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de pedido inválido.",
      };
      return;
    }

    const objPedido = new PedidosModel();
    const result = await objPedido.EliminarPedido(id_pedido);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};