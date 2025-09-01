import { Router } from "../Dependencies/dependencias.ts";
import {getRegiones, postRegiones, putRegiones, deleteRegiones} from "../Controller/RegionesController.ts";

const Regionesrouter = new Router();

Regionesrouter.get("/regiones", getRegiones)
Regionesrouter.post("/regiones", postRegiones)
Regionesrouter.put("/regiones", putRegiones)
Regionesrouter.delete("/regiones/:id", deleteRegiones);

export {Regionesrouter};
