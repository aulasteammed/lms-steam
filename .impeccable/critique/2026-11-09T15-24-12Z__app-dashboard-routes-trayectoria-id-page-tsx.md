---
target: plantilla de pagina de proyecto
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\telle\\OneDrive\\Documents\\UNAL\\INFO GENERAL\\AULA\\LMS\\lms-steam-main\\app\\(dashboard)\\(routes)\\trayectoria\\[id]\\page.tsx"
target_fingerprint: "sha256:c239fa265f973d24b71371a79c9a0026804d0f62e8e014dacc514fb4109b0922"
target_path: "C:\\Users\\telle\\OneDrive\\Documents\\UNAL\\INFO GENERAL\\AULA\\LMS\\lms-steam-main\\app\\(dashboard)\\(routes)\\trayectoria\\[id]\\page.tsx"
timestamp: 2026-11-09T15-24-12Z
slug: app-dashboard-routes-trayectoria-id-page-tsx
---
# Crítica: plantilla de página de proyecto (/trayectoria/[slug])

Método: dual-agent (A: revisión de diseño · B: detector), solo código (servidor caído; revisión de código pedida por la usuaria). Modo: Read.

## Puntuación: 24/40 (Aceptable)
| # | Heurística | Nota | Problema |
|---|---|---|---|
| 1 | Estado | 3 | Estática y clara; "2024 – actual" es la única señal de proyecto en curso |
| 2 | Mundo real | 2 | Estructura de caso de estudio; "Entregable" es jerga; dos listas de socios casi sinónimas |
| 3 | Control | 3 | Volver al mapa abre la card; desde un enlace compartido "Volver" no significa nada |
| 4 | Consistencia | 2 | La misma etiqueta de 11px es h2, dt y p; cinco radios; Inter aquí, Playfair en el blog con la misma paleta |
| 5 | Prevención | 2 | Descargar no dice el peso del PDF (pdfSizeBytes existe) |
| 6 | Reconocer | 3 | Puntos del mini-mapa sin nombre |
| 7 | Eficiencia | 2 | Sin anclas en relato largo; portada y "Leer" duplican destino |
| 8 | Minimalismo | 3 | Año dos veces, lugar dos o tres, leer dos |
| 9 | Errores | 2 | Fotos/portadas caídas sin respaldo; 404 genérico |
| 10 | Ayuda | 2 | Gestos del lector sin pista visible |

## Especificidad
Intercambiable en ~80 %: esqueleto de caso de estudio de agencia (eyebrow+H1, activo destacado, franja de datos, cuerpo+aside, galería, testimonio, descargas, relacionados, agradecimientos). Lo único propio: la publicación como objeto impreso y el lector. Límite real en el modelo de datos: sin participantes, autores, grado, institución anfitriona, aprendizajes, varias citas, nota por lugar; máximo 2 fotos. El periódico se muestra cerrado aunque pages[] ya existe. Tipografía: solo Inter; el blog con la misma paleta usa Playfair + IBM Plex.
Detector: 0 hallazgos (solo reglas por regex; las de contraste y tamaño de texto necesitan la página viva).

## Problemas prioritarios
1. [P1] Rejillas en `md:` ignoran el sidebar de 224px: a 768px el relato queda en ~132px y el titular en ~245px. Pasar a `lg:` o container queries.
2. [P1] Con datos mínimos (sin relato ni fotos) el mini-mapa cae en la columna ancha y queda cuadrado de ~610px con teselas estiradas.
3. [P1] Jerarquía: secciones como h2 de 11px igual que "PERIODO"; título de la publicación es <p>; galería y cita sin encabezado; PageBar no es nav.
4. [P2] La comunidad y el territorio no tienen dónde vivir en el modelo de datos.
5. [P2] Portada sin dimensiones (CLS en el LCP); botones de documento y Compartir 36px; Volver ~20px; acciones Leer+Descargar sin flex-wrap se desbordan a 320px y en tablet.

## Móvil
136px de barras fijas; hover pegado (fotos scale, portadas translate); 100vh en el lector; imágenes sin srcset; h1 sin break-words/hyphens.

## Personas
Jordan: llega al shell del LMS; no sabe quiénes participaron; no hay siguiente paso al final. Sam: seis h2 iguales; dos "Leer: X" seguidos. Casey: barras fijas, Compartir arriba a la derecha, botones de 36px.

## Menores
Contraste del crédito de foto (3,6:1); OSM tiles; key={i}; ExternalLink sin aviso de pestaña nueva; agradecimientos en voz baja; una sola foto deja media rejilla vacía.
