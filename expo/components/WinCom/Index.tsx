import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, withSpring, useSharedValue } from 'react-native-reanimated';
import CompassRing from './CompassRing';
import WindArrow from './WindArrow';

interface WindCompassProps {
  windDirectionFromAPI: number;
  deviceHeading?: number;
}

export default function WindCompass({ windDirectionFromAPI, deviceHeading: externalHeading = 0 }: WindCompassProps) {
  const headingShared = useSharedValue(0);

  React.useEffect(() => {
    headingShared.value = externalHeading;
  }, [externalHeading, headingShared]);

  const ringRotation = useDerivedValue(() => {
    return withSpring(-headingShared.value, { damping: 30, stiffness: 60, mass: 1.2 });
  });

  const arrowRotation = useDerivedValue(() => {
    return withSpring(windDirectionFromAPI + 180 - headingShared.value, { damping: 30, stiffness: 60, mass: 1.2 });
  });

  return (
    <View style={styles.container}>
      <CompassRing rotationStyle={ringRotation} />
      <WindArrow rotationStyle={arrowRotation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },
});
