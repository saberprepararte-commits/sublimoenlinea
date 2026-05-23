# Sublimo Shop

Plantilla web estática para una tienda tipo galería. Permite mostrar productos, filtrar por categoría, buscar productos y enviar consultas por WhatsApp con un mensaje específico por producto.

## Archivos principales

- `index.html`: página pública de la tienda.
- `admin.html`: panel privado de administración.
- `styles.css`: estilos visuales y responsive.
- `app.js`: productos, filtros, WhatsApp, login y administración.
- `sublimo-logo.png`: logo principal usado en el encabezado.
- `hero-sublimo.png`: banner principal.
- `hero-sublimo-mobile.png`: banner optimizado para celulares.
- `assets/`: copia de respaldo de imágenes.

## Cómo usar

Abre `index.html` en el navegador para ver la tienda.

Para administrar productos, entra a:

```text
admin.html
```

Clave inicial:

```text
admin123
```

## Importante

Esta plantilla usa `localStorage`, por lo que los productos se guardan en el navegador donde se editen. Para una tienda publicada con usuarios reales, conviene conectar el panel a un backend o base de datos con autenticación real.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube todos los archivos de esta carpeta.
3. En GitHub, ve a `Settings > Pages`.
4. En `Build and deployment`, selecciona la rama principal y la carpeta raíz.
5. Guarda los cambios y espera a que GitHub genere la URL pública.
