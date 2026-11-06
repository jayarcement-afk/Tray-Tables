/**
 * Pixel stamps from *Achivements Tray Tables.docx* (column **Stamp Image**).
 *
 * Each row’s image is stored in the docx as `word/media/imageN.png`, referenced from the table cell
 * via DrawingML `a:blip` → relationship id → `document.xml.rels`. Files are copied to
 * `/public/imported-passport-stamps/stamp-{NN}-from-doc.png` (achievement **number** 1–32, not row order).
 *
 * Rebuild after updating the Word doc: unzip the docx, map table `Number` → embedded image, copy media
 * into `public/imported-passport-stamps/` and refresh this map if filenames change.
 */
export const PASSPORT_STAMP_DOC_IMAGE_SRC: Partial<Record<number, string>> = {
  1: "/imported-passport-stamps/stamp-01-from-doc.png",
  2: "/imported-passport-stamps/stamp-02-from-doc.png",
  3: "/imported-passport-stamps/stamp-03-from-doc.png",
  4: "/imported-passport-stamps/stamp-04-from-doc.png",
  5: "/imported-passport-stamps/stamp-05-from-doc.png",
  6: "/imported-passport-stamps/stamp-06-from-doc.png",
  7: "/imported-passport-stamps/stamp-07-from-doc.png",
  8: "/imported-passport-stamps/stamp-08-from-doc.png",
  9: "/imported-passport-stamps/stamp-09-from-doc.png",
  10: "/imported-passport-stamps/stamp-10-from-doc.png",
  11: "/imported-passport-stamps/stamp-11-from-doc.png",
  12: "/imported-passport-stamps/stamp-12-from-doc.png",
  13: "/imported-passport-stamps/stamp-13-from-doc.png",
  14: "/imported-passport-stamps/stamp-14-from-doc.png",
  15: "/imported-passport-stamps/stamp-15-from-doc.png",
  16: "/imported-passport-stamps/stamp-16-from-doc.png",
  17: "/imported-passport-stamps/stamp-17-from-doc.png",
  18: "/imported-passport-stamps/stamp-18-from-doc.png",
  19: "/imported-passport-stamps/stamp-19-from-doc.png",
  20: "/imported-passport-stamps/stamp-20-from-doc.png",
  21: "/imported-passport-stamps/stamp-21-from-doc.png",
  22: "/imported-passport-stamps/stamp-22-from-doc.png",
  23: "/imported-passport-stamps/stamp-23-from-doc.png",
  24: "/imported-passport-stamps/stamp-24-from-doc.png",
  25: "/imported-passport-stamps/stamp-25-from-doc.png",
  26: "/imported-passport-stamps/stamp-26-from-doc.png",
  27: "/imported-passport-stamps/stamp-27-from-doc.png",
  28: "/imported-passport-stamps/stamp-28-from-doc.png",
  29: "/imported-passport-stamps/stamp-29-from-doc.png",
  30: "/imported-passport-stamps/stamp-30-from-doc.png",
  31: "/imported-passport-stamps/stamp-31-from-doc.png",
  32: "/imported-passport-stamps/stamp-32-from-doc.png",
};
