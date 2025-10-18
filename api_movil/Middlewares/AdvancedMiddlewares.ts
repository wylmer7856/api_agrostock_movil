import { Context } from "../Dependencies/dependencias.ts";
import { conexion } from "../Models/Conexion.ts";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Nueva ventana de tiempo
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Middleware de Rate Limiting
 */
export function rateLimitMiddleware(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const identifier = ctx.request.ip || 'unknown';
    const result = rateLimiter.isAllowed(identifier);

    ctx.response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    ctx.response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    ctx.response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      ctx.response.status = 429;
      ctx.response.body = {
        success: false,
        error: "Demasiadas solicitudes",
        message: `Has excedido el límite de ${maxRequests} solicitudes por ${windowMs / 1000 / 60} minutos`,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      };
      return;
    }

    await next();
  };
}

/**
 * Middleware de validación de entrada
 */
export function validationMiddleware(schema: any) {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    try {
      const body = await ctx.request.body.json();
      const validated = schema.parse(body);
      ctx.state.validatedData = validated;
      await next();
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos de entrada inválidos",
          message: "Los datos proporcionados no cumplen con el formato requerido",
          details: (error as any).errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        };
        return;
      }
      
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Error de validación",
        message: "Error al procesar los datos de entrada"
      };
    }
  };
}

/**
 * Middleware de logging de requests
 */
export function requestLoggingMiddleware() {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const start = Date.now();
    const method = ctx.request.method;
    const url = ctx.request.url.pathname;
    const ip = ctx.request.ip || 'unknown';
    const userAgent = ctx.request.headers.get('user-agent') || 'unknown';

    console.log(`📥 ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);

    await next();

    const duration = Date.now() - start;
    const status = ctx.response.status;
    
    const statusEmoji = status < 300 ? '✅' : status < 400 ? '🔄' : status < 500 ? '⚠️' : '❌';
    console.log(`${statusEmoji} ${method} ${url} - ${status} - ${duration}ms`);
  };
}

/**
 * Middleware de seguridad - Headers de seguridad
 */
export function securityHeadersMiddleware() {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    // Headers de seguridad
    ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
    ctx.response.headers.set('X-Frame-Options', 'DENY');
    ctx.response.headers.set('X-XSS-Protection', '1; mode=block');
    ctx.response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    ctx.response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // CSP básico
    ctx.response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    );

    await next();
  };
}

/**
 * Middleware de compresión (simulado)
 */
export function compressionMiddleware() {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const acceptEncoding = ctx.request.headers.get('accept-encoding') || '';
    
    if (acceptEncoding.includes('gzip')) {
      ctx.response.headers.set('Content-Encoding', 'gzip');
    }

    await next();
  };
}

/**
 * Middleware de validación de archivos
 */
export function fileValidationMiddleware(maxSize: number = 5 * 1024 * 1024, _allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif']) {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const contentType = ctx.request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Validar tamaño del request
      const contentLength = parseInt(ctx.request.headers.get('content-length') || '0');
      
      if (contentLength > maxSize) {
        ctx.response.status = 413;
        ctx.response.body = {
          success: false,
          error: "Archivo demasiado grande",
          message: `El archivo excede el tamaño máximo de ${maxSize / 1024 / 1024}MB`
        };
        return;
      }
    }

    await next();
  };
}

/**
 * Middleware de validación de roles mejorado
 */
export function roleMiddleware(allowedRoles: string[]) {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const user = ctx.state.user;
    
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: "No autorizado",
        message: "Token de autenticación requerido"
      };
      return;
    }

    if (!allowedRoles.includes(user.rol)) {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "Acceso denegado",
        message: `Tu rol '${user.rol}' no tiene permisos para acceder a este recurso`,
        required_roles: allowedRoles,
        your_role: user.rol
      };
      return;
    }

    await next();
  };
}

/**
 * Middleware de validación de propiedad de recurso
 */
export function ownershipMiddleware(resourceType: 'producto' | 'pedido' | 'mensaje', paramName: string = 'id') {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const user = ctx.state.user;
    const resourceId = (ctx as any).params?.[paramName];

    if (!user || !resourceId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Datos insuficientes",
        message: "Usuario o ID de recurso no proporcionado"
      };
      return;
    }

    try {
      let query = '';
      let params: any[] = [];

      switch (resourceType) {
        case 'producto':
          query = "SELECT id_usuario FROM productos WHERE id_producto = ?";
          params = [resourceId];
          break;
        case 'pedido':
          query = "SELECT id_consumidor, id_productor FROM pedidos WHERE id_pedido = ?";
          params = [resourceId];
          break;
        case 'mensaje':
          query = "SELECT id_remitente, id_destinatario FROM mensajes WHERE id_mensaje = ?";
          params = [resourceId];
          break;
      }

      const result = await conexion.query(query, params);

      if (result.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          error: "Recurso no encontrado",
          message: `${resourceType} no encontrado`
        };
        return;
      }

      const resource = result[0];
      let hasAccess = false;

      switch (resourceType) {
        case 'producto':
          hasAccess = resource.id_usuario === user.id || user.rol === 'admin';
          break;
        case 'pedido':
          hasAccess = resource.id_consumidor === user.id || resource.id_productor === user.id || user.rol === 'admin';
          break;
        case 'mensaje':
          hasAccess = resource.id_remitente === user.id || resource.id_destinatario === user.id || user.rol === 'admin';
          break;
      }

      if (!hasAccess) {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          error: "Acceso denegado",
          message: `No tienes permisos para acceder a este ${resourceType}`
        };
        return;
      }

      ctx.state.resource = resource;
      await next();
    } catch (error) {
      console.error("Error en ownershipMiddleware:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al verificar permisos"
      };
    }
  };
}

/**
 * Middleware de validación de stock
 */
export function stockValidationMiddleware() {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    try {
      const body = ctx.state.validatedData || await ctx.request.body.json();
      
      if (body.cantidad && body.id_producto) {
        const producto = await conexion.query(
          "SELECT stock FROM productos WHERE id_producto = ?",
          [body.id_producto]
        );

        if (producto.length === 0) {
          ctx.response.status = 404;
          ctx.response.body = {
            success: false,
            error: "Producto no encontrado",
            message: "El producto especificado no existe"
          };
          return;
        }

        if (producto[0].stock < body.cantidad) {
          ctx.response.status = 400;
          ctx.response.body = {
            success: false,
            error: "Stock insuficiente",
            message: `Solo hay ${producto[0].stock} unidades disponibles`,
            stock_disponible: producto[0].stock,
            cantidad_solicitada: body.cantidad
          };
          return;
        }
      }

      await next();
    } catch (error) {
      console.error("Error en stockValidationMiddleware:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al validar stock"
      };
    }
  };
}

/**
 * Middleware de sanitización de datos
 */
export function sanitizationMiddleware() {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    if (ctx.state.validatedData) {
      // Sanitizar strings
      const sanitizeString = (str: string): string => {
        return str
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      };

      const sanitizeObject = (obj: any): any => {
        if (typeof obj === 'string') {
          return sanitizeString(obj);
        }
        if (Array.isArray(obj)) {
          return obj.map(sanitizeObject);
        }
        if (obj && typeof obj === 'object') {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
          }
          return sanitized;
        }
        return obj;
      };

      ctx.state.validatedData = sanitizeObject(ctx.state.validatedData);
    }

    await next();
  };
}

/**
 * Middleware de métricas y analytics
 */
export function metricsMiddleware() {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const start = Date.now();
    const method = ctx.request.method;
    const url = ctx.request.url.pathname;

    await next();

    const duration = Date.now() - start;
    const status = ctx.response.status;

    // Aquí podrías enviar métricas a un servicio como Prometheus, DataDog, etc.
    console.log(`📊 Métrica: ${method} ${url} - ${status} - ${duration}ms`);
    
    // Ejemplo de métricas que podrías almacenar:
    // - Tiempo de respuesta por endpoint
    // - Códigos de estado por endpoint
    // - Uso de memoria
    // - Errores por tipo
  };
}
