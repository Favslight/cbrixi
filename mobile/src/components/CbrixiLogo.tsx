import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { cbrixiLogoXml } from '../constants/logo';

type CbrixiLogoProps = {
  width?: number;
  height?: number;
};

export function CbrixiLogo({ width = 220, height = 42 }: CbrixiLogoProps) {
  return (
    <View style={styles.container}>
      <SvgXml xml={cbrixiLogoXml} width={width} height={height} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
