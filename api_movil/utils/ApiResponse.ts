import { Context } from "../Dependencies/dependencias.ts";

/**
 * Clase utilitaria para respuestas de API estandarizadas
 */
export class ApiResponse {
  /**
   * Respuesta exitosa estándar
   */
  static success(
    ctx: Context,
    data: any,
    message: string = "Operación exitosa",
    status: number = 200
  ) {
    ctx.response.status = status;
    ctx.response.body = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Respuesta de error estándar
   */
  static error(
    ctx: Context,
    errorCode: string,
    message: string,
    status: number = 400,
    details?: any
  ) {
    ctx.response.status = status;
    ctx.response.body = {
      success: false,
      error: errorCode,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID()
    };
  }

  /**
   * Respuesta de error de validación
   */
  static validationError(
    ctx: Context,
    errors: Array<{ field: string; message: string }>,
    message: string = "Error de validación"
  ) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: "VALIDATION_ERROR",
      message,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Respuesta de recurso no encontrado
   */
  static notFound(
    ctx: Context,
    resource: string = "Recurso",
    message?: string
  ) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      error: "NOT_FOUND",
      message: message || `${resource} no encontrado`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Respuesta de no autorizado
   */
  static unauthorized(
    ctx: Context,
    message: string = "No autorizado"
  ) {
    ctx.response.status = 401;
    ctx.response.body = {
      success: false,
      error: "UNAUTHORIZED",
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Respuesta de acceso denegado
   */
  static forbidden(
    ctx: Context,
    message: string = "Acceso denegado"
  ) {
    ctx.response.status = 403;
    ctx.response.body = {
      success: false,
      error: "FORBIDDEN",
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Respuesta de error interno del servidor
   */
  static internalError(
    ctx: Context,
    message: string = "Error interno del servidor"
  ) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "INTERNAL_ERROR",
      message,
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID()
    };
  }

  /**
   * Respuesta de lista paginada
   */
  static paginated(
    ctx: Context,
    data: any[],
    pagination: {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
      hayMasPaginas?: boolean;
    },
    message?: string
  ) {
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: message || `${data.length} resultados encontrados`,
      data,
      pagination,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Respuesta de lista vacía (NO es un error)
   */
  static empty(
    ctx: Context,
    resource: string = "Recursos",
    message?: string
  ) {
    ctx.response.status = 200; // ✅ 200 OK, no 404
    ctx.response.body = {
      success: true,
      message: message || `No se encontraron ${resource.toLowerCase()}`,
      data: [],
      total: 0,
      timestamp: new Date().toISOString()
    };
  }
}

