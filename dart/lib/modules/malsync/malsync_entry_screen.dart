import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:yuri_reader/modules/malsync/malsync_screen.dart';
import 'package:yuri_reader/modules/malsync/malsync_style.dart';
import 'package:yuri_reader/services/yuri_sync/yuri_sync_service.dart';
import 'package:yuri_reader/utils/cached_network.dart';

/// One entry's own page, the way MAL-Sync's app shows it: the cover, the state
/// it is in, and the progress, status and score controls that write back
/// through the bridge.
///
/// The controls are its app's (`overview-update-ui`): a progress count with a
/// step button and a slider, a status dropdown with the state dots, and a
/// score. Changes go to the bridge as they are made, the same way its app
/// saves them.
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

  String get _url => '${widget.entry['url'] ?? ''}';
  String get _title => '${widget.entry['title'] ?? ''}';
  int get _total => (widget.entry['total'] as num?)?.toInt() ?? 0;
  int get _totalVolume => (widget.entry['totalVolume'] as num?)?.toInt() ?? 0;
  bool get _isManga =>
      (_url.contains('manga') && !_url.contains('anime')) ||
      widget.isManga;

  @override
  void initState() {
    super.initState();
    _progress = (widget.entry['progress'] as num?)?.toInt() ?? 0;
    _volume = (widget.entry['volume'] as num?)?.toInt() ?? 0;
    _status = (widget.entry['status'] as num?)?.toInt() ?? 0;
    _score = (widget.entry['score'] as num?)?.toInt() ?? 0;
    _progressController = TextEditingController(text: '$_progress');
    _volumeController = TextEditingController(text: '$_volume');
  }

  @override
  void dispose() {
    _progressController.dispose();
    _volumeController.dispose();
    super.dispose();
  }

  /// Writes what changed. The bridge takes the entry's URL, so no id is needed
  /// and a failed write leaves the field where it was.
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
    final image = '${widget.entry['image'] ?? ''}';
    return Scaffold(
      backgroundColor: MalSyncStyle.background(context),
      appBar: AppBar(
        backgroundColor: MalSyncStyle.background(context),
        foregroundColor: MalSyncStyle.text(context),
        elevation: 0,
        title: Text(_title, overflow: TextOverflow.ellipsis),
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
          IconButton(
            tooltip: 'Open on the site',
            icon: const Icon(Icons.open_in_new),
            onPressed: _url.isEmpty ? null : () => launchUrl(Uri.parse(_url)),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: MalSyncStyle.spacer),
        children: [
          if (image.isNotEmpty)
            Stack(
              children: [
                Image(
                  image: coverProvider(image),
                  height: 260,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => const SizedBox(height: 0),
                ),
                // Their overview fades the cover into the page.
                const Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 120,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Color(0xD9242424)],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: MalSyncStyle.spacerHalf,
                  right: MalSyncStyle.spacerHalf,
                  bottom: MalSyncStyle.spacerHalf,
                  child: Row(
                    children: [
                      MalSyncStateDot(state: _status),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: MalSyncStyle.largeText,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          Padding(
            padding: const EdgeInsets.all(MalSyncStyle.spacerHalf),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildProgress(),
                if (_isManga) ...[
                  const SizedBox(height: MalSyncStyle.spacer),
                  _buildVolume(),
                ],
                const SizedBox(height: MalSyncStyle.spacer),
                _buildStatus(),
                const SizedBox(height: MalSyncStyle.spacer),
                _buildScore(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgress() {
    // With no total there is nothing to slide along, so the field and the
    // step button are the whole control.
    final max = (_total > 0 ? _total : (_progress > 0 ? _progress + 10 : 10))
        .toDouble();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              _isManga ? 'Chapter' : 'Episode',
              style: TextStyle(color: MalSyncStyle.lightText(context)),
            ),
            const Spacer(),
            SizedBox(
              width: 90,
              child: _MalSyncNumberField(
                controller: _progressController,
                onSubmitted: (value) => _save(progress: value),
              ),
            ),
            Text(
              ' / ${_total > 0 ? _total : '?'}',
              style: TextStyle(color: MalSyncStyle.lightText(context)),
            ),
            IconButton(
              tooltip: 'One more',
              icon: const Icon(Icons.add),
              onPressed: () => _save(progress: _progress + 1),
            ),
          ],
        ),
        Slider(
          value: _progress.clamp(0, max.toInt()).toDouble(),
          max: max,
          divisions: max.toInt(),
          label: '$_progress',
          onChanged: _total > 0
              ? (value) => setState(() {
                  _progress = value.round();
                  _progressController.text = '$_progress';
                })
              : null,
          onChangeEnd: _total > 0 ? (value) => _save(progress: value.round()) : null,
        ),
      ],
    );
  }

  Widget _buildVolume() {
    final max = (_totalVolume > 0
            ? _totalVolume
            : (_volume > 0 ? _volume + 10 : 10))
        .toDouble();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Volume', style: TextStyle(color: MalSyncStyle.lightText(context))),
            const Spacer(),
            SizedBox(
              width: 90,
              child: _MalSyncNumberField(
                controller: _volumeController,
                onSubmitted: (value) => _save(volume: value),
              ),
            ),
            Text(
              ' / ${_totalVolume > 0 ? _totalVolume : '?'}',
              style: TextStyle(color: MalSyncStyle.lightText(context)),
            ),
            IconButton(
              tooltip: 'One more',
              icon: const Icon(Icons.add),
              onPressed: () => _save(volume: _volume + 1),
            ),
          ],
        ),
        Slider(
          value: _volume.clamp(0, max.toInt()).toDouble(),
          max: max,
          divisions: max.toInt(),
          label: '$_volume',
          onChanged: _totalVolume > 0
              ? (value) => setState(() {
                  _volume = value.round();
                  _volumeController.text = '$_volume';
                })
              : null,
          onChangeEnd:
              _totalVolume > 0 ? (value) => _save(volume: value.round()) : null,
        ),
      ],
    );
  }

  Widget _buildStatus() {
    return Row(
      children: [
        Text('Status', style: TextStyle(color: MalSyncStyle.lightText(context))),
        const Spacer(),
        MalSyncStateDropdown(
          state: _status,
          isManga: _isManga,
          onChanged: (state) => _save(status: state),
        ),
      ],
    );
  }

  Widget _buildScore() {
    return Row(
      children: [
        Text('Score', style: TextStyle(color: MalSyncStyle.lightText(context))),
        const Spacer(),
        DropdownButton<int>(
          value: _score > 0 && _score <= 10 ? _score : null,
          hint: Text(
            'Not scored',
            style: TextStyle(
              color: MalSyncStyle.lightText(context),
              fontSize: MalSyncStyle.smallText,
            ),
          ),
          underline: const SizedBox.shrink(),
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
      ],
    );
  }
}

/// Their progress and volume fields: the number, written back when it is
/// submitted rather than on every keystroke.
class _MalSyncNumberField extends StatelessWidget {
  const _MalSyncNumberField({
    required this.controller,
    required this.onSubmitted,
  });

  final TextEditingController controller;
  final ValueChanged<int> onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextField(
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
      decoration: const InputDecoration(isDense: true, border: InputBorder.none),
    );
  }
}
