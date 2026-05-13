import 'package:yuri_reader/main.dart';
import 'package:yuri_reader/models/settings.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
part 'logs_state.g.dart';

@riverpod
bool logsState(Ref ref) {
  return isar.settings.getSync(227)?.enableLogs ?? false;
}
