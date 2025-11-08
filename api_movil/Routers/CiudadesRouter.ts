import { Router } from "../Dependencies/dependencias.ts";
import {getCiudades} from "../Controller/CiudadesController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const CiudadesRouter = new Router();

// Ruta pública para ciudades (necesaria para registro)
CiudadesRouter.get("/ciudades", getCiudades);

export { CiudadesRouter };
