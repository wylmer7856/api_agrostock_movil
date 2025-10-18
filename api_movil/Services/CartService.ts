import { conexion } from "../Models/Conexion.ts";

interface CartItem {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  disponible: boolean;
  stock_actual: number;
}

interface CartData {
  id_usuario: number;
  items: CartItem[];
  total_items: number;
  total_precio: number;
  fecha_actualizacion: Date;
}

interface CartValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  items_validated: CartItem[];
}

export class CartService {
  private readonly CART_EXPIRY_HOURS = 24; // Carrito expira en 24 horas

  /**
   * Obtiene el carrito de un usuario
   */
  async getUserCart(id_usuario: number): Promise<CartData | null> {
    try {
      const result = await conexion.query(
        `SELECT * FROM carrito_compras WHERE id_usuario = ?`,
        [id_usuario]
      );

      if (result.length === 0) {
        return null;
      }

      const cartData = result[0];
      const items = await this.getCartItems(cartData.id_carrito);
      
      return {
        id_usuario: cartData.id_usuario,
        items: items,
        total_items: items.reduce((sum, item) => sum + item.cantidad, 0),
        total_precio: items.reduce((sum, item) => sum + item.precio_total, 0),
        fecha_actualizacion: cartData.fecha_actualizacion
      };
    } catch (error) {
      console.error("Error al obtener carrito:", error);
      return null;
    }
  }

  /**
   * Obtiene los items del carrito
   */
  private async getCartItems(id_carrito: number): Promise<CartItem[]> {
    try {
      const result = await conexion.query(
        `SELECT 
           ci.*,
           p.nombre as producto_nombre,
           p.stock as stock_actual,
           p.precio as precio_actual,
           CASE WHEN p.stock >= ci.cantidad THEN 1 ELSE 0 END as disponible
         FROM carrito_items ci
         INNER JOIN productos p ON ci.id_producto = p.id_producto
         WHERE ci.id_carrito = ?`,
        [id_carrito]
      );

      return result.map((item: any) => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_total: item.precio_total,
        disponible: Boolean(item.disponible),
        stock_actual: item.stock_actual
      }));
    } catch (error) {
      console.error("Error al obtener items del carrito:", error);
      return [];
    }
  }

  /**
   * Crea un nuevo carrito para un usuario
   */
  async createCart(id_usuario: number): Promise<{ success: boolean; message: string; cart_id?: number }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        `INSERT INTO carrito_compras (id_usuario, fecha_actualizacion) VALUES (?, NOW())`,
        [id_usuario]
      );

      if (result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Carrito creado correctamente",
          cart_id: (result as any).insertId
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "Error al crear carrito"
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al crear carrito:", error);
      return {
        success: false,
        message: "Error interno del servidor"
      };
    }
  }

  /**
   * Agrega un producto al carrito
   */
  async addToCart(id_usuario: number, id_producto: number, cantidad: number): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar que el producto existe y tiene stock
      const producto = await conexion.query(
        "SELECT * FROM productos WHERE id_producto = ? AND stock >= ?",
        [id_producto, cantidad]
      );

      if (producto.length === 0) {
        return {
          success: false,
          message: "Producto no disponible o sin stock suficiente"
        };
      }

      await conexion.execute("START TRANSACTION");

      // Obtener o crear carrito
      let cartResult = await conexion.query(
        "SELECT id_carrito FROM carrito_compras WHERE id_usuario = ?",
        [id_usuario]
      );

      let id_carrito: number;
      if (cartResult.length === 0) {
        const newCart = await conexion.execute(
          "INSERT INTO carrito_compras (id_usuario, fecha_actualizacion) VALUES (?, NOW())",
          [id_usuario]
        );
        id_carrito = (newCart as any).insertId;
      } else {
        id_carrito = cartResult[0].id_carrito;
      }

      // Verificar si el producto ya está en el carrito
      const existingItem = await conexion.query(
        "SELECT * FROM carrito_items WHERE id_carrito = ? AND id_producto = ?",
        [id_carrito, id_producto]
      );

      if (existingItem.length > 0) {
        // Actualizar cantidad existente
        const nuevaCantidad = existingItem[0].cantidad + cantidad;
        const nuevoPrecioTotal = nuevaCantidad * producto[0].precio;

        await conexion.execute(
          `UPDATE carrito_items 
           SET cantidad = ?, precio_total = ?, fecha_actualizacion = NOW()
           WHERE id_carrito = ? AND id_producto = ?`,
          [nuevaCantidad, nuevoPrecioTotal, id_carrito, id_producto]
        );
      } else {
        // Agregar nuevo item
        const precioTotal = cantidad * producto[0].precio;
        await conexion.execute(
          `INSERT INTO carrito_items (id_carrito, id_producto, cantidad, precio_unitario, precio_total, fecha_actualizacion)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [id_carrito, id_producto, cantidad, producto[0].precio, precioTotal]
        );
      }

      // Actualizar fecha del carrito
      await conexion.execute(
        "UPDATE carrito_compras SET fecha_actualizacion = NOW() WHERE id_carrito = ?",
        [id_carrito]
      );

      await conexion.execute("COMMIT");

      return {
        success: true,
        message: "Producto agregado al carrito correctamente"
      };
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al agregar al carrito:", error);
      return {
        success: false,
        message: "Error al agregar producto al carrito"
      };
    }
  }

  /**
   * Actualiza la cantidad de un producto en el carrito
   */
  async updateCartItem(id_usuario: number, id_producto: number, nuevaCantidad: number): Promise<{ success: boolean; message: string }> {
    try {
      if (nuevaCantidad <= 0) {
        return await this.removeFromCart(id_usuario, id_producto);
      }

      // Verificar stock disponible
      const producto = await conexion.query(
        "SELECT stock, precio FROM productos WHERE id_producto = ?",
        [id_producto]
      );

      if (producto.length === 0) {
        return {
          success: false,
          message: "Producto no encontrado"
        };
      }

      if (producto[0].stock < nuevaCantidad) {
        return {
          success: false,
          message: `Stock insuficiente. Disponible: ${producto[0].stock} unidades`
        };
      }

      await conexion.execute("START TRANSACTION");

      const cartResult = await conexion.query(
        "SELECT id_carrito FROM carrito_compras WHERE id_usuario = ?",
        [id_usuario]
      );

      if (cartResult.length === 0) {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "Carrito no encontrado"
        };
      }

      const id_carrito = cartResult[0].id_carrito;
      const nuevoPrecioTotal = nuevaCantidad * producto[0].precio;

      const result = await conexion.execute(
        `UPDATE carrito_items 
         SET cantidad = ?, precio_total = ?, fecha_actualizacion = NOW()
         WHERE id_carrito = ? AND id_producto = ?`,
        [nuevaCantidad, nuevoPrecioTotal, id_carrito, id_producto]
      );

      if (result.affectedRows && result.affectedRows > 0) {
        await conexion.execute(
          "UPDATE carrito_compras SET fecha_actualizacion = NOW() WHERE id_carrito = ?",
          [id_carrito]
        );
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Cantidad actualizada correctamente"
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "Producto no encontrado en el carrito"
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al actualizar item del carrito:", error);
      return {
        success: false,
        message: "Error al actualizar cantidad"
      };
    }
  }

  /**
   * Elimina un producto del carrito
   */
  async removeFromCart(id_usuario: number, id_producto: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const cartResult = await conexion.query(
        "SELECT id_carrito FROM carrito_compras WHERE id_usuario = ?",
        [id_usuario]
      );

      if (cartResult.length === 0) {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "Carrito no encontrado"
        };
      }

      const id_carrito = cartResult[0].id_carrito;

      const result = await conexion.execute(
        "DELETE FROM carrito_items WHERE id_carrito = ? AND id_producto = ?",
        [id_carrito, id_producto]
      );

      if (result.affectedRows && result.affectedRows > 0) {
        await conexion.execute(
          "UPDATE carrito_compras SET fecha_actualizacion = NOW() WHERE id_carrito = ?",
          [id_carrito]
        );
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Producto eliminado del carrito"
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "Producto no encontrado en el carrito"
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al eliminar del carrito:", error);
      return {
        success: false,
        message: "Error al eliminar producto del carrito"
      };
    }
  }

  /**
   * Vacía el carrito de un usuario
   */
  async clearCart(id_usuario: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const cartResult = await conexion.query(
        "SELECT id_carrito FROM carrito_compras WHERE id_usuario = ?",
        [id_usuario]
      );

      if (cartResult.length === 0) {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "Carrito no encontrado"
        };
      }

      const id_carrito = cartResult[0].id_carrito;

      await conexion.execute(
        "DELETE FROM carrito_items WHERE id_carrito = ?",
        [id_carrito]
      );

      await conexion.execute(
        "UPDATE carrito_compras SET fecha_actualizacion = NOW() WHERE id_carrito = ?",
        [id_carrito]
      );

      await conexion.execute("COMMIT");

      return {
        success: true,
        message: "Carrito vaciado correctamente"
      };
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al vaciar carrito:", error);
      return {
        success: false,
        message: "Error al vaciar carrito"
      };
    }
  }

  /**
   * Valida el carrito antes de proceder al checkout
   */
  async validateCart(id_usuario: number): Promise<CartValidationResult> {
    try {
      const cart = await this.getUserCart(id_usuario);
      
      if (!cart || cart.items.length === 0) {
        return {
          valid: false,
          errors: ["El carrito está vacío"],
          warnings: [],
          items_validated: []
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const items_validated: CartItem[] = [];

      for (const item of cart.items) {
        // Verificar disponibilidad
        if (!item.disponible) {
          if (item.stock_actual === 0) {
            errors.push(`El producto ${item.id_producto} está agotado`);
          } else {
            errors.push(`El producto ${item.id_producto} solo tiene ${item.stock_actual} unidades disponibles`);
          }
          continue;
        }

        // Verificar precio actualizado
        const productoActual = await conexion.query(
          "SELECT precio FROM productos WHERE id_producto = ?",
          [item.id_producto]
        );

        if (productoActual.length > 0) {
          const precioActual = productoActual[0].precio;
          if (precioActual !== item.precio_unitario) {
            warnings.push(`El precio del producto ${item.id_producto} ha cambiado de $${item.precio_unitario} a $${precioActual}`);
            
            // Actualizar precio
            item.precio_unitario = precioActual;
            item.precio_total = item.cantidad * precioActual;
          }
        }

        items_validated.push(item);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        items_validated
      };
    } catch (error) {
      console.error("Error al validar carrito:", error);
      return {
        valid: false,
        errors: ["Error al validar el carrito"],
        warnings: [],
        items_validated: []
      };
    }
  }

  /**
   * Convierte el carrito en un pedido
   */
  async convertCartToOrder(id_usuario: number, direccionEntrega: string, notas: string, metodo_pago: string): Promise<{ success: boolean; message: string; pedido_id?: number }> {
    try {
      // Validar carrito
      const validation = await this.validateCart(id_usuario);
      
      if (!validation.valid) {
        return {
          success: false,
          message: `Carrito inválido: ${validation.errors.join(', ')}`
        };
      }

      await conexion.execute("START TRANSACTION");

      // Crear pedido
      const total = validation.items_validated.reduce((sum, item) => sum + item.precio_total, 0);
      const fechaEntregaEstimada = new Date();
      fechaEntregaEstimada.setDate(fechaEntregaEstimada.getDate() + 3); // 3 días por defecto

      const pedidoResult = await conexion.execute(
        `INSERT INTO pedidos (id_consumidor, fecha, estado, total, direccionEntrega, notas, fecha_entrega_estimada, metodo_pago)
         VALUES (?, NOW(), 'pendiente', ?, ?, ?, ?, ?)`,
        [id_usuario, total, direccionEntrega, notas, fechaEntregaEstimada, metodo_pago]
      );

      const id_pedido = (pedidoResult as any).insertId;

      // Crear detalles del pedido
      for (const item of validation.items_validated) {
        await conexion.execute(
          `INSERT INTO detalle_pedidos (id_pedido, id_producto, precio_unitario, cantidad, Precio_total)
           VALUES (?, ?, ?, ?, ?)`,
          [id_pedido, item.id_producto, item.precio_unitario, item.cantidad, item.precio_total]
        );

        // Reducir stock
        await conexion.execute(
          "UPDATE productos SET stock = stock - ? WHERE id_producto = ?",
          [item.cantidad, item.id_producto]
        );
      }

      // Vaciar carrito
      await this.clearCart(id_usuario);

      await conexion.execute("COMMIT");

      return {
        success: true,
        message: "Pedido creado correctamente",
        pedido_id: id_pedido
      };
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al convertir carrito en pedido:", error);
      return {
        success: false,
        message: "Error al crear el pedido"
      };
    }
  }

  /**
   * Limpia carritos expirados
   */
  async cleanupExpiredCarts(): Promise<{ success: boolean; message: string; deleted: number }> {
    try {
      const result = await conexion.execute(
        `DELETE FROM carrito_compras 
         WHERE fecha_actualizacion < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
        [this.CART_EXPIRY_HOURS]
      );

      return {
        success: true,
        message: "Carritos expirados eliminados",
        deleted: result.affectedRows || 0
      };
    } catch (error) {
      console.error("Error al limpiar carritos expirados:", error);
      return {
        success: false,
        message: "Error al limpiar carritos expirados",
        deleted: 0
      };
    }
  }
}

export const cartService = new CartService();
