import { Client } from "../Dependencies/dependencias.ts";

export const conexion = await new Client().connect({

    hostname: "localhost",
    username: "root",
    db: "agrostock",
    password: ""

});