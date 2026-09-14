from pathlib import Path
import fitz
from PIL import Image, ImageFilter


src = next(Path('.').glob('*.pdf'))
out = src.with_name(src.stem + ' - sem expressão.pdf')
doc = fitz.open(src)
scale = 2.0


def cover(page_no, box, source_box=None, white=False):
    page = pages[page_no]
    x0, y0, x1, y1 = [round(v * scale) for v in box]
    w, h = x1 - x0, y1 - y0
    if white:
        patch = Image.new('RGB', (w, h), 'white')
    else:
        sx0, sy0, sx1, sy1 = [round(v * scale) for v in source_box]
        patch = image.crop((sx0, sy0, sx1, sy1)).resize((w, h), Image.Resampling.BICUBIC)
        patch = patch.filter(ImageFilter.GaussianBlur(radius=3 * scale))
    # A short feather keeps the replacement natural against the original artwork.
    mask = Image.new('L', (w, h), 255)
    edge = round(5 * scale)
    for i in range(edge):
        alpha = round(255 * (i + 1) / edge)
        mask.crop((i, i, w - i, h - i)).paste(alpha, (0, 0, w - 2 * i, h - 2 * i))
    image.paste(patch, (x0, y0), mask)


pages = []
for i in range(len(doc)):
    pix = doc[i].get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    pages.append(Image.frombytes('RGB', [pix.width, pix.height], pix.samples))

for page_no, image in enumerate(pages):
    if page_no == 0:
        # Main title over the parchment background.
        cover(page_no, (174, 226, 625, 360), (20, 215, 170, 365))
    elif page_no == 1:
        # The wordmark text; keep the colored puzzle illustration.
        cover(page_no, (376, 292, 645, 414), white=True)
    elif page_no == 2:
        # Wordmark inside the panel preview.
        cover(page_no, (294, 275, 455, 365), (205, 270, 290, 365))

new_doc = fitz.open()
for image in pages:
    pix = fitz.Pixmap(fitz.csRGB, image.width, image.height, False)
    pix.set_origin(0, 0)
    # PIL stores RGB bytes in the same order expected by PyMuPDF.
    pix.samples = image.tobytes()
    page = new_doc.new_page(width=image.width / scale, height=image.height / scale)
    page.insert_image(page.rect, pixmap=pix)
new_doc.save(out, deflate=True, garbage=4)
print(out)
