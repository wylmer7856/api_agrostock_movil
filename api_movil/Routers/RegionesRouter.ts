import { Router } from "../Dependencies/dependencias.ts";
import {getRegiones} from "../Controller/RegionesController.ts";

const Regionesrouter = new Router();

Regionesrouter.get("/regiones", getRegiones)

export {Regionesrouter};
