import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:yuri_reader/modules/malsync/malsync_screen.dart';
import 'package:yuri_reader/modules/malsync/malsync_style.dart';
import 'package:yuri_reader/services/yuri_sync/yuri_sync_service.dart';

/// malsync's own panel, the one it puts beside a list of chapters: the rating
/// it shows for the title, then Status, Volume, Chapter and Your Score, each
/// writing through the bridge as it changes, which is how its own panel works.
///
/// It wraps on purpose. The row it sits in is the whole width of the column,
/// so on a phone the five controls share two or three lines; a wrap starts at
/// the left edge and grows rightwards, so the second line begins under the
/// first control rather than in the middle of the row.
class MalSyncPanel extends StatefulWidget {
  const MalSyncPanel({
    super.key,
    required this.title,
    required this.type,
    this.matchUrl,
  });

  /// The title to look up, as the app has it.
  final String title;

  /// `'manga'` or `'anime'`.
  final String type;

  /// The entry the user picked by hand in the correction panel, when there is
  /// one. It wins over the automatic title search.
  final String? matchUrl;

  @override
  State<MalSyncPanel> createState() => _MalSyncPanelState();
}

class _MalSyncPanelState extends State<MalSyncPanel> {
  bool _loading = true;
  bool _saving = false;
  bool _found = false;
  bool _onList = false;
  String? _error;
  String _url = '';
  String _displayUrl = '';
  String _shortName = '';
  String _serviceName = '';
  String _rating = '';
  int _progress = 0;
  int _volume = 0;
  int _total = 0;
  int _totalVolume = 0;
  int _status = 0;
  int _score = 0;
  late final TextEditingController _progressController;
  late final TextEditingController _volumeController;

  bool get _isManga => widget.type != 'anime';

  @override
  void initState() {
    super.initState();
    _progressController = TextEditingController();
    _volumeController = TextEditingController();
    unawaited(_load());
  }

  @override
  void dispose() {
    _progressController.dispose();
    _volumeController.dispose();
    super.dispose();
  }

  /// What this title matches right now. Reading is safe: the bridge search
  /// does not add anything to the list, so opening a title cannot change it.
  Future<void> _load() async {
    if (widget.title.trim().isEmpty) {
      setState(() {
        _loading = false;
        _error = 'No title to look up.';
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await YuriSyncService().entryFind(
        title: widget.title,
        type: widget.type,
        url: widget.matchUrl,
      );
      if (!mounted) return;
      final entry = result['entry'];
      setState(() {
        _loading = false;
        _found = result['found'] == true;
        if (!_found || entry is! Map) return;
        _onList = entry['onList'] == true;
        _url = '${entry['url'] ?? ''}';
        _displayUrl = '${entry['displayUrl'] ?? _url}';
        _shortName = '${entry['shortName'] ?? ''}';
        _serviceName = MalSyncStyle.serviceName(
          '${result['provider'] ?? _shortName}',
        );
        _rating = '${result['rating'] ?? ''}';
        _progress = (entry['episode'] as num?)?.toInt() ?? 0;
        _volume = (entry['volume'] as num?)?.toInt() ?? 0;
        _total = (entry['totalEpisodes'] as num?)?.toInt() ?? 0;
        _totalVolume = (entry['totalVolumes'] as num?)?.toInt() ?? 0;
        _status = (entry['status'] as num?)?.toInt() ?? 0;
        _score = (entry['score'] as num?)?.toInt() ?? 0;
        _progressController.text = '$_progress';
        _volumeController.text = '$_volume';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst(RegExp(r'^Exception: '), '');
      });
    }
  }

  /// Writes what changed. Setting a status on an entry that is not on the list
  /// is what puts it there, which is the bridge's own `entry.update`; a failed
  /// write puts the field back where it was.
  Future<bool> _save({
    int? progress,
    int? volume,
    int? status,
    int? score,
  }) async {
    if (_url.isEmpty || _saving) return false;
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
        type: widget.type,
        progress: progress,
        volume: volume,
        status: status,
        score: score,
      );
      return true;
    } catch (e) {
      if (!mounted) return false;
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
      return false;
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _add() async {
    if (await _save(status: 1)) {
      await _load();
    }
  }

  Future<void> _openSite() async {
    final target = _displayUrl.isNotEmpty ? _displayUrl : _url;
    if (target.isEmpty) return;
    await launchUrl(Uri.parse(target));
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: _content(context),
    );
  }

  Widget _content(BuildContext context) {
    final labelStyle = TextStyle(
      color: MalSyncStyle.lightText(context),
      fontSize: MalSyncStyle.smallText,
    );
    if (_loading) {
      return Text('Loading', style: labelStyle);
    }
    if (_error != null) {
      return Row(
        children: [
          Flexible(
            child: Text(
              _error!,
              style: labelStyle.copyWith(color: MalSyncStyle.secondaryText(context)),
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: _load,
            style: TextButton.styleFrom(
              minimumSize: Size.zero,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Retry'),
          ),
        ],
      );
    }
    if (!_found) {
      return Text('Nothing found for this title', style: labelStyle);
    }
    if (!_onList) {
      final service = _serviceName.isNotEmpty
          ? _serviceName
          : (_shortName.isNotEmpty ? _shortName : 'the service');
      return Row(
        children: [
          Text('Not on the list', style: labelStyle),
          const SizedBox(width: 8),
          TextButton(
            onPressed: _saving ? null : _add,
            style: TextButton.styleFrom(
              minimumSize: Size.zero,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text('Add to $service'),
          ),
        ],
      );
    }
    return Wrap(
      alignment: WrapAlignment.start,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 16,
      runSpacing: 8,
      children: [
        _item(
          context,
          'Score',
          _rating.isEmpty || _rating == 'N/A'
              ? Text('N/A', style: labelStyle)
              : InkWell(
                  onTap: _openSite,
                  child: Text(
                    _rating,
                    style: TextStyle(
                      color: MalSyncStyle.secondaryText(context),
                      fontSize: MalSyncStyle.smallText,
                    ),
                  ),
                ),
        ),
        _item(
          context,
          'Status',
          MalSyncStateDropdown(
            state: _status,
            isManga: _isManga,
            onChanged: (state) => _save(status: state),
          ),
        ),
        if (_isManga)
          _item(
            context,
            'Volume',
            _countField(
              controller: _volumeController,
              total: _totalVolume,
              onSubmitted: (value) => _save(volume: value),
            ),
          ),
        _item(
          context,
          _isManga ? 'Chapter' : 'Episode',
          _countField(
            controller: _progressController,
            total: _total,
            onSubmitted: (value) => _save(progress: value),
          ),
        ),
        _item(context, 'Your Score', _scoreField(context)),
      ],
    );
  }

  /// One labelled control. `Row` rather than a fixed width, so a wrapped line
  /// starts at the left edge and each control keeps its own size.
  Widget _item(BuildContext context, String label, Widget field) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: TextStyle(
            color: MalSyncStyle.lightText(context),
            fontSize: MalSyncStyle.smallText,
          ),
        ),
        const SizedBox(width: 6),
        field,
      ],
    );
  }

  /// malsync's `FormText`: the count and its total inside one outlined field.
  /// The count is written back when it is submitted, not on every keystroke.
  Widget _countField({
    required TextEditingController controller,
    required int total,
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
                fontSize: MalSyncStyle.smallText,
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
            ' / ${total > 0 ? total : '?'}',
            style: TextStyle(
              color: MalSyncStyle.lightText(context),
              fontSize: MalSyncStyle.smallText,
            ),
          ),
        ],
      ),
    );
  }

  Widget _scoreField(BuildContext context) {
    return Container(
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
            'Not rated',
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
                child: Text(value == 0 ? 'Not rated' : '$value'),
              ),
          ],
          onChanged: (value) {
            if (value != null) _save(score: value);
          },
        ),
      ),
    );
  }
}
