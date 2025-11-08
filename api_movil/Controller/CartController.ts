import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { cartService } from "../Services/CartService.ts";
import { notificationService } from "../Services/NotificationService.ts";
import { emailService } from "../Services/EmailService.ts";

// Esquemas de validación
const addToCartSchema = z.object({
  id_producto: z.number().int().positive(),
  cantidad: z.number().int().positive().max(100)
});

const updateCartItemSchema = z.object({
  cantidad: z.number().int().positive().max(100)
});

const checkoutSchema = z.object({
  direccionEntrega: z.string().min(10).max(500),
  notas: z.string().max(1000).optional(),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta']),
  cupon_codigo: z.string().optional()
});

export class CartController {
  /**
   * Obtener carrito del usuario
   */
  static async getCart(ctx: Context) {
    try {
      const user = ctx.state.user;
      const cart = await cartService.getUserCart(user.id);

      if (!cart) {
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Carrito vacío",
          data: {
            items: [],
            total_items: 0,
            total_precio: 0,
            fecha_actualizacion: new Date()
          }
        };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Carrito obtenido correctamente",
        data: cart
      };
    } catch (error) {
      console.error("Error al obtener carrito:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al obtener el carrito"
      };
    }
  }

  /**
   * Agregar producto al carrito
   */
  static async addToCart(ctx: Context) {
    try {
      const user = ctx.state.user;
      const body = await ctx.request.body.json();
      const validated = addToCartSchema.parse(body);

      const result = await cartService.addToCart(
        user.id,
        validated.id_producto,
        validated.cantidad
      );

      if (result.success) {
        // Obtener el carrito actualizado
        const cart = await cartService.getUserCart(user.id);
        
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: result.message,
          data: cart
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al agregar al carrito",
          message: result.message
        };
      }
    } catch (error) {
      console.error("Error al agregar al carrito:", error);
      
      if (error instanceof z.ZodError) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos inválidos",
          message: "Los datos proporcionados no son válidos",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        };
        return;
      }

      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al agregar producto al carrito"
      };
    }
  }

  /**
   * Actualizar cantidad de producto en el carrito
   */
  static async updateCartItem(ctx: RouterContext<"/cart/item/:id">) {
    try {
      const user = ctx.state.user;
      const id_producto = Number(ctx.params.id);
      const body = await ctx.request.body.json();
      const validated = updateCartItemSchema.parse(body);

      if (isNaN(id_producto) || id_producto <= 0) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "ID de producto inválido",
          message: "El ID del producto no es válido"
        };
        return;
      }

      const result = await cartService.updateCartItem(
        user.id,
        id_producto,
        validated.cantidad
      );

      if (result.success) {
        const cart = await cartService.getUserCart(user.id);
        
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: result.message,
          data: cart
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al actualizar carrito",
          message: result.message
        };
      }
    } catch (error) {
      console.error("Error al actualizar item del carrito:", error);
      
      if (error instanceof z.ZodError) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos inválidos",
          message: "Los datos proporcionados no son válidos",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        };
        return;
      }

      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al actualizar el carrito"
      };
    }
  }

  /**
   * Eliminar producto del carrito
   */
  static async removeFromCart(ctx: RouterContext<"/cart/item/:id">) {
    try {
      const user = ctx.state.user;
      const id_producto = Number(ctx.params.id);

      if (isNaN(id_producto) || id_producto <= 0) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "ID de producto inválido",
          message: "El ID del producto no es válido"
        };
        return;
      }

      const result = await cartService.removeFromCart(user.id, id_producto);

      if (result.success) {
        const cart = await cartService.getUserCart(user.id);
        
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: result.message,
          data: cart
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al eliminar del carrito",
          message: result.message
        };
      }
    } catch (error) {
      console.error("Error al eliminar del carrito:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al eliminar producto del carrito"
      };
    }
  }

  /**
   * Vaciar carrito
   */
  static async clearCart(ctx: Context) {
    try {
      const user = ctx.state.user;
      const result = await cartService.clearCart(user.id);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: result.message,
          data: {
            items: [],
            total_items: 0,
            total_precio: 0,
            fecha_actualizacion: new Date()
          }
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al vaciar carrito",
          message: result.message
        };
      }
    } catch (error) {
      console.error("Error al vaciar carrito:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al vaciar el carrito"
      };
    }
  }

  /**
   * Validar carrito antes del checkout
   */
  static async validateCart(ctx: Context) {
    try {
      const user = ctx.state.user;
      const validation = await cartService.validateCart(user.id);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: validation.valid ? "Carrito válido" : "Carrito inválido",
        data: {
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          items_validated: validation.items_validated,
          total_items: validation.items_validated.length,
          total_precio: validation.items_validated.reduce((sum, item) => sum + item.precio_total, 0)
        }
      };
    } catch (error) {
      console.error("Error al validar carrito:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al validar el carrito"
      };
    }
  }

  /**
   * Procesar checkout (convertir carrito en pedido)
   */
  static async checkout(ctx: Context) {
    try {
      const user = ctx.state.user;
      const body = await ctx.request.body.json();
      const validated = checkoutSchema.parse(body);

      // Validar carrito primero
      const validation = await cartService.validateCart(user.id);
      
      if (!validation.valid) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Carrito inválido",
          message: "El carrito contiene errores que deben ser corregidos",
          details: {
            errors: validation.errors,
            warnings: validation.warnings
          }
        };
        return;
      }

      // Procesar checkout
      const result = await cartService.convertCartToOrder(
        user.id,
        validated.direccionEntrega,
        validated.notas || '',
        validated.metodo_pago
      );

      if (result.success) {
        // Obtener información del pedido para notificaciones
        const { conexion } = await import("../Models/Conexion.ts");
        const pedido = await conexion.query(
          `SELECT p.*, u.nombre as nombre_productor, u.email as email_productor
           FROM pedidos p
           INNER JOIN usuarios u ON p.id_productor = u.id_usuario
           WHERE p.id_pedido = ?`,
          [result.pedido_id]
        );

        const productos = await conexion.query(
          `SELECT dp.*, pr.nombre, pr.unidad_medida
           FROM detalle_pedidos dp
           INNER JOIN productos pr ON dp.id_producto = pr.id_producto
           WHERE dp.id_pedido = ?`,
          [result.pedido_id]
        );

        // Notificar al productor
        if (pedido.length > 0) {
          await notificationService.notifyNewOrder(
            pedido[0].id_productor,
            result.pedido_id!,
            productos
          );

          // Enviar email al productor
          await emailService.sendOrderNotification(
            pedido[0].email_productor,
            pedido[0].nombre_productor,
            result.pedido_id!,
            productos
          );
        }

        // Notificar al consumidor
        await notificationService.createNotification({
          id_usuario: user.id,
          titulo: "🛒 Pedido Realizado",
          mensaje: `Tu pedido #${result.pedido_id} ha sido procesado exitosamente`,
          tipo: 'success',
          datos_extra: {
            pedido_id: result.pedido_id,
            action: 'view_order'
          }
        });

        ctx.response.status = 201;
        ctx.response.body = {
          success: true,
          message: result.message,
          data: {
            pedido_id: result.pedido_id,
            total_items: validation.items_validated.length,
            total_precio: validation.items_validated.reduce((sum, item) => sum + item.precio_total, 0),
            metodo_pago: validated.metodo_pago,
            direccion_entrega: validated.direccionEntrega
          }
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al procesar pedido",
          message: result.message
        };
      }
    } catch (error) {
      console.error("Error en checkout:", error);
      
      if (error instanceof z.ZodError) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos inválidos",
          message: "Los datos proporcionados no son válidos",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        };
        return;
      }

      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al procesar el pedido"
      };
    }
  }

  /**
   * Obtener estadísticas del carrito
   */
  static async getCartStats(ctx: Context) {
    try {
      const user = ctx.state.user;
      const cart = await cartService.getUserCart(user.id);

      if (!cart) {
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Sin estadísticas de carrito",
          data: {
            total_items: 0,
            total_precio: 0,
            productos_unicos: 0,
            fecha_actualizacion: null
          }
        };
        return;
      }

      const productosUnicos = cart.items.length;
      const productosDisponibles = cart.items.filter(item => item.disponible).length;
      const productosSinStock = cart.items.filter(item => !item.disponible).length;

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Estadísticas del carrito obtenidas",
        data: {
          total_items: cart.total_items,
          total_precio: cart.total_precio,
          productos_unicos: productosUnicos,
          productos_disponibles: productosDisponibles,
          productos_sin_stock: productosSinStock,
          fecha_actualizacion: cart.fecha_actualizacion,
          porcentaje_disponibilidad: productosUnicos > 0 ? (productosDisponibles / productosUnicos) * 100 : 0
        }
      };
    } catch (error) {
      console.error("Error al obtener estadísticas del carrito:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al obtener estadísticas del carrito"
      };
    }
  }
}
