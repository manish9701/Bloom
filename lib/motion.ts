import { Easing } from "react-native";

export const motion = {
  duration: {
    micro: 150,
    screen: 320,
    reveal: 500,
    scan: 2500,
  },
  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  stagger: {
    step: 80,
    delay: (index: number) => index * 80,
  },
  press: {
    scale: 0.97,
    duration: 150,
  },
};
