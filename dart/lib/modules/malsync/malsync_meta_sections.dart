import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:yuri_reader/modules/malsync/malsync_style.dart';
import 'package:yuri_reader/utils/cached_network.dart';

/// The sections MAL-Sync's own entry page carries, drawn from the title data
/// malsync fetches: the statistics row, the description, the other names, the
/// cast, related and recommended titles, reviews, and the details list.
///
/// Each one is skipped when the provider has nothing for it, so a title with
/// no reviews simply has no reviews section.
class MalSyncMetaSections extends StatelessWidget {
  const MalSyncMetaSections({super.key, required this.meta});

  /// The `meta` map from the bridge's `entry.meta`.
  final Map<String, dynamic> meta;

  @override
  Widget build(BuildContext context) {
    final statistics = (meta['statistics'] as List?) ?? const [];
    final characters = (meta['characters'] as List?) ?? const [];
    final related = (meta['related'] as List?) ?? const [];
    final recommendations = (meta['recommendations'] as List?) ?? const [];
    final reviews = (meta['reviews'] as List?) ?? const [];
    final altTitles = (meta['alternativeTitle'] as List?) ?? const [];
    final description = _plainText('${meta['description'] ?? ''}');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (statistics.isNotEmpty) ...[
          _MalSyncStats(statistics: statistics),
          const SizedBox(height: MalSyncStyle.sectionGap),
        ],
        if (description.isNotEmpty) ...[
          MalSyncSection(
            child: Text(
              description,
              style: TextStyle(
                color: MalSyncStyle.text(context),
                height: 1.3,
              ),
            ),
          ),
          const SizedBox(height: MalSyncStyle.sectionGap),
        ],
        if (altTitles.isNotEmpty) ...[
          Align(
            alignment: Alignment.centerLeft,
            child: MalSyncSynonymsButton(titles: altTitles),
          ),
          const SizedBox(height: MalSyncStyle.sectionGap),
        ],
        if (characters.isNotEmpty) ...[
          MalSyncSection(
            title: 'Characters',
            child: MalSyncGrid(
              children: [
                for (final character in characters)
                  _Character(character: character as Map),
              ],
            ),
          ),
        ],
        if (related.isNotEmpty) ...[
          MalSyncSection(
            title: 'Related',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final group in related)
                  _RelatedGroup(group: group as Map),
              ],
            ),
          ),
        ],
        if (recommendations.isNotEmpty) ...[
          MalSyncSection(
            title: 'Recommendations',
            child: MalSyncGrid(
              children: [
                for (final recommendation in recommendations)
                  _Recommendation(recommendation: recommendation as Map),
              ],
            ),
          ),
        ],
        if (reviews.isNotEmpty)
          MalSyncSection(
            title: 'Reviews',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final review in reviews) _Review(review: review as Map),
              ],
            ),
          ),
      ],
    );
  }

  /// Their description is the site's HTML. This keeps its line breaks and
  /// drops the markup, because the app draws text rather than a page.
  static String _plainText(String html) {
    var text = html
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n\n')
        .replaceAll(RegExp(r'<[^>]+>'), '');
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&mdash;': '-',
    };
    for (final entry in entities.entries) {
      text = text.replaceAll(entry.key, entry.value);
    }
    return text.trim();
  }
}

/// The details list on its own, because MAL-Sync's page puts it under the
/// cover rather than with the rest.
class MalSyncInfoSection extends StatelessWidget {
  const MalSyncInfoSection({super.key, required this.meta});

  final Map<String, dynamic> meta;

  @override
  Widget build(BuildContext context) {
    final info = (meta['info'] as List?) ?? const [];
    if (info.isEmpty) return const SizedBox.shrink();
    return MalSyncSection(title: 'Information', child: _Information(info: info));
  }
}

/// Their section: a bold heading, then the content, one spacer apart.
class MalSyncSection extends StatelessWidget {
  const MalSyncSection({super.key, this.title, required this.child});

  final String? title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: MalSyncStyle.sectionGap),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null)
            Padding(
              padding: const EdgeInsets.only(
                bottom: MalSyncStyle.sectionGap,
              ),
              child: Text(
                title!,
                style: TextStyle(
                  color: MalSyncStyle.text(context),
                  fontSize: MalSyncStyle.largeText,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          child,
          Container(
            height: 2,
            margin: const EdgeInsets.only(top: MalSyncStyle.sectionGap),
            color: MalSyncStyle.backdrop(context),
          ),
        ],
      ),
    );
  }
}

/// Their statistics row: label then value, scrolling sideways when it is
/// longer than the column.
class _MalSyncStats extends StatelessWidget {
  const _MalSyncStats({required this.statistics});

  final List statistics;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final statistic in statistics)
            Padding(
              padding: const EdgeInsets.only(right: 20),
              child: Row(
                children: [
                  Text(
                    '${(statistic as Map)['title'] ?? ''} ',
                    style: TextStyle(color: MalSyncStyle.lightText(context)),
                  ),
                  Text(
                    '${statistic['body'] ?? ''}',
                    style: TextStyle(
                      color: MalSyncStyle.text(context),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Their "Synonyms" pill: the other names a title goes by, in a dialog.
class MalSyncSynonymsButton extends StatelessWidget {
  const MalSyncSynonymsButton({super.key, required this.titles});

  final List titles;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: MalSyncStyle.foreground(context),
          title: Text(
            'Other names',
            style: TextStyle(color: MalSyncStyle.text(context)),
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final title in titles)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5),
                    child: Text(
                      '$title',
                      style: TextStyle(color: MalSyncStyle.text(context)),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: MalSyncStyle.darkBackground(context),
          borderRadius: BorderRadius.circular(30),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.translate, size: 18, color: Colors.white),
            const SizedBox(width: 8),
            Text(
              'Synonyms',
              style: const TextStyle(color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}

/// Their grid: `repeat(auto-fill, minmax(100px, 1fr))` with its spacer.
class MalSyncGrid extends StatelessWidget {
  const MalSyncGrid({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 5,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: MalSyncStyle.spacer,
      crossAxisSpacing: MalSyncStyle.spacer,
      childAspectRatio: 0.62,
      children: children,
    );
  }
}

/// Their character card: a square cover, the name bold, the role under it.
class _Character extends StatelessWidget {
  const _Character({required this.character});

  final Map character;

  @override
  Widget build(BuildContext context) {
    final image = '${character['img'] ?? ''}';
    final url = '${character['url'] ?? ''}';
    return GestureDetector(
      onTap: url.isEmpty ? null : () => launchUrl(Uri.parse(url)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(MalSyncStyle.controlRadius),
              child: image.isEmpty
                  ? Container(color: MalSyncStyle.backdrop(context))
                  : Image(
                      image: coverProvider(image),
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const SizedBox.shrink(),
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Text(
              '${character['name'] ?? ''}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: MalSyncStyle.text(context),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Text(
              '${character['subtext'] ?? character['role'] ?? ''}',
              style: TextStyle(
                color: MalSyncStyle.lightText(context),
                fontSize: MalSyncStyle.smallText,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Their related list: the relation, then the titles under it.
class _RelatedGroup extends StatelessWidget {
  const _RelatedGroup({required this.group});

  final Map group;

  @override
  Widget build(BuildContext context) {
    final links = (group['links'] as List?) ?? const [];
    if (links.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: MalSyncStyle.spacerHalf),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${group['type'] ?? ''}',
            style: TextStyle(
              color: MalSyncStyle.lightText(context),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 3),
          for (final link in links)
            GestureDetector(
              onTap: () {
                final url = '${(link as Map)['url'] ?? ''}';
                if (url.isNotEmpty) launchUrl(Uri.parse(url));
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Text(
                  '${link['title'] ?? ''}',
                  style: TextStyle(color: MalSyncStyle.secondaryText(context)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Their recommendation card: the cover with how many people recommend it, the
/// name under it.
class _Recommendation extends StatelessWidget {
  const _Recommendation({required this.recommendation});

  final Map recommendation;

  @override
  Widget build(BuildContext context) {
    final entry = (recommendation['entry'] as Map?) ?? const {};
    final stats = (recommendation['stats'] as Map?) ?? const {};
    final image = '${entry['image'] ?? entry['imageLarge'] ?? ''}';
    final url = '${entry['url'] ?? ''}';
    final users = '${stats['users'] ?? ''}';
    return GestureDetector(
      onTap: url.isEmpty ? null : () => launchUrl(Uri.parse(url)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            children: [
              AspectRatio(
                aspectRatio: MalSyncStyle.coverAspectRatio,
                child: ClipRRect(
                  borderRadius:
                      BorderRadius.circular(MalSyncStyle.controlRadius),
                  child: image.isEmpty
                      ? Container(color: MalSyncStyle.backdrop(context))
                      : Image(
                          image: coverProvider(image),
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const SizedBox.shrink(),
                        ),
                ),
              ),
              if (users.isNotEmpty)
                Positioned(
                  top: MalSyncStyle.spacerHalf,
                  left: MalSyncStyle.spacerHalf,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: MalSyncStyle.darkBackground(context),
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.people_outline,
                          size: 18,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          users,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: MalSyncStyle.smallText,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Text(
              '${entry['title'] ?? ''}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: MalSyncStyle.text(context),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Their review card: who wrote it, their rating, and the text.
class _Review extends StatelessWidget {
  const _Review({required this.review});

  final Map review;

  @override
  Widget build(BuildContext context) {
    final user = (review['user'] as Map?) ?? const {};
    final body = (review['body'] as Map?) ?? const {};
    final text = MalSyncMetaSections._plainText('${body['text'] ?? ''}');
    return Padding(
      padding: const EdgeInsets.only(bottom: MalSyncStyle.spacer),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '${user['name'] ?? ''}',
                  style: TextStyle(
                    color: MalSyncStyle.text(context),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              if ('${body['rating'] ?? ''}'.isNotEmpty)
                Text(
                  '${body['rating']}',
                  style: TextStyle(color: MalSyncStyle.secondaryText(context)),
                ),
            ],
          ),
          const SizedBox(height: 5),
          Text(
            text,
            maxLines: 6,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: MalSyncStyle.text(context), height: 1.3),
          ),
        ],
      ),
    );
  }
}

/// Their details list: the label bold, the values under it.
class _Information extends StatelessWidget {
  const _Information({required this.info});

  final List info;

  @override
  Widget build(BuildContext context) {
    final items = <Widget>[];
    for (final raw in info) {
      final item = raw as Map;
      final values = _values(item['body']);
      if (values.isEmpty) continue;
      items.add(
        Padding(
          padding: const EdgeInsets.only(bottom: MalSyncStyle.spacerHalf),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${item['title'] ?? ''}',
                style: TextStyle(
                  color: MalSyncStyle.text(context),
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 3),
              Wrap(
                spacing: 5,
                runSpacing: 3,
                children: values,
              ),
            ],
          ),
        ),
      );
    }
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: items);
  }

  /// A details value can be text, a link, or a release date we do not have
  /// this app's own view for.
  static List<Widget> _values(dynamic body) {
    if (body is! List) return const [];
    final spans = <Widget>[];
    for (final raw in body) {
      if (raw is! Map) continue;
      if (raw.containsKey('date')) continue;
      final text = '${raw['text'] ?? ''}';
      if (text.isEmpty) continue;
      final subtext = '${raw['subtext'] ?? ''}';
      spans.add(_InfoValue(text: text, url: '${raw['url'] ?? ''}', subtext: subtext));
    }
    return spans;
  }
}

class _InfoValue extends StatelessWidget {
  const _InfoValue({
    required this.text,
    required this.url,
    required this.subtext,
  });

  final String text;
  final String url;
  final String subtext;

  @override
  Widget build(BuildContext context) {
    final label = Text(
      subtext.isEmpty ? text : '$text $subtext',
      style: TextStyle(
        color: url.isEmpty
            ? MalSyncStyle.text(context)
            : MalSyncStyle.secondaryText(context),
      ),
    );
    if (url.isEmpty) return label;
    return GestureDetector(
      onTap: () => launchUrl(Uri.parse(url)),
      child: label,
    );
  }
}
