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
import { notificationService } from "../Services/NotificationService.ts";
import { conexion } from "../Models/Conexion.ts";


// Configuración JWT mejorada
let secret: string;
let key: CryptoKey;

async function initializeJWT() {
  const env = await load();
  secret = (env as any).JWT_SECRET || "mi_clave_secreta_super_segura_2024";
  
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
      const usuario: any = await userInstance.buscarPorEmail(email);

      if (!usuario) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "Credenciales inválidas",
          message: "Email o contraseña incorrectos"
        };
        return;
      }

      // Verificar si el usuario está bloqueado
      if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
        ctx.response.status = 423;
        ctx.response.body = {
          success: false,
          error: "Cuenta bloqueada",
          message: `Tu cuenta está bloqueada hasta ${new Date(usuario.bloqueado_hasta).toLocaleString()}`,
          bloqueado_hasta: usuario.bloqueado_hasta
        };
        return;
      }

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
        // Incrementar intentos de login
        await conexion.execute(
          "UPDATE usuarios SET intentos_login = intentos_login + 1 WHERE id_usuario = ?",
          [usuario.id_usuario]
        );

        const maxIntentos = 5; // Configurable
        const intentosActuales = (usuario.intentos_login || 0) + 1;

        if (intentosActuales >= maxIntentos) {
          // Bloquear cuenta por 30 minutos
          const bloqueadoHasta = new Date();
          bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + 30);
          
          await conexion.execute(
            "UPDATE usuarios SET bloqueado_hasta = ? WHERE id_usuario = ?",
            [bloqueadoHasta, usuario.id_usuario]
          );

          ctx.response.status = 423;
          ctx.response.body = {
            success: false,
            error: "Cuenta bloqueada",
            message: `Demasiados intentos fallidos. Tu cuenta está bloqueada por 30 minutos.`,
            bloqueado_hasta: bloqueadoHasta,
            intentos_restantes: 0
          };
          return;
        }

        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "Credenciales inválidas",
          message: "Email o contraseña incorrectos",
          intentos_restantes: maxIntentos - intentosActuales
        };
        return;
      }

      // Login exitoso - resetear intentos y actualizar último acceso
      await conexion.execute(
        "UPDATE usuarios SET intentos_login = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW() WHERE id_usuario = ?",
        [usuario.id_usuario]
      );

      // Crear sesión
      const sessionId = securityService.generateSessionId();
      const ipAddress = ctx.request.ip || 'unknown';
      const userAgent = ctx.request.headers.get('user-agent') || '';

      await conexion.execute(
        `INSERT INTO sesiones_usuario (id_usuario, session_id, ip_address, user_agent, fecha_inicio, fecha_ultima_actividad)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [usuario.id_usuario, sessionId, ipAddress, userAgent]
      );

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

      // Crear notificación de login exitoso
      await notificationService.createNotification({
        id_usuario: usuario.id_usuario!,
        titulo: "🔐 Inicio de sesión exitoso",
        mensaje: `Has iniciado sesión desde ${ipAddress}`,
        tipo: 'success',
        datos_extra: {
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: sessionId
        }
      });

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Login exitoso",
        token: jwt,
        usuario: {
          id: usuario.id_usuario,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          email_verificado: usuario.email_verificado,
          telefono_verificado: usuario.telefono_verificado,
          fecha_registro: usuario.fecha_registro,
          ultimo_acceso: usuario.ultimo_acceso
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
        rol: rol
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

      // Generar token de verificación de email
      const verificationToken = await securityService.generateEmailVerificationHash(email);
      await conexion.execute(
        `INSERT INTO tokens_verificacion (id_usuario, token, tipo, expiracion)
         VALUES (?, ?, 'email', DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
        [result.usuario!.id_usuario, verificationToken]
      );

      // Enviar email de bienvenida
      await emailService.sendWelcomeEmail(email, nombre, rol);

      // Crear notificación de bienvenida
      await notificationService.createNotification({
        id_usuario: Number(result.usuario!.id_usuario),
        titulo: "🎉 ¡Bienvenido a AgroStock!",
        mensaje: "Tu cuenta ha sido creada exitosamente. ¡Explora todos los productos frescos disponibles!",
        tipo: 'success',
        datos_extra: {
          action: 'explore_products'
        }
      });

      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        message: "Usuario registrado exitosamente",
        usuario: {
          id: result.usuario!.id_usuario,
          nombre: result.usuario!.nombre,
          email: result.usuario!.email,
          rol: result.usuario!.rol,
          email_verificado: false,
          telefono_verificado: false
        },
        verification_required: true,
        message_email: "Se ha enviado un email de verificación a tu correo electrónico"
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
  static async logout(ctx: Context) {
    try {
      const user = ctx.state.user;
      const sessionId = user?.session_id;

      if (sessionId) {
        // Invalidar sesión
        await conexion.execute(
          "UPDATE sesiones_usuario SET activa = 0 WHERE session_id = ?",
          [sessionId]
        );
      }

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
  static async verifyToken(ctx: Context) {
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

      // Verificar que la sesión sigue activa
      const session = await conexion.query(
        "SELECT * FROM sesiones_usuario WHERE session_id = ? AND activa = 1",
        [user.session_id]
      );

      if (session.length === 0) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "Sesión expirada",
          message: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
        };
        return;
      }

      // Actualizar última actividad
      await conexion.execute(
        "UPDATE sesiones_usuario SET fecha_ultima_actividad = NOW() WHERE session_id = ?",
        [user.session_id]
      );

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Token válido",
        usuario: {
          id: user.id,
          rol: user.rol,
          email: user.email,
          session_id: user.session_id
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
      const usuario: any = await userInstance.buscarPorEmail(user.email);

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

      // Crear notificación
      await notificationService.createNotification({
        id_usuario: user.id,
        titulo: "🔐 Contraseña actualizada",
        mensaje: "Tu contraseña ha sido actualizada exitosamente",
        tipo: 'success'
      });

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