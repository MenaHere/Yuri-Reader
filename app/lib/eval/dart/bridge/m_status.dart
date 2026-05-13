import 'package:d4rt/d4rt.dart';
import 'package:yuri_reader/models/manga.dart';

class MStatusBridge {
  final statusDefinition = BridgedEnumDefinition<Status>(
    name: 'MStatus',
    values: Status.values,
  );
  void registerBridgedEnum(D4rt interpreter) {
    interpreter.registerBridgedEnum(
      statusDefinition,
      'package:yuri_reader/bridge_lib.dart',
    );
  }
}
