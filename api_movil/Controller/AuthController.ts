import {
  Context,
  create,
  getNumericDate,
  load,
} from "../Dependencies/dependencias.ts";
import type { Header, Payload } from "../Dependencies/dependencias.ts";
import { Usuario } from "../Models/UsuariosModel.ts";
import { securityService } from "../Services/SecurityService.ts";
import { emailService } from "../Services/EmailService.ts";
import { conexion } from "../Models/Conexion.ts";


// Configuración JWT mejorada
let secret: string;
let key: CryptoKey;

async function initializeJWT() {
  const env = await load();
  secret = (env as Record<string, string>).JWT_SECRET || "mi_clave_secreta_super_segura_2024";
  
  key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// Inicializar JWT
await initializeJWT();

export class AuthController {
  /**
   * Login mejorado con validaciones de seguridad
   */
  static async login(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { email, password } = body;

      // Validaciones básicas
      if (!email || !password) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos requeridos",
          message: "Email y contraseña son requeridos"
        };
        return;
      }

      // Validar formato de email
      if (!securityService.validateEmail(email)) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Email inválido",
          message: "El formato del email no es válido"
        };
        return;
      }

      const userInstance = new Usuario();
      const usuario = await userInstance.buscarPorEmail(email);

      if (!usuario) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "Credenciales inválidas",
          message: "Email o contraseña incorrectos"
        };
        return;
      }

      // Verificación de bloqueo removida - la base de datos simplificada no tiene esta columna

      // Verificar si el usuario está activo
      if (usuario.activo === false) {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          error: "Cuenta inactiva",
          message: "Tu cuenta ha sido desactivada. Contacta al administrador."
        };
        return;
      }

      // Verificar contraseña
      const passwordValid = await securityService.verifyPassword(password, usuario.password);
      
      if (!passwordValid) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "Credenciales inválidas",
          message: "Email o contraseña incorrectos"
        };
        return;
      }

      // Login exitoso - actualizar último acceso
      await conexion.execute(
        "UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?",
        [usuario.id_usuario]
      );

      // Crear sesión (simplificado - sin tabla de sesiones)
      const sessionId = securityService.generateSessionId();

      // Crear JWT con información adicional
      const payload: Payload = {
        id: usuario.id_usuario!,
        rol: usuario.rol,
        email: usuario.email,
        session_id: sessionId,
        exp: getNumericDate(24 * 60 * 60), // expira en 24 horas
        iat: getNumericDate(0), // issued at
      };

      const header: Header = { alg: "HS256", typ: "JWT" };
      const jwt = await create(header, payload, key);

      // Notificación de login exitoso (simplificado - sin tabla de notificaciones)

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Login exitoso",
        token: jwt,
        usuario: {
          id_usuario: usuario.id_usuario,
          id: usuario.id_usuario, // Compatibilidad
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          telefono: usuario.telefono || null,
          direccion: usuario.direccion || null,
          id_ciudad: usuario.id_ciudad || null,
          activo: usuario.activo !== undefined ? usuario.activo : true,
          email_verificado: usuario.email_verificado || false,
          foto_perfil: usuario.foto_perfil || null,
          fecha_registro: usuario.fecha_registro || null,
          ultimo_acceso: usuario.ultimo_acceso || null
        },
        session_id: sessionId,
        expires_in: 24 * 60 * 60 // 24 horas en segundos
      };
    } catch (error) {
      console.error("Error en login:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo."
      };
    }
  }

  /**
   * Registro de nuevos usuarios
   */
  static async register(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { nombre, email, password, telefono, direccion, id_ciudad, rol = 'consumidor' } = body;

      // Validaciones básicas
      if (!nombre || !email || !password || !telefono || !direccion || !id_ciudad) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos requeridos",
          message: "Todos los campos son obligatorios"
        };
        return;
      }

      // Validar formato de email
      if (!securityService.validateEmail(email)) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Email inválido",
          message: "El formato del email no es válido"
        };
        return;
      }

      // Validar formato de teléfono
      if (!securityService.validatePhone(telefono)) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Teléfono inválido",
          message: "El formato del teléfono no es válido"
        };
        return;
      }

      // Validar fortaleza de contraseña
      const passwordValidation = securityService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Contraseña débil",
          message: "La contraseña no cumple con los requisitos de seguridad",
          feedback: passwordValidation.feedback,
          score: passwordValidation.score
        };
        return;
      }

      // Verificar si el email ya existe
      const userInstance = new Usuario();
      const existingUser = await userInstance.buscarPorEmail(email);
      if (existingUser) {
        ctx.response.status = 409;
        ctx.response.body = {
          success: false,
          error: "Email ya registrado",
          message: "Ya existe una cuenta con este email"
        };
        return;
      }

      // Hash de la contraseña
      const hashedPassword = await securityService.hashPassword(password);

      // Crear usuario
      const newUser = new Usuario({
        id_usuario: null,
        nombre: securityService.sanitizeInput(nombre),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        telefono: telefono,
        direccion: securityService.sanitizeInput(direccion),
        id_ciudad: id_ciudad,
        rol: rol,
        activo: true,
        email_verificado: false
      });

      const result = await newUser.InsertarUsuario();

      if (!result.success) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al crear usuario",
          message: result.message
        };
        return;
      }

      // Email de bienvenida (opcional - puede fallar si no está configurado)
      try {
        await emailService.sendWelcomeEmail(email, nombre, rol);
      } catch (error) {
        console.warn('No se pudo enviar email de bienvenida:', error);
      }

      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        message: "Usuario registrado exitosamente",
        usuario: {
          id_usuario: result.usuario!.id_usuario,
          id: result.usuario!.id_usuario,
          nombre: result.usuario!.nombre,
          email: result.usuario!.email,
          rol: result.usuario!.rol,
          email_verificado: false
        }
      };
    } catch (error) {
      console.error("Error en registro:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo."
      };
    }
  }

  /**
   * Logout
   */
  static logout(ctx: Context) {
    try {
      // Logout simplificado - solo limpiar token del cliente
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Sesión cerrada correctamente"
      };
    } catch (error) {
      console.error("Error en logout:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al cerrar sesión"
      };
    }
  }

  /**
   * Verificar token JWT
   */
  static verifyToken(ctx: Context) {
    try {
      const user = ctx.state.user;
      
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "Token inválido",
          message: "El token proporcionado no es válido"
        };
        return;
      }

      // Verificación simplificada - solo verificar que el token es válido
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Token válido",
        usuario: {
          id: user.id,
          rol: user.rol,
          email: user.email
        }
      };
    } catch (error) {
      console.error("Error al verificar token:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al verificar token"
      };
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(ctx: Context) {
    try {
      const user = ctx.state.user;
      const body = await ctx.request.body.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos requeridos",
          message: "Contraseña actual y nueva contraseña son requeridas"
        };
        return;
      }

      // Validar fortaleza de nueva contraseña
      const passwordValidation = securityService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Contraseña débil",
          message: "La nueva contraseña no cumple con los requisitos de seguridad",
          feedback: passwordValidation.feedback
        };
        return;
      }

      // Obtener usuario actual
      const userInstance = new Usuario();
      const usuario = await userInstance.buscarPorEmail(user.email);

      if (!usuario) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          error: "Usuario no encontrado",
          message: "El usuario no existe"
        };
        return;
      }

      // Verificar contraseña actual
      const currentPasswordValid = await securityService.verifyPassword(currentPassword, usuario.password);
      if (!currentPasswordValid) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Contraseña actual incorrecta",
          message: "La contraseña actual no es correcta"
        };
        return;
      }

      // Hash de nueva contraseña
      const hashedNewPassword = await securityService.hashPassword(newPassword);

      // Actualizar contraseña
      await conexion.execute(
        "UPDATE usuarios SET password = ? WHERE id_usuario = ?",
        [hashedNewPassword, user.id]
      );

      // Notificación de cambio de contraseña (simplificado)

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Contraseña actualizada correctamente"
      };
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al cambiar contraseña"
      };
    }
  }
}