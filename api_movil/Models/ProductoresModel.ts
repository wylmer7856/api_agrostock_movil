import { conexion } from "./Conexion.ts";

export interface ProductorData {
  id_productor?: number | null;
  id_usuario: number;
  nombre_finca?: string | null;
  tipo_productor?: 'agricultor' | 'ganadero' | 'apicultor' | 'piscicultor' | 'avicultor' | 'mixto' | 'otro';
  id_departamento?: number | null;
  id_ciudad?: number | null;
  vereda?: string | null;
  direccion_finca?: string | null;
  numero_registro_ica?: string | null;
  certificaciones?: string | null;
  descripcion_actividad?: string | null;
  anos_experiencia?: number | null;
  hectareas?: number | null;
  metodo_produccion?: 'tradicional' | 'organico' | 'convencional' | 'mixto';
  redes_sociales?: any | null;
  sitio_web?: string | null;
  foto_perfil_finca?: string | null;
  activo?: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface ProductorCompleto extends ProductorData {
  nombre?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad_nombre?: string;
  departamento_nombre?: string;
  region_nombre?: string;
  total_productos_activos?: number;
  total_pedidos_recibidos?: number;
}

export class ProductoresModel {
  public _objProductor: ProductorData | null;

  constructor(objProductor: ProductorData | null = null) {
    this._objProductor = objProductor;
  }

  // 📌 Obtener productor por ID de usuario
  public async ObtenerPorUsuario(id_usuario: number): Promise<ProductorCompleto | null> {
    try {
      const result = await conexion.query(`
        SELECT * FROM vista_productores_completa 
        WHERE id_usuario = ?
      `, [id_usuario]);

      if (result.length > 0) {
        return result[0] as ProductorCompleto;
      }
      return null;
    } catch (error) {
      console.error("Error al obtener productor por usuario:", error);
      throw new Error("Error al obtener información del productor.");
    }
  }

  // 📌 Obtener productor por ID
  public async ObtenerPorId(id_productor: number): Promise<ProductorData | null> {
    try {
      const result = await conexion.query(`
        SELECT * FROM productores 
        WHERE id_productor = ?
      `, [id_productor]);

      if (result.length > 0) {
        return result[0] as ProductorData;
      }
      return null;
    } catch (error) {
      console.error("Error al obtener productor por ID:", error);
      throw new Error("Error al obtener productor.");
    }
  }

  // 📌 Listar todos los productores
  public async ListarProductores(): Promise<ProductorCompleto[]> {
    try {
      const result = await conexion.query(`
        SELECT * FROM vista_productores_completa 
        WHERE activo = 1
        ORDER BY nombre_finca ASC
      `);
      return result as ProductorCompleto[];
    } catch (error) {
      console.error("Error al listar productores:", error);
      throw new Error("Error al listar productores.");
    }
  }

  // 📌 Buscar productores por criterios
  public async BuscarProductores(criterios: {
    tipo_productor?: string;
    departamento?: number;
    ciudad?: number;
    nombre_finca?: string;
    certificaciones?: string;
  }): Promise<ProductorCompleto[]> {
    try {
      let query = `
        SELECT * FROM vista_productores_completa 
        WHERE activo = 1
      `;
      const params: any[] = [];

      if (criterios.tipo_productor) {
        query += " AND tipo_productor = ?";
        params.push(criterios.tipo_productor);
      }

      if (criterios.departamento) {
        query += " AND id_departamento = ?";
        params.push(criterios.departamento);
      }

      if (criterios.ciudad) {
        query += " AND id_ciudad = ?";
        params.push(criterios.ciudad);
      }

      if (criterios.nombre_finca) {
        query += " AND nombre_finca LIKE ?";
        params.push(`%${criterios.nombre_finca}%`);
      }

      if (criterios.certificaciones) {
        query += " AND certificaciones LIKE ?";
        params.push(`%${criterios.certificaciones}%`);
      }

      query += " ORDER BY nombre_finca ASC";

      const result = await conexion.query(query, params);
      return result as ProductorCompleto[];
    } catch (error) {
      console.error("Error al buscar productores:", error);
      throw new Error("Error al buscar productores.");
    }
  }

  // 📌 Crear o actualizar perfil de productor
  public async GuardarProductor(): Promise<{ success: boolean; message: string; productor?: ProductorData }> {
    try {
      if (!this._objProductor) {
        throw new Error("No se ha proporcionado un objeto de productor válido.");
      }

      const { id_usuario } = this._objProductor;

      if (!id_usuario) {
        throw new Error("El ID de usuario es requerido.");
      }

      // Verificar si el usuario es productor
      const usuario = await conexion.query(`
        SELECT rol FROM usuarios WHERE id_usuario = ?
      `, [id_usuario]);

      if (usuario.length === 0 || usuario[0].rol !== 'productor') {
        throw new Error("El usuario debe tener rol de productor.");
      }

      await conexion.execute("START TRANSACTION");

      // Verificar si ya existe un perfil de productor
      const existe = await conexion.query(`
        SELECT id_productor FROM productores WHERE id_usuario = ?
      `, [id_usuario]);

      if (existe.length > 0) {
        // Actualizar
        const { id_productor, ...datosActualizacion } = this._objProductor;
        const campos = Object.keys(datosActualizacion).filter(key => datosActualizacion[key as keyof typeof datosActualizacion] !== undefined);
        
        if (campos.length === 0) {
          await conexion.execute("ROLLBACK");
          return {
            success: false,
            message: "No hay campos para actualizar."
          };
        }

        const setClause = campos.map(campo => `${campo} = ?`).join(", ");
        const valores = campos.map(campo => datosActualizacion[campo as keyof typeof datosActualizacion]);

        await conexion.execute(`
          UPDATE productores 
          SET ${setClause}
          WHERE id_usuario = ?
        `, [...valores, id_usuario]);

        await conexion.execute("COMMIT");

        const productorActualizado = await this.ObtenerPorUsuario(id_usuario);
        return {
          success: true,
          message: "Perfil de productor actualizado exitosamente.",
          productor: productorActualizado as any
        };
      } else {
        // Crear nuevo
        const {
          nombre_finca,
          tipo_productor,
          id_departamento,
          id_ciudad,
          vereda,
          direccion_finca,
          numero_registro_ica,
          certificaciones,
          descripcion_actividad,
          anos_experiencia,
          hectareas,
          metodo_produccion,
          redes_sociales,
          sitio_web,
          foto_perfil_finca
        } = this._objProductor;

        const result = await conexion.execute(`
          INSERT INTO productores (
            id_usuario, nombre_finca, tipo_productor, id_departamento, id_ciudad,
            vereda, direccion_finca, numero_registro_ica, certificaciones,
            descripcion_actividad, anos_experiencia, hectareas, metodo_produccion,
            redes_sociales, sitio_web, foto_perfil_finca
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id_usuario, nombre_finca || null, tipo_productor || 'agricultor',
          id_departamento || null, id_ciudad || null, vereda || null,
          direccion_finca || null, numero_registro_ica || null,
          certificaciones || null, descripcion_actividad || null,
          anos_experiencia || null, hectareas || null,
          metodo_produccion || 'tradicional',
          redes_sociales ? JSON.stringify(redes_sociales) : null,
          sitio_web || null, foto_perfil_finca || null
        ]);

        if (result && result.affectedRows && result.affectedRows > 0) {
          await conexion.execute("COMMIT");
          const nuevoProductor = await this.ObtenerPorUsuario(id_usuario);
          return {
            success: true,
            message: "Perfil de productor creado exitosamente.",
            productor: nuevoProductor as any
          };
        } else {
          await conexion.execute("ROLLBACK");
          return {
            success: false,
            message: "No se pudo crear el perfil de productor."
          };
        }
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al guardar productor:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error al guardar perfil de productor."
      };
    }
  }

  // 📌 Eliminar perfil de productor (soft delete)
  public async EliminarProductor(id_usuario: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(`
        UPDATE productores 
        SET activo = 0 
        WHERE id_usuario = ?
      `, [id_usuario]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Perfil de productor desactivado exitosamente."
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se encontró el perfil de productor."
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al eliminar productor:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error al eliminar perfil de productor."
      };
    }
  }
}

