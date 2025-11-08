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
        `SELECT 
           c.*,
           p.nombre as producto_nombre,
           p.precio as precio_actual,
           p.stock as stock_actual,
           p.disponible as producto_disponible,
           p.imagen_principal,
           CASE WHEN p.stock >= c.cantidad AND p.disponible = 1 THEN 1 ELSE 0 END as disponible
         FROM carrito c
         INNER JOIN productos p ON c.id_producto = p.id_producto
         WHERE c.id_usuario = ?
         ORDER BY c.fecha_agregado DESC`,
        [id_usuario]
      );

      if (result.length === 0) {
        return null;
      }

      const items: CartItem[] = result.map((item: any) => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_actual,
        precio_total: item.cantidad * item.precio_actual,
        disponible: Boolean(item.disponible),
        stock_actual: item.stock_actual
      }));

      const fechaActualizacion = result.length > 0 ? new Date(result[0].fecha_agregado) : new Date();
      
      return {
        id_usuario: id_usuario,
        items: items,
        total_items: items.reduce((sum, item) => sum + item.cantidad, 0),
        total_precio: items.reduce((sum, item) => sum + item.precio_total, 0),
        fecha_actualizacion: fechaActualizacion
      };
    } catch (error) {
      console.error("Error al obtener carrito:", error);
      return null;
    }
  }

  // El carrito se crea automáticamente al agregar el primer producto

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

      // Verificar si el producto ya está en el carrito (UNIQUE KEY usuario_producto)
      const existingItem = await conexion.query(
        "SELECT * FROM carrito WHERE id_usuario = ? AND id_producto = ?",
        [id_usuario, id_producto]
      );

      if (existingItem.length > 0) {
        // Actualizar cantidad existente
        const nuevaCantidad = existingItem[0].cantidad + cantidad;
        
        await conexion.execute(
          `UPDATE carrito 
           SET cantidad = ?, fecha_agregado = NOW()
           WHERE id_usuario = ? AND id_producto = ?`,
          [nuevaCantidad, id_usuario, id_producto]
        );
      } else {
        // Agregar nuevo item
        await conexion.execute(
          `INSERT INTO carrito (id_usuario, id_producto, cantidad, fecha_agregado)
           VALUES (?, ?, ?, NOW())`,
          [id_usuario, id_producto, cantidad]
        );
      }

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

      const result = await conexion.execute(
        `UPDATE carrito 
         SET cantidad = ?, fecha_agregado = NOW()
         WHERE id_usuario = ? AND id_producto = ?`,
        [nuevaCantidad, id_usuario, id_producto]
      );

      if (result.affectedRows && result.affectedRows > 0) {
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

      const result = await conexion.execute(
        "DELETE FROM carrito WHERE id_usuario = ? AND id_producto = ?",
        [id_usuario, id_producto]
      );

      if (result.affectedRows && result.affectedRows > 0) {
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

      await conexion.execute(
        "DELETE FROM carrito WHERE id_usuario = ?",
        [id_usuario]
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

      // Agrupar productos por productor
      const productosPorProductor = new Map<number, CartItem[]>();
      
      for (const item of validation.items_validated) {
        const producto = await conexion.query(
          "SELECT id_usuario FROM productos WHERE id_producto = ?",
          [item.id_producto]
        );
        
        if (producto.length > 0) {
          const id_productor = producto[0].id_usuario;
          if (!productosPorProductor.has(id_productor)) {
            productosPorProductor.set(id_productor, []);
          }
          productosPorProductor.get(id_productor)!.push(item);
        }
      }

      const pedidosCreados: number[] = [];

      // Crear un pedido por cada productor
      for (const [id_productor, items] of productosPorProductor) {
        const total = items.reduce((sum, item) => sum + item.precio_total, 0);

        const pedidoResult = await conexion.execute(
          `INSERT INTO pedidos (id_consumidor, id_productor, total, estado, direccion_entrega, metodo_pago, estado_pago, notas)
           VALUES (?, ?, ?, 'pendiente', ?, ?, 'pendiente', ?)`,
          [id_usuario, id_productor, total, direccionEntrega, metodo_pago, notas || null]
        );

        const id_pedido = (pedidoResult as any).insertId;
        pedidosCreados.push(id_pedido);

        // Crear detalles del pedido
        for (const item of items) {
          await conexion.execute(
            `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
             VALUES (?, ?, ?, ?, ?)`,
            [id_pedido, item.id_producto, item.cantidad, item.precio_unitario, item.precio_total]
          );

          // Reducir stock
          await conexion.execute(
            "UPDATE productos SET stock = stock - ? WHERE id_producto = ?",
            [item.cantidad, item.id_producto]
          );
        }
      }

      // Vaciar carrito
      await this.clearCart(id_usuario);

      await conexion.execute("COMMIT");

      return {
        success: true,
        message: `Pedido${pedidosCreados.length > 1 ? 's' : ''} creado${pedidosCreados.length > 1 ? 's' : ''} correctamente`,
        pedido_id: pedidosCreados[0] // Retornar el primer pedido para compatibilidad
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
        `DELETE FROM carrito 
         WHERE fecha_agregado < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
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
