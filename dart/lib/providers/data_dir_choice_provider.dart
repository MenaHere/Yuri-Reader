import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:yuri_reader/providers/storage_provider.dart';

/// Whether the startup data-directory gate is due. It is read once when the
/// app builds and [DataDirChoiceDue.resolve] clears it as soon as the user
/// answers, so a choice made in a running session does not re-prompt.
class DataDirChoiceDue extends Notifier<bool> {
  @override
  bool build() => StorageProvider.dataDirChoiceRequired;

  void resolve() => state = false;
}

final dataDirChoiceDueProvider = NotifierProvider<DataDirChoiceDue, bool>(
  DataDirChoiceDue.new,
);
