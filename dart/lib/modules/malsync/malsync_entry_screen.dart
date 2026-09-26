import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:yuri_reader/modules/malsync/malsync_meta_sections.dart';
import 'package:yuri_reader/modules/malsync/malsync_screen.dart';
import 'package:yuri_reader/modules/malsync/malsync_style.dart';
import 'package:yuri_reader/services/yuri_sync/yuri_sync_service.dart';
import 'package:yuri_reader/utils/cached_network.dart';

/// One entry's own page, laid out the way MAL-Sync's app lays it out: the
/// cover and the controls in a 300px column beside the title once the window
/// is wide enough, and stacked on a narrow one. The controls are its
/// `overview-update-ui` - a progress count with a step mark, a slider, volume
/// for manga, the status pill and the score - and each saves through the
/// bridge as it changes, which is how its app saves them.
class MalSyncEntryScreen extends StatefulWidget {
  const MalSyncEntryScreen({
    super.key,
    required this.entry,
    required this.isManga,
  });

  /// A row from the bridge's `entry.list`.
  final Map<String, dynamic> entry;
  final bool isManga;

  @override
  State<MalSyncEntryScreen> createState() => _MalSyncEntryScreenState();
}

class _MalSyncEntryScreenState extends State<MalSyncEntryScreen> {
  late int _progress;
  late int _volume;
  late int _status;
  late int _score;
  late final TextEditingController _progressController;
  late final TextEditingController _volumeController;
  bool _saving = false;

  /// What the site itself says about this title. It arrives after the entry
  /// data does, so the page is usable before it lands.
  Map<String, dynamic>? _meta;

  String get _url => '${widget.entry['url'] ?? ''}';
  String get _title => '${widget.entry['title'] ?? ''}';
  int get _total => (widget.entry['total'] as num?)?.toInt() ?? 0;
  int get _totalVolume => (widget.entry['totalVolume'] as num?)?.toInt() ?? 0;
  bool get _isManga => widget.isManga;

  @override
  void initState() {
    super.initState();
    _progress = (widget.entry['progress'] as num?)?.toInt() ?? 0;
    _volume = (widget.entry['volume'] as num?)?.toInt() ?? 0;
    _status = (widget.entry['status'] as num?)?.toInt() ?? 0;
    _score = (widget.entry['score'] as num?)?.toInt() ?? 0;
    _progressController = TextEditingController(text: '$_progress');
    _volumeController = TextEditingController(text: '$_volume');
    unawaited(_loadMeta());
  }

  /// The site's own data for this title: description, statistics, other names,
  /// cast, related and recommended titles, reviews, details. Failure is not an
  /// error state of its own - the entry and its controls are the page, and
  /// this is what the site adds to it.
  Future<void> _loadMeta() async {
    if (_url.isEmpty) return;
    try {
      final meta = await YuriSyncService().entryMeta(
        url: _url,
        type: _isManga ? 'manga' : 'anime',
      );
      if (!mounted) return;
      setState(() => _meta = meta);
    } catch (_) {
      // The page keeps working without it.
    }
  }

  @override
  void dispose() {
    _progressController.dispose();
    _volumeController.dispose();
    super.dispose();
  }

  /// Writes what changed. The bridge takes the entry's URL, so no id is
  /// needed; a failed write puts the field back where it was.
  Future<void> _save({
    int? progress,
    int? volume,
    int? status,
    int? score,
  }) async {
    if (_url.isEmpty || _saving) return;
    final previous = (
      progress: _progress,
      volume: _volume,
      status: _status,
      score: _score,
    );
    setState(() {
      _saving = true;
      if (progress != null) _progress = progress;
      if (volume != null) _volume = volume;
      if (status != null) _status = status;
      if (score != null) _score = score;
      _progressController.text = '$_progress';
      _volumeController.text = '$_volume';
    });
    try {
      await YuriSyncService().entryUpdate(
        url: _url,
        type: _isManga ? 'manga' : 'anime',
        progress: progress,
        volume: volume,
        status: status,
        score: score,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _progress = previous.progress;
        _volume = previous.volume;
        _status = previous.status;
        _score = previous.score;
        _progressController.text = '$_progress';
        _volumeController.text = '$_volume';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Could not save: ${e.toString().replaceFirst(RegExp(r'^Exception: '), '')}',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MalSyncStyle.background(context),
      appBar: AppBar(
        backgroundColor: MalSyncStyle.background(context),
        foregroundColor: MalSyncStyle.text(context),
        elevation: 0,
        title: const Text('MAL-Sync'),
        actions: [
          if (_saving)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Center(
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final wide =
              constraints.maxWidth >= MalSyncStyle.overviewBreakpoint;
          final image = '${widget.entry['image'] ?? ''}';
          final controls = <Widget>[
            _progressSection(),
            if (_isManga) _volumeSection(),
            _statusSection(),
            _scoreSection(),
          ];
          if (wide) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(
                MalSyncStyle.sectionGap,
                MalSyncStyle.sectionGap,
                MalSyncStyle.sectionGap,
                MalSyncStyle.sectionGap,
              ),
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: MalSyncStyle.overviewColumnWidth,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _cover(image, height: null),
                          const SizedBox(height: MalSyncStyle.sectionGap),
                          ...controls,
                          // Their page puts the details under the cover, not
                          // with the rest of the title's data.
                          if (_meta != null) ...[
                            const SizedBox(height: MalSyncStyle.sectionGap),
                            MalSyncInfoSection(meta: _meta!),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: MalSyncStyle.sectionGap),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _header(),
                          const _Divider(),
                          if (_meta != null) MalSyncMetaSections(meta: _meta!),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            );
          }
          return ListView(
            children: [
              _cover(image, height: 200),
              Padding(
                padding: const EdgeInsets.all(MalSyncStyle.spacerHalf),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _header(),
                    const _Divider(),
                    if (_meta != null) MalSyncMetaSections(meta: _meta!),
                    ...controls,
                    if (_meta != null) ...[
                      const SizedBox(height: MalSyncStyle.sectionGap),
                      MalSyncInfoSection(meta: _meta!),
                    ],
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  /// Their `overviewImage`: a 10px-cornered card with a soft shadow, the whole
  /// 225 by 350 cover once the column has the room for it.
  Widget _cover(String image, {required double? height}) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(MalSyncStyle.controlRadius),
        boxShadow: const [
          BoxShadow(
            color: Color(0x11000000),
            blurRadius: 21,
            offset: Offset(0, 11),
          ),
          BoxShadow(
            color: Color(0x1A000000),
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(MalSyncStyle.controlRadius),
        child: image.isEmpty
            ? const SizedBox.shrink()
            : height != null
            ? Image(
                image: coverProvider(image),
                height: height,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => const SizedBox.shrink(),
              )
            : AspectRatio(
                aspectRatio: MalSyncStyle.coverAspectRatio,
                child: Image(
                  image: coverProvider(image),
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => const SizedBox.shrink(),
                ),
              ),
      ),
    );
  }

  /// Their header: the state dot, then the title at 1.5x, and a way out to the
  /// site. Their app swaps the dot for an `open_in_new` mark on hover; there
  /// is no hover on a touch screen, so both are always shown.
  Widget _header() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 7),
          child: MalSyncStateDot(state: _status),
        ),
        Expanded(
          child: Text(
            _title,
            style: TextStyle(
              color: MalSyncStyle.text(context),
              fontSize: MalSyncStyle.largeText,
              fontWeight: FontWeight.w500,
              height: 1.25,
            ),
          ),
        ),
        IconButton(
          tooltip: 'Open on the site',
          icon: Icon(
            Icons.open_in_new,
            size: 20,
            color: MalSyncStyle.secondary,
          ),
          onPressed: _url.isEmpty ? null : () => launchUrl(Uri.parse(_url)),
        ),
      ],
    );
  }

  Widget _progressSection() {
    return _Section(
      label: _isManga ? 'Chapter' : 'Episode',
      field: _countField(
        controller: _progressController,
        suffix: '/ ${_total > 0 ? _total : '?'}',
        onSubmitted: (value) => _save(progress: value),
      ),
      onIncrease: () => _save(progress: _progress + 1),
      value: _progress,
      max: _total,
      onSlide: (value) => setState(() {
        _progress = value;
        _progressController.text = '$_progress';
      }),
      onSlideEnd: (value) => _save(progress: value),
    );
  }

  Widget _volumeSection() {
    return _Section(
      label: 'Volume',
      field: _countField(
        controller: _volumeController,
        suffix: '/ ${_totalVolume > 0 ? _totalVolume : '?'}',
        onSubmitted: (value) => _save(volume: value),
      ),
      onIncrease: () => _save(volume: _volume + 1),
      value: _volume,
      max: _totalVolume,
      onSlide: (value) => setState(() {
        _volume = value;
        _volumeController.text = '$_volume';
      }),
      onSlideEnd: (value) => _save(volume: value),
    );
  }

  Widget _statusSection() {
    return _Section(
      label: 'Status',
      trailing: MalSyncStateDropdown(
        state: _status,
        isManga: _isManga,
        onChanged: (state) => _save(status: state),
      ),
    );
  }

  Widget _scoreSection() {
    return _Section(
      label: 'Score',
      trailing: Container(
        height: MalSyncStyle.pillHeight,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: MalSyncStyle.control(
          context,
          radius: MalSyncStyle.pillRadius,
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<int>(
            value: _score > 0 && _score <= 10 ? _score : null,
            hint: Text(
              'Not scored',
              style: TextStyle(
                color: MalSyncStyle.lightText(context),
                fontSize: MalSyncStyle.smallText,
              ),
            ),
            dropdownColor: MalSyncStyle.foreground(context),
            style: TextStyle(
              color: MalSyncStyle.text(context),
              fontSize: MalSyncStyle.smallText,
            ),
            items: [
              for (var value = 0; value <= 10; value++)
                DropdownMenuItem(
                  value: value,
                  child: Text(value == 0 ? 'Clear' : '$value'),
                ),
            ],
            onChanged: (value) {
              if (value != null) _save(score: value);
            },
          ),
        ),
      ),
    );
  }

  /// Their `FormText`: the count and its total inside one 5px-cornered
  /// outlined field. The count is written back when it is submitted, not on
  /// every keystroke.
  Widget _countField({
    required TextEditingController controller,
    required String suffix,
    required ValueChanged<int> onSubmitted,
  }) {
    return Container(
      decoration: MalSyncStyle.control(context, radius: MalSyncStyle.miniRadius),
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 44,
            child: TextField(
              controller: controller,
              textAlign: TextAlign.end,
              keyboardType: TextInputType.number,
              style: TextStyle(
                color: MalSyncStyle.text(context),
                fontSize: MalSyncStyle.baseFontSize,
              ),
              onSubmitted: (text) {
                final value = int.tryParse(text.trim());
                if (value != null && value >= 0) onSubmitted(value);
              },
              decoration: const InputDecoration(
                isDense: true,
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
          Text(
            ' $suffix',
            style: TextStyle(
              color: MalSyncStyle.lightText(context),
              fontSize: MalSyncStyle.baseFontSize,
            ),
          ),
        ],
      ),
    );
  }
}

/// Their `Section`: a label row with the controls beside the label, and a
/// slider under it, 15px apart on a 60px minimum.
class _Section extends StatelessWidget {
  const _Section({
    required this.label,
    this.field,
    this.trailing,
    this.onIncrease,
    this.value,
    this.max,
    this.onSlide,
    this.onSlideEnd,
  });

  final String label;
  final Widget? field;
  final Widget? trailing;
  final VoidCallback? onIncrease;
  final int? value;
  final int? max;
  final ValueChanged<int>? onSlide;
  final ValueChanged<int>? onSlideEnd;

  @override
  Widget build(BuildContext context) {
    final hasSlider = value != null && max != null;
    // With no total there is nothing to slide along, so the count field and
    // the step mark are the whole control.
    final sliderMax = (max ?? 0) > 0
        ? max!.toDouble()
        : ((value ?? 0) > 0 ? (value! + 10).toDouble() : 10.0);
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 60),
      child: Padding(
        padding: const EdgeInsets.only(bottom: MalSyncStyle.spacerHalf),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(
                bottom: MalSyncStyle.labelRowGap,
              ),
              child: Row(
                children: [
                  Text(
                    label,
                    style: TextStyle(color: MalSyncStyle.lightText(context)),
                  ),
                  const SizedBox(width: MalSyncStyle.labelRowGap),
                  ?field,
                  if (onIncrease != null) ...[
                    const SizedBox(width: MalSyncStyle.labelRowGap),
                    GestureDetector(
                      onTap: onIncrease,
                      child: Text(
                        '+',
                        style: TextStyle(
                          color: MalSyncStyle.lightText(context),
                        ),
                      ),
                    ),
                  ],
                  if (trailing != null) ...[
                    const Spacer(),
                    trailing!,
                  ],
                ],
              ),
            ),
            if (hasSlider)
              SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  trackHeight: 6,
                  activeTrackColor: MalSyncStyle.primary,
                  inactiveTrackColor: MalSyncStyle.backdrop(context),
                  thumbColor: MalSyncStyle.foreground(context),
                  overlayShape: const RoundSliderOverlayShape(
                    overlayRadius: 0,
                  ),
                  thumbShape: const RoundSliderThumbShape(
                    enabledThumbRadius: 9,
                  ),
                ),
                child: Slider(
                  value: value!.clamp(0, sliderMax.toInt()).toDouble(),
                  max: sliderMax,
                  divisions: sliderMax.toInt(),
                  onChanged: (max ?? 0) > 0 ? (v) => onSlide?.call(v.round()) : null,
                  onChangeEnd:
                      (max ?? 0) > 0 ? (v) => onSlideEnd?.call(v.round()) : null,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Their `HR`: a 2px rule in the backdrop colour, one spacer below it.
class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 2,
      margin: const EdgeInsets.only(bottom: MalSyncStyle.sectionGap),
      color: MalSyncStyle.backdrop(context),
    );
  }
}
