import { Router } from "../Dependencies/dependencias.ts";
import { AuthController } from "../Controller/AuthController.ts";

const AuthRouter = new Router();

AuthRouter.post("/auth/login", AuthController.login);

export { AuthRouter };
