## API Agrostock Móvil

Este proyecto consiste en una API desarrollada con Deno para la gestión integral de Agrostock, orientada a aplicaciones móviles y web. El sistema permite la administración de usuarios, productos, pedidos, reseñas, alertas de stock y localizaciones geográficas, facilitando la interoperabilidad entre plataformas y brindando un entorno escalable y seguro para la gestión agrícola digital.

# Instalación y ejecución

***Instalar Deno***
1. en su entorno de desarrollo.
2.  Clonar este repositorio mediante git clone.
3. Configurar las variables de entorno en el archivo .env para la conexión con la base de datos y parámetros de seguridad.
4. Instalar las dependencias definidas en Dependencies/dependencias.ts.

***Uso***

La API expone múltiples endpoints para la gestión de datos agrícolas y logísticos. Entre las funcionalidades principales se incluyen:

- Autenticación y registro de usuarios con control de roles.
- Gestión de productos y stock con validación de cantidades mínimas.
- Creación, modificación y consulta de pedidos.
- Envío y recuperación de reseñas asociadas a productos.
- Generación de alertas de stock en tiempo real.
- Publicación y consulta de consejos agrícolas.
- Gestión de ubicaciones (departamentos, ciudades y regiones) para trazabilidad de pedidos.
- Para ejemplos de pruebas y consumo de endpoints, revisar el archivo api.rest.

## Seguridad

***El proyecto implementa un sistema de seguridad basado en:***

1. Middleware d-e autenticación (Middlewares/AuthMiddleware.ts) para validación de tokens JWT.
2.  Validación de datos entrantes para mitigar riesgos de inyección SQL o XSS.
3. Gestión de permisos para proteger rutas sensibles según roles de usuario.


## Base de datos

El esquema relacional se encuentra en el archivo agrostock.sql.
La conexión está configurada en Models/Conexion.ts, donde se deben ajustar parámetros como host, puerto, usuario, contraseña y base de datos según el entorno de despliegue.

***Contribución***

- Realizar un fork del repositorio.
- Trabajar en una rama separada para los cambios.
- Enviar pull requests documentados y con pruebas asociadas.
- Contacto y soporte
- Para incidencias, dudas técnicas o sugerencias:
- Abrir un issue en el repositorio oficial.
- Contactar directamente con el equipo de desarrollo de Agrostock.

***Autores***

# Proyecto desarrollado por el equipo de Agrostock:

1. Wilmer Andres Morales Peña
2. Samuel Alejandro Gonzales Castillo
3. Juan Pablo Barrera Caipa
4. Lina Daniela Cepeda Alarcón
5. Andres Felipe Saavedra Castro