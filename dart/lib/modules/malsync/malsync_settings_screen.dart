import 'package:flutter/material.dart';
import 'package:yuri_reader/modules/malsync/malsync_style.dart';
import 'package:yuri_reader/services/yuri_sync/yuri_sync_service.dart';

/// What a settings row can be.
enum _Kind { toggle, choice, text, number }

class _Row {
  const _Row(this.key, this.label, this.kind, {this.options, this.hint});

  final String key;
  final String label;
  final _Kind kind;
  final List<String>? options;
  final String? hint;
}

class _Section {
  const _Section(this.title, this.rows);

  final String title;
  final List<_Row> rows;
}

/// The bridge's settings, in the grouped list MAL-Sync's own settings screen
/// uses. Only the settings the bridge both holds and acts on are shown: its
/// defaults carry a web-extension's preferences too (float button, userscript
/// mode, presence), and offering a switch that changes nothing here would be
/// worse than leaving it out. Credentials are never sent at all - the bridge
/// only reports settings that are not secrets.
class MalSyncSettingsScreen extends StatefulWidget {
  const MalSyncSettingsScreen({super.key});

  @override
  State<MalSyncSettingsScreen> createState() => _MalSyncSettingsScreenState();
}

class _MalSyncSettingsScreenState extends State<MalSyncSettingsScreen> {
  static const _sections = <_Section>[
    _Section('Sync', [
      _Row(
        'syncMode',
        'Sync Mode',
        _Kind.choice,
        options: ['MAL', 'ANILIST', 'KITSU', 'SIMKL', 'SHIKI', 'MANGABAKA'],
        hint: 'Which service the tracked list is read from and written to',
      ),
      _Row('splitTracking', 'Split anime and manga', _Kind.toggle),
      _Row('localSync', 'Local list', _Kind.toggle),
      _Row('askBefore', 'Ask before changing an entry', _Kind.toggle),
    ]),
    _Section('Progress', [
      _Row('readerTracking', 'Track from the reader', _Kind.toggle),
      _Row('epPredictions', 'Episode predictions', _Kind.toggle),
      _Row('malContinue', 'Continue button', _Kind.toggle),
      _Row('malResume', 'Resume button', _Kind.toggle),
      _Row(
        'autoTrackingModeanime',
        'Anime auto-tracking',
        _Kind.choice,
        options: ['video', 'instant', 'manual'],
      ),
      _Row(
        'autoTrackingModemanga',
        'Manga auto-tracking',
        _Kind.choice,
        options: ['instant', 'manual'],
      ),
      _Row('videoDuration', 'Video length (min)', _Kind.number),
      _Row('mangaCompletionPercentage', 'Manga completed at (%)', _Kind.number),
      _Row('delay', 'Delay (min)', _Kind.number),
    ]),
    _Section('Notifications', [
      _Row('progressNotificationsAnime', 'Anime progress', _Kind.toggle),
      _Row('progressNotificationsManga', 'Manga progress', _Kind.toggle),
      _Row('notificationsSticky', 'Keep notifications', _Kind.toggle),
    ]),
    _Section('Titles and tags', [
      _Row('forceEnglishTitles', 'Force English titles', _Kind.toggle),
      _Row('malTags', 'Write tags back', _Kind.toggle),
      _Row(
        'progressIntervalDefaultAnime',
        'Anime progress step',
        _Kind.text,
      ),
      _Row(
        'progressIntervalDefaultManga',
        'Manga progress step',
        _Kind.text,
      ),
    ]),
  ];

  Map<String, dynamic> _settings = const {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final settings = await YuriSyncService().settingsList();
      if (!mounted) return;
      setState(() {
        _settings = settings;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _set(String key, dynamic value) async {
    final previous = _settings[key];
    setState(() => _settings = {..._settings, key: value});
    try {
      await YuriSyncService().setSetting(key, value);
    } catch (e) {
      if (!mounted) return;
      setState(() => _settings = {..._settings, key: previous});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save $key: $e')),
      );
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
        title: const Text('MAL-Sync Settings'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(MalSyncStyle.spacer),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Could not load the settings',
                      style: TextStyle(color: MalSyncStyle.text(context)),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: MalSyncStyle.lightText(context),
                        fontSize: MalSyncStyle.smallText,
                      ),
                    ),
                    const SizedBox(height: MalSyncStyle.spacerHalf),
                    TextButton(onPressed: _load, child: const Text('Try again')),
                  ],
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(
                MalSyncStyle.spacerHalf,
                MalSyncStyle.spacerHalf,
                MalSyncStyle.spacerHalf,
                MalSyncStyle.spacer,
              ),
              children: [
                for (final section in _sections) ...[
                  Padding(
                    padding: const EdgeInsets.only(
                      left: 4,
                      bottom: MalSyncStyle.spacerHalf,
                    ),
                    child: Text(
                      section.title,
                      style: TextStyle(
                        color: MalSyncStyle.primary,
                        fontSize: MalSyncStyle.smallText,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: MalSyncStyle.foreground(context),
                      borderRadius: BorderRadius.circular(MalSyncStyle.pillRadius),
                    ),
                    child: Column(
                      children: [
                        for (var i = 0; i < section.rows.length; i++) ...[
                          if (i > 0)
                            Divider(
                              height: 1,
                              color: MalSyncStyle.backdrop(context),
                            ),
                          _buildRow(section.rows[i]),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: MalSyncStyle.spacer),
                ],
              ],
            ),
    );
  }

  Widget _buildRow(_Row row) {
    final value = _settings[row.key];
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: MalSyncStyle.spacerHalf,
        vertical: 10,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  row.label,
                  style: TextStyle(color: MalSyncStyle.text(context)),
                ),
                if (row.hint != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      row.hint!,
                      style: TextStyle(
                        color: MalSyncStyle.lightText(context),
                        fontSize: MalSyncStyle.tinyText,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: MalSyncStyle.spacerHalf),
          switch (row.kind) {
            _Kind.toggle => Switch(
              value: value == true,
              onChanged: (picked) => _set(row.key, picked),
            ),
            _Kind.choice => DropdownButton<String>(
              value: row.options!.contains(value) ? value as String : null,
              hint: Text(
                'Not set',
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
                for (final option in row.options!)
                  DropdownMenuItem(value: option, child: Text(option)),
              ],
              onChanged: (picked) {
                if (picked != null) _set(row.key, picked);
              },
            ),
            _Kind.number => SizedBox(
              width: 90,
              child: _MalSyncTextField(
                initial: '$value',
                onSubmitted: (text) {
                  final parsed = num.tryParse(text.trim());
                  if (parsed != null) _set(row.key, parsed);
                },
              ),
            ),
            _Kind.text => SizedBox(
              width: 140,
              child: _MalSyncTextField(
                initial: value == null ? '' : '$value',
                onSubmitted: (text) => _set(row.key, text.trim()),
              ),
            ),
          },
        ],
      ),
    );
  }
}

/// A field that only writes on submit, so typing does not hit the bridge on
/// every keystroke.
class _MalSyncTextField extends StatefulWidget {
  const _MalSyncTextField({required this.initial, required this.onSubmitted});

  final String initial;
  final ValueChanged<String> onSubmitted;

  @override
  State<_MalSyncTextField> createState() => _MalSyncTextFieldState();
}

class _MalSyncTextFieldState extends State<_MalSyncTextField> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.initial);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      textAlign: TextAlign.end,
      style: TextStyle(
        color: MalSyncStyle.text(context),
        fontSize: MalSyncStyle.smallText,
      ),
      onSubmitted: widget.onSubmitted,
      decoration: InputDecoration(
        isDense: true,
        hintText: 'Not set',
        hintStyle: TextStyle(
          color: MalSyncStyle.lightText(context),
          fontSize: MalSyncStyle.smallText,
        ),
        border: const OutlineInputBorder(),
      ),
    );
  }
}
