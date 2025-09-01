import { Router } from "../Dependencies/dependencias.ts";
import {getAlertas, postAlerta, deleteAlerta} from "../Controller/Alertas_StockController.ts";

const AlertasRouter = new Router();

AlertasRouter.get("/alertas", getAlertas);
AlertasRouter.post("/alertas", postAlerta);
AlertasRouter.delete("/alertas/:id", deleteAlerta);

export { AlertasRouter };
