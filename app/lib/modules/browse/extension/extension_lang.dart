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
  final Map<String, bool> _optimistic = {};

  void _updateLang(String lang, bool val, List<Source> entries) {
    setState(() => _optimistic[lang] = val);
    isar.writeTxn(() async {
      for (var source in entries) {
        if (source.lang!.toLowerCase() == lang.toLowerCase()) {
          await isar.sources.put(
            source
              ..isActive = val
              ..updatedAt = DateTime.now().millisecondsSinceEpoch,
          );
        }
      }
    });
  }

  void _setAll(bool enable, List<Source> entries) {
    final languages = entries.map((e) => e.lang!).toSet().toList();
    for (var lang in languages) {
      _optimistic[lang] = enable;
    }
    setState(() {});
    isar.writeTxn(() async {
      for (var source in entries) {
        await isar.sources.put(
          source
            ..isActive = enable
            ..updatedAt = DateTime.now().millisecondsSinceEpoch,
        );
      }
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
            onSelected: (value) {
              final enable = value == 0;
              isar.writeTxn(() async {
                final sources = await isar.sources
                    .filter()
                    .idIsNotNull()
                    .and()
                    .itemTypeEqualTo(widget.itemType)
                    .findAll();
                for (var source in sources) {
                  await isar.sources.put(
                    source
                      ..isActive = enable
                      ..updatedAt = DateTime.now().millisecondsSinceEpoch,
                  );
                }
              });
            },
          ),
        ],
      ),
      body: StreamBuilder(
        stream: isar.sources
            .filter()
            .idIsNotNull()
            .and()
            .itemTypeEqualTo(widget.itemType)
            .watch(fireImmediately: true),
        builder: (context, snapshot) {
          List<Source>? entries = snapshot.hasData ? snapshot.data : [];
          final languages = entries!.map((e) => e.lang!).toSet().toList();

          if (_optimistic.isNotEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) setState(() => _optimistic.clear());
            });
          }

          languages.sort((a, b) => a.compareTo(b));
          return SuperListView.builder(
            itemCount: languages.length,
            itemBuilder: (context, index) {
              final lang = languages[index];
              final dbValue = entries
                  .where(
                    (element) =>
                        element.lang!.toLowerCase() == lang.toLowerCase() &&
                        element.isActive!,
                  )
                  .isNotEmpty;
              return ExtensionLangListTileWidget(
                lang: lang,
                onChanged: (val) => _updateLang(lang, val, entries),
                value: _optimistic[lang] ?? dbValue,
              );
            },
          );
        },
      ),
    );
  }
}
