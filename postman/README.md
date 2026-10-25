# Colección de Postman — Shop

Importa **Shop-API.postman_collection.json** desde **Import → Files** en Postman. No necesitas importar un entorno adicional: las variables están dentro de la colección.

## Preparación

1. Abre la colección y entra en **Variables**.
2. Revisa `baseUrl`: inicialmente `http://localhost:4000/api`, sin barra final.
3. Completa `loginEmail` y `loginPassword` con una cuenta existente y activa.
4. Ejecuta **00 · Autenticación → Iniciar sesión y guardar token**. Su script guarda `data.accessToken` en `token` y el usuario autenticado en `sessionUserId`.
5. Las demás solicitudes heredan la autenticación Bearer de la colección.

Las credenciales de acceso y el token se entregan vacíos. Los datos de ejemplo para crear registros son ficticios. Configura sus valores locales en Postman.

## Orden para probar

- Categorías: crea una categoría y después una subcategoría dentro de ella.
- Marcas: crea una marca y selecciona el logo y banner locales.
- Atributos: crea un grupo asociado a una categoría, crea el atributo y consulta sus valores.
- Productos: usa una categoría, subcategoría y marca existentes. El ejemplo crea un borrador con una galería local.
- Colaboradores: crea, consulta, edita, cambia estados o prueba la importación/exportación según necesites.

Las creaciones guardan sus IDs automáticamente cuando la respuesta los devuelve. También puedes copiar IDs existentes a las variables `categoryId`, `subcategoryId`, `brandId`, `attributeGroupId`, `attributeId`, `attributeValueId`, `productId`, etc. `sessionUserId` corresponde al usuario autenticado; `collaboratorId` es el colaborador que deseas probar.

Cada solicitud indica qué ID necesita. Un grupo sin categorías o sin registros activos puede producir una respuesta vacía según las reglas del endpoint. Los selectores que filtran registros activos requieren activar esos registros previamente.

## Archivos y cuerpos

- **Crear marca:** selecciona archivos en `logoUrl` y `bannerUrl` de **Body → form-data**. En editar marca esos campos están desactivados por defecto y son opcionales.
- **Crear producto:** selecciona archivos en `gallery` y coloca en `galleryFilename` el nombre exacto de una de las imágenes elegidas. Ese nombre se usa para `cover` y `miniature`. La implementación admite hasta 10 imágenes de hasta 3 MB por archivo.
- **Subir imágenes de producto:** selecciona `gallery` y configura `productId`.
- Postman genera automáticamente el encabezado multipart. No establezcas manualmente `Content-Type` en estas solicitudes.
- **Importar colaboradores:** el backend recibe registros JSON, no el archivo Excel/CSV. La conversión del archivo se realiza en el panel. La colección incluye un ejemplo del JSON que acepta el backend.
- **Exportar colaboradores:** usa **Send and Download**; el ejemplo exporta XLSX con datos enmascarados. Puedes cambiar `format` a `csv`.
- Los filtros opcionales están visibles y desactivados en **Params**. Actívalos cuando quieras utilizarlos.

## Estados y operaciones especiales

Los endpoints nuevos, como `updateAttributeStatus`, reciben el **estado deseado**. Algunas rutas antiguas de grupos y variaciones todavía reciben el **estado actual** y lo invierten; está indicado en su nombre y descripción. `update_feature_attribute` también invierte el valor actual de `isFeatured` y recibe un `productDescriptionId`.

Para mover registros, configura `destinationCategoryId` y `destinationSubcategoryId` con destinos existentes y coherentes. Las acciones de estado, edición, eliminación, importación y movimiento sí modifican datos cuando pulsas **Send**. Ejecuta las solicitudes individualmente y en el orden adecuado para tus registros.

## Cobertura y verificación

La colección contiene todas las rutas HTTP declaradas en los controladores de `src/`, más `/api/metrics`, registrado por `PrometheusModule`. Solo conserva los nombres que existen actualmente en el código; no inventa alias para rutas antiguas.

`routes-manifest.json` enumera cada ruta, método, controlador y DTO identificado. La colección comprueba respuestas 2xx y captura tokens e IDs mediante scripts locales de Postman. Un error 400, 401, 404 o 409 puede indicar variables pendientes, falta de permisos, registros inexistentes o reglas de negocio.

Se validaron la estructura de la colección y sus ejemplos; no se ejecutaron solicitudes contra la base de datos para generar el archivo.

Para regenerarla después de cambiar endpoints o DTOs:

```powershell
cd C:\shop\backend
node postman/generate-collection.cjs
```

Formato: [Postman Collection v2.1](https://schema.getpostman.com/json/collection/v2.1.0/collection.json).
