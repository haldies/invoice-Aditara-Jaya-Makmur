import LiquidGlass from "liquid-glass-react";

interface LiquidGlassIndicatorProps {
  size?: number;
}

export default function LiquidGlassIndicator({
  size = 44,
}: LiquidGlassIndicatorProps) {
  return (
    <LiquidGlass
      displacementScale={38}
      blurAmount={0.02}
      saturation={105}
      aberrationIntensity={0.7}
      elasticity={0.18}
      cornerRadius={size / 2}
      padding="0"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: "transparent",
      }}
    >
      <span className="block h-full w-full" />
    </LiquidGlass>
  );
}
