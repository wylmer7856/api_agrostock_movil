// 📋 ROUTER DE AUDITORÍA

import { Router } from "../Dependencies/dependencias.ts";
import { AuditoriaController } from "../Controller/AuditoriaController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

export const AuditoriaRouter = new Router();

// Aplicar middleware de autenticación a todas las rutas
AuditoriaRouter.use(AuthMiddleware([]));

// Obtener historial del usuario actual
AuditoriaRouter.get("/auditoria/mi-historial", AuditoriaController.obtenerMiHistorial);

// Obtener bitácora de un registro (solo admin)
AuditoriaRouter.get("/auditoria/bitacora/:tabla/:id", AuditoriaController.obtenerBitacoraRegistro);

// Obtener todas las acciones (solo admin)
AuditoriaRouter.get("/auditoria/acciones", AuditoriaController.obtenerTodasLasAcciones);




