// 💳 CONTROLADOR DE PAGOS

import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { PaymentService, type PaymentData } from "../Services/PaymentService.ts";
import { AuditoriaService } from "../Services/AuditoriaService.ts";

export class PaymentController {
  
  /**
   * Crear pago
   */
  static async crearPago(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "No autenticado",
          message: "Debes estar autenticado"
        };
        return;
      }

      const body = await ctx.request.body.json();
      const paymentData: PaymentData = {
        id_pedido: Number(body.id_pedido),
        id_usuario: user.id,
        monto: Number(body.monto),
        metodo_pago: (body.metodo_pago || 'efectivo') as PaymentData['metodo_pago'],
        pasarela: body.pasarela as PaymentData['pasarela'],
        datos_tarjeta: body.datos_tarjeta as PaymentData['datos_tarjeta'],
        datos_adicionales: body.datos_adicionales as PaymentData['datos_adicionales']
      };

      const result = await PaymentService.crearPago(paymentData, ctx);

      // Registrar en auditoría
      await AuditoriaService.registrarAccion({
        id_usuario: user.id,
        accion: 'crear_pago',
        tabla_afectada: 'pagos',
        id_registro_afectado: result.id_pago,
        datos_despues: paymentData as unknown as Record<string, unknown>,
        resultado: result.success ? 'exitoso' : 'fallido',
        error_message: result.error
      }, ctx);

      ctx.response.status = result.success ? 201 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error creando pago:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al crear pago"
      };
    }
  }

  /**
   * Obtener información de un pago
   */
  static async obtenerPago(ctx: RouterContext<"/pagos/:id">) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "No autenticado"
        };
        return;
      }

      const { id } = ctx.params;
      const pago = await PaymentService.obtenerPago(parseInt(id));

      if (!pago) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          error: "Pago no encontrado"
        };
        return;
      }

      // Verificar que el usuario tenga acceso (es su pago o es admin)
      if (pago.id_usuario !== user.id && user.rol !== 'admin') {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          error: "No autorizado"
        };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: pago
      };
    } catch (error) {
      console.error("Error obteniendo pago:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor"
      };
    }
  }

  /**
   * Obtener pagos de un pedido
   */
  static async obtenerPagosPorPedido(ctx: RouterContext<"/pagos/pedido/:id_pedido">) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "No autenticado"
        };
        return;
      }

      const { id_pedido } = ctx.params;
      const pagos = await PaymentService.obtenerPagosPorPedido(parseInt(id_pedido));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: pagos,
        total: pagos.length
      };
    } catch (error) {
      console.error("Error obteniendo pagos:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor"
      };
    }
  }

  /**
   * Actualizar estado de pago (solo admin o webhook)
   */
  static async actualizarEstadoPago(ctx: Context) {
    try {
      const user = ctx.state.user;
      const body = await ctx.request.body.json();
      const { id, estado, motivo } = body;

      // Verificar si es webhook (tiene secret) o admin
      const webhookSecret = ctx.request.headers.get('X-Webhook-Secret');
      // @ts-ignore - Deno is a global object in Deno runtime
      const isWebhook = webhookSecret === Deno.env.get("WEBHOOK_SECRET");

      if (!user && !isWebhook) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "No autorizado"
        };
        return;
      }

      if (user && user.rol !== 'admin' && !isWebhook) {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          error: "Solo administradores pueden actualizar estados"
        };
        return;
      }

      await PaymentService.actualizarEstadoPago(parseInt(id), estado, motivo);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Estado de pago actualizado"
      };
    } catch (error) {
      console.error("Error actualizando estado:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor"
      };
    }
  }
}




