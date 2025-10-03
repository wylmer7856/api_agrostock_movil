import { Context } from "../Dependencies/dependencias.ts";
import { ReportesModel, ReporteCreateData } from "../Models/ReportesModel.ts";

export class ReportesController {
  
  // 📌 Crear reporte
  static async CrearReporte(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { id_usuario_reportado, id_producto_reportado, tipo_reporte, motivo, descripcion } = body;
      const userId = ctx.state.user.id;

      if (!tipo_reporte || !motivo || !descripcion) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Faltan campos requeridos" };
        return;
      }

      if (tipo_reporte === 'usuario' && !id_usuario_reportado) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Debe especificar el usuario reportado" };
        return;
      }

      if (tipo_reporte === 'producto' && !id_producto_reportado) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Debe especificar el producto reportado" };
        return;
      }

      const reporteData: ReporteCreateData = {
        id_usuario_reportado: id_usuario_reportado || undefined,
        id_producto_reportado: id_producto_reportado || undefined,
        id_usuario_reportador: userId,
        tipo_reporte,
        motivo,
        descripcion
      };

      const reporteModel = new ReportesModel(reporteData);
      const result = await reporteModel.CrearReporte();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en CrearReporte:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener todos los reportes (solo admin)
  static async ObtenerTodosLosReportes(ctx: Context) {
    try {
      const { estado, tipo } = ctx.request.url.searchParams;
      const reporteModel = new ReportesModel();

      let reportes;
      if (estado) {
        reportes = await reporteModel.ObtenerReportesPorEstado(estado);
      } else if (tipo) {
        reportes = await reporteModel.ObtenerReportesPorTipo(tipo);
      } else {
        reportes = await reporteModel.ObtenerTodosLosReportes();
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        reportes,
        total: reportes.length
      };
    } catch (error) {
      console.error("Error en ObtenerTodosLosReportes:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener reportes por estado
  static async ObtenerReportesPorEstado(ctx: Context) {
    try {
      const { estado } = ctx.params;
      const reporteModel = new ReportesModel();
      const reportes = await reporteModel.ObtenerReportesPorEstado(estado);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        reportes,
        total: reportes.length
      };
    } catch (error) {
      console.error("Error en ObtenerReportesPorEstado:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener reportes por tipo
  static async ObtenerReportesPorTipo(ctx: Context) {
    try {
      const { tipo } = ctx.params;
      const reporteModel = new ReportesModel();
      const reportes = await reporteModel.ObtenerReportesPorTipo(tipo);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        reportes,
        total: reportes.length
      };
    } catch (error) {
      console.error("Error en ObtenerReportesPorTipo:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Actualizar estado del reporte (solo admin)
  static async ActualizarEstadoReporte(ctx: Context) {
    try {
      const { id_reporte } = ctx.params;
      const body = await ctx.request.body.json();
      const { estado, accion_tomada } = body;

      if (!id_reporte || !estado) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del reporte y estado son requeridos" };
        return;
      }

      const estadosValidos = ['pendiente', 'en_revision', 'resuelto', 'rechazado'];
      if (!estadosValidos.includes(estado)) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Estado inválido" };
        return;
      }

      const reporteModel = new ReportesModel();
      const result = await reporteModel.ActualizarEstadoReporte(parseInt(id_reporte), estado, accion_tomada);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ActualizarEstadoReporte:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Eliminar reporte resuelto (solo admin)
  static async EliminarReporteResuelto(ctx: Context) {
    try {
      const { id_reporte } = ctx.params;

      if (!id_reporte) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del reporte requerido" };
        return;
      }

      const reporteModel = new ReportesModel();
      const result = await reporteModel.EliminarReporteResuelto(parseInt(id_reporte));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarReporteResuelto:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener estadísticas de reportes (solo admin)
  static async ObtenerEstadisticasReportes(ctx: Context) {
    try {
      const reporteModel = new ReportesModel();
      const estadisticas = await reporteModel.ObtenerEstadisticasReportes();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        estadisticas
      };
    } catch (error) {
      console.error("Error en ObtenerEstadisticasReportes:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Reportar usuario
  static async ReportarUsuario(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { id_usuario_reportado, motivo, descripcion } = body;
      const userId = ctx.state.user.id;

      if (!id_usuario_reportado || !motivo || !descripcion) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Faltan campos requeridos" };
        return;
      }

      if (id_usuario_reportado === userId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "No puedes reportarte a ti mismo" };
        return;
      }

      const reporteData: ReporteCreateData = {
        id_usuario_reportado,
        id_usuario_reportador: userId,
        tipo_reporte: 'usuario',
        motivo,
        descripcion
      };

      const reporteModel = new ReportesModel(reporteData);
      const result = await reporteModel.CrearReporte();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ReportarUsuario:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Reportar producto
  static async ReportarProducto(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { id_producto_reportado, motivo, descripcion } = body;
      const userId = ctx.state.user.id;

      if (!id_producto_reportado || !motivo || !descripcion) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Faltan campos requeridos" };
        return;
      }

      const reporteData: ReporteCreateData = {
        id_producto_reportado,
        id_usuario_reportador: userId,
        tipo_reporte: 'producto',
        motivo,
        descripcion
      };

      const reporteModel = new ReportesModel(reporteData);
      const result = await reporteModel.CrearReporte();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ReportarProducto:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }
}
