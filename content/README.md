# Proyectos comunitarios (mapa de `/proyectos`)

Toda la información de las cards está en **`content/proyectos.json`**.
Los archivos (fotos, PDF, páginas del libro) de cada proyecto van en su carpeta:

```
public/proyectos/<id>/
  fotos/          01.jpg, 02.jpg…  (fotos de la card y de la página del proyecto)
  periodico/      md/ y lg/ con las páginas en WebP (opcional, ver abajo)
```

## Campos de cada proyecto

| Campo | Qué es |
|---|---|
| `id` | Nombre corto sin espacios ni tildes (`comuna-1`). Es la dirección de la página: `/proyectos/comuna-1` y el nombre de su carpeta. |
| `titulo`, `lugar`, `anio`, `descripcion` | Textos de la card. La descripción debe ser corta (2–3 frases). |
| `coordenadas` | `latitud` y `longitud` en números. En Google Maps: clic derecho sobre el lugar → el primer número es la latitud y el segundo la longitud. |
| `fotos` | Lista de fotos. `archivo` es la ruta dentro de la carpeta del proyecto (`fotos/01.jpg`); `descripcion` describe la foto (se lee en voz alta para personas ciegas). La primera foto es la principal. |
| `enlace` *(opcional)* | Botón a un sitio externo: `{ "url": "https://…", "texto": "Ver video" }`. |
| `publicacion` *(opcional)* | Lector tipo libro: `titulo`, `carpeta` (donde están las páginas) y `paginas` (cantidad). |

El orden de la lista es el orden de los números en el mapa.

Si algo queda mal escrito (falta un campo, una coordenada fuera de Colombia,
un `id` repetido…), `npm run dev` / `npm run build` muestran un error que dice
qué proyecto y qué campo corregir.

## Agregar una publicación (lector tipo libro)

1. Instala una vez: `pip install pymupdf pillow`
2. Convierte el PDF en páginas:
   `python scripts/pdf-a-paginas.py "C:/ruta/mi-archivo.pdf" public/proyectos/<id>/periodico`
3. Agrega el bloque `publicacion` al proyecto en `proyectos.json`.

## Recomendaciones para las fotos

- JPG de máximo 1600 px de lado y menos de 400 KB (se pueden reducir en squoosh.app).
- Nombres sin espacios ni tildes: `01.jpg`, `taller-agua.jpg`.
- No uses fotos donde se reconozca a menores de edad sin autorización.
