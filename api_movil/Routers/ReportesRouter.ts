import { Router } from "../Dependencies/dependencias.ts";
import { ReportesController } from "../Controller/ReportesController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const router = new Router();

// 📌 Rutas para reportes (requieren autenticación)
router.post("/crear", AuthMiddleware(['consumidor', 'productor']), ReportesController.CrearReporte);
router.post("/reportar-usuario", AuthMiddleware(['consumidor', 'productor']), ReportesController.ReportarUsuario);
router.post("/reportar-producto", AuthMiddleware(['consumidor', 'productor']), ReportesController.ReportarProducto);

// 📌 Rutas para administradores
router.get("/todos", AuthMiddleware(['admin']), ReportesController.ObtenerTodosLosReportes);
router.get("/estado/:estado", AuthMiddleware(['admin']), ReportesController.ObtenerReportesPorEstado);
router.get("/tipo/:tipo", AuthMiddleware(['admin']), ReportesController.ObtenerReportesPorTipo);
router.put("/:id_reporte/estado", AuthMiddleware(['admin']), ReportesController.ActualizarEstadoReporte);
router.delete("/:id_reporte/resuelto", AuthMiddleware(['admin']), ReportesController.EliminarReporteResuelto);
router.get("/estadisticas", AuthMiddleware(['admin']), ReportesController.ObtenerEstadisticasReportes);

export { router as ReportesRouter };
