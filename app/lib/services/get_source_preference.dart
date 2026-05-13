import 'package:yuri_reader/eval/lib.dart';
import 'package:yuri_reader/eval/model/source_preference.dart';
import 'package:yuri_reader/models/source.dart';

List<SourcePreference> getSourcePreference({required Source source}) {
  final service = getExtensionService(source, "");
  try {
    return service.getSourcePreferences();
  } finally {
    service.dispose();
  }
}
