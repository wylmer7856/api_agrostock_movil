import { load } from "../Dependencies/dependencias.ts";

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private config!: EmailConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      const env = await load();
      
      this.config = {
        host: env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(env.SMTP_PORT || "587"),
        user: env.SMTP_USER || "",
        pass: env.SMTP_PASS || "",
        secure: env.SMTP_SECURE === "true"
      };

      this.isConfigured = !!(this.config.user && this.config.pass);
      
      if (!this.isConfigured) {
        console.warn("⚠️ EmailService no configurado. Las funciones de email estarán deshabilitadas.");
      } else {
        console.log("✅ EmailService configurado correctamente");
      }
    } catch (error) {
      console.error("Error al cargar configuración de email:", error);
      this.isConfigured = false;
    }
  }

  /**
   * Envía un email usando la API de Resend (recomendado para producción)
   */
  async sendEmail(data: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured) {
        console.log(`📧 Email simulado enviado a: ${data.to}`);
        console.log(`📧 Asunto: ${data.subject}`);
        return {
          success: true,
          message: "Email simulado enviado (servicio no configurado)"
        };
      }

      // Usar Resend API para envío de emails profesional
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.pass}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `AgroStock <${this.config.user}>`,
          to: [data.to],
          subject: data.subject,
          html: data.html,
          text: data.text
        }),
      });

      if (response.ok) {
        // const result = await response.json(); // TODO: Usar result si se necesita
        console.log(`✅ Email enviado exitosamente a: ${data.to}`);
        return {
          success: true,
          message: "Email enviado correctamente"
        };
      } else {
        const error = await response.text();
        console.error("Error al enviar email:", error);
        return {
          success: false,
          message: "Error al enviar email"
        };
      }
    } catch (error) {
      console.error("Error en EmailService:", error);
      return {
        success: false,
        message: "Error interno del servidor"
      };
    }
  }

  /**
   * Envía email de bienvenida a nuevos usuarios
   */
  async sendWelcomeEmail(email: string, nombre: string, rol: string): Promise<{ success: boolean; message: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenido a AgroStock</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2e7d32; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .button { background: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 Bienvenido a AgroStock</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${nombre}!</h2>
            <p>Te damos la bienvenida a AgroStock, la plataforma que conecta productores y consumidores de productos agrícolas frescos.</p>
            
            <p><strong>Tu rol:</strong> ${this.getRolDescription(rol)}</p>
            
            <h3>¿Qué puedes hacer ahora?</h3>
            <ul>
              ${this.getRolActions(rol)}
            </ul>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" class="button">Comenzar a usar AgroStock</a>
            </p>
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© 2024 AgroStock - Conectando el campo con la ciudad</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: "🌱 Bienvenido a AgroStock - Tu cuenta está lista",
      html: html,
      text: `Bienvenido a AgroStock ${nombre}! Tu cuenta como ${rol} está lista. Visita http://localhost:3000 para comenzar.`
    });
  }

  /**
   * Envía notificación de nuevo pedido
   */
  async sendOrderNotification(email: string, nombre: string, pedidoId: number, productos: Array<{ nombre: string; cantidad: number; unidadMedida?: string; precio_unitario: number }>): Promise<{ success: boolean; message: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nuevo Pedido - AgroStock</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .product { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4caf50; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 Nuevo Pedido Recibido</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${nombre}!</h2>
            <p>Has recibido un nuevo pedido <strong>#${pedidoId}</strong> en AgroStock.</p>
            
            <h3>Productos solicitados:</h3>
            ${productos.map(p => `
              <div class="product">
                <strong>${p.nombre}</strong><br>
                Cantidad: ${p.cantidad} ${p.unidadMedida || 'unidades'}<br>
                Precio: $${p.precio_unitario}
              </div>
            `).join('')}
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/pedidos/${pedidoId}" style="background: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver Pedido</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 AgroStock</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: `🛒 Nuevo Pedido #${pedidoId} - AgroStock`,
      html: html,
      text: `Nuevo pedido #${pedidoId} recibido. Productos: ${productos.map(p => p.nombre).join(', ')}`
    });
  }

  /**
   * Envía alerta de stock bajo
   */
  async sendLowStockAlert(email: string, nombre: string, productos: Array<{ nombre: string; stock_actual: number; stockMinimo: number; unidadMedida?: string }>): Promise<{ success: boolean; message: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Alerta de Stock Bajo - AgroStock</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert { background: #ffebee; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #f44336; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerta de Stock Bajo</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${nombre}!</h2>
            <p>Los siguientes productos tienen stock bajo y necesitan reposición:</p>
            
            ${productos.map(p => `
              <div class="alert">
                <strong>${p.nombre}</strong><br>
                Stock actual: ${p.stock_actual} ${p.unidadMedida || 'unidades'}<br>
                Stock mínimo: ${p.stockMinimo} ${p.unidadMedida || 'unidades'}
              </div>
            `).join('')}
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/productos" style="background: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Gestionar Productos</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 AgroStock</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: "⚠️ Alerta de Stock Bajo - AgroStock",
      html: html,
      text: `Alerta de stock bajo para: ${productos.map(p => p.nombre).join(', ')}`
    });
  }

  private getRolDescription(rol: string): string {
    switch (rol) {
      case 'admin':
        return 'Administrador - Puedes gestionar toda la plataforma';
      case 'productor':
        return 'Productor - Puedes vender tus productos agrícolas';
      case 'consumidor':
        return 'Consumidor - Puedes comprar productos frescos';
      default:
        return 'Usuario';
    }
  }

  /**
   * Envía email de recuperación de contraseña
   */
  async sendPasswordRecoveryEmail(
    email: string, 
    nombre: string, 
    token: string
  ): Promise<{ success: boolean; message: string }> {
    // @ts-ignore - Deno is a global object in Deno runtime
    const recoveryUrl = `${Deno.env.get("FRONTEND_URL") || "http://localhost:5173"}/password-recovery?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2d5016 0%, #4a7c2a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #4a7c2a; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background: #2d5016; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña en AgroStock.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <div style="text-align: center;">
              <a href="${recoveryUrl}" class="button">Restablecer Contraseña</a>
            </div>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #4a7c2a;">${recoveryUrl}</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expirará en 1 hora</li>
                <li>Si no solicitaste este cambio, ignora este email</li>
                <li>Nunca compartas este enlace con nadie</li>
              </ul>
            </div>
            <p>Si tienes problemas, contacta a nuestro equipo de soporte.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AgroStock. Todos los derechos reservados.</p>
            <p>Este es un email automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: "🔐 Recuperación de Contraseña - AgroStock",
      html: html,
      text: `Hola ${nombre},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nVisita: ${recoveryUrl}\n\nEste enlace expira en 1 hora.\n\nSi no solicitaste este cambio, ignora este email.`
    });
  }

  private getRolActions(rol: string): string {
    switch (rol) {
      case 'admin':
        return `
          <li>Gestionar usuarios y productos</li>
          <li>Ver estadísticas y reportes</li>
          <li>Moderar contenido</li>
          <li>Configurar la plataforma</li>
        `;
      case 'productor':
        return `
          <li>Agregar y gestionar tus productos</li>
          <li>Recibir pedidos de consumidores</li>
          <li>Ver estadísticas de ventas</li>
          <li>Comunicarte con tus clientes</li>
        `;
      case 'consumidor':
        return `
          <li>Explorar productos frescos</li>
          <li>Realizar pedidos</li>
          <li>Calificar productos</li>
          <li>Contactar productores</li>
        `;
      default:
        return '<li>Explorar la plataforma</li>';
    }
  }
}

export const emailService = new EmailService();
