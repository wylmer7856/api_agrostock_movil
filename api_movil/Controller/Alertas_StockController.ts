import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { AlertasModel } from "../Models/Alertas_StockModel.ts";

export const getAlertas = async (ctx: Context) => {
  try {
    const model = new AlertasModel();
    const lista = await model.ListarAlertas();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: lista.length > 0 ? "Alertas encontradas." : "No se encontraron alertas.",
      data: lista,
    };
  } catch (error) {
    console.error("Error en getAlertas:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const getAlertasActivas = async (ctx: Context) => {
  try {
    const model = new AlertasModel();
    const lista = await model.ListarAlertasActivas();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: lista.length > 0 ? "Alertas activas encontradas." : "No hay alertas activas.",
      data: lista,
    };
  } catch (error) {
    console.error("Error en getAlertasActivas:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const generarAlertasAutomaticas = async (ctx: Context) => {
  try {
    const model = new AlertasModel();
    const result = await model.GenerarAlertasAutomaticas();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: result.mensaje,
      alertasCreadas: result.alertasCreadas,
    };
  } catch (error) {
    console.error("Error en generarAlertasAutomaticas:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error al generar alertas automaticas.",
    };
  }
};

export const marcarAlertaResuelta = async (ctx: RouterContext<"/alertas/:id/resolver">) => {
  try {
    const id_alerta = Number(ctx.params.id);
    if (isNaN(id_alerta) || id_alerta <= 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "ID de alerta invalido.",
      };
      return;
    }

    const model = new AlertasModel();
    const result = await model.MarcarAlertaComoResuelta(id_alerta);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en marcarAlertaResuelta:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const deleteAlerta = async (ctx: RouterContext<"/alertas/:id">) => {
  try {
    const id_alerta = Number(ctx.params.id);
    if (isNaN(id_alerta) || id_alerta <= 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "ID de alerta invalido.",
      };
      return;
    }

    const model = new AlertasModel();
    const result = await model.EliminarAlerta(id_alerta);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en deleteAlerta:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};