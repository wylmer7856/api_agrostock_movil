// 🔐 CONTROLADOR DE RECUPERACIÓN DE CONTRASEÑA

import { Context } from "../Dependencies/dependencias.ts";
import { PasswordRecoveryService } from "../Services/PasswordRecoveryService.ts";

export class PasswordRecoveryController {
  
  /**
   * Solicitar recuperación de contraseña por email
   */
  static async solicitarRecuperacionEmail(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { email } = body;

      if (!email) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Email requerido",
          message: "Debes proporcionar un email"
        };
        return;
      }

      const result = await PasswordRecoveryService.generateRecoveryToken(email, 'email');

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error en solicitar recuperación:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al procesar solicitud de recuperación"
      };
    }
  }

  /**
   * Solicitar recuperación de contraseña por SMS
   */
  static async solicitarRecuperacionSMS(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { email } = body;

      if (!email) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Email requerido",
          message: "Debes proporcionar un email"
        };
        return;
      }

      const result = await PasswordRecoveryService.generateRecoveryToken(email, 'sms');

      // En producción, no devolver el código SMS
      if (result.success && result.codigo_sms) {
        delete result.codigo_sms;
      }

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error en solicitar recuperación SMS:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al procesar solicitud de recuperación"
      };
    }
  }

  /**
   * Validar token de recuperación
   */
  static async validarToken(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { token } = body;

      if (!token) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          valid: false,
          message: "Token requerido"
        };
        return;
      }

      const result = await PasswordRecoveryService.validateRecoveryToken(token);

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error validando token:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        valid: false,
        message: "Error al validar token"
      };
    }
  }

  /**
   * Validar código SMS
   */
  static async validarCodigoSMS(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { email, codigo } = body;

      if (!email || !codigo) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          valid: false,
          message: "Email y código son requeridos"
        };
        return;
      }

      const result = await PasswordRecoveryService.validateSMSCode(email, codigo);

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error validando código SMS:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        valid: false,
        message: "Error al validar código"
      };
    }
  }

  /**
   * Restablecer contraseña con token
   */
  static async restablecerConToken(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { token, newPassword } = body;

      if (!token || !newPassword) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Token y nueva contraseña son requeridos"
        };
        return;
      }

      const result = await PasswordRecoveryService.resetPasswordWithToken(token, newPassword);

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error restableciendo contraseña:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Error al restablecer contraseña"
      };
    }
  }

  /**
   * Restablecer contraseña con código SMS
   */
  static async restablecerConSMS(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { email, codigo, newPassword } = body;

      if (!email || !codigo || !newPassword) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Email, código y nueva contraseña son requeridos"
        };
        return;
      }

      const result = await PasswordRecoveryService.resetPasswordWithSMS(email, codigo, newPassword);

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error restableciendo contraseña:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Error al restablecer contraseña"
      };
    }
  }
}




