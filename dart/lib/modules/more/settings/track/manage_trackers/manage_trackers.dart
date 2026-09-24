import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:yuri_reader/models/track_preference.dart';
import 'package:yuri_reader/modules/tracker_library/tracker_library_screen.dart';
import 'package:yuri_reader/modules/widgets/gridview_widget.dart';
import 'package:yuri_reader/modules/widgets/tracker_account_avatar.dart';
import 'package:yuri_reader/repositories/track_repository.dart';
import 'package:yuri_reader/providers/l10n_providers.dart';
import 'package:yuri_reader/utils/constant.dart';
import 'package:yuri_reader/utils/extensions/build_context_extensions.dart';

class ManageTrackersScreen extends StatefulWidget {
  const ManageTrackersScreen({super.key});

  @override
  State<ManageTrackersScreen> createState() => _ManageTrackersScreenState();
}

class _ManageTrackersScreenState extends State<ManageTrackersScreen> {
  late List<TrackPreference> trackPreferences = [];
  @override
  void initState() {
    super.initState();
    trackPreferences = trackRepository.getAllPreferences();
    // trackPreferences.insert(0, TrackPreference(syncId: -1));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.manage_trackers)),
      body: GridViewWidget(
        childAspectRatio: 0.69,
        itemCount: trackPreferences.length,
        itemBuilder: (context, index) {
          final trackerPref = trackPreferences[index];
          final accountLabel = trackerPref.accountLabel;
          return Padding(
            padding: const EdgeInsets.all(8.0),
            child: MaterialButton(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              onPressed: () {
                // MAL-Sync has no tracker detail page of ours worth showing:
                // its tracked list and its settings live in its own web app.
                if (trackerPref.syncId == TrackerProviders.malsync.syncId) {
                  context.push(
                    '/mangawebview',
                    extra: {'url': malsyncPwaUrl, 'title': 'MAL-Sync'},
                  );
                } else {
                  context.push('/trackingDetail', extra: trackerPref);
                }
              },
              child: Column(
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 5),
                      child: Container(
                        decoration: BoxDecoration(
                          color: trackerPref.syncId == -1
                              ? Colors.grey
                              : trackInfos(trackerPref.syncId!).$3,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: trackerPref.syncId == -1
                            ? SizedBox(
                                width: context.width(1),
                                child: const Icon(
                                  Icons.local_library_rounded,
                                  size: 60,
                                ),
                              )
                            : trackerIcon(
                                trackerPref.syncId!,
                                size: 60,
                                imageHeight: null,
                              ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Text(
                      trackerPref.syncId == -1
                          ? 'Local'
                          : trackInfos(trackerPref.syncId!).$2,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 19,
                      ),
                    ),
                  ),
                  // Which account, not just which service. Four services can
                  // be connected at once and nothing here said whose lists
                  // were being shown.
                  if (accountLabel != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          TrackerAccountAvatar(
                            preference: trackerPref,
                            radius: 10,
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              accountLabel,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 13,
                                color: context.secondaryColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    const SizedBox(height: 10),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
