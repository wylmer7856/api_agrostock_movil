import { Router } from "../Dependencies/dependencias.ts";
import { EstadisticasController } from "../Controller/EstadisticasController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const router = new Router();

// 📌 Rutas para estadísticas generales (solo admin)
router.get("/generales", AuthMiddleware(['admin']), EstadisticasController.ObtenerEstadisticasGenerales);
router.get("/actividad-reciente", AuthMiddleware(['admin']), EstadisticasController.ObtenerActividadReciente);
router.get("/productos-por-categoria", AuthMiddleware(['admin']), EstadisticasController.ObtenerEstadisticasProductosPorCategoria);
router.get("/usuarios-por-region", AuthMiddleware(['admin']), EstadisticasController.ObtenerEstadisticasUsuariosPorRegion);
router.get("/pedidos", AuthMiddleware(['admin']), EstadisticasController.ObtenerEstadisticasPedidos);
router.get("/mensajes", AuthMiddleware(['admin']), EstadisticasController.ObtenerEstadisticasMensajes);

// 📌 Rutas para estadísticas de usuario
router.get("/estadisticas/usuario/:id_usuario", AuthMiddleware(['admin', 'consumidor', 'productor']), EstadisticasController.ObtenerEstadisticasUsuario);
router.put("/estadisticas/usuario/:id_usuario", AuthMiddleware(['admin', 'consumidor', 'productor']), EstadisticasController.ActualizarEstadisticasUsuario);

export { router as EstadisticasRouter };
