# Proyectos, participaciones y alianzas (mapa de `/proyectos`)

Los registros del mapa y la línea de tiempo **ya no se editan en archivos**.
Se crean y se editan en el panel de profesor, en **`/teacher/proyectos`**, y se
guardan en la base de datos. Las fotos y los documentos se suben desde el mismo
panel.

Un registro aparece en el mapa cuando se **publica**. Mientras sea borrador solo
se ve en el panel.

## Lo único que sigue en esta carpeta

**`proyectos-portada.json`**: el título y el texto de la card de bienvenida del
mapa.

```json
{
  "titulo": "Proyectos comunitarios",
  "texto": "Procesos construidos junto a comunidades…"
}
```

## Documentos (periódico, revista, entregable, informe)

En el panel se sube solo el PDF. El navegador arma las páginas para el visor;
ya no hace falta `scripts/pdf-a-paginas.py`.
