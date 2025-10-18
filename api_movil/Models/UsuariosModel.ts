import { conexion } from "./Conexion.ts";

interface UsuarioData {
  id_usuario: number | null;
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  direccion: string;
  id_ciudad: number;
  rol: string;
  // Campos adicionales de seguridad
  intentos_login?: number;
  bloqueado_hasta?: string | null;
  activo?: boolean;
  email_verificado?: boolean;
  telefono_verificado?: boolean;
  fecha_registro?: string | null;
  ultimo_acceso?: string | null;
}

// Interfaz específica para login con todas las propiedades garantizadas
export interface UsuarioLoginData {
  id_usuario: number | null;
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  direccion: string;
  id_ciudad: number;
  rol: string;
  intentos_login: number;
  bloqueado_hasta: string | null;
  activo: boolean;
  email_verificado: boolean;
  telefono_verificado: boolean;
  fecha_registro: string | null;
  ultimo_acceso: string | null;
}

export class Usuario {
  public _objUsuario: UsuarioData | null;

  constructor(objUsuario: UsuarioData | null = null) {
    this._objUsuario = objUsuario;
  }

  // 📌 Listar todos los usuarios
  public async ListarUsuarios(): Promise<UsuarioData[]> {
    try {
      const result = await conexion.execute("SELECT * FROM usuarios");
      if (!result || !result.rows) {
        return [];
      }
      return result.rows;
    } catch (error) {
      console.error("Error al consultar los usuarios: ", error);
      throw new Error("No se pudieron obtener los usuarios.");
    }
  }

  // 📌 Insertar usuario
  public async InsertarUsuario(): Promise<{ success: boolean; message: string; usuario?: Record<string, unknown> }> {
    try {
      if (!this._objUsuario) {
        throw new Error("No se ha proporcionado un objeto valido.");
      }

      const { nombre, email, password, telefono, direccion, id_ciudad, rol } = this._objUsuario;

      if (!nombre || !email || !password || !telefono || !direccion || !id_ciudad || !rol) {
        throw new Error("Faltan campos requeridos para insertar usuario.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "INSERT INTO usuarios (nombre, email, password, telefono, direccion, id_ciudad, rol) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nombre, email, password, telefono, direccion, id_ciudad, rol]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [usuario] = await conexion.query("SELECT * FROM usuarios ORDER BY id_usuario DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Usuario insertado con exito.",
          usuario: usuario,
        };
      } else {
        throw new Error("No se pudo insertar el usuario.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Eliminar usuario
  public async EliminarUsuario(id_usuario: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM usuarios WHERE id_usuario = ?", [id_usuario]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Usuario eliminado correctamente.",
        };
      } else {
        throw new Error("No se encontro el usuario a eliminar.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Editar usuario
  public async EditarUsuario(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objUsuario || !this._objUsuario.id_usuario) {
        throw new Error("No se ha proporcionado un usuario valido con ID.");
      }

      const { id_usuario, nombre, email, password, telefono, direccion, id_ciudad, rol } = this._objUsuario;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "UPDATE usuarios SET nombre = ?, email = ?, password = ?, telefono = ?, direccion = ?, id_ciudad = ?, rol = ? WHERE id_usuario = ?",
        [nombre, email, password, telefono, direccion, id_ciudad, rol, id_usuario]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Usuario actualizado correctamente.",
        };
      } else {
        throw new Error("No se pudo actualizar el usuario o no se encontro.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Buscar usuario por email (para login)
  public async buscarPorEmail(email: string): Promise<UsuarioLoginData | null> {
    try {
      const result = await conexion.query(`
        SELECT 
          id_usuario, nombre, email, password, telefono, direccion, id_ciudad, rol,
          COALESCE(intentos_login, 0) as intentos_login,
          bloqueado_hasta,
          COALESCE(activo, 1) as activo,
          COALESCE(email_verificado, 0) as email_verificado,
          COALESCE(telefono_verificado, 0) as telefono_verificado,
          fecha_registro,
          ultimo_acceso
        FROM usuarios 
        WHERE email = ? 
        LIMIT 1
      `, [email]);
      if (result.length > 0) {
        const user = result[0] as any;
        return {
          id_usuario: user.id_usuario,
          nombre: user.nombre,
          email: user.email,
          password: user.password,
          telefono: user.telefono,
          direccion: user.direccion,
          id_ciudad: user.id_ciudad,
          rol: user.rol,
          intentos_login: user.intentos_login || 0,
          bloqueado_hasta: user.bloqueado_hasta,
          activo: user.activo !== 0,
          email_verificado: user.email_verificado !== 0,
          telefono_verificado: user.telefono_verificado !== 0,
          fecha_registro: user.fecha_registro,
          ultimo_acceso: user.ultimo_acceso
        } as UsuarioLoginData;
      }
      return null;
    } catch (error) {
      console.error("Error al buscar usuario por email: ", error);
      return null;
    }
  }

  // 📌 Filtrar usuarios por ciudad
  public async FiltrarPorCiudad(id_ciudad: number): Promise<UsuarioData[]> {
    try {
      const result = await conexion.query("SELECT * FROM usuarios WHERE id_ciudad = ?", [id_ciudad]);
      return result as UsuarioData[];
    } catch (error) {
      console.error("Error al filtrar usuarios por ciudad: ", error);
      return [];
    }
  }

  // 📌 Filtrar usuarios por departamento
  public async FiltrarPorDepartamento(id_departamento: number): Promise<UsuarioData[]> {
    try {
      const result = await conexion.query(
        `SELECT u.* 
         FROM usuarios u
         INNER JOIN ciudades c ON u.id_ciudad = c.id_ciudad
         WHERE c.id_departamento = ?`,
        [id_departamento]
      );
      return result as UsuarioData[];
    } catch (error) {
      console.error("Error al filtrar usuarios por departamento: ", error);
      return [];
    }
  }

  // 📌 Filtrar usuarios por región
  public async FiltrarPorRegion(id_region: number): Promise<UsuarioData[]> {
    try {
      const result = await conexion.query(
        `SELECT u.* 
         FROM usuarios u
         INNER JOIN ciudades c ON u.id_ciudad = c.id_ciudad
         INNER JOIN departamentos d ON c.id_departamento = d.id_departamento
         WHERE d.id_region = ?`,
        [id_region]
      );
      return result as UsuarioData[];
    } catch (error) {
      console.error("Error al filtrar usuarios por región: ", error);
      return [];
    }
  }
}
