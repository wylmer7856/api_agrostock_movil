import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { ProductoresModel, ProductorData } from "../Models/ProductoresModel.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

// Esquema de validación para productor
const productorSchema = z.object({
  id_usuario: z.number().int().positive(),
  nombre_finca: z.string().min(1).max(255).optional().nullable(),
  tipo_productor: z.enum(['agricultor', 'ganadero', 'apicultor', 'piscicultor', 'avicultor', 'mixto', 'otro']).optional(),
  id_departamento: z.number().int().positive().optional().nullable(),
  id_ciudad: z.number().int().positive().optional().nullable(),
  vereda: z.string().max(255).optional().nullable(),
  direccion_finca: z.string().optional().nullable(),
  numero_registro_ica: z.string().max(100).optional().nullable(),
  certificaciones: z.string().optional().nullable(),
  descripcion_actividad: z.string().optional().nullable(),
  anos_experiencia: z.number().int().min(0).max(100).optional().nullable(),
  hectareas: z.number().min(0).optional().nullable(),
  metodo_produccion: z.enum(['tradicional', 'organico', 'convencional', 'mixto']).optional(),
  redes_sociales: z.any().optional().nullable(),
  sitio_web: z.string().url().optional().nullable(),
  foto_perfil_finca: z.string().optional().nullable(),
});

// 📌 Obtener perfil de productor por ID de usuario
export const getProductorPorUsuario = async (ctx: RouterContext<"/productores/usuario/:id">) => {
  try {
    const id_usuario = Number(ctx.params.id);
    
    if (isNaN(id_usuario) || id_usuario <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "ID_INVALIDO",
        message: "ID de usuario inválido."
      };
      return;
    }

    const objProductor = new ProductoresModel();
    const productor = await objProductor.ObtenerPorUsuario(id_usuario);

    if (!productor) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "No se encontró perfil de productor para este usuario."
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Perfil de productor encontrado.",
      data: productor
    };
  } catch (error) {
    console.error("Error en getProductorPorUsuario:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: "Error interno del servidor."
    };
  }
};

// 📌 Obtener mi propio perfil de productor
export const getMiPerfilProductor = async (ctx: Context) => {
  try {
    const user = ctx.state.user;
    
    if (!user || user.rol !== 'productor') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "NO_AUTORIZADO",
        message: "Solo los productores pueden acceder a este recurso."
      };
      return;
    }

    const objProductor = new ProductoresModel();
    const productor = await objProductor.ObtenerPorUsuario(user.id);

    if (!productor) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "No se encontró tu perfil de productor. Por favor, complétalo."
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Perfil de productor encontrado.",
      data: productor
    };
  } catch (error) {
    console.error("Error en getMiPerfilProductor:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: "Error interno del servidor."
    };
  }
};

// 📌 Listar todos los productores
export const getProductores = async (ctx: Context) => {
  try {
    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    
    const objProductor = new ProductoresModel();
    
    // Si hay criterios de búsqueda, usar búsqueda avanzada
    if (queryParams.tipo_productor || queryParams.departamento || queryParams.ciudad || 
        queryParams.nombre_finca || queryParams.certificaciones) {
      const criterios = {
        tipo_productor: queryParams.tipo_productor,
        departamento: queryParams.departamento ? Number(queryParams.departamento) : undefined,
        ciudad: queryParams.ciudad ? Number(queryParams.ciudad) : undefined,
        nombre_finca: queryParams.nombre_finca,
        certificaciones: queryParams.certificaciones
      };
      
      const productores = await objProductor.BuscarProductores(criterios);
      
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: `${productores.length} productores encontrados.`,
        data: productores,
        total: productores.length
      };
    } else {
      // Listar todos
      const productores = await objProductor.ListarProductores();
      
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: `${productores.length} productores encontrados.`,
        data: productores,
        total: productores.length
      };
    }
  } catch (error) {
    console.error("Error en getProductores:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: "Error interno del servidor."
    };
  }
};

// 📌 Crear o actualizar perfil de productor
export const postProductor = async (ctx: Context) => {
  try {
    const user = ctx.state.user;
    
    if (!user || user.rol !== 'productor') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "NO_AUTORIZADO",
        message: "Solo los productores pueden crear/actualizar su perfil."
      };
      return;
    }

    const body = await ctx.request.body.json();
    
    // Asegurar que el id_usuario sea el del usuario autenticado
    const productorData = {
      ...body,
      id_usuario: user.id
    };

    const validated = productorSchema.parse(productorData);

    const objProductor = new ProductoresModel(validated as ProductorData);
    const result = await objProductor.GuardarProductor();

    if (result.success) {
      ctx.response.status = result.productor ? 201 : 200;
      ctx.response.body = {
        success: true,
        message: result.message,
        data: result.productor
      };
    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "ERROR_GUARDAR",
        message: result.message
      };
    }
  } catch (error) {
    console.error("Error en postProductor:", error);
    
    if (error instanceof z.ZodError) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "VALIDACION_ERROR",
        message: "Datos inválidos.",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "ERROR_INTERNO",
        message: "Error interno del servidor."
      };
    }
  }
};

// 📌 Actualizar perfil de productor
export const putProductor = async (ctx: RouterContext<"/productores/:id">) => {
  try {
    const user = ctx.state.user;
    const id_productor = Number(ctx.params.id);
    
    if (isNaN(id_productor) || id_productor <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "ID_INVALIDO",
        message: "ID de productor inválido."
      };
      return;
    }

    // Verificar que el productor pertenece al usuario autenticado o es admin
    const objProductor = new ProductoresModel();
    const productor = await objProductor.ObtenerPorId(id_productor);

    if (!productor) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "Perfil de productor no encontrado."
      };
      return;
    }

    if (productor.id_usuario !== user.id && user.rol !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "NO_AUTORIZADO",
        message: "No tienes permisos para actualizar este perfil."
      };
      return;
    }

    const body = await ctx.request.body.json();
    const productorData = {
      ...body,
      id_usuario: productor.id_usuario,
      id_productor: id_productor
    };

    const validated = productorSchema.parse(productorData);

    const objProductorUpdate = new ProductoresModel(validated as ProductorData);
    const result = await objProductorUpdate.GuardarProductor();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.productor
    };
  } catch (error) {
    console.error("Error en putProductor:", error);
    
    if (error instanceof z.ZodError) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "VALIDACION_ERROR",
        message: "Datos inválidos.",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "ERROR_INTERNO",
        message: "Error interno del servidor."
      };
    }
  }
};

// 📌 Eliminar perfil de productor (solo admin)
export const deleteProductor = async (ctx: RouterContext<"/productores/:id">) => {
  try {
    const user = ctx.state.user;
    
    if (!user || user.rol !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "NO_AUTORIZADO",
        message: "Solo los administradores pueden eliminar perfiles."
      };
      return;
    }

    const id_productor = Number(ctx.params.id);
    
    if (isNaN(id_productor) || id_productor <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "ID_INVALIDO",
        message: "ID de productor inválido."
      };
      return;
    }

    const objProductor = new ProductoresModel();
    const productor = await objProductor.ObtenerPorId(id_productor);

    if (!productor) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "Perfil de productor no encontrado."
      };
      return;
    }

    const result = await objProductor.EliminarProductor(productor.id_usuario);

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    console.error("Error en deleteProductor:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: "Error interno del servidor."
    };
  }
};



