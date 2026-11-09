---
target: seccion de trayectoria publica (usuario final)
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\telle\\OneDrive\\Documents\\UNAL\\INFO GENERAL\\AULA\\LMS\\lms-steam-main\\app\\(dashboard)\\(routes)\\trayectoria"
timestamp: 2026-11-09T07-00-22Z
slug: app-dashboard-routes-trayectoria
---
# Crítica: Trayectoria pública (visitante, no modo profesor)

Método: dual-agent (A: revisión de diseño · B: detector) + capturas con emulación móvil (Chrome headless vía DevTools) contra localhost:3000, hechas después de ambas evaluaciones.
Modo de superficie: Experience (mapa-recorrido) con sub-superficies Read (ficha y lector).

## Puntuación (Nielsen)
| # | Heurística | Nota | Problema clave |
|---|---|---|---|
| 1 | Estado del sistema | 2 | Sin "3 de 12" en el recorrido; "Cargando mapa…" solo se apaga en `load`, no hay estado de error |
| 2 | Lenguaje del mundo real | 3 | Copy cálido; pero cada registro vive en su año de FIN |
| 3 | Control y libertad | 1 | Tocar el mapa oculta el recorrido; volver de una ficha reinicia todo; estado no está en la URL |
| 4 | Consistencia | 2 | "Ver todos" / "Todos los años" / re-clic en año = lo mismo; ícono Globe también en "Volver" |
| 5 | Prevención de errores | 3 | Años vacíos deshabilitados; arrastre accidental en móvil oculta todo |
| 6 | Reconocer vs recordar | 2 | Sin leyenda del punto azul (publicación) ni del cluster; nombres de marcador solo en hover |
| 7 | Flexibilidad | 2 | Lector con atajos; mapa sin búsqueda ni enlaces profundos |
| 8 | Estética minimalista | 2 | Escritorio limpio; en celular controles encimados (confirmado en captura) |
| 9 | Recuperación de errores | 1 | 404 por defecto en inglés (confirmado); sin error.tsx; sin fallback si el mapa falla |
| 10 | Ayuda | 1 | Nada explica que el scroll mueve el mapa ni qué significan colores/puntos |
| Total | | 20/40 | Aceptable (límite inferior) |

## Veredicto de especificidad
Medio anclado. Propio: el relieve andino con toponimia en español y las publicaciones tratadas como objeto impreso (portada con lomo, flip-book). Genérico: tarjetas blancas rounded-2xl shadow-xl, pills, eyebrows en mayúsculas copiados en 3 archivos, marcadores de 26px. El territorio aparece solo como puntos. El chrome del LMS (sidebar slate/sky, Registrarse/Iniciar sesión) es un segundo lenguaje visual alrededor de una superficie editorial cálida.
Detector: 1 hallazgo advisory, `bounce-easing` en intro-card.tsx:92 (`md:animate-bounce` infinito sin motion-safe). Verdadero positivo; coincide con la revisión A.

## Problemas prioritarios
1. [P1] El mapa en celular no funciona como mapa: hoja de tarjetas 60%, línea de tiempo y pila de controles anclados a porcentajes. iPhone SE: "Publicaciones" queda debajo del selector de tipo y "Ver todos" medio tapado; no queda franja visible de mapa. 390×844: "Cargando mapa…" se encima sobre "Publicaciones". Horizontal (844×390): entra el layout de escritorio con sidebar, el h1 se sale de la tarjeta, página scrollea 170px. Fix: bottom sheet con estados peek/medio/completo; sacar Publicaciones de la pila de mapa; ocultar ± en pointer:coarse; anclar a la altura de la hoja, no a %.
2. [P1] El estado del recorrido es frágil: cualquier drag/pinch oculta las tarjetas (projects-map.tsx:687-689) sin forma de volver salvo "Ver todos" que reinicia; tipo/año/registro no están en la URL, así que "Volver al mapa" y el botón atrás llevan al inicio. Fix: search params (?tipo=&anio=&registro=), "Volver al mapa" a ?registro=slug, colapsar a una pastilla "Mostrar recorrido · 3 de 12".
3. [P1] Teclado, lector de pantalla y movimiento: columna oculta con aria-hidden+opacity pero focusable; marcadores primero en el DOM; flyTo essential:true ignora reduced-motion; bounce infinito; descarga del lector sin nombre en móvil. Fix: inert, reordenar DOM + "Saltar al recorrido", essential:false, motion-safe, aria-label, región aria-live.
4. [P2] La línea de tiempo cuenta la trayectoria al revés: año = año de fin (lib/timeline.ts:80-81), "Comenzar recorrido" arranca en el año más reciente, el último card del año es un callejón sin salida. Fix: año de inicio o rango; empezar por el más antiguo; card final "Siguiente: 2023 →".
5. [P2] Estados faltantes o rotos: 404 en inglés (confirmado), sin error.tsx; Publicaciones muestra "0 documentos / Aún no hay publicaciones" aunque Brazo Robótico tiene un PDF leíble (probable caché `all-documents` vieja); tarjeta sin fotos deja bloque gris; tipos con 0 registros seleccionables con lista vacía; fullscreen muerto en iPhone.

## Capa móvil nativa
- Sin `-webkit-tap-highlight-color` → destello gris al tocar.
- Tailwind 3.4 sin `hoverOnlyWhenSupported` → hover pegado (portadas con -translate-y, fotos con scale).
- Sin export `viewport` ni `theme-color`.
- flip-book usa 100vh (flip-book.tsx:472-476) → dvh.
- Breakpoint md por ancho → teléfono horizontal recibe layout de escritorio.
- `min-h-[480px]` en el mapa + navbar 80px → la página scrollea en horizontal y el mapa se come el gesto.
- Objetivos táctiles medidos <44px: selector de tipo 36px alto, años 36px, Comenzar recorrido 36px, Publicaciones/Ver todos 40px, ± 40×40, marcadores 26×26, Compartir 36px, Volver al mapa 20px alto, Leer/Descargar 36px, puntos del carrusel ~6px.
- Sin inputs en la sección → zoom de input no aplica.
- Requiere teléfono real: hover pegado, destello, fluidez del flyTo con scroll-snap, pinch en lector, fullscreen en iPhone.

## Personas
- Jordan (primera vez): "Trayectoria" ambiguo y detrás del menú hamburguesa; nada explica que el scroll mueve el mapa; chevron hacia abajo en un carrusel horizontal; punto azul sin leyenda; no encuentra un proyecto de 2019 en 2019; CTA "Ver más" genérico.
- Sam (teclado/lector): canvas "Map" en inglés, todos los marcadores antes de los controles, tarjetas invisibles pero enfocables, Esc global oculta el recorrido, sin anuncios al cambiar de año; la publicación son imágenes "Página 3 de 12".
- Casey (una mano): selector de tipo arriba a la derecha (zona más difícil), objetivos chicos, swipe de tarjetas cerca del mapa dispara drag que oculta todo; en la ficha 80px navbar + 56px barra sticky = 136px de chrome.

## Observaciones menores
- text-editorial-muted (~3.5:1) en texto chico: conteos del selector, créditos de fotos.
- Etiquetas de marcador nowrap sin max-width.
- `<img>` sin srcset/sizes; portadas sin dimensiones (CLS); primera imagen de cada tarjeta eager.
- Mini-mapa usa tile.openstreetmap.org directo (política de uso de OSM) y otro estilo cartográfico.
- Ambas fotos de la ficha tienen como pie el título del proyecto: el pie no aporta información.
- Copy de Publicaciones: falta punto final y "aula" en minúscula.
- Dos configs de Tailwind (.js y .ts).
- Error de hidratación en NavbarRoutes al emular móvil (global, fuera de alcance, aparece en todas las páginas).

## Preguntas
1. Si es una trayectoria, ¿por qué nunca se ven proyectos, participaciones y alianzas juntos en el mapa?
2. ¿Contarían su historia en persona empezando por hoy y fechando cada proyecto por el año en que terminó?
3. En celular, donde miran las comunidades, ¿el primer pantallazo debería ser el mapa o la historia?
4. El periódico hecho con la comunidad es lo más valioso; ¿por qué en el mapa es un punto de 12px sin leyenda?
