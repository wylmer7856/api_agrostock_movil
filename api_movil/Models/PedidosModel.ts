import { conexion } from "./Conexion.ts";

interface PedidoData {
  id_pedido: number | null;
  id_consumidor: number;
  id_productor: number;
  fecha: Date;
  estado: "pendiente" | "confirmado" | "comprado";
  total: number;
  direccionEntrega: string;
  notas?: string;
  fecha_entrega_estimada: Date;
  metodo_pago: string;
}


export class PedidosModel {
  public _objPedido: PedidoData | null;

  constructor(objPedido: PedidoData | null = null) {
    this._objPedido = objPedido;
  }

  public async ListarPedidos(): Promise<PedidoData[]> {
    try {
      const result = await conexion.query("SELECT * FROM pedidos");
      // deno-lint-ignore no-explicit-any
      return result.map((row: any) => ({
        ...row,
        fecha: new Date(row.fecha),
        fecha_entrega_estimada: new Date(row.fecha_entrega_estimada),
      })) as PedidoData[];
    } catch (error) {
      console.error("Error al listar pedidos:", error);
      throw new Error("Error al listar pedidos.");
    }
  }

  public async AgregarPedido(): Promise<{ success: boolean; message: string; pedido?: PedidoData }> {
    try {
      if (!this._objPedido) {
        throw new Error("No se proporcionó un objeto de pedido.");
      }

      const { id_consumidor, id_productor, fecha, estado, total, direccionEntrega, notas, fecha_entrega_estimada, metodo_pago } = this._objPedido;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(`INSERT INTO pedidos (id_consumidor, id_productor, fecha, estado, total, direccionEntrega, notas, fecha_entrega_estimada, metodo_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_consumidor, id_productor, fecha, estado, total, direccionEntrega, notas, fecha_entrega_estimada, metodo_pago]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const queryResult = await conexion.query("SELECT * FROM pedidos ORDER BY id_pedido DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Pedido agregado exitosamente.",
          pedido: {
            ...queryResult[0],
            fecha: new Date(queryResult[0].fecha),
            fecha_entrega_estimada: new Date(queryResult[0].fecha_entrega_estimada),
          } as PedidoData,
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo agregar el pedido.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al agregar pedido:", error);
      return {
        success: false,
        message: "Error al agregar pedido.",
      };
    }
  }

  public async EditarPedido(id_pedido: number): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objPedido) {
        throw new Error("No se proporcionó un objeto de pedido.");
      }

      const { id_consumidor, id_productor, fecha, estado, total, direccionEntrega, notas, fecha_entrega_estimada, metodo_pago } = this._objPedido;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(`UPDATE pedidos SET id_consumidor = ?, id_productor = ?, fecha = ?, estado = ?, total = ?, direccionEntrega = ?, notas = ?, fecha_entrega_estimada = ?, metodo_pago = ? WHERE id_pedido = ?`,
        [id_consumidor, id_productor, fecha, estado, total, direccionEntrega, notas, fecha_entrega_estimada, metodo_pago, id_pedido]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Pedido editado exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo editar el pedido.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al editar pedido:", error);
      return {
        success: false,
        message: "Error al editar pedido.",
      };
    }
  }

  public async EliminarPedido(id_pedido: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM pedidos WHERE id_pedido = ?", [id_pedido]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Pedido eliminado exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo eliminar el pedido.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al eliminar pedido:", error);
      return {
        success: false,
        message: "Error al eliminar pedido.",
      };
    }
  }
}
