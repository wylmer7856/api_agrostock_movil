import { Application, oakCors } from "./Dependencies/dependencias.ts";
import { UsuariosRouter } from "./Routers/UsuariosRouter.ts";
import { AuthRouter } from "./Routers/AuthRouter.ts";
import { ProductosRouter } from "./Routers/ProductosRouter.ts";
import { Regionesrouter } from "./Routers/RegionesRouter.ts";
import { DepartamentosRouter } from "./Routers/DepartamentosRouter.ts";
import { CiudadesRouter } from "./Routers/CiudadesRouter.ts";
import { AlertasRouter } from "./Routers/Alertas_StockRouter.ts";
import { DetallePedidosRouter } from "./Routers/Detalle_PedidosRouter.ts";

const app = new Application();


app.use(oakCors());

const routers = [UsuariosRouter,AuthRouter, ProductosRouter, Regionesrouter, DepartamentosRouter, CiudadesRouter, AlertasRouter, DetallePedidosRouter];

routers.forEach((router) => {
  app.use(router.routes());
  app.use(router.allowedMethods());
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("Error en el servidor:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: "Error interno del servidor" };
  }
});

console.log("Servidor corriendo por el puerto 8000");

await app.listen({ port: 8000 });
