import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

const CARDINAL_MARKERS = [
  { degree: 0, label: 'N' },
  { degree: 90, label: 'E' },
  { degree: 180, label: 'S' },
  { degree: 270, label: 'W' },
];

const CENTER = 150;
const RADIUS = 140;
const TICK_MAJOR = 16;
const TICK_MINOR = 8;
const TEXT_RADIUS = 112;

const MINOR_TICKS = Array.from({ length: 72 }, (_, i) => i * 5);

export default function CompassRing({ rotationStyle }: { rotationStyle: any }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationStyle.value}deg` }],
  }));

  const Container = Platform.OS !== 'web' ? Animated.View : View;
  const containerStyle = Platform.OS !== 'web' ? [styles.fullSize, animatedStyle] : styles.fullSize;

  const pos = (degree: number, radius: number) => {
    const rad = ((degree - 90) * Math.PI) / 180;
    return {
      x: CENTER + radius * Math.cos(rad),
      y: CENTER + radius * Math.sin(rad),
    };
  };

  return (
    <Container style={containerStyle}>
      <Svg height="300" width="300" viewBox="0 0 300 300">
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.5"
          fill="none"
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS - 22}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.8"
          fill="none"
        />

        {MINOR_TICKS.map((deg) => {
          const isCardinal = deg % 90 === 0;
          if (isCardinal) return null;
          const is30 = deg % 30 === 0;
          const tickLen = is30 ? TICK_MINOR + 4 : TICK_MINOR;
          const outerP = pos(deg, RADIUS);
          const innerP = pos(deg, RADIUS - tickLen);
          return (
            <Line
              key={`t${deg}`}
              x1={outerP.x}
              y1={outerP.y}
              x2={innerP.x}
              y2={innerP.y}
              stroke={is30 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}
              strokeWidth={is30 ? '1.2' : '0.8'}
            />
          );
        })}

        {CARDINAL_MARKERS.map(({ degree, label }) => {
          const outerP = pos(degree, RADIUS);
          const innerP = pos(degree, RADIUS - TICK_MAJOR);
          const textP = pos(degree, TEXT_RADIUS);
          const isNorth = degree === 0;

          return (
            <React.Fragment key={degree}>
              <Line
                x1={outerP.x}
                y1={outerP.y}
                x2={innerP.x}
                y2={innerP.y}
                stroke="white"
                strokeWidth={isNorth ? '3' : '2'}
              />
              <SvgText
                x={textP.x}
                y={textP.y}
                fill={isNorth ? '#ff4444' : 'white'}
                fontSize={isNorth ? '20' : '16'}
                fontWeight={isNorth ? 'bold' : '600'}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </Container>
  );
}

const styles = StyleSheet.create({
  fullSize: { position: 'absolute', width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },
});
