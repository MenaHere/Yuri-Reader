import 'dart:async';

import 'package:flutter/material.dart';
import 'package:yuri_reader/router/router.dart';

/// The manga completion percentage (MAL-Sync's `mangaCompletionPercentage`,
/// default 90): the reader bumps the tracker when this share of the chapter's
/// pages has been read. Loaded from the sync service at startup and edited in
/// the MAL-Sync settings screen.
final ValueNotifier<int> malsyncCompletionPercentage = ValueNotifier<int>(90);

/// The confirm bar currently on screen, so it can be taken down when the reader
/// is left instead of lingering over another screen.
OverlayEntry? _activeConfirm;
VoidCallback? _activeConfirmCancel;

/// MAL-Sync's `flashm` bar, replicated from `utils/general.ts`: a fixed bar at
/// the bottom, centered, `max-width: 60%`, `background: #323232` (or `#3e0808`
/// on error), white 14px text, `padding: 14px 24px`, `border-radius: 2px`, with
/// the pink `Undo` / `Wrong?` buttons under it when a sync can be undone. It
/// slides down over 800ms, stays 4s, then collapses to an 8px sliver.
void showMalSyncFlash(
  String message, {
  bool error = false,
  VoidCallback? onUndo,
  VoidCallback? onWrong,
}) {
  final overlay = navigatorKey.currentState?.overlay;
  if (overlay == null) return;
  late OverlayEntry entry;
  entry = OverlayEntry(
    builder: (context) => MalSyncFlashBar(
      message: message,
      error: error,
      onUndo: onUndo,
      onWrong: onWrong,
      onDone: () => entry.remove(),
    ),
  );
  overlay.insert(entry);
}

/// Records the confirm bar currently on screen, with the callback that settles
/// its answer as "no" when it is taken down.
void registerMalSyncConfirm(OverlayEntry entry, VoidCallback onCancel) {
  _activeConfirm = entry;
  _activeConfirmCancel = onCancel;
}

/// Takes down the confirm bar, if one is up. Called when the reader route is
/// disposed: MAL-Sync's `flashConfirm` is permanent on a web page, but here it
/// must not follow the user out of the reader.
void dismissMalSyncConfirm() {
  final entry = _activeConfirm;
  if (entry == null) return;
  _activeConfirm = null;
  final cancel = _activeConfirmCancel;
  _activeConfirmCancel = null;
  entry.remove();
  cancel?.call();
}

class MalSyncFlashBar extends StatefulWidget {
  const MalSyncFlashBar({
    super.key,
    required this.message,
    required this.onDone,
    this.error = false,
    this.onUndo,
    this.onWrong,
  });

  final String message;
  final bool error;
  final VoidCallback? onUndo;
  final VoidCallback? onWrong;
  final VoidCallback onDone;

  @override
  State<MalSyncFlashBar> createState() => _MalSyncFlashBarState();
}

class _MalSyncFlashBarState extends State<MalSyncFlashBar> {
  bool _visible = false;
  bool _collapsed = false;

  @override
  void initState() {
    super.initState();
    // slideDown(800): the bar grows from nothing.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() => _visible = true);
    });
    // delay(4000), then collapse to the 8px sliver.
    Timer(const Duration(milliseconds: 4800), () {
      if (mounted) setState(() => _collapsed = true);
    });
    // and take it down once the collapse has played out.
    Timer(const Duration(milliseconds: 5600), () {
      if (mounted) widget.onDone();
    });
  }

  @override
  Widget build(BuildContext context) {
    final maxWidth = MediaQuery.of(context).size.width * 0.6;
    final hasButtons = widget.onUndo != null || widget.onWrong != null;
    final bar = Container(
      constraints: BoxConstraints(maxWidth: maxWidth),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      decoration: BoxDecoration(
        color: widget.error
            ? const Color(0xFF3e0808)
            : const Color(0xFF323232),
        borderRadius: BorderRadius.circular(2),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            widget.message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w400,
              height: 17 / 14,
            ),
          ),
          if (hasButtons)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (widget.onUndo != null)
                    _FlashButton(label: 'Undo', onTap: widget.onUndo!),
                  if (widget.onUndo != null && widget.onWrong != null)
                    const SizedBox(width: 8),
                  if (widget.onWrong != null)
                    _FlashButton(label: 'Wrong?', onTap: widget.onWrong!),
                ],
              ),
            ),
        ],
      ),
    );
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Align(
        alignment: Alignment.bottomCenter,
        child: AnimatedSize(
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeOut,
          child: _collapsed
              ? const SizedBox(width: 0, height: 8)
              : _visible
              ? bar
              : const SizedBox(width: 0, height: 0),
        ),
      ),
    );
  }
}

/// A bare pink text button, the way MAL-Sync styles the buttons inside its
/// bars: transparent, no border, `color: rgb(255,64,129)`, `margin-top: 10px`.
class _FlashButton extends StatelessWidget {
  const _FlashButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Text(
        label,
        style: const TextStyle(
          color: Color(0xFFFF4081),
          fontSize: 14,
          fontWeight: FontWeight.w400,
          height: 17 / 14,
        ),
      ),
    );
  }
}

/// MAL-Sync's `flashConfirm`, replicated: a permanent bar at the top with the
/// question, an optional score dropdown (the "Set as completed?" bar carries
/// one), and pink Yes/No buttons, the way the extension asks "Start reading?"
/// and "Set as completed?".
class MalSyncFlashConfirm extends StatefulWidget {
  const MalSyncFlashConfirm({
    super.key,
    required this.message,
    required this.onAnswer,
    this.scoreOptions = const [],
  });

  final String message;
  final void Function(bool answer, int? score) onAnswer;

  /// The entry's score options as `{value, label}` maps, from `entry.find`.
  final List<Map<String, dynamic>> scoreOptions;

  @override
  State<MalSyncFlashConfirm> createState() => _MalSyncFlashConfirmState();
}

class _MalSyncFlashConfirmState extends State<MalSyncFlashConfirm> {
  bool _visible = false;
  int? _score;

  @override
  void initState() {
    super.initState();
    // slideDown(800): the bar grows from nothing.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() => _visible = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final maxWidth = MediaQuery.of(context).size.width * 0.6;
    final bar = Container(
      constraints: BoxConstraints(maxWidth: maxWidth),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF323232),
        borderRadius: BorderRadius.circular(2),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            widget.message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w400,
              height: 17 / 14,
            ),
          ),
          if (widget.scoreOptions.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: DropdownButton<int>(
                value: _score,
                underline: const SizedBox.shrink(),
                dropdownColor: const Color(0xFF4e4e4e),
                style: const TextStyle(color: Colors.white, fontSize: 14),
                items: widget.scoreOptions
                    .map(
                      (option) => DropdownMenuItem<int>(
                        value: (option['value'] as num?)?.toInt(),
                        child: Text('${option['label']}'),
                      ),
                    )
                    .toList(),
                onChanged: (value) => setState(() => _score = value),
              ),
            ),
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _FlashButton(
                  label: 'Yes',
                  onTap: () => widget.onAnswer(true, _score),
                ),
                const SizedBox(width: 24),
                _FlashButton(
                  label: 'No',
                  onTap: () => widget.onAnswer(false, _score),
                ),
              ],
            ),
          ),
        ],
      ),
    );
    return Positioned(
      left: 0,
      right: 0,
      top: 0,
      child: Align(
        alignment: Alignment.topCenter,
        child: AnimatedSize(
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeOut,
          child: _visible ? bar : const SizedBox(width: 0, height: 0),
        ),
      ),
    );
  }
}
