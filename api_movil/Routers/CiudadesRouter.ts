import { Router } from "../Dependencies/dependencias.ts";
import {getCiudades, postCiudades, putCiudades, deleteCiudades} from "../Controller/CiudadesController.ts";

const CiudadesRouter = new Router();

CiudadesRouter.get("/ciudades", getCiudades);
CiudadesRouter.post("/ciudades", postCiudades);
CiudadesRouter.put("/ciudades", putCiudades);
CiudadesRouter.delete("/ciudades/:id", deleteCiudades);

export { CiudadesRouter };
