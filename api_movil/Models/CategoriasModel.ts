import { conexion } from "./Conexion.ts";

export interface CategoriaData {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
}

export interface CategoriaCreateData {
  nombre: string;
  descripcion?: string;
  activa?: boolean;
}

export class CategoriasModel {
  public _objCategoria: CategoriaCreateData | null;

  constructor(objCategoria: CategoriaCreateData | null = null) {
    this._objCategoria = objCategoria;
  }

  // 📌 Listar todas las categorías
  public async ListarCategorias(): Promise<CategoriaData[]> {
    try {
      const result = await conexion.query("SELECT * FROM categorias WHERE activa = 1 ORDER BY nombre");
      return result as CategoriaData[];
    } catch (error) {
      console.error("Error al listar categorías:", error);
      return [];
    }
  }

  // 📌 Listar todas las categorías (incluyendo inactivas - solo admin)
  public async ListarTodasLasCategorias(): Promise<CategoriaData[]> {
    try {
      const result = await conexion.query("SELECT * FROM categorias ORDER BY nombre");
      return result as CategoriaData[];
    } catch (error) {
      console.error("Error al listar todas las categorías:", error);
      return [];
    }
  }

  // 📌 Crear nueva categoría
  public async CrearCategoria(): Promise<{ success: boolean; message: string; categoria?: CategoriaData }> {
    try {
      if (!this._objCategoria) {
        throw new Error("No se ha proporcionado un objeto de categoría válido.");
      }

      const { nombre, descripcion, activa } = this._objCategoria;

      if (!nombre) {
        throw new Error("El nombre de la categoría es requerido.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "INSERT INTO categorias (nombre, descripcion, activa) VALUES (?, ?, ?)",
        [nombre, descripcion || null, activa !== false ? 1 : 0]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [nuevaCategoria] = await conexion.query("SELECT * FROM categorias ORDER BY id_categoria DESC LIMIT 1");
        
        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Categoría creada exitosamente.",
          categoria: nuevaCategoria as CategoriaData,
        };
      } else {
        throw new Error("No se pudo crear la categoría.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Actualizar categoría
  public async ActualizarCategoria(id_categoria: number): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objCategoria) {
        throw new Error("No se ha proporcionado un objeto de categoría válido.");
      }

      const { nombre, descripcion, activa } = this._objCategoria;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "UPDATE categorias SET nombre = ?, descripcion = ?, activa = ? WHERE id_categoria = ?",
        [nombre, descripcion || null, activa !== false ? 1 : 0, id_categoria]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Categoría actualizada correctamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo actualizar la categoría o no se encontró.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Eliminar categoría
  public async EliminarCategoria(id_categoria: number): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar si hay productos asociados
      const productosAsociados = await conexion.query(
        "SELECT COUNT(*) as total FROM productos_categorias WHERE id_categoria = ?",
        [id_categoria]
      );

      if (productosAsociados[0]?.total > 0) {
        return {
          success: false,
          message: "No se puede eliminar la categoría porque tiene productos asociados.",
        };
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "DELETE FROM categorias WHERE id_categoria = ?",
        [id_categoria]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Categoría eliminada correctamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se encontró la categoría a eliminar.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Obtener categoría por ID
  public async ObtenerCategoriaPorId(id_categoria: number): Promise<CategoriaData | null> {
    try {
      const result = await conexion.query("SELECT * FROM categorias WHERE id_categoria = ?", [id_categoria]);
      return result.length > 0 ? result[0] as CategoriaData : null;
    } catch (error) {
      console.error("Error al obtener categoría por ID:", error);
      return null;
    }
  }

  // 📌 Asociar producto con categoría
  public async AsociarProductoCategoria(id_producto: number, id_categoria: number): Promise<{ success: boolean; message: string }> {
    try {
      const result = await conexion.execute(
        "INSERT INTO productos_categorias (id_producto, id_categoria) VALUES (?, ?)",
        [id_producto, id_categoria]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        return {
          success: true,
          message: "Producto asociado con la categoría correctamente.",
        };
      } else {
        return {
          success: false,
          message: "No se pudo asociar el producto con la categoría.",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Desasociar producto de categoría
  public async DesasociarProductoCategoria(id_producto: number, id_categoria: number): Promise<{ success: boolean; message: string }> {
    try {
      const result = await conexion.execute(
        "DELETE FROM productos_categorias WHERE id_producto = ? AND id_categoria = ?",
        [id_producto, id_categoria]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        return {
          success: true,
          message: "Producto desasociado de la categoría correctamente.",
        };
      } else {
        return {
          success: false,
          message: "No se encontró la asociación a eliminar.",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Obtener categorías de un producto
  public async ObtenerCategoriasDeProducto(id_producto: number): Promise<CategoriaData[]> {
    try {
      const result = await conexion.query(`
        SELECT c.* 
        FROM categorias c
        INNER JOIN productos_categorias pc ON c.id_categoria = pc.id_categoria
        WHERE pc.id_producto = ? AND c.activa = 1
        ORDER BY c.nombre
      `, [id_producto]);
      
      return result as CategoriaData[];
    } catch (error) {
      console.error("Error al obtener categorías del producto:", error);
      return [];
    }
  }

  // 📌 Obtener productos por categoría
  public async ObtenerProductosPorCategoria(id_categoria: number): Promise<any[]> {
    try {
      const result = await conexion.query(`
        SELECT p.*, u.nombre as nombre_productor, c.nombre as nombre_ciudad
        FROM productos p
        INNER JOIN productos_categorias pc ON p.id_producto = pc.id_producto
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        INNER JOIN ciudades c ON p.id_ciudad_origen = c.id_ciudad
        WHERE pc.id_categoria = ?
        ORDER BY p.nombre
      `, [id_categoria]);
      
      return result;
    } catch (error) {
      console.error("Error al obtener productos por categoría:", error);
      return [];
    }
  }
}
