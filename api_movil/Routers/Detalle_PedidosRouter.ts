import { Router } from "../Dependencies/dependencias.ts";
import { getDetalles, postDetalle, deleteDetalle} from "../Controller/Detalle_PedidosController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const DetallePedidosRouter = new Router();

DetallePedidosRouter
  .get("/detalle_pedidos", AuthMiddleware(["admin", "productor"]), getDetalles)
  .post("/detalle_pedidos", AuthMiddleware(["admin", "consumidor"]), postDetalle)
  .delete("/detalle_pedidos/:id", AuthMiddleware(["admin", "consumidor"]), deleteDetalle);

export { DetallePedidosRouter };
