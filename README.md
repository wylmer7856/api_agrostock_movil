## Imágenes de apoyo

A continuación se muestran ejemplos de imágenes que puedes agregar para complementar la documentación:

### Diagrama de arquitectura



# API Agrostock Móvil

Este proyecto es una API desarrollada con Deno para la gestión de Agrostock, orientada a aplicaciones móviles. Permite administrar usuarios, productos, pedidos, reseñas, alertas de stock y más, facilitando la integración con sistemas móviles y web.


## Instalación y ejecución

1. Instala [Deno](https://deno.land/).
2. Clona este repositorio.
3. Configura las variables de entorno en el archivo `.env`.
4. Instala las dependencias necesarias (ver `Dependencies/dependencias.ts`).
5. Ejecuta la API:
   ```powershell
   deno run --allow-net --allow-read app.ts
   ```

## Uso

La API permite gestionar usuarios, productos, pedidos, reseñas, alertas de stock, consejos y ubicaciones (regiones, ciudades, departamentos). Los endpoints principales incluyen:

- Autenticación y registro de usuarios
- Gestión de productos y stock
- Creación y consulta de pedidos
- Envío y consulta de reseñas
- Alertas de stock
- Consejos agrícolas
- Gestión de ubicaciones

Consulta el archivo `api.rest` para ejemplos de peticiones y pruebas.

## Seguridad

El proyecto implementa autenticación mediante middleware (`Middlewares/AuthMiddleware.ts`). Se recomienda proteger las rutas sensibles y validar los datos recibidos.

## Base de datos

El archivo `agrostock.sql` contiene el esquema de la base de datos. Modifica la configuración de conexión en `Models/Conexion.ts` según tu entorno.

## Contribución

Si deseas contribuir, por favor realiza un fork del repositorio y envía tus pull requests. Es importante seguir las buenas prácticas de desarrollo y documentar tus cambios.

## Contacto y soporte

Para dudas, sugerencias o soporte, contacta al equipo de Agrostock o abre un issue en el repositorio.


## Autor

Proyecto desarrollado por el equipo de Agrostock conformado por 
Wilmer Andres Morales Peña
Samuel Alejandro Gonzales Castillo
Juan Pablo Barrera Caipa
Lina Daniela Cepeda Alarcon 
Andres Felipe Saavedra Castro


