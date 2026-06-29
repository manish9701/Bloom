/**
 * Bloom — Full-screen image viewer
 * Swipe down to close, Before/After toggle, scrollable tags
 */
import React, { useRef, useCallback } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Text,
  Animated,
  PanResponder,
  ScrollView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { X } from "phosphor-react-native";
import { colors, fonts, radius } from "../../lib/theme";

const { width: W, height: H } = Dimensions.get("window");

type Props = {
  visible: boolean;
  uri: string | null;
  caption?: string;
  onClose: () => void;
  beforeUri?: string | null;
  afterUri?: string | null;
  tags?: string[];
};

export default function ImageViewer({
  visible,
  uri,
  caption,
  onClose,
  beforeUri,
  afterUri,
  tags,
}: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(1)).current;
  const hasBA = !!(beforeUri && afterUri);
  const [showing, setShowing] = React.useState<"main" | "before" | "after">("main");

  React.useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      opacity.setValue(1);
      setShowing(afterUri ? "after" : "main");
    }
  }, [visible, afterUri]);

  const activeUri = hasBA
    ? (showing === "before" ? beforeUri : afterUri) ?? uri
    : uri;

  const onCloseRef = useRef(onClose);
  React.useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: H, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      translateY.setValue(0);
      opacity.setValue(1);
      onCloseRef.current();
    });
  }, [opacity, translateY]);

  const closeRef = useRef(close);
  React.useEffect(() => { closeRef.current = close; }, [close]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx) * 2.5,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dy > 16 && Math.abs(g.dy) > Math.abs(g.dx) * 2.5,
      onPanResponderGrant: () => {
        (translateY as any).setOffset((translateY as any).__getValue());
        translateY.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
          opacity.setValue(Math.max(0, 1 - g.dy / 280));
        }
      },
      onPanResponderRelease: (_, g) => {
        translateY.flattenOffset();
        if (g.dy > 80 || g.vy > 0.5) {
          closeRef.current();
        } else {
          Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
            Animated.timing(opacity,   { toValue: 1, duration: 160, useNativeDriver: true }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        translateY.flattenOffset();
        Animated.parallel([
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
          Animated.timing(opacity,   { toValue: 1, duration: 160, useNativeDriver: true }),
        ]).start();
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  if (!visible || !activeUri) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <StatusBar hidden translucent backgroundColor="#000" />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={{ flex: 1, backgroundColor: "#000" }} />
      </View>
      <Animated.View
        style={[s.root, { transform: [{ translateY }], backgroundColor: "#000" }]}
        {...panResponder.panHandlers}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity, backgroundColor: "#000" }]} pointerEvents="none" />

        <View style={s.imgWrap} pointerEvents="box-none">
          <Image
            source={{ uri: activeUri }}
            style={s.img}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>

        <View style={s.topBar} pointerEvents="box-none">
          <TouchableOpacity style={s.cancelBtn} onPress={close} hitSlop={12} activeOpacity={0.8}>
            <X size={16} color={colors.white} weight="light" />
            <Text style={s.cancelTxt}>Close</Text>
          </TouchableOpacity>

          {hasBA && (
            <View style={s.baToggle} pointerEvents="box-none">
              {Platform.OS !== "web" && (
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              )}
              <TouchableOpacity
                style={[s.baBtn, showing === "before" && s.baBtnActiveBefore]}
                onPress={() => setShowing("before")}
                activeOpacity={0.8}
              >
                <Text style={[s.baBtnTxt, showing === "before" && s.baBtnTxtActiveBefore]}>Before</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.baBtn, showing === "after" && s.baBtnActiveAfter]}
                onPress={() => setShowing("after")}
                activeOpacity={0.8}
              >
                <Text style={[s.baBtnTxt, showing === "after" && s.baBtnTxtActiveAfter]}>
                  {showing === "after" ? "✦ After" : "After"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={s.bottomBar} pointerEvents="box-none">
          {caption ? (
            <View style={s.captionWrap}>
              <Text style={s.captionTxt} numberOfLines={2}>{caption}</Text>
            </View>
          ) : null}

          {tags && tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tagsRow}
              style={s.tagScroll}
            >
              {tags.map((tag, i) => (
                <View key={i} style={s.tag}>
                  <Text style={s.tagTxt}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <Text style={s.hintTxt}>Swipe down to close</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  imgWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  img:     { width: W, height: H, backgroundColor: "#000" },

  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingTop: 52,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  cancelBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.glass,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  cancelTxt: { color: colors.white, fontSize: 13, fontFamily: fonts.bodyMedium },

  baToggle: {
    flexDirection: "row", padding: 4,
    backgroundColor: "rgba(18,32,24,0.55)",
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.white15,
    overflow: "hidden",
  },
  baBtn:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  baBtnActiveBefore: { backgroundColor: colors.white },
  baBtnActiveAfter:  { backgroundColor: colors.forest },
  baBtnTxt:       { color: colors.white55, fontSize: 12, fontFamily: fonts.bodyMedium },
  baBtnTxtActiveBefore: { color: colors.charcoal, fontFamily: fonts.bodySemiBold },
  baBtnTxtActiveAfter:  { color: colors.cream, fontFamily: fonts.bodySemiBold },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingBottom: 40, gap: 10,
  },
  captionWrap: {
    marginHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12,
  },
  captionTxt: { color: colors.white, fontSize: 14, fontFamily: fonts.bodyRegular, textAlign: "center" },
  tagScroll:  { marginBottom: 4 },
  tagsRow:    { paddingHorizontal: 18, gap: 8 },
  tag: {
    backgroundColor: colors.glass,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tagTxt:  { color: colors.sage, fontSize: 12, fontFamily: fonts.bodyMedium },
  hintTxt: {
    color: colors.white40, fontSize: 11,
    fontFamily: fonts.bodyRegular, textAlign: "center",
  },
});
