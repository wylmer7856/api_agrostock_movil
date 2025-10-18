import { Router } from "../Dependencies/dependencias.ts";
import { CartController } from "../Controller/CartController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const CartRouter = new Router();

// Todas las rutas del carrito requieren autenticación
CartRouter.use(AuthMiddleware([]));

// Rutas del carrito
CartRouter.get("/cart", CartController.getCart);
CartRouter.post("/cart/add", CartController.addToCart);
CartRouter.put("/cart/item/:id", CartController.updateCartItem);
CartRouter.delete("/cart/item/:id", CartController.removeFromCart);
CartRouter.delete("/cart/clear", CartController.clearCart);
CartRouter.get("/cart/validate", CartController.validateCart);
CartRouter.post("/cart/checkout", CartController.checkout);
CartRouter.get("/cart/stats", CartController.getCartStats);

export { CartRouter };
