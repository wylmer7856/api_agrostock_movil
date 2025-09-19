import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { Consejo } from "../Models/ConsejosModel.ts";

// 📌 Validaciones con Zod
const consejoSchema = z.object({
  id_usuario: z.number().int().positive(),
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  contenido: z.string().min(5, "El contenido debe tener al menos 5 caracteres"),
  fecha: z.coerce.date(),
});

const consejoSchemaUpdate = consejoSchema.extend({
  id_consejo: z.number().int().positive("El ID debe ser un número positivo"),
});

// 📌 Listar todos los consejos
export const getConsejos = async (ctx: Context) => {
  try {
    const objConsejo = new Consejo();
    const lista = await objConsejo.ListarConsejos();

    ctx.response.status = lista.length > 0 ? 200 : 404;
    ctx.response.body = {
      success: lista.length > 0,
      message: lista.length > 0 ? "Consejos encontrados." : "No se encontraron consejos.",
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

// 📌 Insertar consejo
export const postConsejo = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = consejoSchema.parse(body);

    const consejoData = {
      id_consejo: null,
      ...validated,
    };

    const objConsejo = new Consejo(consejoData);
    const result = await objConsejo.InsertarConsejo();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.consejo,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos inválidos." : "Error al insertar el consejo.",
    };
  }
};

// 📌 Actualizar consejo
export const putConsejo = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = consejoSchemaUpdate.parse(body);

    const objConsejo = new Consejo(validated);
    const result = await objConsejo.EditarConsejo();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos inválidos." : "Error al actualizar el consejo.",
    };
  }
};

// 📌 Eliminar consejo
export const deleteConsejo = async (ctx: RouterContext<"/Consejo/:id">) => {
  try {
    const id_consejo = Number(ctx.params.id);
    if (isNaN(id_consejo) || id_consejo <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de consejo inválido.",
      };
      return;
    }

    const objConsejo = new Consejo();
    const result = await objConsejo.EliminarConsejo(id_consejo);

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
