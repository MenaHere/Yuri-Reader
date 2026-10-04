// Renders the Yuri-Reader "ユ" icon at any size, matching
// dart/assets/app_icons/icon_v0.7.0_current.svg.
// Usage: render_icon <size> <out.png> [grey|glyph]
//   grey  - the app icon on a light grey backdrop (preview)
//   glyph - only the ユ strokes, on a transparent background. The UI tints the
//           logo (More/About, the TV rail), so it must carry no cream square,
//           or the tint paints a solid block over it.
//   none  - the app icon: the cream rounded square with the orange ユ
#include <cairo/cairo.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void rounded_rect(cairo_t *cr, double w, double h, double r) {
  cairo_new_sub_path(cr);
  cairo_arc(cr, w - r, r, r, -M_PI / 2, 0);
  cairo_arc(cr, w - r, h - r, r, 0, M_PI / 2);
  cairo_arc(cr, r, h - r, r, M_PI / 2, M_PI);
  cairo_arc(cr, r, r, r, M_PI, 3 * M_PI / 2);
  cairo_close_path(cr);
}

int main(int argc, char **argv) {
  if (argc < 3) {
    fprintf(stderr, "usage: render_icon <size> <out.png> [grey|glyph]\n");
    return 1;
  }
  const int S = atoi(argv[1]);
  const char *out = argv[2];
  const int glyph = argc > 3 && strcmp(argv[3], "glyph") == 0;
  const int grey = argc > 3 && !glyph;
  const double k = S / 512.0;

  cairo_surface_t *surf =
      cairo_image_surface_create(CAIRO_FORMAT_ARGB32, S, S);
  cairo_t *cr = cairo_create(surf);

  if (!glyph) {
    if (grey) {
      cairo_set_source_rgb(cr, 0.87, 0.87, 0.87);
      cairo_paint(cr);
    }

    // Rounded square, #ffffe5.
    rounded_rect(cr, S, S, 116 * k);
    cairo_set_source_rgb(cr, 1.0, 1.0, 0xE5 / 255.0);
    cairo_fill(cr);
  }

  // Katakana ユ, #ff8c00.
  cairo_set_source_rgb(cr, 0xFF / 255.0, 0x8C / 255.0, 0x00 / 255.0);
  cairo_set_line_width(cr, 46 * k);
  cairo_set_line_cap(cr, CAIRO_LINE_CAP_ROUND);
  cairo_set_line_join(cr, CAIRO_LINE_JOIN_ROUND);

  // Top stroke: (145,170) -> (351,154) -> (265,330).
  cairo_move_to(cr, 145 * k, 170 * k);
  cairo_line_to(cr, 351 * k, 154 * k);
  cairo_line_to(cr, 265 * k, 330 * k);
  cairo_stroke(cr);

  // Baseline: quadratic (55,360) Q(250,322) (455,345), as a cubic.
  cairo_move_to(cr, 55 * k, 360 * k);
  cairo_curve_to(cr, 185 * k, 334.667 * k, 318.333 * k, 329.667 * k,
                 455 * k, 345 * k);
  cairo_stroke(cr);

  cairo_surface_write_to_png(surf, out);
  cairo_destroy(cr);
  cairo_surface_destroy(surf);
  return 0;
}
