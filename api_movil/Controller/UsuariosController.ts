import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { Usuario } from "../Models/UsuariosModel.ts";

const usuarioSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  telefono: z.string().min(7),
  direccion: z.string().min(3),
  id_ciudad: z.number().int().positive(),
  rol: z.enum(["admin", "consumidor", "productor"], {
    message: "El rol debe ser admin, consumidor o productor",
  }),
});

const usuarioSchemaUpdate = usuarioSchema.extend({
  id_usuario: z.number().int().positive("El ID debe ser un numero positivo"),
});

export const getUsuarios = async (ctx: Context) => {
  try {
    const objUsuario = new Usuario();
    const lista = await objUsuario.ListarUsuarios();

    ctx.response.status = lista.length > 0 ? 200 : 404;
    ctx.response.body = {
      success: lista.length > 0,
      message: lista.length > 0 ? "Usuarios encontrados." : "No se encontraron usuarios.",
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

export const postUsuario = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = usuarioSchema.parse(body);

    const usuarioData = {
      id_usuario: null,
      ...validated,
    };

    const objUsuario = new Usuario(usuarioData);
    const result = await objUsuario.InsertarUsuario();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.usuario,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos." : "Error al insertar el usuario.",
    };
  }
};

export const putUsuario = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = usuarioSchemaUpdate.parse(body);

    const objUsuario = new Usuario(validated);
    const result = await objUsuario.EditarUsuario();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos." : "Error al actualizar el usuario.",
    };
  }
};

export const deleteUsuario = async (ctx: RouterContext<"/Usuario/:id">) => {
  try {
    const id_usuario = Number(ctx.params.id);
    if (isNaN(id_usuario) || id_usuario <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de usuario invalido.",
      };
      return;
    }

    const objUsuario = new Usuario();
    const result = await objUsuario.EliminarUsuario(id_usuario);

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
