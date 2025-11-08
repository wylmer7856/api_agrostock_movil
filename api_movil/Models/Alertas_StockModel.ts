import { conexion } from "./Conexion.ts";
import { ProductoData } from "./ProductosModel.ts";

interface AlertaData {
  id_alerta: number | null;
  id_producto: number;
  stock_actual: number;
  fecha: string;
  mensaje: string;
}

export class AlertasModel {
  public _objAlerta: AlertaData | null;

  constructor(objAlerta: AlertaData | null = null) {
    this._objAlerta = objAlerta;
  }

  public async ListarAlertas(): Promise<AlertaData[]> {
    try {
      const result = await conexion.query(`SELECT a.*, p.nombre as nombre_producto FROM alertas_stock a LEFT JOIN productos p ON a.id_producto = p.id_producto ORDER BY a.fecha DESC`);
      return result as AlertaData[];
    } catch (error) {
      console.error("Error al listar alertas:", error);
      throw new Error("Error al listar alertas.");
    }
  }

  public async ListarAlertasActivas(): Promise<AlertaData[]> {
    try {

      const result = await conexion.query(`SELECT a.*, p.nombre as nombre_producto FROM alertas_stock a LEFT JOIN productos p ON a.id_producto = p.id_producto WHERE DATE(a.fecha) >= DATE(NOW() - INTERVAL 7 DAY) ORDER BY a.fecha DESC`);
      return result as AlertaData[];
    } catch (error) {
      console.error("Error al listar alertas activas:", error);
      throw new Error("Error al listar alertas activas.");
    }
  }

  private async CrearAlerta(producto: ProductoData): Promise<void> {
    try {
      let mensaje = '';

      if (producto.stock === 0) {
        mensaje = `¡URGENTE! El producto "${producto.nombre}" esta sin stock.`;
      } else if (producto.stock <= Math.floor((producto.stock_minimo || 0) * 0.5)) {
        mensaje = `¡CRiTICO! El producto "${producto.nombre}" tiene stock critico (${producto.stock} unidades).`;
      } else if (producto.stock <= (producto.stock_minimo || 0)) {
        mensaje = `¡ATENCIoN! El producto "${producto.nombre}" tiene stock bajo (${producto.stock} unidades).`;
      } else {
        return;
      }

      const fecha = new Date().toISOString().split('T')[0];

      await conexion.execute(`INSERT INTO alertas_stock (id_producto, stock_actual, fecha, mensaje) VALUES (?, ?, ?, ?)`, 
        [
        producto.id_producto,
        producto.stock,
        fecha,
        mensaje
      ]);

    } catch (error) {
      console.error(`Error al crear alerta para producto ${producto.id_producto}:`, error);
    }
  }

  private async ExisteAlertaReciente(idProducto: number): Promise<boolean> {
    try {

      const result = await conexion.query(`SELECT COUNT(*) as count FROM alertas_stock WHERE id_producto = ? AND DATE(fecha) = CURDATE()`, 
        [idProducto]
      );

      return result[0].count > 0;
    } catch (error) {
      console.error("Error al verificar alerta existente:", error);
      return false;
    }
  }

  public async GenerarAlertasAutomaticas(): Promise<{ alertasCreadas: number; mensaje: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const productos = await conexion.query(`SELECT id_producto, nombre, stock, stock_minimo FROM productos WHERE stock <= stock_minimo OR stock = 0`) as ProductoData[];

      let alertasCreadas = 0;

      for (const producto of productos) {

        const existeAlertaReciente = await this.ExisteAlertaReciente(producto.id_producto);
        
        if (!existeAlertaReciente) {
          await this.CrearAlerta(producto);
          alertasCreadas++;
        }
      }

      await conexion.execute("COMMIT");

      return {
        alertasCreadas,
        mensaje: alertasCreadas > 0 ? `Se crearon ${alertasCreadas} nuevas alertas de stock.` : "No se encontraron productos que requieran alertas nuevas."
      };

    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al generar alertas automaticas:", error);
      throw new Error("Error al generar alertas automaticas.");
    }
  }

  public async MarcarAlertaComoResuelta(id_alerta: number): Promise<{ success: boolean; message: string }> {
    try {

      const result = await conexion.execute("UPDATE alertas_stock SET mensaje = CONCAT('[RESUELTA] ', mensaje) WHERE id_alerta = ? AND mensaje NOT LIKE '[RESUELTA]%'",
        [id_alerta]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        return {
          success: true,
          message: "Alerta marcada como resuelta.",
        };
      } else {
        return {
          success: false,
          message: "No se encontro la alerta o ya estaba resuelta.",
        };
      }
    } catch (error) {
      console.error("Error al marcar alerta como resuelta:", error);
      return {
        success: false,
        message: "Error al marcar la alerta como resuelta.",
      };
    }
  }

  public async EliminarAlerta(id_alerta: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM alertas_stock WHERE id_alerta = ?", [id_alerta]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Alerta eliminada exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo eliminar la alerta.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al eliminar alerta:", error);
      return {
        success: false,
        message: "Error al eliminar la alerta.",
      };
    }
  }
}