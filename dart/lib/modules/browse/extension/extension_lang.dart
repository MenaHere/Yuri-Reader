import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar_community/isar.dart';
import 'package:yuri_reader/main.dart';
import 'package:yuri_reader/models/manga.dart';
import 'package:yuri_reader/models/source.dart';
import 'package:yuri_reader/providers/l10n_providers.dart';
import 'package:yuri_reader/modules/browse/extension/widgets/extension_lang_list_tile_widget.dart';
import 'package:yuri_reader/utils/global_style.dart';
import 'package:super_sliver_list/super_sliver_list.dart';

class ExtensionsLang extends ConsumerStatefulWidget {
  final ItemType itemType;
  const ExtensionsLang({required this.itemType, super.key});

  @override
  ConsumerState<ExtensionsLang> createState() => _ExtensionsLangState();
}

class _ExtensionsLangState extends ConsumerState<ExtensionsLang> {
  List<Source>? _entries;
  List<String> _languages = [];
  Map<String, bool> _langActive = {};
  bool _loading = true;
  Timer? _saveTimer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final entries = await isar.sources
        .filter()
        .idIsNotNull()
        .and()
        .itemTypeEqualTo(widget.itemType)
        .findAll();
    _updateDerivedData(entries);
    if (mounted) {
      setState(() {
        _entries = entries;
        _loading = false;
      });
    }
  }

  void _updateDerivedData(List<Source> entries) {
    final languages = entries.map((e) => e.lang!).toSet().toList();
    languages.sort((a, b) => a.compareTo(b));
    final langActive = <String, bool>{};
    for (final source in entries) {
      if (source.lang != null &&
          source.isActive == true &&
          !langActive.containsKey(source.lang!)) {
        langActive[source.lang!] = true;
      }
    }
    _languages = languages;
    _langActive = langActive;
  }

  void _updateLang(String lang, bool val) {
    if (_entries == null) return;
    setState(() {
      for (var source in _entries!) {
        if (source.lang!.toLowerCase() == lang.toLowerCase()) {
          source
            ..isActive = val
            ..updatedAt = DateTime.now().millisecondsSinceEpoch;
        }
      }
      _updateDerivedData(_entries!);
    });

    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 300), () {
      final toUpdate = _entries!
          .where((s) => s.lang!.toLowerCase() == lang.toLowerCase())
          .toList();
      isar.writeTxn(() async {
        await isar.sources.putAll(toUpdate);
      });
    });
  }

  void _setAll(bool enable) {
    if (_entries == null) return;
    setState(() {
      for (var source in _entries!) {
        source
          ..isActive = enable
          ..updatedAt = DateTime.now().millisecondsSinceEpoch;
      }
      _updateDerivedData(_entries!);
    });

    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 300), () {
      isar.writeTxn(() async {
        await isar.sources.putAll(_entries!);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = l10nLocalizations(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.extensions),
        actions: [
          PopupMenuButton(
            popUpAnimationStyle: popupAnimationStyle,
            itemBuilder: (context) {
              return [
                PopupMenuItem<int>(value: 0, child: Text(l10n.enable_all)),
                PopupMenuItem<int>(value: 1, child: Text(l10n.disable_all)),
              ];
            },
            onSelected: (value) => _setAll(value == 0),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SuperListView.builder(
              itemCount: _languages.length,
              itemBuilder: (context, index) {
                final lang = _languages[index];
                return ExtensionLangListTileWidget(
                  key: ValueKey(lang),
                  lang: lang,
                  onChanged: (val) => _updateLang(lang, val),
                  value: _langActive[lang] ?? false,
                );
              },
            ),
    );
  }
}
