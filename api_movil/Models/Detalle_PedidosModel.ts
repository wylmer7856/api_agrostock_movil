import { conexion } from "./Conexion.ts";

interface DetallePedidoData {
  id_detalle: number | null;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export class DetallePedidosModel {
  public _objDetalle: DetallePedidoData | null;

  constructor(objDetalle: DetallePedidoData | null = null) {
    this._objDetalle = objDetalle;
  }

  public async ListarDetalles(): Promise<DetallePedidoData[]> {
    try {
      const result = await conexion.query("SELECT * FROM detalle_pedidos");
      return result as DetallePedidoData[];
    } catch (error) {
      console.error("Error al listar detalles de pedidos:", error);
      throw new Error("Error al listar detalles.");
    }
  }

  public async AgregarDetalle(): Promise<{ success: boolean; message: string; detalle?: DetallePedidoData }> {
    try {
      if (!this._objDetalle) {
        throw new Error("No se proporciono un objeto de detalle.");
      }

      const { id_pedido, id_producto, cantidad, precio_unitario, subtotal } = this._objDetalle;

      if (!id_pedido || !id_producto || !cantidad || !precio_unitario || subtotal === undefined) {
        throw new Error("Faltan campos obligatorios para crear el detalle del pedido.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
        [id_pedido, id_producto, cantidad, precio_unitario, subtotal]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const queryResult = await conexion.query("SELECT * FROM detalle_pedidos ORDER BY id_detalle DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Detalle agregado exitosamente.",
          detalle: queryResult?.[0] as DetallePedidoData,
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo agregar el detalle.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al agregar detalle:", error);
      return {
        success: false,
        message: "Error al agregar detalle.",
      };
    }
  }

  public async EliminarDetalle(id_detalle: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM detalle_pedidos WHERE id_detalle = ?", [id_detalle]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Detalle eliminado exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo eliminar el detalle.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al eliminar detalle:", error);
      return {
        success: false,
        message: "Error al eliminar el detalle.",
      };
    }
  }
}
