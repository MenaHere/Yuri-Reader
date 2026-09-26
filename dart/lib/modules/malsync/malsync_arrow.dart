import 'dart:math' as math;

import 'package:flutter/material.dart';

/// malsync's own mark: the arrow its floating button shows on a page it
/// recognises. A solid head with a rounded shaft and a heavier tail behind it,
/// turned so it points up and to the left, which is the direction its
/// correction button points.
class MalSyncArrowIcon extends StatelessWidget {
  const MalSyncArrowIcon({super.key, required this.color, this.size = 20});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: -math.pi / 4,
      child: CustomPaint(
        size: Size(size, size * 0.5),
        painter: _MalSyncArrowPainter(color),
      ),
    );
  }
}

class _MalSyncArrowPainter extends CustomPainter {
  const _MalSyncArrowPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final height = size.height;
    // The head is as wide as the arrow is tall, which is the proportion its
    // three-div mark has.
    final head = height;
    final headPath = Path()
      ..moveTo(0, height / 2)
      ..lineTo(head, 0)
      ..lineTo(head, height)
      ..close();
    canvas.drawPath(headPath, paint);
    canvas.drawRRect(
      RRect.fromLTRBR(
        head * 0.8,
        height * 0.3,
        size.width - height * 0.35,
        height * 0.7,
        Radius.circular(height * 0.2),
      ),
      paint,
    );
    canvas.drawRRect(
      RRect.fromLTRBR(
        size.width - height * 0.45,
        height * 0.08,
        size.width,
        height * 0.92,
        Radius.circular(height * 0.25),
      ),
      paint,
    );
  }

  @override
  bool shouldRepaint(_MalSyncArrowPainter oldDelegate) =>
      oldDelegate.color != color;
}
