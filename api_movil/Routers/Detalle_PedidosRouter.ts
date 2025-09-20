import { Router } from "../Dependencies/dependencias.ts";
import {getDetalles, postDetalle, deleteDetalle} from "../Controller/Detalle_PedidosController.ts";

const DetallePedidosRouter = new Router();

DetallePedidosRouter.get("/detalle_pedidos", getDetalles);
DetallePedidosRouter.post("/detalle_pedidos", postDetalle);
DetallePedidosRouter.delete("/detalle_pedidos/:id", deleteDetalle);

export { DetallePedidosRouter };
