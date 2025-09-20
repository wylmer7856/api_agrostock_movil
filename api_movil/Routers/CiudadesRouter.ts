import { Router } from "../Dependencies/dependencias.ts";
import {getCiudades} from "../Controller/CiudadesController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const CiudadesRouter = new Router();

CiudadesRouter.get("/ciudades", AuthMiddleware(["admin", "productor"]), getCiudades);

export { CiudadesRouter };
