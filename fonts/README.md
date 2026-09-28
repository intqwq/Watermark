# Lumen Hand

An original, lightly slanted handwritten typeface made for Watermark Studio.
All 95 printable ASCII characters (U+0020 through U+007E) are drawn from the
pen paths in `build_font.py`: capitals, lowercase, digits, space and punctuation.
No outlines, tracings or letterforms from another font are imported.

The **intqwq@X** signature preset uses the user-supplied PNG in
`dist/signatures/intqwq-x.png`, separately from this font. Its white background
is made transparent in the browser, with the original ink shape and antialiasing
preserved. The thumbnail and watermark use the same prepared image, so no
private-use font character is needed. Editing its text returns to handwriting.

![Original handwritten ASCII specimen](specimen.png)

The centerlines are expanded with gently varying pressure into closed outlines.
The checked-in TTF and WOFF2 files live in `dist/fonts/`; the application needs
no font-building libraries at runtime. Characters outside ASCII use the browser's
normal fallback font, including Chinese.

To rebuild with Python 3:

```sh
python -m pip install 'fonttools[woff]' shapely brotli
python fonts/build_font.py
```

The source and generated font files are included in this project so the original
design can be inspected and rebuilt.
