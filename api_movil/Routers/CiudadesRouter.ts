import { Router } from "../Dependencies/dependencias.ts";
import {getCiudades} from "../Controller/CiudadesController.ts";

const CiudadesRouter = new Router();

CiudadesRouter.get("/ciudades", getCiudades);


export { CiudadesRouter };
