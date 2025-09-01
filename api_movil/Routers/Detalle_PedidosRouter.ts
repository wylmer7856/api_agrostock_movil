import { Router } from "../Dependencies/dependencias.ts";
import {getDetalles, postDetalle, deleteDetalle} from "../Controller/Detalle_PedidosController.ts";

const DetallePedidosRouter = new Router();

DetallePedidosRouter
  .get("/detalle_pedidos", getDetalles)
  .post("/detalle_pedidos", postDetalle)
  .delete("/detalle_pedidos/:id", deleteDetalle);

export { DetallePedidosRouter };
