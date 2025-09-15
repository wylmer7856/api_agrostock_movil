import { Context, RouterContext, z } from "../Dependencies/dependencias.ts";
import { DepartamentosModel } from "../Models/DepartamentosModel.ts";

const departamentoSchema = z.object({
  nombre: z.string().min(1),
  id_region: z.number().int().positive("ID de region debe ser positivo."),
});

const departamentoUpdateSchema = departamentoSchema.extend({
  id_departamento: z.number().int().positive("ID de departamento invalido."),
});

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

export const postDepartamentos = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = departamentoSchema.parse(body);

    const data = {
      id_departamento: null,
      ...validated,
    };

    const model = new DepartamentosModel(data);
    const result = await model.AgregarDepartamento();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.departamento,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos." : "Error al agregar el departamento.",
    };
  }
};

export const putDepartamentos = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = departamentoUpdateSchema.parse(body);

    const model = new DepartamentosModel(validated);
    const result = await model.EditarDepartamento();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en putDepartamento:", error);
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos" : "Error al editar el departamento.",
    };
  }
};

export const deleteDepartamentos = async (ctx: RouterContext<"/departamentos/:id">) => {
  try {
    const id_departamento = Number(ctx.params.id);
    if (isNaN(id_departamento) || id_departamento <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de departamento invalido.",
      };
      return;
    }

    const model = new DepartamentosModel();
    const result = await model.EliminarDepartamento(id_departamento);

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
