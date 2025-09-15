import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { ProductosModel, ProductoData } from "../Models/ProductosModel.ts";

interface ProductoDataResponse extends ProductoData {
  imagenUrl: string | null;
}

const productosSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  precio: z.number().min(0),
  stock: z.number().min(0),
  stockMinimo: z.number().min(0).optional(),
  id_usuario: z.number().int().positive(),
  id_ciudad_origen: z.number().int().positive(),
  unidadMedida: z.string().optional(),
  pesoAprox: z.number().min(0).optional(),
  imagenData: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      if (typeof val !== 'string') return false;
            if (val.startsWith('http://') || val.startsWith('https://')) {
        return true;
      }
      if (val.startsWith('file://')) {
        return true;
      }
      
      if (val.startsWith('data:image/')) {
        return true;
      }
        if (val.match(/^[A-Za-z0-9+/]+=*$/)) {
        return true;
      }
      
      return false;
    },

  ),
});

const productosUpdateSchema = productosSchema.extend({
  id_producto: z.number().int().positive(),
});

export const getProductos = async (ctx: Context) => {
  try {
    const objProductos = new ProductosModel();
    const lista = await objProductos.ListarProductos();

    const listaConImagenes = lista.map(producto => ({
      ...producto,
      imagenUrl: producto.imagenPrincipal 
        ? objProductos.construirUrlImagen(producto.imagenPrincipal, `${ctx.request.url.protocol}//${ctx.request.url.host}`)
        : null
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: lista.length > 0
        ? "Productos encontrados."
        : "No se encontraron productos.",
      data: listaConImagenes,
    };
  } catch (error) {
    console.error("Error en getProductos:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const getProductoPorId = async (ctx: RouterContext<"/productos/:id">) => {
  try {
    const id_producto = Number(ctx.params.id);
    
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de producto invalido.",
      };
      return;
    }

    const objProductos = new ProductosModel();
    const producto = await objProductos.ObtenerProductoPorId(id_producto);

    if (!producto) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Producto no encontrado.",
      };
      return;
    }

    const productoConImagen = {
      ...producto,
      imagenUrl: producto.imagenPrincipal 
        ? objProductos.construirUrlImagen(producto.imagenPrincipal, `${ctx.request.url.protocol}//${ctx.request.url.host}`)
        : null
    };

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Producto encontrado.",
      data: productoConImagen,
    };
  } catch (error) {
    console.error("Error en getProductoPorId:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const postProducto = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = productosSchema.parse(body);

    const { imagenData, ...productoData } = validated;

    const productoCompleto: ProductoData = {
      id_producto: 0,
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      precio: productoData.precio,
      stock: productoData.stock,
      stockMinimo: productoData.stockMinimo || 10,
      id_usuario: productoData.id_usuario,
      id_ciudad_origen: productoData.id_ciudad_origen,
      unidadMedida: productoData.unidadMedida,
      pesoAprox: productoData.pesoAprox,
    };

    const objProductos = new ProductosModel(productoCompleto);
    const result = await objProductos.AgregarProducto(imagenData);

    if (result.success && result.producto) {
      const productoConUrl: ProductoDataResponse = {
        ...result.producto,
        imagenUrl: result.producto.imagenPrincipal 
          ? objProductos.construirUrlImagen(result.producto.imagenPrincipal, `${ctx.request.url.protocol}//${ctx.request.url.host}`)
          : null
      };

      ctx.response.status = 201;
      ctx.response.body = {
        success: result.success,
        message: result.message,
        data: productoConUrl,
      };
    } else {
      ctx.response.status = result.success ? 201 : 400;
      ctx.response.body = {
        success: result.success,
        message: result.message,
        data: result.producto,
      };
    }
  } catch (error) {
    console.error("Error en postProducto:", error);
    
    if (error instanceof z.ZodError) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Datos invalidos.",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Error interno del servidor al agregar el producto.",
      };
    }
  }
};

export const putProducto = async (ctx: RouterContext<"/productos/:id">) => {
  try {
    const id_producto = Number(ctx.params.id);
    
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de producto invalido.",
      };
      return;
    }

    const body = await ctx.request.body.json();
    
    const bodyWithId = { ...body, id_producto };
    const validated = productosUpdateSchema.parse(bodyWithId);

    const { imagenData, ...productoData } = validated;

    const objProductosCheck = new ProductosModel();
    const productoExiste = await objProductosCheck.ObtenerProductoPorId(id_producto);
    
    if (!productoExiste) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Producto no encontrado.",
      };
      return;
    }

    const productoCompleto: ProductoData = {
      id_producto: productoData.id_producto,
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      precio: productoData.precio,
      stock: productoData.stock,
      stockMinimo: productoData.stockMinimo || 10,
      id_usuario: productoData.id_usuario,
      id_ciudad_origen: productoData.id_ciudad_origen,
      unidadMedida: productoData.unidadMedida,
      pesoAprox: productoData.pesoAprox,
      imagenPrincipal: productoExiste.imagenPrincipal,
    };

    const objProductos = new ProductosModel(productoCompleto);
    const result = await objProductos.EditarProducto(imagenData);

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en putProducto:", error);
    
    if (error instanceof z.ZodError) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Datos invalidos.",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Error interno del servidor al actualizar el producto.",
      };
    }
  }
};

export const deleteProducto = async (ctx: RouterContext<"/productos/:id">) => {
  try {
    const id_producto = Number(ctx.params.id);
    
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de producto invalido.",
      };
      return;
    }

    const objProductos = new ProductosModel();
    const result = await objProductos.EliminarProducto(id_producto);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en deleteProducto:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};