export type DeviceType = "iphone_portrait" | "iphone_69_portrait" | "ipad_portrait" | "android_portrait";

export type LayoutStyle = "text-top" | "text-bottom" | "full-screenshot";

export type BackgroundType = "solid" | "linear-gradient" | "radial-gradient";

export type MockupColor = "dark" | "light" | "gold" | "spacegray";

export type OverlayType = "dust" | "grain";

export interface OverlayElement {
  type: OverlayType;
  enabled: boolean;
  scale: number;
  opacity: number;
}

export interface LocaleTranslation {
  headline: string;
  subtext: string;
}

export interface ScreenshotScreen {
  id: string;
  name: string; // E.g., "Screen 1 - Dashboard"
  headline: string;
  subtext: string;
  translations?: Record<string, LocaleTranslation>;
  screenshotUrl: string | null; // Base64 or object URL of uploaded image
  screenshotFit: "contain" | "cover";
  deviceType: DeviceType;
  deviceColor: MockupColor;
  backgroundType: BackgroundType;
  backgroundColor1: string;
  backgroundColor2: string;
  gradientAngle: number;
  fontFamily: string;
  headlineFontWeight: string; // "bold" | "normal" | "600" etc.
  textColorHeadline: string;
  textColorSubtext: string;
  fontSizeHeadline: number; // in pixels (will scale with output canvas)
  fontSizeSubtext: number;  // in pixels (will scale with output canvas)
  lineHeightHeadline: number; // multiplier, e.g. 1.25
  lineHeightSubtext: number;  // multiplier, e.g. 1.35
  align: "left" | "center" | "right";
  layoutStyle: LayoutStyle;
  deviceScale: number; // E.g., 0.85
  deviceOffsetY: number; // offset from default center (as % of canvas height, e.g. -10 to +10)
  deviceOffsetX: number; // offset as % of canvas width
  deviceRotation?: number; // rotation in degrees (-45 to +45)
  isLocked: boolean; // lock settings to global values (or override)
  overlays: OverlayElement[];
}

export interface AppStoreDimensions {
  width: number;
  height: number;
  label: string;
  description: string;
}

export interface ASOProject {
  appName: string;
  appDescription: string;
  category: "kids" | "productivity" | "utility" | "game" | "custom";
  tone: "playful" | "bold" | "minimal" | "corporate" | "energetic";
  locales: string[];
  activeLocale: string;
  globalSettings: {
    deviceType: DeviceType;
    deviceColor: MockupColor;
    backgroundType: BackgroundType;
    backgroundColor1: string;
    backgroundColor2: string;
    gradientAngle: number;
    fontFamily: string;
    headlineFontWeight: string;
    textColorHeadline: string;
    textColorSubtext: string;
    fontSizeHeadline: number;
    fontSizeSubtext: number;
    lineHeightHeadline: number;
    lineHeightSubtext: number;
    align: "left" | "center" | "right";
    layoutStyle: LayoutStyle;
    deviceRotation?: number;
    overlays: OverlayElement[];
  };
  screens: ScreenshotScreen[];
}
