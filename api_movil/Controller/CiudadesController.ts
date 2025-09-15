import { Context, RouterContext, z } from "../Dependencies/dependencias.ts";
import { CiudadesModel } from "../Models/CiudadesModel.ts";

const ciudadSchema = z.object({
  nombre: z.string().min(1),
  id_departamento: z.number().int().positive("ID de departamento debe ser positivo."),
});

const ciudadUpdateSchema = ciudadSchema.extend({
  id_ciudad: z.number().int().positive("ID de ciudad invalido."),
});

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

export const postCiudades = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = ciudadSchema.parse(body);

    const data = {
      id_ciudad: null,
      ...validated,
    };

    const model = new CiudadesModel(data);
    const result = await model.AgregarCiudad();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.ciudad,
    };
  } catch (error) {
    console.error("Error en postCiudad:", error);
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos" : "Error al agregar la ciudad."
    };
  }
};

export const putCiudades = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = ciudadUpdateSchema.parse(body);

    const model = new CiudadesModel(validated);
    const result = await model.EditarCiudad();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en putCiudad:", error);
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos" : "Error al actualizar la ciudad.",
    };
  }
};

export const deleteCiudades = async (ctx: RouterContext<"/ciudades/:id">) => {
  try {
    const id_ciudad = Number(ctx.params.id);
    if (isNaN(id_ciudad) || id_ciudad <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de ciudad invalido.",
      };
      return;
    }

    const model = new CiudadesModel();
    const result = await model.EliminarCiudad(id_ciudad);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en deleteCiudad:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};
