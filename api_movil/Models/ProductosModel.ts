import { conexion } from "./Conexion.ts";

interface ProductoData {
    id_producto: number | null;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    id_usuario: number;
    id_ciudad_origen: number;
}

export class ProductosModel {
    public _objProducto: ProductoData | null;

    constructor(objProducto: ProductoData | null = null) {
        this._objProducto = objProducto;
    }

    public async ListarProductos(): Promise<ProductoData[]> {
    try {
      const result = await conexion.query("SELECT * FROM productos");
      return result as ProductoData[];
    } catch (error) {
      console.error("Error al listar productos:", error);
      throw new Error("Error al listar productos.");
    }
  }

    public async AgregarProducto(): Promise<{ success: boolean; message: string; producto?: ProductoData }> {
        try {
            if (!this._objProducto) {
                throw new Error("No se proporcionó un objeto de producto.");
            }

            const { nombre, descripcion, precio, stock, id_usuario, id_ciudad_origen } = this._objProducto;

            if (!nombre || !descripcion || precio === undefined || stock === undefined || !id_usuario || !id_ciudad_origen) {
                throw new Error("Faltan campos obligatorios para agregar el producto.");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute("INSERT INTO productos (nombre, descripcion, precio, stock, id_usuario, id_ciudad_origen) VALUES (?, ?, ?, ?, ?, ?)",
                [nombre, descripcion, precio, stock, id_usuario, id_ciudad_origen]
            );

            if (result && result.affectedRows && result.affectedRows > 0) {
                const queryResult = await conexion.query("SELECT * FROM productos ORDER BY id_producto DESC LIMIT 1");

                await conexion.execute("COMMIT");

                return {
                    success: true,
                    message: "Producto agregado exitosamente.",
                    producto: queryResult?.rows?.[0] as ProductoData
                };
            } else {
                await conexion.execute("ROLLBACK");
                return { success: false, message: "No se pudo agregar el producto." };
            }
        } catch (error) {
            await conexion.execute("ROLLBACK");
            console.error("Error al agregar producto:", error);
            return { success: false, message: "Error al agregar producto." };
        }
    }

    public async EditarProducto(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objProducto || !this._objProducto.id_producto) {
        throw new Error("No se proporcionó un objeto de producto válido.");
      }

      const {id_producto, nombre, descripcion, precio, stock, id_usuario, id_ciudad_origen} = this._objProducto;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, id_usuario = ?, id_ciudad_origen = ? WHERE id_producto = ?",
        [nombre, descripcion, precio, stock, id_usuario, id_ciudad_origen, id_producto]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Producto editado exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo editar el producto.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al editar producto:", error);
      return {
        success: false,
        message: "Error al editar el producto.",
      };
    }
  }

    public async EliminarProducto(id_producto: number): Promise<{ success: boolean; message: string }> {
        try {
            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute("DELETE FROM productos WHERE id_producto = ?", [id_producto]);

            if(result && result.affectedRows && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                return{
                    success: true,
                    message: "Producto eliminado exitosamente."
                };
            } else {
                throw new Error("No se pudo eliminar el producto.");
            }
        } catch (error) {
            await conexion.execute("ROLLBACK");
            return{
                success: false,
                message: error instanceof Error ? error.message : "Error al eliminar el producto."
            };
        }        
    }
}