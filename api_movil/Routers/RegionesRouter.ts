import { Router } from "../Dependencies/dependencias.ts";
import { getRegiones } from "../Controller/RegionesController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const RegionesRouter = new Router();

RegionesRouter.get("/regiones", AuthMiddleware(["admin", "productor"]), getRegiones);

export { RegionesRouter };
