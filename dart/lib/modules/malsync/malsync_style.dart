import 'package:flutter/material.dart';

/// The MAL-Sync app's own look, so the screens that show its data read as the
/// same product: these are its colours, sizes and spacing, taken from
/// `src/_minimal/less` of the malsync tree the bridge is built from.
///
/// Nothing here is invented: the palette, the status colours and the cover
/// ratio are theirs, so a change in malsync can be followed by changing these.
abstract final class MalSyncStyle {
  // ---- Palette ---------------------------------------------------------

  /// Body text: `#333333` light, white dark.
  static Color text(BuildContext context) => _dark(context)
      ? Colors.white
      : const Color(0xFF333333);

  /// Fainter text: `#828282` light, `#afafaf` dark.
  static Color lightText(BuildContext context) => _dark(context)
      ? const Color(0xFFAFAFAF)
      : const Color(0xFF828282);

  /// Their primary, unchanged between themes.
  static const primary = Color(0xFF4C8FF2);

  /// Their secondary (red), unchanged between themes.
  static const secondary = Color(0xFFEB5757);

  /// The page behind the cards.
  static Color background(BuildContext context) =>
      _dark(context) ? const Color(0xFF353535) : Colors.white;

  /// The raised surface a card or a control sits on.
  static Color foreground(BuildContext context) =>
      _dark(context) ? const Color(0xFF5E5E5E) : Colors.white;

  /// Their neutral backdrop, used for dividers and the switch track.
  static Color backdrop(BuildContext context) =>
      _dark(context) ? const Color(0xFF5E5E5E) : const Color(0xFFEBEBEB);

  static bool _dark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  /// What each tracked state is painted with. The numbers are malsync's:
  /// 0 no state, 1 watching/reading, 2 completed, 3 on hold, 4 dropped,
  /// 6 plan to watch/read.
  static const stateColors = <int, Color>{
    0: Color(0xFF808080),
    1: Color(0xFF27AE60),
    2: Color(0xFF56CCF2),
    3: Color(0xFFF2994A),
    4: Color(0xFFEB5757),
    6: Color(0xFFBB6BD9),
  };

  static Color stateColor(int state) =>
      stateColors[state] ?? stateColors[0]!;

  // ---- Spacing and size ------------------------------------------------

  /// `--size-spacer`: 30px in their app, 15px in its narrow layout.
  static const spacer = 30.0;
  static const spacerHalf = 15.0;

  /// Covers are 225 by 350 there.
  static const coverAspectRatio = 225 / 350;

  /// Their grid: `repeat(auto-fill, minmax(100px, 1fr))`.
  static const gridMinWidth = 100.0;

  static const baseFontSize = 16.0;
  static const tinyText = 12.0;
  static const smallText = 14.0;
  static const largeText = 24.0;

  /// A rounded pill, which their buttons and dropdowns use.
  static const pillRadius = 15.0;

  /// The state names their app shows, in their order, with the values it sends.
  static const listStates = <int>[7, 1, 2, 3, 4, 6];

  /// The name of a state, in the wording their app uses for the type.
  static String stateName(int state, {required bool isManga}) {
    switch (state) {
      case 1:
        return isManga ? 'Reading' : 'Watching';
      case 2:
        return 'Completed';
      case 3:
        return 'On Hold';
      case 4:
        return 'Dropped';
      case 6:
        return isManga ? 'Plan to Read' : 'Plan to Watch';
      case 7:
        return 'All';
      default:
        return 'None';
    }
  }
}
