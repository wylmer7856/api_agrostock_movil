import { Router } from "../Dependencies/dependencias.ts";
import {
  getCiudades,
  postCiudades,
  putCiudades,
  deleteCiudades,
} from "../Controller/CiudadesController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const CiudadesRouter = new Router();

CiudadesRouter
  .get("/ciudades", AuthMiddleware(["admin", "productor"]), getCiudades)
  .post("/ciudades", AuthMiddleware(["admin"]), postCiudades)
  .put("/ciudades", AuthMiddleware(["admin"]), putCiudades)
  .delete("/ciudades/:id", AuthMiddleware(["admin"]), deleteCiudades);

export { CiudadesRouter };
