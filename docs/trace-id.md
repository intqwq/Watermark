# Invisible Trace ID v1

Trace ID is an original, experimental blind image watermark implemented in this repository. It is not Google SynthID and cannot be read by Google's detector. It needs no server, model download, account, or original image to read an ID.

## Using it

1. Select an image. Invisible Trace ID is on by default, including after Reset.
2. Download the PNG. The visible watermark is drawn first, then the invisible ID is embedded and read back for verification. A failed embedding never produces a download marked as successful.
3. Save the export record. It includes the ID, export and source filenames, dimensions, visible text, timestamp, and SHA-256 of that exact PNG. Records also stay in this browser's local storage, when available. Clearing browser data removes these local records; the JSON download is the backup.
4. Use **Check an image** to recover an ID from a received or found image. A matching local record is shown if one exists. Otherwise, compare the recovered ID with your saved JSON record.

Each selected image gets a cryptographically random 128-bit ID (`WM1-` plus 32 hexadecimal digits). Repeated exports from that selection share its ID, while their hashes can differ. Selecting the image again generates a new ID. The ID becomes part of the image pixels and is not secret.

Cropping, rotating, undoing and restoring within the editor retain that selection's ID. Export records use the resulting dimensions. Trace ID is embedded after the image edits and visible watermark, so these editor operations do not damage the new watermark. Editing an already exported image in another app can still damage its existing ID. Crops smaller than 256 × 256 require turning Trace ID off before export.

Images, IDs and export records are not uploaded. Heavy pixel processing runs in a local module worker. The normal preview shows the visible watermark; the small pixel changes from Trace ID are applied on download. Switching Trace ID off prevents a new embedding and does not remove an existing one.

## Limits

- This identifies copies you supply to the checker. It does not search the internet, report views, locate viewers, or send callbacks.
- It is not a cryptographic signature, proof of authorship, or proof of authenticity. Anyone with this public algorithm can copy, alter, remove or forge an ID. The checksum rejects accidental decoding errors; it does not authenticate a person. The JSON hash identifies exact file bytes, not authorship.
- Resizing and rotation can destroy the signal. Compression, cropping, color adjustments, overlays and other edits may also prevent recovery. There is no guarantee of recovery from a social platform's re-encoded image or a screenshot.
- Embedding needs at least 256 × 256 pixels and four usable copies of every payload bit. All pixels in a used 8 × 8 block must be fully opaque. Sparse transparent artwork can fail even if its dimensions meet the minimum. Disable Trace ID to export unsupported images.
- The watermark subtly changes RGB pixels, including potentially visible texture in very flat regions. Alpha and blocks containing any translucent or transparent pixel are left unchanged.
- “No verified Trace ID found” does not establish that an image is unmarked; it can also mean damage or a different watermark format.

## Format and algorithm

`dist/trace-codec.js` implements quantization of the difference between two luminance DCT coefficients, at frequencies (2,1) and (1,2), in each 8 × 8 block. The lattice step is 24. Even or odd lattice positions encode a bit. Equal RGB adjustments preserve chroma approximately; limited corrective passes compensate for integer rounding and clipping.

A 16 × 16 block tile repeats a 256-bit frame. Within a tile, the bit index is `(slot * 73 + 19) mod 256`. The byte layout is:

| Bytes | Content |
| --- | --- |
| 0–7 | ASCII `WMSID001` |
| 8–23 | 128-bit ID |
| 24–27 | CRC-32 of bytes 0–23, big-endian |
| 28–31 | ASCII `TRC1` |

Detection sums cosine soft votes over repeated tiles and accepts a decoded frame only if the header, trailer and CRC all match. It requires at least two samples of every bit. Crop search checks all eight pixel offsets in each dimension and all tile phases. Large-image detection samples distributed whole tiles to limit work. It does not perform scale or rotation search. Version changes to the lattice or payload need a new decoder/version, not a silent parameter change.

## Validation scope

`npm test` covers full-ID recovery, pixel distortion, non-block-aligned cropping, brightness changes, a small overlay, alpha preservation, insufficient capacity, unmarked images, and worker message/buffer transfer. Those are deterministic fixtures, not a population-level robustness or false-positive estimate.

Additional offline JPEG checks used Pillow's [hopper test image](https://github.com/python-pillow/Pillow/blob/main/Tests/images/hopper.jpg), resized to 512 × 512 before embedding. With the final step of 24, RGB PSNR was 45.89 dB and the largest channel change was 7 levels out of 255. The ID recovered at JPEG quality settings 95, 85, 75 and 60 on this one fixture. These settings are encoder-specific and do not establish universal JPEG tolerance.

Local browser automation was denied during development. Browser worker execution, downloads, the new controls and responsive visual layout have not been verified end to end in a browser for this feature. Code and deployment checks are separate from that missing validation.
