import { Router } from "../Dependencies/dependencias.ts";
import {
  getAlertas,
  getAlertasActivas,
  generarAlertasAutomaticas,
  marcarAlertaResuelta,
  deleteAlerta,
} from "../Controller/Alertas_StockController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const AlertasRouter = new Router();

AlertasRouter
  .get("/alertas", AuthMiddleware(["admin"]), getAlertas)
  .get("/alertas/activas", AuthMiddleware(["admin", "productor"]), getAlertasActivas)
  .post("/alertas/generar", AuthMiddleware(["admin"]), generarAlertasAutomaticas)
  .put("/alertas/:id/resolver", AuthMiddleware(["admin", "productor"]), marcarAlertaResuelta)
  .delete("/alertas/:id", AuthMiddleware(["admin"]), deleteAlerta);

export { AlertasRouter };
