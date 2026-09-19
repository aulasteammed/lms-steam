"""
Convierte un PDF en imágenes WebP para el lector tipo libro de /proyectos.

Uso (desde la raíz del proyecto):
    pip install pymupdf pillow
    python scripts/pdf-a-paginas.py "ruta/al/archivo.pdf" public/proyectos/<id>/<carpeta>

Genera dos tamaños en la carpeta de destino:
    md/  páginas del libro (1100 px)
    lg/  vista ampliada (1600 px)
y muestra cuántas páginas tiene el PDF (valor para "paginas" en proyectos.json).
"""
import io
import sys
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

SIZES = {"md": (1100, 80), "lg": (1600, 76)}


def main() -> None:
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    pdf_path, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    doc = fitz.open(pdf_path)
    for size in SIZES:
        (out_dir / size).mkdir(parents=True, exist_ok=True)

    for number, page in enumerate(doc, start=1):
        # Render a ~1600 px de ancho y luego se reduce para cada tamaño.
        zoom = max(SIZES["lg"][0] / page.rect.width, 1)
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        image = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")

        for size, (width, quality) in SIZES.items():
            height = round(image.height * width / image.width)
            image.resize((width, height), Image.LANCZOS).save(
                out_dir / size / f"{number:02d}.webp", "WEBP", quality=quality, method=6
            )
        print(f"  página {number}/{doc.page_count}")

    print(f'\nListo. En proyectos.json usa "paginas": {doc.page_count}')


if __name__ == "__main__":
    main()
