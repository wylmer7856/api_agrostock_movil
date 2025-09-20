import { Router } from "../Dependencies/dependencias.ts";
import { getPedidos, postPedido, putPedido, deletePedido} from "../Controller/PedidosController.ts";

const pedidosRouter = new Router();

pedidosRouter.get("/Pedidos", getPedidos);
pedidosRouter.post("/Pedidos", postPedido);
pedidosRouter.put("/Pedido/:id", putPedido);
pedidosRouter.delete("/Pedido/:id", deletePedido);

export { pedidosRouter };