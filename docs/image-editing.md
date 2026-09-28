# Image editing

- Paste an image with **Ctrl+V** (Windows/Linux) or **⌘V** (macOS) while the page is focused. Dropping and choosing files continue to work. Plain-text paste in text fields is preserved. Only clipboard image bytes are used; HTML image URLs are not fetched.
- **Crop** opens a selection. Drag inside to move it, drag a corner to resize, or drag outside to start another selection. Use an aspect-ratio preset or enter exact pixel coordinates/dimensions. Exact width/height input switches the preset to Free. Apply or cancel before exporting.
- **Rotate left/right** turns the current image 90 degrees. **Undo edit** reverses an image edit; **Restore original** resets image edits and can itself be undone. These controls leave watermark styling intact; the sidebar Reset resets watermark settings.
- Drag the visible watermark with a mouse, pen or touch. Free placement also offers horizontal/vertical sliders. With the canvas focused, arrow keys move by one output-image pixel; Shift moves by ten. During cropping, those keys move the crop selection; Enter applies and Escape cancels.
- Watermarks stay upright in the edited image. Corner presets anchor to its corners; free placement uses the watermark center's relative position. The renderer clamps the whole watermark inside the image and ignores corner spacing in free mode.

## Rendering and data

The original bitmap stays in memory. `image-edit.js` stores quarter-turn orientation and a rectangular view in the oriented original's coordinates. Rotating a crop transforms that rectangle; another crop adds its offset to the current view. Undo stores these small descriptions rather than bitmap copies. Export draws from the original once, then adds the visible watermark and optional Trace ID. Alpha is retained; metadata is not copied.

Preview and export call the same image and watermark renderers. Preview may be reduced to 1,800 pixels on its longer edge; input coordinates are mapped from its displayed rectangle into output-image coordinates. Crop shading, handles, guides and focus outlines are preview-only.

An image selection retains its Trace ID while editing; record dimensions change with the output. See [Trace ID](trace-id.md) for its minimum dimensions and limitations.

## Verification

Automated tests cover pixel order for every quarter-turn, successive crop/rotation composition, selection bounds and aspect ratios, display-coordinate mapping, clipboard image selection and ordinary text paste, pointer grab offsets and capture, keyboard placement, cancellation, undo/restore, export locks, free watermark placement, and existing signature/Trace ID behavior. Controller tests use DOM doubles, not a real browser.

Browser preview access was previously denied. These changes have not received browser visual or end-to-end clipboard/download verification; code tests and deployed-file checks do not replace those checks.
