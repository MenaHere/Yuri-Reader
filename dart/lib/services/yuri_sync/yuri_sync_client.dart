import 'dart:io';
import 'dart:convert';
import 'dart:async';

class YuriSyncClient {
  final String host;
  final int port;
  Socket? _socket;
  int _messageId = 0;
  final Map<int, Completer<Map<String, dynamic>>> _pending = {};
  final _buffer = StringBuffer();

  YuriSyncClient({this.host = '127.0.0.1', required this.port});

  Future<void> connect() async {
    _socket = await Socket.connect(host, port);
    _socket!.listen(
      _onData,
      onError: (Object error) {
        for (final c in _pending.values) {
          if (!c.isCompleted) c.completeError(error);
        }
        _pending.clear();
      },
      onDone: () {
        for (final c in _pending.values) {
          if (!c.isCompleted) {
            c.completeError(StateError('YuriSync connection closed'));
          }
        }
        _pending.clear();
      },
    );
  }

  Future<Map<String, dynamic>> call(
      String method, Map<String, dynamic> params) async {
    final id = ++_messageId;
    final completer = Completer<Map<String, dynamic>>();
    _pending[id] = completer;

    final message = jsonEncode({
      'jsonrpc': '2.0',
      'method': method,
      'params': params,
      'id': id,
    });

    _socket!.write('$message\n');
    return completer.future;
  }

  void _onData(List<int> data) {
    _buffer.write(utf8.decode(data, allowMalformed: true));
    String chunk = _buffer.toString();
    int idx;
    while ((idx = chunk.indexOf('\n')) != -1) {
      final line = chunk.substring(0, idx).trim();
      chunk = chunk.substring(idx + 1);
      if (line.isNotEmpty) {
        _processLine(line);
      }
    }
    _buffer.clear();
    _buffer.write(chunk);
  }

  void _processLine(String line) {
    try {
      final response = jsonDecode(line) as Map<String, dynamic>;
      final id = response['id'] as int?;
      if (id != null && _pending.containsKey(id)) {
        _pending.remove(id)!.complete(response);
      }
    } catch (_) {}
  }

  void disconnect() {
    _socket?.close();
    _socket = null;
  }
}
