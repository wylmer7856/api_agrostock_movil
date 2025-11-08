// 💳 SERVICIO DE PAGOS - INTEGRACIÓN CON PASARELAS DE PAGO

import { conexion } from "../Models/Conexion.ts";
import { AuditoriaService } from "./AuditoriaService.ts";
import type { Context } from "../Dependencies/dependencias.ts";

export interface PaymentData {
  id_pedido: number;
  id_usuario: number;
  monto: number;
  metodo_pago: 'tarjeta' | 'nequi' | 'daviplata' | 'pse' | 'efectivo' | 'transferencia';
  pasarela?: 'wompi' | 'payu' | 'mercadopago' | 'stripe';
  datos_tarjeta?: {
    numero?: string;
    cvv?: string;
    fecha_expiracion?: string;
    nombre_titular?: string;
  };
  datos_adicionales?: any;
}

export interface PaymentResponse {
  success: boolean;
  id_pago?: number;
  referencia_pago?: string;
  estado_pago?: string;
  url_pago?: string;
  mensaje?: string;
  error?: string;
}

export class PaymentService {
  private static readonly WOMPI_PUBLIC_KEY = Deno.env.get("WOMPI_PUBLIC_KEY") || "";
  private static readonly WOMPI_PRIVATE_KEY = Deno.env.get("WOMPI_PRIVATE_KEY") || "";
  private static readonly PAYU_API_KEY = Deno.env.get("PAYU_API_KEY") || "";
  private static readonly PAYU_MERCHANT_ID = Deno.env.get("PAYU_MERCHANT_ID") || "";

  /**
   * Crear pago
   */
  static async crearPago(
    data: PaymentData,
    ctx?: Context
  ): Promise<PaymentResponse> {
    try {
      // Validar monto
      if (data.monto <= 0) {
        return {
          success: false,
          error: "El monto debe ser mayor a 0"
        };
      }

      // Crear registro de pago
      const [result] = await conexion.query(
        `INSERT INTO pagos 
         (id_pedido, id_usuario, monto, moneda, metodo_pago, pasarela_pago, estado_pago)
         VALUES (?, ?, ?, 'COP', ?, ?, 'pendiente')
         RETURNING id_pago`,
        [
          data.id_pedido,
          data.id_usuario,
          data.monto,
          data.metodo_pago,
          data.pasarela || 'manual'
        ]
      );

      const id_pago = result.id_pago;

      // Procesar según método de pago
      if (data.metodo_pago === 'efectivo') {
        // Pago en efectivo - se marca como aprobado manualmente después
        await this.actualizarEstadoPago(id_pago, 'pendiente', 'Pago en efectivo pendiente de confirmación');
        
        return {
          success: true,
          id_pago,
          estado_pago: 'pendiente',
          mensaje: "Pago en efectivo registrado. Se confirmará cuando se reciba el pago."
        };
      }

      // Procesar con pasarela de pago
      if (data.pasarela === 'wompi') {
        return await this.procesarConWompi(id_pago, data);
      } else if (data.pasarela === 'payu') {
        return await this.procesarConPayU(id_pago, data);
      } else {
        return {
          success: false,
          error: "Pasarela de pago no especificada o no soportada"
        };
      }
    } catch (error) {
      console.error("Error creando pago:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear pago"
      };
    }
  }

  /**
   * Procesar pago con Wompi (Colombia)
   */
  private static async procesarConWompi(
    id_pago: number,
    data: PaymentData
  ): Promise<PaymentResponse> {
    try {
      // Actualizar estado a procesando
      await this.actualizarEstadoPago(id_pago, 'procesando', 'Procesando con Wompi');

      // Aquí iría la integración real con Wompi API
      // Por ahora, simulamos la respuesta
      const referencia_pago = `WOMPI_${Date.now()}_${id_pago}`;

      // En producción, aquí harías:
      /*
      const wompiResponse = await fetch('https://production.wompi.co/v1/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.WOMPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount_in_cents: data.monto * 100,
          currency: 'COP',
          customer_email: customerEmail,
          payment_method: {
            type: 'CARD',
            token: data.datos_tarjeta?.token
          },
          reference: referencia_pago
        })
      });
      */

      // Simulación - en producción usar respuesta real
      const estado_pago = 'aprobado'; // o 'rechazado' según respuesta

      await conexion.execute(
        `UPDATE pagos 
         SET referencia_pago = ?, 
             estado_pago = ?,
             fecha_procesamiento = NOW(),
             fecha_aprobacion = ?,
             respuesta_pasarela = ?
         WHERE id_pago = ?`,
        [
          referencia_pago,
          estado_pago,
          estado_pago === 'aprobado' ? new Date() : null,
          JSON.stringify({ simulacion: true }), // En producción: respuesta real
          id_pago
        ]
      );

      // Actualizar estado del pedido
      await this.sincronizarEstadoPedido(id_pago);

      return {
        success: estado_pago === 'aprobado',
        id_pago,
        referencia_pago,
        estado_pago,
        mensaje: estado_pago === 'aprobado' 
          ? "Pago procesado exitosamente" 
          : "Pago rechazado"
      };
    } catch (error) {
      await this.actualizarEstadoPago(id_pago, 'rechazado', error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: "Error procesando pago con Wompi"
      };
    }
  }

  /**
   * Procesar pago con PayU (Colombia)
   */
  private static async procesarConPayU(
    id_pago: number,
    data: PaymentData
  ): Promise<PaymentResponse> {
    try {
      await this.actualizarEstadoPago(id_pago, 'procesando', 'Procesando con PayU');

      const referencia_pago = `PAYU_${Date.now()}_${id_pago}`;

      // En producción, aquí harías:
      /*
      const payuResponse = await fetch('https://api.payulatam.com/payments-api/4.0/service.cgi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(this.PAYU_API_KEY + ':' + this.PAYU_MERCHANT_ID)}`
        },
        body: JSON.stringify({
          language: 'es',
          command: 'SUBMIT_TRANSACTION',
          merchant: {
            apiKey: this.PAYU_API_KEY,
            apiLogin: this.PAYU_MERCHANT_ID
          },
          transaction: {
            order: {
              accountId: this.PAYU_MERCHANT_ID,
              referenceCode: referencia_pago,
              description: 'Pago AgroStock',
              value: data.monto,
              currency: 'COP'
            },
            payer: {
              email: customerEmail
            },
            paymentMethod: data.metodo_pago
          }
        })
      });
      */

      const estado_pago = 'aprobado'; // Simulación

      await conexion.execute(
        `UPDATE pagos 
         SET referencia_pago = ?, 
             estado_pago = ?,
             fecha_procesamiento = NOW(),
             fecha_aprobacion = ?,
             respuesta_pasarela = ?
         WHERE id_pago = ?`,
        [
          referencia_pago,
          estado_pago,
          estado_pago === 'aprobado' ? new Date() : null,
          JSON.stringify({ simulacion: true }),
          id_pago
        ]
      );

      await this.sincronizarEstadoPedido(id_pago);

      return {
        success: estado_pago === 'aprobado',
        id_pago,
        referencia_pago,
        estado_pago,
        mensaje: estado_pago === 'aprobado' 
          ? "Pago procesado exitosamente" 
          : "Pago rechazado"
      };
    } catch (error) {
      await this.actualizarEstadoPago(id_pago, 'rechazado', error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: "Error procesando pago con PayU"
      };
    }
  }

  /**
   * Sincronizar estado de pago con pedido
   */
  static async sincronizarEstadoPedido(id_pago: number): Promise<void> {
    try {
      const [pago] = await conexion.query(
        `SELECT id_pedido, estado_pago FROM pagos WHERE id_pago = ?`,
        [id_pago]
      );

      if (!pago) return;

      const nuevoEstadoPedido = pago.estado_pago === 'aprobado' ? 'confirmado' : 
                                pago.estado_pago === 'rechazado' ? 'pendiente' : null;

      if (nuevoEstadoPedido) {
        await conexion.execute(
          `UPDATE pedidos 
           SET estado = ?, 
               estado_pago = ?,
               id_pago = ?,
               fecha_pago = ?
           WHERE id_pedido = ?`,
          [
            nuevoEstadoPedido,
            pago.estado_pago,
            id_pago,
            pago.estado_pago === 'aprobado' ? new Date() : null,
            pago.id_pedido
          ]
        );

        // Registrar en bitácora
        await AuditoriaService.registrarCambio(
          'pedidos',
          pago.id_pedido,
          'actualizar',
          0, // Sistema
          {
            cambios_completos: {
              estado_pago: pago.estado_pago,
              estado_pedido: nuevoEstadoPedido
            }
          },
          null,
          'Sincronización automática con estado de pago'
        );
      }
    } catch (error) {
      console.error("Error sincronizando estado de pago:", error);
    }
  }

  /**
   * Actualizar estado de pago
   */
  static async actualizarEstadoPago(
    id_pago: number,
    estado: string,
    motivo?: string
  ): Promise<void> {
    try {
      await conexion.execute(
        `UPDATE pagos 
         SET estado_pago = ?,
             motivo_rechazo = ?,
             fecha_procesamiento = CASE WHEN ? = 'procesando' THEN NOW() ELSE fecha_procesamiento END,
             fecha_aprobacion = CASE WHEN ? = 'aprobado' THEN NOW() ELSE fecha_aprobacion END
         WHERE id_pago = ?`,
        [estado, motivo || null, estado, estado, id_pago]
      );

      // Sincronizar con pedido
      await this.sincronizarEstadoPedido(id_pago);
    } catch (error) {
      console.error("Error actualizando estado de pago:", error);
    }
  }

  /**
   * Obtener información de un pago
   */
  static async obtenerPago(id_pago: number): Promise<any> {
    try {
      const [pago] = await conexion.query(
        `SELECT * FROM pagos WHERE id_pago = ?`,
        [id_pago]
      );
      return pago;
    } catch (error) {
      console.error("Error obteniendo pago:", error);
      return null;
    }
  }

  /**
   * Obtener pagos de un pedido
   */
  static async obtenerPagosPorPedido(id_pedido: number): Promise<any[]> {
    try {
      const pagos = await conexion.query(
        `SELECT * FROM pagos WHERE id_pedido = ? ORDER BY fecha_creacion DESC`,
        [id_pedido]
      );
      return pagos;
    } catch (error) {
      console.error("Error obteniendo pagos:", error);
      return [];
    }
  }
}




