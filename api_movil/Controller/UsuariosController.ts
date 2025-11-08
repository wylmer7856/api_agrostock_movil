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
  // Campos opcionales de seguridad
  intentos_login: z.number().optional(),
  bloqueado_hasta: z.string().nullable().optional(),
  activo: z.boolean().optional(),
  email_verificado: z.boolean().optional(),
  telefono_verificado: z.boolean().optional(),
  fecha_registro: z.string().optional(),
  ultimo_acceso: z.string().nullable().optional(),
});

const usuarioSchemaUpdate = usuarioSchema.extend({
  id_usuario: z.number().int().positive("El ID debe ser un numero positivo"),
});

export const getUsuarios = async (ctx: Context) => {
  try {
    const objUsuario = new Usuario();
    const lista = await objUsuario.ListarUsuarios();

    // ✅ Retornar 200 con lista vacía, no 404
    if (lista.length === 0) {
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "No se encontraron usuarios.",
        data: [],
        total: 0,
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: `${lista.length} usuarios encontrados.`,
      data: lista,
      total: lista.length,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Error interno del servidor.",
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
      activo: validated.activo ?? true, // Por defecto activo si no se especifica
      email_verificado: validated.email_verificado ?? false, // Por defecto no verificado
    };

    const objUsuario = new Usuario(usuarioData);
    const result = await objUsuario.InsertarUsuario();

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.usuario,
    };
  } catch (error) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos." : 
               error instanceof Error ? error.message : "Error al insertar el usuario.",
    };
  }
};

export const putUsuario = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = usuarioSchemaUpdate.parse(body);

    const usuarioData = {
      ...validated,
      activo: validated.activo ?? true, // Por defecto activo si no se especifica
      email_verificado: validated.email_verificado ?? false, // Por defecto no verificado
    };

    const objUsuario = new Usuario(usuarioData);
    const result = await objUsuario.EditarUsuario();

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos." : 
               error instanceof Error ? error.message : "Error al actualizar el usuario.",
    };
  }
};

export const deleteUsuario = async (ctx: RouterContext<"/Usuario/:id">) => {
  try {
    const id_usuario = Number(ctx.params.id);
    if (isNaN(id_usuario) || id_usuario <= 0) {
      ctx.response.status = 404;
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
      message: error instanceof Error ? error.message : "Error interno del servidor.",
    };
  }
};

export const filtrarUsuarios = async (ctx: Context) => {
  try {
    // TODO: Implementar filtros cuando se agreguen las funciones correspondientes
    // const ciudad = ctx.request.url.searchParams.get("ciudad");
    // const departamento = ctx.request.url.searchParams.get("departamento");
    // const region = ctx.request.url.searchParams.get("region");

    const objUsuario = new Usuario();
    const lista = await objUsuario.ListarUsuarios();

    ctx.response.status = lista.length > 0 ? 200 : 404;
    ctx.response.body = {
      success: lista.length > 0,
      message: lista.length > 0
        ? "Usuarios encontrados."
        : "No se encontraron usuarios.",
      data: lista,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor al filtrar usuarios.",
    };
  }
};

