import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { ProductosModel, ProductoData } from "../Models/ProductosModel.ts";
import { conexion } from "../Models/Conexion.ts";

interface ProductoDataResponse extends ProductoData {
  imagenUrl: string | null;
}

// Helper function para obtener la URL base de forma segura
function getBaseUrl(ctx: Context): string {
  const origin = ctx.request.url.origin;
  if (typeof origin === 'string' && origin) {
    return origin;
  }
  return 'http://localhost:8000';
}

const productosSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  precio: z.number().min(0),
  stock: z.number().min(0),
  stock_minimo: z.number().min(0).optional(),
  id_usuario: z.number().int().positive(),
  id_categoria: z.number().int().positive().optional().nullable(),
  id_ciudad_origen: z.number().int().positive().optional().nullable(),
  unidad_medida: z.string().optional(),
  disponible: z.boolean().optional(),
  imagen_principal: z.string().url().optional().nullable(),
  imagenData: z.string().optional().refine(
    (val: string | undefined) => {
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
  imagen_principal: z.string().optional(),
  imagenes_adicionales: z.array(z.string()).optional(),
});

const filtrosSchema = z.object({
  nombre: z.string().optional(),
  precio_min: z.string().transform((val: string) => val ? Number(val) : undefined).optional(),
  precio_max: z.string().transform((val: string) => val ? Number(val) : undefined).optional(),
  stock_min: z.string().transform((val: string) => val ? Number(val) : undefined).optional(),
  id_usuario: z.string().transform((val: string) => val ? Number(val) : undefined).optional(),
  id_ciudad_origen: z.string().transform((val: string) => val ? Number(val) : undefined).optional(),
  unidad_medida: z.string().optional(),
  disponible: z.string().transform((val: string) => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
  orden: z.enum(['nombre_asc', 'nombre_desc', 'precio_asc', 'precio_desc', 'stock_asc', 'stock_desc']).optional(),
  limite: z.string().transform((val: string) => val ? Number(val) : 50).optional(),
  pagina: z.string().transform((val: string) => val ? Number(val) : 1).optional(),
});

// deno-lint-ignore no-explicit-any
function filtrarProductos(productos: ProductoData[], filtros: any): ProductoData[] {
  let productosFiltrados = [...productos];

  if (filtros.nombre) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
    );
  }

  if (filtros.precio_min !== undefined) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.precio !== undefined && producto.precio >= filtros.precio_min
    );
  }
  if (filtros.precio_max !== undefined) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.precio !== undefined && producto.precio <= filtros.precio_max
    );
  }

  if (filtros.stock_min !== undefined) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.stock >= filtros.stock_min
    );
  }

  if (filtros.id_usuario !== undefined) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.id_usuario === filtros.id_usuario
    );
  }

  if (filtros.id_ciudad_origen !== undefined) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.id_ciudad_origen === filtros.id_ciudad_origen
    );
  }

  if (filtros.unidad_medida) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.unidad_medida?.toLowerCase().includes(filtros.unidad_medida.toLowerCase())
    );
  }

  if (filtros.disponible !== undefined) {
    if (filtros.disponible) {
      productosFiltrados = productosFiltrados.filter(producto => producto.stock > 0);
    } else {
      productosFiltrados = productosFiltrados.filter(producto => producto.stock === 0);
    }
  }

  if (filtros.orden) {
    switch (filtros.orden) {
      case 'nombre_asc':
        productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'nombre_desc':
        productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case 'precio_asc':
        productosFiltrados.sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0));
        break;
      case 'precio_desc':
        productosFiltrados.sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));
        break;
      case 'stock_asc':
        productosFiltrados.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock_desc':
        productosFiltrados.sort((a, b) => b.stock - a.stock);
        break;
    }
  }

  return productosFiltrados;
}

function paginarResultados(productos: ProductoData[], pagina: number, limite: number) {
  const inicio = (pagina - 1) * limite;
  const fin = inicio + limite;
  const productosPaginados = productos.slice(inicio, fin);
  
  return {
    productos: productosPaginados,
    total: productos.length,
    pagina,
    limite,
    totalPaginas: Math.ceil(productos.length / limite),
    hayMasPaginas: fin < productos.length
  };
}

export const getProductos = async (ctx: Context) => {
  try {
    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    const filtros = filtrosSchema.parse(queryParams);

    const objProductos = new ProductosModel();
    const lista = await objProductos.ListarProductos();

    const productosFiltrados = filtrarProductos(lista, filtros);
    const resultado = paginarResultados(productosFiltrados, filtros.pagina || 1, filtros.limite || 50);
    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
        : null
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: resultado.productos.length > 0 ? `${resultado.productos.length} productos encontrados.` : "No se encontraron productos con los filtros aplicados.",
      data: listaConImagenes,
      pagination: {
        total: resultado.total,
        pagina: resultado.pagina,
        limite: resultado.limite,
        totalPaginas: resultado.totalPaginas,
        hayMasPaginas: resultado.hayMasPaginas
      },
      filtros_aplicados: filtros
    };
  } catch (error) {
    console.error("Error en getProductos:", error);
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Parámetros de filtro inválidos.",
        errors: zodError.errors.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Error interno del servidor.",
      };
    }
  }
};

export const getProductosPorUsuario = async (ctx: RouterContext<"/productos/usuario/:id">) => {
  try {
    const id_usuario = Number(ctx.params.id);
    
    if (isNaN(id_usuario) || id_usuario <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de usuario inválido.",
      };
      return;
    }

    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    const filtros = { ...filtrosSchema.parse(queryParams), id_usuario };

    const objProductos = new ProductosModel();
    const lista = await objProductos.ListarProductos();

    const productosFiltrados = filtrarProductos(lista, filtros);
    const resultado = paginarResultados(productosFiltrados, filtros.pagina || 1, filtros.limite || 50);
    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
        : null
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: resultado.productos.length > 0 ? `${resultado.productos.length} productos encontrados para el usuario.` : "No se encontraron productos para este usuario.",
      data: listaConImagenes,
      pagination: {
        total: resultado.total,
        pagina: resultado.pagina,
        limite: resultado.limite,
        totalPaginas: resultado.totalPaginas,
        hayMasPaginas: resultado.hayMasPaginas
      }
    };
  } catch (error) {
    console.error("Error en getProductosPorUsuario:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const getProductosDisponibles = async (ctx: Context) => {
  try {
    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    const filtros = { ...filtrosSchema.parse(queryParams), disponible: true };

    const objProductos = new ProductosModel();
    const lista = await objProductos.ListarProductos();

    const productosFiltrados = filtrarProductos(lista, filtros);
    const resultado = paginarResultados(productosFiltrados, filtros.pagina || 1, filtros.limite || 50);
    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
        : null
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: resultado.productos.length > 0
        ? `${resultado.productos.length} productos disponibles encontrados.`
        : "No hay productos disponibles.",
      data: listaConImagenes,
      pagination: {
        total: resultado.total,
        pagina: resultado.pagina,
        limite: resultado.limite,
        totalPaginas: resultado.totalPaginas,
        hayMasPaginas: resultado.hayMasPaginas
      }
    };
  } catch (error) {
    console.error("Error en getProductosDisponibles:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const buscarProductos = async (ctx: Context) => {
  try {
    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    const filtros = filtrosSchema.parse(queryParams);

    if (!filtros.nombre) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "El parámetro 'nombre' es requerido para la búsqueda.",
      };
      return;
    }

    const objProductos = new ProductosModel();
    const lista = await objProductos.ListarProductos();

    const productosFiltrados = filtrarProductos(lista, filtros);
    const resultado = paginarResultados(productosFiltrados, filtros.pagina || 1, filtros.limite || 50);
    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
        : null
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: resultado.productos.length > 0 ? `${resultado.productos.length} productos encontrados con "${filtros.nombre}".` : `No se encontraron productos con "${filtros.nombre}".`,
      data: listaConImagenes,
      pagination: {
        total: resultado.total,
        pagina: resultado.pagina,
        limite: resultado.limite,
        totalPaginas: resultado.totalPaginas,
        hayMasPaginas: resultado.hayMasPaginas
      },
      termino_busqueda: filtros.nombre
    };
  } catch (error) {
    console.error("Error en buscarProductos:", error);
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
      ctx.response.status = 404;
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

    const baseUrl = getBaseUrl(ctx);
    const productoConImagen = {
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
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

    const { imagenData, imagen_principal, ...productoData } = validated;

    const productoCompleto: ProductoData = {
      id_producto: 0,
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      precio: productoData.precio,
      stock: productoData.stock,
      stock_minimo: productoData.stock_minimo || 5,
      id_usuario: productoData.id_usuario,
      id_categoria: productoData.id_categoria ?? undefined,
      id_ciudad_origen: productoData.id_ciudad_origen ?? undefined,
      unidad_medida: productoData.unidad_medida || 'kg',
      disponible: productoData.disponible !== false,
      imagen_principal: imagen_principal ?? undefined
    };

    const objProductos = new ProductosModel(productoCompleto);
    // Si hay imagen_principal (URL), actualizarla después de crear el producto
    const result = await objProductos.AgregarProducto(imagenData);
    
    // Si se creó exitosamente y hay imagen_principal (URL), actualizarla
    if (result.success && result.producto && imagen_principal && !imagenData) {
      await conexion.execute(
        "UPDATE productos SET imagen_principal = ? WHERE id_producto = ?",
        [imagen_principal, result.producto.id_producto]
      );
      // Recargar el producto con la imagen actualizada
      const productoActualizado = await conexion.query(
        "SELECT * FROM productos WHERE id_producto = ?",
        [result.producto.id_producto]
      );
      if (productoActualizado.length > 0) {
        result.producto = productoActualizado[0] as ProductoData;
      }
    }

    if (result.success && result.producto) {
      const baseUrl = getBaseUrl(ctx);
      const productoConUrl: ProductoDataResponse = {
        ...result.producto,
        imagenUrl: result.producto.imagen_principal 
          ? objProductos.construirUrlImagen(result.producto.imagen_principal, baseUrl)
          : null
      };

      ctx.response.status = 200;
      ctx.response.body = {
        success: result.success,
        message: result.message,
        data: productoConUrl,
      };
    } else {
      ctx.response.status = result.success ? 200 : 404;
      ctx.response.body = {
        success: result.success,
        message: result.message,
        data: result.producto,
      };
    }
  } catch (error) {
    console.error("Error en postProducto:", error);
    
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      ctx.response.status = 400; // Bad Request para errores de validación
      ctx.response.body = {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Datos inválidos.",
        errors: zodError.errors.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor al agregar el producto.",
      };
    }
  }
};

export const putProducto = async (ctx: RouterContext<"/productos/:id">) => {
  try {
    const id_producto = Number(ctx.params.id);
    
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 404;
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
      stock_minimo: productoData.stock_minimo || 5,
      id_usuario: productoData.id_usuario,
      id_categoria: productoData.id_categoria ?? undefined,
      id_ciudad_origen: productoData.id_ciudad_origen ?? undefined,
      unidad_medida: productoData.unidad_medida || 'kg',
      disponible: productoData.disponible !== false,
      imagen_principal: productoExiste.imagen_principal,
      imagenes_adicionales: productoExiste.imagenes_adicionales,
    };

    const objProductos = new ProductosModel(productoCompleto);
    const result = await objProductos.EditarProducto(imagenData);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en putProducto:", error);
    
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      ctx.response.status = 400; // Bad Request para errores de validación
      ctx.response.body = {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Datos inválidos.",
        errors: zodError.errors.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor al actualizar el producto.",
      };
    }
  }
};

export const deleteProducto = async (ctx: RouterContext<"/productos/:id">) => {
  try {
    const id_producto = Number(ctx.params.id);
    
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "ID de producto invalido.",
      };
      return;
    }

    // Obtener información del producto antes de eliminarlo para borrar la imagen
    const { conexion } = await import("../Models/Conexion.ts");
    const producto = await conexion.query(
      "SELECT imagen_principal FROM productos WHERE id_producto = ?",
      [id_producto]
    );

    // Eliminar imagen si existe
    if (producto.length > 0 && producto[0].imagen_principal) {
      try {
        const { imageService } = await import("../Services/ImageService.ts");
        // Eliminar la imagen individual
        await imageService.deleteImage(producto[0].imagen_principal);
        // También intentar eliminar la carpeta del producto si existe
        await imageService.deleteFolder(`productos/${id_producto}`);
      } catch (imageError) {
        console.error("Error eliminando imagen del producto:", imageError);
        // Continuar con la eliminación del producto aunque falle la eliminación de la imagen
      }
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

// 📌 Nuevas funciones para funcionalidades mejoradas

export const getProductosConInfo = async (ctx: Context) => {
  try {
    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    const filtros = filtrosSchema.parse(queryParams);

    const objProductos = new ProductosModel();
    const lista = await objProductos.ListarProductosConInfo();

    // Aplicar filtros básicos
    let productosFiltrados: ProductoData[] = [...(lista as unknown as ProductoData[])];

    if (filtros.nombre) {
      productosFiltrados = productosFiltrados.filter((producto: ProductoData) => 
        producto.nombre.toLowerCase().includes(filtros.nombre!.toLowerCase())
      );
    }

    if (filtros.precio_min !== undefined) {
      productosFiltrados = productosFiltrados.filter((producto: ProductoData) => 
        producto.precio >= filtros.precio_min!
      );
    }

    if (filtros.precio_max !== undefined) {
      productosFiltrados = productosFiltrados.filter((producto: ProductoData) => 
        producto.precio <= filtros.precio_max!
      );
    }

    if (filtros.stock_min !== undefined) {
      productosFiltrados = productosFiltrados.filter((producto: ProductoData) => 
        producto.stock >= filtros.stock_min!
      );
    }

    const resultado = paginarResultados(productosFiltrados, filtros.pagina || 1, filtros.limite || 50);
    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
        : null
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: resultado.productos.length > 0 ? `${resultado.productos.length} productos encontrados.` : "No se encontraron productos.",
      data: listaConImagenes,
      pagination: {
        total: resultado.total,
        pagina: resultado.pagina,
        limite: resultado.limite,
        totalPaginas: resultado.totalPaginas,
        hayMasPaginas: resultado.hayMasPaginas
      }
    };
  } catch (error) {
    console.error("Error en getProductosConInfo:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const buscarProductosAvanzado = async (ctx: Context) => {
  try {
    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    
    const criterios = {
      nombre: queryParams.nombre,
      categoria: queryParams.categoria ? parseInt(queryParams.categoria) : undefined,
      ciudad: queryParams.ciudad ? parseInt(queryParams.ciudad) : undefined,
      departamento: queryParams.departamento ? parseInt(queryParams.departamento) : undefined,
      region: queryParams.region ? parseInt(queryParams.region) : undefined,
      precio_min: queryParams.precio_min ? parseFloat(queryParams.precio_min) : undefined,
      precio_max: queryParams.precio_max ? parseFloat(queryParams.precio_max) : undefined,
      stock_min: queryParams.stock_min ? parseInt(queryParams.stock_min) : undefined,
    };

    const objProductos = new ProductosModel();
    const productos = await objProductos.BuscarProductos(criterios);

    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = productos.map((producto: any) => {
      const imagenPrincipal = typeof producto.imagen_principal === 'string' ? producto.imagen_principal : null;
      return {
        ...producto,
        imagenUrl: imagenPrincipal 
          ? objProductos.construirUrlImagen(imagenPrincipal, baseUrl)
          : null
      };
    });

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: productos.length > 0 ? `${productos.length} productos encontrados.` : "No se encontraron productos con los criterios especificados.",
      data: listaConImagenes,
      total: productos.length,
      criterios_aplicados: criterios
    };
  } catch (error) {
    console.error("Error en buscarProductosAvanzado:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const getProductosPorProductor = async (ctx: RouterContext<"/productos/productor/:id">) => {
  try {
    const id_usuario = Number(ctx.params.id);
    
    if (isNaN(id_usuario) || id_usuario <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de usuario inválido.",
      };
      return;
    }

    const objProductos = new ProductosModel();
    const productos = await objProductos.ObtenerProductosPorProductor(id_usuario);

    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = productos.map((producto: any) => {
      const imagenPrincipal = typeof producto.imagen_principal === 'string' ? producto.imagen_principal : null;
      return {
        ...producto,
        imagenUrl: imagenPrincipal 
          ? objProductos.construirUrlImagen(imagenPrincipal, baseUrl)
          : null
      };
    });

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: productos.length > 0 ? `${productos.length} productos encontrados para el productor.` : "No se encontraron productos para este productor.",
      data: listaConImagenes,
      total: productos.length
    };
  } catch (error) {
    console.error("Error en getProductosPorProductor:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const getProductoDetallado = async (ctx: RouterContext<"/productos/:id/detalle">) => {
  try {
    const id_producto = Number(ctx.params.id);
    
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "ID de producto inválido.",
      };
      return;
    }

    const { conexion } = await import("../Models/Conexion.ts");
    
    const producto = await conexion.query(`
      SELECT 
        p.*,
        u.nombre as nombre_productor,
        u.email as email_productor,
        u.telefono as telefono_productor,
        u.direccion as direccion_productor,
        c.nombre as ciudad_origen,
        d.nombre as departamento_origen,
        r.nombre as region_origen,
        GROUP_CONCAT(cat.nombre) as categorias,
        AVG(res.calificacion) as calificacion_promedio,
        COUNT(res.id_resena) as total_resenas
      FROM productos p
      INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
      INNER JOIN ciudades c ON p.id_ciudad_origen = c.id_ciudad
      INNER JOIN departamentos d ON c.id_departamento = d.id_departamento
      INNER JOIN regiones r ON d.id_region = r.id_region
      LEFT JOIN productos_categorias pc ON p.id_producto = pc.id_producto
      LEFT JOIN categorias cat ON pc.id_categoria = cat.id_categoria AND cat.activa = 1
      LEFT JOIN resenas res ON p.id_producto = res.id_producto
      WHERE p.id_producto = ?
      GROUP BY p.id_producto
    `, [id_producto]);

    if (producto.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Producto no encontrado.",
      };
      return;
    }

    const objProductos = new ProductosModel();
    const baseUrl = getBaseUrl(ctx);
    const productoDetallado = {
      ...producto[0],
      imagenUrl: producto[0].imagenPrincipal 
        ? objProductos.construirUrlImagen(producto[0].imagenPrincipal, baseUrl)
        : null,
      calificacion_promedio: producto[0].calificacion_promedio ? parseFloat(producto[0].calificacion_promedio).toFixed(1) : null,
      total_resenas: parseInt(producto[0].total_resenas) || 0
    };

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Producto encontrado.",
      data: productoDetallado,
    };
  } catch (error) {
    console.error("Error en getProductoDetallado:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};