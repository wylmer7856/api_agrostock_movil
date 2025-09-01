import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { ProductosModel } from "../Models/ProductosModel.ts";

const productosSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  precio: z.number().min(0),
  stock: z.number().min(0),
  id_usuario: z.number().int().positive(),
  id_ciudad_origen: z.number().int().positive(),
});

const productosUpdateSchema = productosSchema.extend({
  id_producto: z.number().int().positive("El ID debe ser un numero positivo"),
});

export const getProductos = async (ctx: Context) => {
  try {
    const objProductos = new ProductosModel();
    const lista = await objProductos.ListarProductos();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: lista.length > 0
        ? "Productos encontrados."
        : "No se encontraron productos.",
      data: lista,
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

export const postProducto = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = productosSchema.parse(body);

    const productoData = {
      id_producto: null,
      ...validated,
    };

    const objProductos = new ProductosModel(productoData);
    const result = await objProductos.AgregarProducto();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.producto,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos." : "Error al agregar el producto"
    };
  }
};

export const putProducto = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = productosUpdateSchema.parse(body);

    const objProductos = new ProductosModel(validated);
    const result = await objProductos.EditarProducto();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en putProducto:", error);
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos, problema en el esquema" : "Error al actualizar el producto."
    };
  }
};

export const deleteProducto = async (ctx: RouterContext<"/productos/:id">) => {
  try {
    const id_producto = Number(ctx.params.id);
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de producto inválido.",
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
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};