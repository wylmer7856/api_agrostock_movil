import { Router } from "../Dependencies/dependencias.ts";
import { getAlertas, getAlertasActivas, generarAlertasAutomaticas, marcarAlertaResuelta, deleteAlerta} from "../Controller/Alertas_StockController.ts";

const AlertasRouter = new Router();

AlertasRouter.get("/alertas", getAlertas);
AlertasRouter.get("/alertas/activas", getAlertasActivas);
AlertasRouter.post("/alertas/generar", generarAlertasAutomaticas);
AlertasRouter.put("/alertas/:id/resolver", marcarAlertaResuelta);
AlertasRouter.delete("/alertas/:id", deleteAlerta);

export { AlertasRouter };