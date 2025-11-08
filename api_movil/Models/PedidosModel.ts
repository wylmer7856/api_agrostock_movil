import { conexion } from "./Conexion.ts";

interface PedidoData {
  id_pedido: number | null;
  id_consumidor: number;
  id_productor: number;
  total: number;
  estado: "pendiente" | "confirmado" | "en_preparacion" | "en_camino" | "entregado" | "cancelado";
  direccion_entrega: string;
  id_ciudad_entrega?: number | null;
  metodo_pago: "efectivo" | "transferencia" | "nequi" | "daviplata" | "pse" | "tarjeta";
  estado_pago?: "pendiente" | "pagado" | "reembolsado";
  notas?: string | null;
  fecha_pedido?: string | null;
  fecha_entrega?: string | null;
}


export class PedidosModel {
  public _objPedido: PedidoData | null;

  constructor(objPedido: PedidoData | null = null) {
    this._objPedido = objPedido;
  }

  public async ListarPedidos(): Promise<PedidoData[]> {
    try {
      const result = await conexion.query("SELECT * FROM pedidos ORDER BY fecha_pedido DESC");
      return result as PedidoData[];
    } catch (error) {
      console.error("Error al listar pedidos:", error);
      throw new Error("Error al listar pedidos.");
    }
  }

  // 📌 Obtener pedidos por productor
  public async ObtenerPedidosPorProductor(id_productor: number): Promise<PedidoData[]> {
    try {
      const result = await conexion.query(
        "SELECT * FROM pedidos WHERE id_productor = ? ORDER BY fecha_pedido DESC",
        [id_productor]
      );
      return result as PedidoData[];
    } catch (error) {
      console.error("Error al obtener pedidos por productor:", error);
      throw new Error("Error al obtener pedidos del productor.");
    }
  }

  // 📌 Obtener pedidos por consumidor
  public async ObtenerPedidosPorConsumidor(id_consumidor: number): Promise<PedidoData[]> {
    try {
      const result = await conexion.query(
        "SELECT * FROM pedidos WHERE id_consumidor = ? ORDER BY fecha_pedido DESC",
        [id_consumidor]
      );
      return result as PedidoData[];
    } catch (error) {
      console.error("Error al obtener pedidos por consumidor:", error);
      throw new Error("Error al obtener pedidos del consumidor.");
    }
  }

  public async AgregarPedido(): Promise<{ success: boolean; message: string; pedido?: PedidoData }> {
    try {
      if (!this._objPedido) {
        throw new Error("No se proporcionó un objeto de pedido.");
      }

      const { id_consumidor, id_productor, total, estado, direccion_entrega, id_ciudad_entrega, metodo_pago, estado_pago, notas } = this._objPedido;

      if (!id_consumidor || !id_productor || !total || !direccion_entrega || !metodo_pago) {
        throw new Error("Faltan campos obligatorios para crear el pedido.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(`INSERT INTO pedidos (id_consumidor, id_productor, total, estado, direccion_entrega, id_ciudad_entrega, metodo_pago, estado_pago, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_consumidor, id_productor, total, estado || 'pendiente', direccion_entrega, id_ciudad_entrega || null, metodo_pago, estado_pago || 'pendiente', notas || null]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const queryResult = await conexion.query("SELECT * FROM pedidos ORDER BY id_pedido DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Pedido agregado exitosamente.",
          pedido: queryResult[0] as PedidoData,
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

      const { id_consumidor, id_productor, total, estado, direccion_entrega, id_ciudad_entrega, metodo_pago, estado_pago, notas, fecha_entrega } = this._objPedido;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(`UPDATE pedidos SET id_consumidor = ?, id_productor = ?, total = ?, estado = ?, direccion_entrega = ?, id_ciudad_entrega = ?, metodo_pago = ?, estado_pago = ?, notas = ?, fecha_entrega = ? WHERE id_pedido = ?`,
        [id_consumidor, id_productor, total, estado, direccion_entrega, id_ciudad_entrega || null, metodo_pago, estado_pago || 'pendiente', notas || null, fecha_entrega || null, id_pedido]
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
