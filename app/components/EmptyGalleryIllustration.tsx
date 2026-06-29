import React from "react";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { colors } from "../../lib/theme";

type Props = { width?: number; height?: number };

/** Minimal line-art lifestyle vignette for gallery empty state */
export default function EmptyGalleryIllustration({ width = 200, height = 160 }: Props) {
  const stroke = colors.sage;
  const accent = colors.terracotta;
  return (
    <Svg width={width} height={height} viewBox="0 0 200 160" fill="none">
      {/* Plant */}
      <Line x1="50" y1="130" x2="50" y2="70" stroke={stroke} strokeWidth="1.5" />
      <Path d="M50 90 Q30 80 35 65 Q45 75 50 90" stroke={stroke} strokeWidth="1.5" fill="none" />
      <Path d="M50 75 Q70 65 65 50 Q55 60 50 75" stroke={stroke} strokeWidth="1.5" fill="none" />
      <Circle cx="50" cy="130" r="12" stroke={stroke} strokeWidth="1.5" fill="none" />
      {/* Hanger + garment */}
      <Path d="M110 45 L130 45 M120 45 L120 55" stroke={stroke} strokeWidth="1.5" />
      <Path d="M95 55 Q120 40 145 55 L140 110 Q120 115 100 110 Z" stroke={stroke} strokeWidth="1.5" fill="none" />
      {/* Bowl */}
      <Path d="M155 115 Q170 125 185 115" stroke={accent} strokeWidth="1.5" fill="none" />
      <Ellipse cx={170} cy={115} rx={18} ry={6} stroke={accent} strokeWidth={1.5} fill="none" />
      {/* Shelf line */}
      <Line x1="30" y1="130" x2="185" y2="130" stroke={`${stroke}60`} strokeWidth="1" strokeDasharray="4 4" />
    </Svg>
  );
}

function Ellipse({ cx, cy, rx, ry, stroke, strokeWidth, fill }: {
  cx: number; cy: number; rx: number; ry: number;
  stroke: string; strokeWidth: number; fill: string;
}) {
  return (
      <Path
        d={`M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
      />  );
}
