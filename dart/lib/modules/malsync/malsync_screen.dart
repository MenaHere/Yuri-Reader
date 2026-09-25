import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:yuri_reader/modules/malsync/malsync_settings_screen.dart';
import 'package:yuri_reader/modules/malsync/malsync_style.dart';
import 'package:yuri_reader/services/yuri_sync/yuri_sync_service.dart';
import 'package:yuri_reader/utils/cached_network.dart';

/// The list MAL-Sync keeps: everything being tracked, and the state each entry
/// is in.
///
/// The layout is MAL-Sync's own - its anime/manga switch, its state dropdown,
/// its cover cards - and the data is the same list its app shows: the bridge
/// runs malsync's own list classes, so nothing here is a second
/// implementation of its fetching.
class MalSyncScreen extends StatefulWidget {
  const MalSyncScreen({super.key});

  @override
  State<MalSyncScreen> createState() => _MalSyncScreenState();
}

class _MalSyncScreenState extends State<MalSyncScreen> {
  bool _isManga = false;
  int _state = 7;
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _entries = const [];
  bool _searching = false;
  String _query = '';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final entries = await YuriSyncService().entryList(
        type: _isManga ? 'manga' : 'anime',
        status: _state,
      );
      if (!mounted) return;
      setState(() {
        _entries = entries;
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

  /// Their list is searched client side too, so the search box does not
  /// re-fetch the list on every keystroke.
  List<Map<String, dynamic>> get _visible {
    final query = _query.trim().toLowerCase();
    if (query.isEmpty) return _entries;
    return _entries
        .where((entry) => '${entry['title'] ?? ''}'.toLowerCase().contains(query))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final textColor = MalSyncStyle.text(context);
    return Scaffold(
      backgroundColor: MalSyncStyle.background(context),
      appBar: AppBar(
        backgroundColor: MalSyncStyle.background(context),
        foregroundColor: textColor,
        elevation: 0,
        leading: _searching
            ? IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => setState(() {
                  _searching = false;
                  _query = '';
                  _searchController.clear();
                }),
              )
            : null,
        title: _searching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: TextStyle(color: textColor),
                onChanged: (value) => setState(() => _query = value),
                decoration: InputDecoration(
                  hintText: 'Search',
                  border: InputBorder.none,
                  hintStyle: TextStyle(color: MalSyncStyle.lightText(context)),
                ),
              )
            : const Text('MAL-Sync'),
        actions: [
          if (!_searching)
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () => setState(() => _searching = true),
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loading ? null : _load,
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => const MalSyncSettingsScreen(),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              MalSyncStyle.spacerHalf,
              MalSyncStyle.spacerHalf,
              MalSyncStyle.spacerHalf,
              MalSyncStyle.spacer,
            ),
            child: Row(
              children: [
                MalSyncTypeSwitch(
                  isManga: _isManga,
                  onChanged: (isManga) {
                    setState(() => _isManga = isManga);
                    _load();
                  },
                ),
                const Spacer(),
                MalSyncStateDropdown(
                  state: _state,
                  isManga: _isManga,
                  onChanged: (state) {
                    setState(() => _state = state);
                    _load();
                  },
                ),
              ],
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return _MalSyncMessage(
        icon: Icons.cloud_off,
        title: 'Could not load the list',
        // The bridge's own words, without Dart's "Exception: " in front.
        detail: _error!.replaceFirst(RegExp(r'^Exception: '), ''),
        action: ('Try again', _load),
      );
    }
    final entries = _visible;
    if (entries.isEmpty) {
      return _MalSyncMessage(
        icon: Icons.bookmark_border,
        title: _query.isEmpty
            ? 'Nothing in ${MalSyncStyle.stateName(_state, isManga: _isManga)}'
            : 'No title matches "$_query"',
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(
        MalSyncStyle.spacerHalf,
        0,
        MalSyncStyle.spacerHalf,
        MalSyncStyle.spacer,
      ),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 350,
        mainAxisSpacing: MalSyncStyle.spacer,
        crossAxisSpacing: MalSyncStyle.spacer,
        childAspectRatio: 350 / 240,
      ),
      itemCount: entries.length,
      itemBuilder: (context, index) =>
          MalSyncEntryCard(entry: entries[index], isManga: _isManga),
    );
  }
}

/// Their `FormSwitch`: the two states, one pill each, the picked one filled.
class MalSyncTypeSwitch extends StatelessWidget {
  const MalSyncTypeSwitch({
    super.key,
    required this.isManga,
    required this.onChanged,
  });

  final bool isManga;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: MalSyncStyle.foreground(context),
        borderRadius: BorderRadius.circular(MalSyncStyle.pillRadius),
      ),
      padding: const EdgeInsets.all(3),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _pill(context, label: 'Anime', selected: !isManga, value: false),
          _pill(context, label: 'Manga', selected: isManga, value: true),
        ],
      ),
    );
  }

  Widget _pill(
    BuildContext context, {
    required String label,
    required bool selected,
    required bool value,
  }) {
    return GestureDetector(
      onTap: () => onChanged(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? MalSyncStyle.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(MalSyncStyle.pillRadius),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : MalSyncStyle.text(context),
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

/// Their state dropdown: a pill carrying the state's dot and its name.
class MalSyncStateDropdown extends StatelessWidget {
  const MalSyncStateDropdown({
    super.key,
    required this.state,
    required this.isManga,
    required this.onChanged,
  });

  final int state;
  final bool isManga;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<int>(
      onSelected: onChanged,
      color: MalSyncStyle.foreground(context),
      itemBuilder: (context) => [
        for (final value in MalSyncStyle.listStates)
          PopupMenuItem(
            value: value,
            child: Row(
              children: [
                MalSyncStateDot(state: value),
                const SizedBox(width: 10),
                Text(MalSyncStyle.stateName(value, isManga: isManga)),
              ],
            ),
          ),
      ],
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: MalSyncStyle.foreground(context),
          borderRadius: BorderRadius.circular(MalSyncStyle.pillRadius),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            MalSyncStateDot(state: state),
            const SizedBox(width: 10),
            Text(
              MalSyncStyle.stateName(state, isManga: isManga),
              style: TextStyle(
                color: MalSyncStyle.text(context),
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The coloured dot their app puts before every state name.
class MalSyncStateDot extends StatelessWidget {
  const MalSyncStateDot({super.key, required this.state});

  final int state;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        color: MalSyncStyle.stateColor(state),
        shape: BoxShape.circle,
      ),
    );
  }
}

/// One card, as their "Cards" format draws it: the cover fills the card, a
/// dark gradient carries the text, the score sits top right, and the episode
/// or chapter count and the title sit at the bottom with the state dot.
class MalSyncEntryCard extends StatelessWidget {
  const MalSyncEntryCard({
    super.key,
    required this.entry,
    required this.isManga,
  });

  final Map<String, dynamic> entry;
  final bool isManga;

  @override
  Widget build(BuildContext context) {
    final title = '${entry['title'] ?? ''}';
    final image = '${entry['image'] ?? ''}';
    final url = '${entry['url'] ?? ''}';
    final progress = entry['progress'] ?? 0;
    final total = entry['total'] ?? 0;
    final score = entry['score'] ?? 0;
    final entryIsManga = '${entry['type']}' == 'manga' || isManga;
    final state = entry['status'] is int ? entry['status'] as int : 0;

    return ClipRRect(
      borderRadius: BorderRadius.circular(11),
      child: Material(
        color: MalSyncStyle.foreground(context),
        child: InkWell(
          onTap: url.isEmpty ? null : () => launchUrl(Uri.parse(url)),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (image.isNotEmpty)
                Image(
                  image: coverProvider(image),
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => const SizedBox.shrink(),
                ),
              // Their card darkens towards the bottom so the text can be read
              // over any cover.
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0xD9242424)],
                    stops: [0.3, 1],
                  ),
                ),
              ),
              if (score is num && score > 0)
                Positioned(
                  top: MalSyncStyle.spacerHalf,
                  right: MalSyncStyle.spacerHalf,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0x66000000),
                      borderRadius: BorderRadius.circular(MalSyncStyle.pillRadius),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, size: 14, color: Colors.white),
                        const SizedBox(width: 4),
                        Text(
                          '$score',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              Positioned(
                left: MalSyncStyle.spacerHalf,
                right: MalSyncStyle.spacerHalf,
                bottom: MalSyncStyle.spacerHalf,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${entryIsManga ? 'Chapter' : 'Episode'}  $progress/$total',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: MalSyncStyle.smallText,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 5, right: 8),
                          child: MalSyncStateDot(state: state),
                        ),
                        Expanded(
                          child: Text(
                            title,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: MalSyncStyle.baseFontSize,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Their empty and error sections, which are a centred icon and a line.
class _MalSyncMessage extends StatelessWidget {
  const _MalSyncMessage({
    required this.icon,
    required this.title,
    this.detail,
    this.action,
  });

  final IconData icon;
  final String title;
  final String? detail;
  final (String, Future<void> Function())? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(MalSyncStyle.spacer),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: MalSyncStyle.lightText(context)),
            const SizedBox(height: MalSyncStyle.spacerHalf),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(color: MalSyncStyle.text(context)),
            ),
            if (detail != null) ...[
              const SizedBox(height: 8),
              Text(
                detail!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: MalSyncStyle.lightText(context),
                  fontSize: MalSyncStyle.smallText,
                ),
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: MalSyncStyle.spacerHalf),
              TextButton(
                onPressed: () => action!.$2(),
                child: Text(action!.$1),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
