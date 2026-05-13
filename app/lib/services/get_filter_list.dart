import 'package:yuri_reader/eval/lib.dart';
import 'package:yuri_reader/models/source.dart';

List<dynamic> getFilterList({required Source source}) {
  final service = getExtensionService(source, "");
  try {
    return service.getFilterList().filters;
  } finally {
    service.dispose();
  }
}
