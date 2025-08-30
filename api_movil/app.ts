import { Application, oakCors } from "./Dependencies/dependencias.ts";
import { UsuariosRouter } from "./Routers/UsuariosRouter.ts";
import { AuthRouter } from "./Routers/AuthRouter.ts";
import { ProductosRouter } from "./Routers/ProductosRouter.ts";

const app = new Application();


app.use(oakCors());

// Routers
const routers = [UsuariosRouter,AuthRouter, ProductosRouter, ];

routers.forEach((router) => {
  app.use(router.routes());
  app.use(router.allowedMethods());
});

// Middleware  para manejo de errores
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("❌ Error en el servidor:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: "Error interno del servidor" };
  }
});

console.log("✅ Servidor corriendo en http://localhost:8000");

await app.listen({ port: 8000 });
