import { Router } from "../Dependencies/dependencias.ts";
import { AuthController } from "../Controller/AuthController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const AuthRouter = new Router();

// Rutas públicas
AuthRouter.post("/auth/login", AuthController.login);
AuthRouter.post("/auth/register", AuthController.register);

// Rutas protegidas
AuthRouter.post("/auth/logout", AuthMiddleware([]), AuthController.logout);
AuthRouter.get("/auth/verify", AuthMiddleware([]), AuthController.verifyToken);
AuthRouter.post("/auth/change-password", AuthMiddleware([]), AuthController.changePassword);

export { AuthRouter };
