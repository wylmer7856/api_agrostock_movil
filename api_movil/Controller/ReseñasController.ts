import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { Resena } from "../Models/ReseñasModel.ts";

// 📌 Validaciones con Zod
const resenaSchema = z.object({
  id_usuario: z.number().int().positive(),
  id_producto: z.number().int().positive(),
  calificacion: z.number().min(1).max(5),
  comentario: z.string().min(3),
  fecha: z.string().transform((val: string) => new Date(val)),
});

const resenaSchemaUpdate = resenaSchema.extend({
  id_resena: z.number().int().positive("El ID debe ser un número positivo"),
});

// 📌 Listar reseñas
export const getResenas = async (ctx: Context) => {
  try {
    const objResena = new Resena();
    const lista = await objResena.ListarResenas();

    ctx.response.status = lista.length > 0 ? 200 : 404;
    ctx.response.body = {
      success: lista.length > 0,
      message: lista.length > 0 ? "Reseñas encontradas." : "No se encontraron reseñas.",
      data: lista,
    };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

// 📌 Insertar reseña
export const postResena = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = resenaSchema.parse(body);

    const resenaData = {
      id_resena: null,
      ...validated,
    };

    const objResena = new Resena(resenaData);
    const result = await objResena.InsertarResena();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.resena,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos inválidos." : "Error al insertar la reseña.",
    };
  }
};

// 📌 Editar reseña
export const putResena = async (ctx: RouterContext<"/resenas/:id">) => {
  try {
    const body = await ctx.request.body.json();
    const validated = resenaSchemaUpdate.parse(body);

    const objResena = new Resena(validated);
    const result = await objResena.EditarResena();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos inválidos." : "Error al actualizar la reseña.",
    };
  }
};

// 📌 Eliminar reseña
export const deleteResena = async (ctx: RouterContext<"/resenas/:id">) => {
  try {
    const id_resena = Number(ctx.params.id);
    if (isNaN(id_resena) || id_resena <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de reseña inválido.",
      };
      return;
    }

    const objResena = new Resena();
    const result = await objResena.EliminarResena(id_resena);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

// 📌 Buscar reseñas de un producto
export const getResenasByProducto = async (ctx: RouterContext<"/resenas/producto/:id">) => {
  try {
    const id_producto = Number(ctx.params.id);
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de producto inválido.",
      };
      return;
    }

    const objResena = new Resena();
    const lista = await objResena.BuscarPorProducto(id_producto);

    ctx.response.status = lista.length > 0 ? 200 : 404;
    ctx.response.body = {
      success: lista.length > 0,
      message: lista.length > 0 ? "Reseñas encontradas para el producto." : "No se encontraron reseñas para este producto.",
      data: lista,
    };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};
