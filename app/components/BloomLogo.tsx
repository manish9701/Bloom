import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "../../lib/theme";

type Props = {
  size?: number;
  color?: string;
};

/** 6-petal fine-line Bloom flower mark */
export default function BloomLogo({ size = 28, color = colors.forest }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx="16" cy="16" r="2.5" stroke={color} strokeWidth="1.2" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 16 + Math.cos(rad) * 7;
        const cy = 16 + Math.sin(rad) * 7;
        return (
          <Path
            key={deg}
            d={`M16 16 Q${16 + Math.cos(rad - 0.4) * 10} ${16 + Math.sin(rad - 0.4) * 10} ${cx} ${cy} Q${16 + Math.cos(rad + 0.4) * 10} ${16 + Math.sin(rad + 0.4) * 10} 16 16`}
            stroke={color}
            strokeWidth="1.2"
            fill="none"
          />
        );
      })}
    </Svg>
  );
}
