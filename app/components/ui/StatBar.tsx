import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, cardShadow, radius } from "../../../lib/theme";

type Stat = { label: string; value: string };

type Props = {
  stats: Stat[];
};

export default function StatBar({ stats }: Props) {
  return (
    <View style={s.wrap}>
      {stats.map((stat, i) => (
        <React.Fragment key={stat.label}>
          {i > 0 && <View style={s.divider} />}
          <View style={s.item}>
            <Text style={s.value}>{stat.value}</Text>
            <Text style={s.label}>{stat.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginTop: -28,
    ...cardShadow,
    borderWidth: 1,
    borderColor: `${colors.forest}08`,
  },
  item:     { flex: 1, alignItems: "center" },
  value:    { fontSize: 20, fontFamily: fonts.displayMedium, color: colors.forest },
  label:    { fontSize: 11, fontFamily: fonts.bodyRegular, color: colors.sage, marginTop: 2 },
  divider:  { width: 1, height: 32, backgroundColor: `${colors.forest}10` },
});
