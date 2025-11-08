import { conexion } from './Conexion.ts';

export interface CategoriaData {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  activa: boolean;
}

export interface CategoriaCreateData {
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  activa?: boolean;
}

export class CategoriasModel {
  public _objCategoria: CategoriaCreateData | null;

  constructor(objCategoria: CategoriaCreateData | null = null) {
    this._objCategoria = objCategoria;
  }

  // Métodos de asociación producto-categoría (many-to-many)
  /**
   * Asocia un producto con una categoría en la tabla productos_categorias
   * @param id_producto - ID del producto a asociar
   * @param id_categoria - ID de la categoría a asociar
   * @returns Promise con el resultado de la operación
   */
  public async AsociarProductoCategoria(
    id_producto: number,
    id_categoria: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar si la asociación ya existe
      const existe = await conexion.query(
        'SELECT * FROM productos_categorias WHERE id_producto = ? AND id_categoria = ?',
        [id_producto, id_categoria],
      );

      if (existe.length > 0) {
        return {
          success: false,
          message: 'El producto ya está asociado a esta categoría.',
        };
      }

      await conexion.execute(
        'INSERT INTO productos_categorias (id_producto, id_categoria) VALUES (?, ?)',
        [id_producto, id_categoria],
      );

      return {
        success: true,
        message: 'Producto asociado a la categoría exitosamente.',
      };
    } catch (error) {
      console.error('Error al asociar producto con categoría:', error);
      return {
        success: false,
        message: error instanceof Error
          ? error.message
          : 'Error al asociar producto con categoría.',
      };
    }
  }

  /**
   * Desasocia un producto de una categoría en la tabla productos_categorias
   * @param id_producto - ID del producto a desasociar
   * @param id_categoria - ID de la categoría a desasociar
   * @returns Promise con el resultado de la operación
   */
  public async DesasociarProductoCategoria(
    id_producto: number,
    id_categoria: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await conexion.execute(
        'DELETE FROM productos_categorias WHERE id_producto = ? AND id_categoria = ?',
        [id_producto, id_categoria],
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        return {
          success: true,
          message: 'Producto desasociado de la categoría exitosamente.',
        };
      } else {
        return {
          success: false,
          message:
            'No se encontró la asociación entre el producto y la categoría.',
        };
      }
    } catch (error) {
      console.error('Error al desasociar producto de categoría:', error);
      return {
        success: false,
        message: error instanceof Error
          ? error.message
          : 'Error al desasociar producto de categoría.',
      };
    }
  }

  /**
   * Obtiene todas las categorías asociadas a un producto (many-to-many)
   * @param id_producto - ID del producto
   * @returns Promise con array de categorías asociadas al producto
   */
  public async ObtenerCategoriasDeProducto(
    id_producto: number,
  ): Promise<CategoriaData[]> {
    try {
      const result = await conexion.query(
        `
        SELECT c.* 
        FROM categorias c
        INNER JOIN productos_categorias pc ON c.id_categoria = pc.id_categoria
        WHERE pc.id_producto = ? AND c.activa = 1
        ORDER BY c.nombre
      `,
        [id_producto],
      );

      return result as CategoriaData[];
    } catch (error) {
      console.error('Error al obtener categorías del producto:', error);
      return [];
    }
  }

  // 📌 Listar todas las categorías
  public async ListarCategorias(): Promise<CategoriaData[]> {
    try {
      const result = await conexion.query(
        'SELECT * FROM categorias WHERE activa = 1 ORDER BY nombre',
      );
      return result as CategoriaData[];
    } catch (error) {
      console.error('Error al listar categorías:', error);
      return [];
    }
  }

  // 📌 Listar todas las categorías (incluyendo inactivas - solo admin)
  public async ListarTodasLasCategorias(): Promise<CategoriaData[]> {
    try {
      const result = await conexion.query(
        'SELECT * FROM categorias ORDER BY nombre',
      );
      return result as CategoriaData[];
    } catch (error) {
      console.error('Error al listar todas las categorías:', error);
      return [];
    }
  }

  // 📌 Crear nueva categoría
  public async CrearCategoria(): Promise<
    { success: boolean; message: string; categoria?: CategoriaData }
  > {
    try {
      if (!this._objCategoria) {
        throw new Error(
          'No se ha proporcionado un objeto de categoría válido.',
        );
      }

      const { nombre, descripcion, imagen_url, activa } = this._objCategoria;

      if (!nombre) {
        throw new Error('El nombre de la categoría es requerido.');
      }

      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'INSERT INTO categorias (nombre, descripcion, imagen_url, activa) VALUES (?, ?, ?, ?)',
        [
          nombre,
          descripcion || null,
          imagen_url || null,
          activa !== false ? 1 : 0,
        ],
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [nuevaCategoria] = await conexion.query(
          'SELECT * FROM categorias ORDER BY id_categoria DESC LIMIT 1',
        );

        await conexion.execute('COMMIT');

        return {
          success: true,
          message: 'Categoría creada exitosamente.',
          categoria: nuevaCategoria as CategoriaData,
        };
      } else {
        throw new Error('No se pudo crear la categoría.');
      }
    } catch (error) {
      await conexion.execute('ROLLBACK');
      return {
        success: false,
        message: error instanceof Error
          ? error.message
          : 'Error interno del servidor',
      };
    }
  }

  // 📌 Actualizar categoría
  public async ActualizarCategoria(
    id_categoria: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objCategoria) {
        throw new Error(
          'No se ha proporcionado un objeto de categoría válido.',
        );
      }

      const { nombre, descripcion, imagen_url, activa } = this._objCategoria;

      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'UPDATE categorias SET nombre = ?, descripcion = ?, imagen_url = ?, activa = ? WHERE id_categoria = ?',
        [
          nombre,
          descripcion || null,
          imagen_url || null,
          activa !== false ? 1 : 0,
          id_categoria,
        ],
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute('COMMIT');
        return {
          success: true,
          message: 'Categoría actualizada correctamente.',
        };
      } else {
        await conexion.execute('ROLLBACK');
        return {
          success: false,
          message: 'No se pudo actualizar la categoría o no se encontró.',
        };
      }
    } catch (error) {
      await conexion.execute('ROLLBACK');
      return {
        success: false,
        message: error instanceof Error
          ? error.message
          : 'Error interno del servidor',
      };
    }
  }

  // 📌 Eliminar categoría
  public async EliminarCategoria(
    id_categoria: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar si hay productos asociados
      const productosAsociados = await conexion.query(
        'SELECT COUNT(*) as total FROM productos WHERE id_categoria = ?',
        [id_categoria],
      );

      if (productosAsociados[0]?.total > 0) {
        return {
          success: false,
          message:
            'No se puede eliminar la categoría porque tiene productos asociados.',
        };
      }

      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'DELETE FROM categorias WHERE id_categoria = ?',
        [id_categoria],
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute('COMMIT');
        return {
          success: true,
          message: 'Categoría eliminada correctamente.',
        };
      } else {
        await conexion.execute('ROLLBACK');
        return {
          success: false,
          message: 'No se encontró la categoría a eliminar.',
        };
      }
    } catch (error) {
      await conexion.execute('ROLLBACK');
      return {
        success: false,
        message: error instanceof Error
          ? error.message
          : 'Error interno del servidor',
      };
    }
  }

  // 📌 Obtener categoría por ID
  public async ObtenerCategoriaPorId(
    id_categoria: number,
  ): Promise<CategoriaData | null> {
    try {
      const result = await conexion.query(
        'SELECT * FROM categorias WHERE id_categoria = ?',
        [id_categoria],
      );
      return result.length > 0 ? result[0] as CategoriaData : null;
    } catch (error) {
      console.error('Error al obtener categoría por ID:', error);
      return null;
    }
  }

  // 📌 Obtener categoría de un producto
  public async ObtenerCategoriaDeProducto(
    id_producto: number,
  ): Promise<CategoriaData | null> {
    try {
      const result = await conexion.query(
        `
        SELECT c.* 
        FROM categorias c
        INNER JOIN productos p ON c.id_categoria = p.id_categoria
        WHERE p.id_producto = ? AND c.activa = 1
        LIMIT 1
      `,
        [id_producto],
      );

      return result.length > 0 ? result[0] as CategoriaData : null;
    } catch (error) {
      console.error('Error al obtener categoría del producto:', error);
      return null;
    }
  }

  // 📌 Obtener productos por categoría
  public async ObtenerProductosPorCategoria(
    id_categoria: number,
  ): Promise<any[]> {
    try {
      const result = await conexion.query(
        `
        SELECT p.*, u.nombre as nombre_productor, u.foto_perfil as foto_productor, ciu.nombre as nombre_ciudad
        FROM productos p
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        LEFT JOIN ciudades ciu ON p.id_ciudad_origen = ciu.id_ciudad
        WHERE p.id_categoria = ? AND p.disponible = 1
        ORDER BY p.nombre
      `,
        [id_categoria],
      );

      return result;
    } catch (error) {
      console.error('Error al obtener productos por categoría:', error);
      return [];
    }
  }
}
