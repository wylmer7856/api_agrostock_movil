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

const filtrosSchema = z.object({
  nombre: z.string().optional(),
  precio_min: z.string().transform(val => val ? Number(val) : undefined).optional(),
  precio_max: z.string().transform(val => val ? Number(val) : undefined).optional(),
  stock_min: z.string().transform(val => val ? Number(val) : undefined).optional(),
  id_usuario: z.string().transform(val => val ? Number(val) : undefined).optional(),
  id_ciudad_origen: z.string().transform(val => val ? Number(val) : undefined).optional(),
  unidadMedida: z.string().optional(),
  disponible: z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
  orden: z.enum(['nombre_asc', 'nombre_desc', 'precio_asc', 'precio_desc', 'stock_asc', 'stock_desc']).optional(),
  limite: z.string().transform(val => val ? Number(val) : 50).optional(),
  pagina: z.string().transform(val => val ? Number(val) : 1).optional(),
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

  if (filtros.unidadMedida) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.unidadMedida?.toLowerCase().includes(filtros.unidadMedida.toLowerCase())
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
    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagenPrincipal 
        ? objProductos.construirUrlImagen(producto.imagenPrincipal, `${ctx.request.url.protocol}//${ctx.request.url.host}`)
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
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Parámetros de filtro inválidos.",
        errors: error.errors.map(err => ({
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

    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagenPrincipal 
        ? objProductos.construirUrlImagen(producto.imagenPrincipal, `${ctx.request.url.protocol}//${ctx.request.url.host}`)
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

    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagenPrincipal 
        ? objProductos.construirUrlImagen(producto.imagenPrincipal, `${ctx.request.url.protocol}//${ctx.request.url.host}`)
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

    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagenPrincipal 
        ? objProductos.construirUrlImagen(producto.imagenPrincipal, `${ctx.request.url.protocol}//${ctx.request.url.host}`)
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
      ctx.response.status = 404;
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
      stockMinimo: productoData.stockMinimo || 10,
      id_usuario: productoData.id_usuario,
      id_ciudad_origen: productoData.id_ciudad_origen,
      unidadMedida: productoData.unidadMedida,
      pesoAprox: productoData.pesoAprox,
      imagenPrincipal: productoExiste.imagenPrincipal,
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
      ctx.response.status = 404;
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
      ctx.response.status = 404;
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