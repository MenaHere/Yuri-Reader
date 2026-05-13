import 'package:isar_community/isar.dart';
import 'package:yuri_reader/main.dart';
import 'package:yuri_reader/models/custom_button.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
part 'custom_buttons_provider.g.dart';

@riverpod
Stream<List<CustomButton>> getCustomButtonsStream(Ref ref) async* {
  yield* isar.customButtons.filter().idIsNotNull().sortByPos().watch(
    fireImmediately: true,
  );
}
