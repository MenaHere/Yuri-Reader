import 'package:flutter/material.dart';
import 'package:yuri_reader/utils/language.dart';

class ExtensionLangListTileWidget extends StatefulWidget {
  final String lang;
  final bool value;
  final Function(bool) onChanged;
  const ExtensionLangListTileWidget({
    super.key,
    required this.lang,
    required this.value,
    required this.onChanged,
  });

  @override
  State<ExtensionLangListTileWidget> createState() =>
      _ExtensionLangListTileWidgetState();
}

class _ExtensionLangListTileWidgetState
    extends State<ExtensionLangListTileWidget> {
  late bool _value;

  @override
  void initState() {
    super.initState();
    _value = widget.value;
  }

  @override
  void didUpdateWidget(covariant ExtensionLangListTileWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _value = widget.value;
    }
  }

  void _handleChange(bool val) {
    setState(() => _value = val);
    widget.onChanged(val);
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: () => _handleChange(!_value),
      title: Text(completeLanguageName(widget.lang.toLowerCase())),
      trailing: Switch(
        value: _value,
        onChanged: _handleChange,
      ),
    );
  }
}
