// 💳 ROUTER DE PAGOS

import { Router } from "../Dependencies/dependencias.ts";
import { PaymentController } from "../Controller/PaymentController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

export const PaymentRouter = new Router();

// Aplicar middleware de autenticación a todas las rutas
PaymentRouter.use(AuthMiddleware([]));

// Crear pago
PaymentRouter.post("/pagos", PaymentController.crearPago);

// Obtener pago por ID
PaymentRouter.get("/pagos/:id", PaymentController.obtenerPago);

// Obtener pagos de un pedido
PaymentRouter.get("/pagos/pedido/:id_pedido", PaymentController.obtenerPagosPorPedido);

// Actualizar estado de pago (admin o webhook)
PaymentRouter.put("/pagos/estado", PaymentController.actualizarEstadoPago);




