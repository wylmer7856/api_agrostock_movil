import { Router } from "../Dependencies/dependencias.ts";
import { getPedidos, postPedido, putPedido, deletePedido, getMisPedidos} from "../Controller/PedidosController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const pedidosRouter = new Router();

// ✅ Rutas protegidas con autenticación - Usar nombres estándar REST (minúsculas, plural)
pedidosRouter.get("/pedidos", AuthMiddleware(['admin']), getPedidos); // Solo admin puede ver todos los pedidos
pedidosRouter.get("/pedidos/mis-pedidos", AuthMiddleware(['productor', 'consumidor']), getMisPedidos); // Productores y consumidores pueden ver sus pedidos
pedidosRouter.post("/pedidos", AuthMiddleware([]), postPedido);
pedidosRouter.put("/pedidos/:id", AuthMiddleware([]), putPedido);
pedidosRouter.delete("/pedidos/:id", AuthMiddleware([]), deletePedido);

export { pedidosRouter };