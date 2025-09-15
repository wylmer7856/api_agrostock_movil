import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { RegionesModel } from "../Models/RegionesModel.ts";

const regionSchema = z.object({
  nombre: z.string().min(1),
});

const regionUpdateSchema = regionSchema.extend({
  id_region: z.number().int().positive("El ID debe ser un numero positivo."),
});

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

export const postRegiones = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = regionSchema.parse(body);

    const regionData = {
      id_region: null,
      ...validated,
    };

    const objRegiones = new RegionesModel(regionData);
    const result = await objRegiones.AgregarRegion();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.region,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos." : "Error al agregar la region.",
    };
  }
};

export const putRegiones = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = regionUpdateSchema.parse(body);

    const objRegiones = new RegionesModel(validated);
    const result = await objRegiones.EditarRegion();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en putRegion:", error);
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos, problema en el esquema" : "Error al actualizar la region.",
    };
  }
};

export const deleteRegiones = async (ctx: RouterContext<"/regiones/:id">) => {
  try {
    const id_region = Number(ctx.params.id);
    if (isNaN(id_region) || id_region <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de region invalido.",
      };
      return;
    }

    const objRegiones = new RegionesModel();
    const result = await objRegiones.EliminarRegion(id_region);

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
