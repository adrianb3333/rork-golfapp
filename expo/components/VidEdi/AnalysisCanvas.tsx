import React, { useMemo } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import { useSwingStore } from '@/store/swingStore';
import { DrawingPath, Point } from '@/Types';

interface AnalysisCanvasProps {
  width: number;
  height: number;
}

function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

function renderDrawing(drawing: DrawingPath) {
  const { tool, points, color, strokeWidth, id } = drawing;

  switch (tool) {
    case 'freehand':
      return (
        <Path
          key={id}
          d={pointsToSvgPath(points)}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    case 'line':
      if (points.length < 2) return null;
      const start = points[0];
      const end = points[points.length - 1];
      return (
        <G key={id}>
          <Line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Circle cx={start.x} cy={start.y} r={4} fill={color} />
          <Circle cx={end.x} cy={end.y} r={4} fill={color} />
        </G>
      );

    case 'circle':
      if (points.length < 2) return null;
      const center = points[0];
      const edgePoint = points[points.length - 1];
      const radius = Math.sqrt(
        Math.pow(edgePoint.x - center.x, 2) + Math.pow(edgePoint.y - center.y, 2)
      );
      return (
        <G key={id}>
          <Circle
            cx={center.x}
            cy={center.y}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle cx={center.x} cy={center.y} r={3} fill={color} />
        </G>
      );

    case 'angle':
      if (points.length < 3) {
        if (points.length === 2) {
          return (
            <Line
              key={id}
              x1={points[0].x}
              y1={points[0].y}
              x2={points[1].x}
              y2={points[1].y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        }
        return null;
      }
      const p1 = points[0];
      const vertex = points[Math.floor(points.length / 2)];
      const p3 = points[points.length - 1];
      return (
        <G key={id}>
          <Line
            x1={vertex.x}
            y1={vertex.y}
            x2={p1.x}
            y2={p1.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Line
            x1={vertex.x}
            y1={vertex.y}
            x2={p3.x}
            y2={p3.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Circle cx={vertex.x} cy={vertex.y} r={5} fill={color} />
          <Circle cx={p1.x} cy={p1.y} r={3} fill={color} />
          <Circle cx={p3.x} cy={p3.y} r={3} fill={color} />
        </G>
      );

    default:
      return null;
  }
}

export default function AnalysisCanvas({ width, height }: AnalysisCanvasProps) {
  const {
    drawings = [],
    activeDrawing,
    currentTool,
    startDrawing,
    continueDrawing,
    finishDrawing,
  } = useSwingStore();

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => currentTool !== 'none',
        onMoveShouldSetPanResponder: () => currentTool !== 'none',
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          console.log('Drawing started at:', locationX, locationY);
          startDrawing({ x: locationX, y: locationY });
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          continueDrawing({ x: locationX, y: locationY });
        },
        onPanResponderRelease: () => {
          finishDrawing();
        },
        onPanResponderTerminate: () => {
          finishDrawing();
        },
      }),
    [currentTool, startDrawing, continueDrawing, finishDrawing]
  );

  if (width === 0 || height === 0) return null;

  return (
    <View
      style={[styles.container, { width, height }]}
      {...panResponder.panHandlers}
      testID="analysis-canvas"
    >
      <Svg width={width} height={height}>
        {drawings.map(renderDrawing)}
        {activeDrawing && renderDrawing(activeDrawing)}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
  },
});
