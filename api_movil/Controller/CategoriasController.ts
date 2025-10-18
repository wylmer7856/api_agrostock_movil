import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { CategoriasModel, CategoriaCreateData } from "../Models/CategoriasModel.ts";

export class CategoriasController {
  
  // 📌 Listar categorías activas
  static async ListarCategorias(ctx: Context) {
    try {
      const categoriaModel = new CategoriasModel();
      const categorias = await categoriaModel.ListarCategorias();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        categorias,
        total: categorias.length
      };
    } catch (error) {
      console.error("Error en ListarCategorias:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Listar todas las categorías (solo admin)
  static async ListarTodasLasCategorias(ctx: Context) {
    try {
      const categoriaModel = new CategoriasModel();
      const categorias = await categoriaModel.ListarTodasLasCategorias();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        categorias,
        total: categorias.length
      };
    } catch (error) {
      console.error("Error en ListarTodasLasCategorias:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Crear categoría (solo admin)
  static async CrearCategoria(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { nombre, descripcion, activa } = body;

      if (!nombre) {
        ctx.response.status = 400;
        ctx.response.body = { error: "El nombre de la categoría es requerido" };
        return;
      }

      const categoriaData: CategoriaCreateData = {
        nombre,
        descripcion: descripcion || undefined,
        activa: activa !== false
      };

      const categoriaModel = new CategoriasModel(categoriaData);
      const result = await categoriaModel.CrearCategoria();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en CrearCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Actualizar categoría (solo admin)
  static async ActualizarCategoria(ctx: RouterContext<"/categorias/:id_categoria">) {
    try {
      const { id_categoria } = ctx.params;
      const body = await ctx.request.body.json();
      const { nombre, descripcion, activa } = body;

      if (!id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID de la categoría requerido" };
        return;
      }

      const categoriaData: CategoriaCreateData = {
        nombre,
        descripcion: descripcion || undefined,
        activa: activa !== false
      };

      const categoriaModel = new CategoriasModel(categoriaData);
      const result = await categoriaModel.ActualizarCategoria(parseInt(id_categoria));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ActualizarCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Eliminar categoría (solo admin)
  static async EliminarCategoria(ctx: RouterContext<"/categorias/:id_categoria">) {
    try {
      const { id_categoria } = ctx.params;

      if (!id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID de la categoría requerido" };
        return;
      }

      const categoriaModel = new CategoriasModel();
      const result = await categoriaModel.EliminarCategoria(parseInt(id_categoria));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener categoría por ID
  static async ObtenerCategoriaPorId(ctx: RouterContext<"/categorias/:id_categoria">) {
    try {
      const { id_categoria } = ctx.params;

      if (!id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID de la categoría requerido" };
        return;
      }

      const categoriaModel = new CategoriasModel();
      const categoria = await categoriaModel.ObtenerCategoriaPorId(parseInt(id_categoria));

      if (categoria) {
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          categoria
        };
      } else {
        ctx.response.status = 404;
        ctx.response.body = { error: "Categoría no encontrada" };
      }
    } catch (error) {
      console.error("Error en ObtenerCategoriaPorId:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Asociar producto con categoría
  static async AsociarProductoCategoria(ctx: RouterContext<"/categorias/:id_categoria/productos/:id_producto">) {
    try {
      const { id_producto, id_categoria } = ctx.params;

      if (!id_producto || !id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del producto y categoría requeridos" };
        return;
      }

      const categoriaModel = new CategoriasModel();
      const result = await categoriaModel.AsociarProductoCategoria(parseInt(id_producto), parseInt(id_categoria));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en AsociarProductoCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Desasociar producto de categoría
  static async DesasociarProductoCategoria(ctx: RouterContext<"/categorias/:id_categoria/productos/:id_producto">) {
    try {
      const { id_producto, id_categoria } = ctx.params;

      if (!id_producto || !id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del producto y categoría requeridos" };
        return;
      }

      const categoriaModel = new CategoriasModel();
      const result = await categoriaModel.DesasociarProductoCategoria(parseInt(id_producto), parseInt(id_categoria));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en DesasociarProductoCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener categorías de un producto
  static async ObtenerCategoriasDeProducto(ctx: RouterContext<"/productos/:id_producto/categorias">) {
    try {
      const { id_producto } = ctx.params;

      if (!id_producto) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del producto requerido" };
        return;
      }

      const categoriaModel = new CategoriasModel();
      const categorias = await categoriaModel.ObtenerCategoriasDeProducto(parseInt(id_producto));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        categorias,
        total: categorias.length
      };
    } catch (error) {
      console.error("Error en ObtenerCategoriasDeProducto:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener productos por categoría
  static async ObtenerProductosPorCategoria(ctx: RouterContext<"/categorias/:id_categoria/productos">) {
    try {
      const { id_categoria } = ctx.params;

      if (!id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID de la categoría requerido" };
        return;
      }

      const categoriaModel = new CategoriasModel();
      const productos = await categoriaModel.ObtenerProductosPorCategoria(parseInt(id_categoria));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        productos,
        total: productos.length
      };
    } catch (error) {
      console.error("Error en ObtenerProductosPorCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }
}
