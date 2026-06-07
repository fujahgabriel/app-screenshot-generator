import { ScreenshotScreen, DeviceType, LayoutStyle, BackgroundType, MockupColor, OverlayElement, ZoomCallout } from "../types";

// ─── Text Utilities ────────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// ─── Shape Drawing Helpers ─────────────────────────────────────────────────────

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Draw a pill/stadium shape
function drawPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  drawRoundRect(ctx, x, y, width, height, height / 2);
}

// ─── Noise / Grain Texture ─────────────────────────────────────────────────────

/**
 * Draws a procedural film-grain / paper-noise texture over the canvas.
 * Uses a seeded pseudo-random pattern so it's deterministic for export.
 */
function drawGrainTexture(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  intensity: number = 0.04,
  particleSize: number = 1
) {
  ctx.save();
  // Use a small offscreen canvas to stamp the grain efficiently
  const grain = document.createElement("canvas");
  const tileSize = 256;
  grain.width = tileSize;
  grain.height = tileSize;
  const gc = grain.getContext("2d")!;
  const imageData = gc.createImageData(tileSize, tileSize);
  const d = imageData.data;

  // Seeded LCG random to keep grain deterministic
  let seed = 42;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  for (let i = 0; i < d.length; i += 4) {
    const v = rng() < intensity ? Math.floor(rng() * 60) : 0;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = v > 0 ? Math.floor(rng() * 180 + 40) : 0;
  }
  gc.putImageData(imageData, 0, 0);

  // Tile the grain tile across the full canvas
  const pattern = ctx.createPattern(grain, "repeat");
  if (pattern) {
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/**
 * Draws floating dust particles — small soft circles scattered across canvas.
 * Inspired by the sample design's speckled paper texture.
 */
function drawDustParticles(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  color: string,
  count: number = 60,
  maxRadius: number = 3
) {
  ctx.save();
  // Seeded LCG
  let seed = 1234;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  for (let i = 0; i < count; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const r = rng() * maxRadius + 0.5;
    const alpha = rng() * 0.25 + 0.05;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Procedural App Screen Mockups ────────────────────────────────────────────

function drawProceduralScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  type: string,
  deviceColor: MockupColor
) {
  ctx.save();
  ctx.beginPath();
  drawRoundRect(ctx, x, y, w, h, w * 0.075);
  ctx.clip();

  const isDarkTheme = deviceColor === "dark" || type.startsWith("prod");

  // Base background
  ctx.fillStyle = isDarkTheme ? "#12131C" : "#FFF9F2";
  ctx.fillRect(x, y, w, h);

  switch (type) {
    case "procedural:kids-welcome": {
      // Sky gradient background
      const skyGrad = ctx.createLinearGradient(x, y, x, y + h * 0.65);
      skyGrad.addColorStop(0, "#87CEEB");
      skyGrad.addColorStop(1, "#B8E0FF");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(x, y, w, h * 0.65);

      // Rolling green hills
      ctx.fillStyle = "#5DB832";
      ctx.beginPath();
      ctx.ellipse(x + w * 0.25, y + h * 0.73, w * 0.55, h * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6DC73A";
      ctx.beginPath();
      ctx.ellipse(x + w * 0.78, y + h * 0.76, w * 0.62, h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ground
      ctx.fillStyle = "#4CAF50";
      ctx.fillRect(x, y + h * 0.8, w, h * 0.2);

      // Bright sun with glow
      ctx.save();
      ctx.shadowColor = "rgba(255, 220, 50, 0.6)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#FFE34E";
      ctx.beginPath();
      ctx.arc(x + w * 0.82, y + h * 0.14, w * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Cute animated bear
      const bearX = x + w * 0.35;
      const bearY = y + h * 0.42;

      // Bear body shadow
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#8D5B4C";
      ctx.beginPath();
      ctx.ellipse(bearX, bearY + h * 0.04, w * 0.18, h * 0.11, 0, 0, Math.PI * 2); // body
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#8D5B4C";
      ctx.beginPath();
      ctx.arc(bearX, bearY - h * 0.04, w * 0.14, 0, Math.PI * 2); // head
      ctx.fill();
      // Ears
      ctx.beginPath();
      ctx.arc(bearX - w * 0.1, bearY - h * 0.11, w * 0.05, 0, Math.PI * 2);
      ctx.arc(bearX + w * 0.1, bearY - h * 0.11, w * 0.05, 0, Math.PI * 2);
      ctx.fill();
      // Ear inner
      ctx.fillStyle = "#C4836B";
      ctx.beginPath();
      ctx.arc(bearX - w * 0.1, bearY - h * 0.11, w * 0.028, 0, Math.PI * 2);
      ctx.arc(bearX + w * 0.1, bearY - h * 0.11, w * 0.028, 0, Math.PI * 2);
      ctx.fill();
      // Snout
      ctx.fillStyle = "#ECC695";
      ctx.beginPath();
      ctx.ellipse(bearX, bearY - h * 0.025, w * 0.065, h * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = "#1A202C";
      ctx.beginPath();
      ctx.arc(bearX - w * 0.055, bearY - h * 0.055, w * 0.018, 0, Math.PI * 2);
      ctx.arc(bearX + w * 0.055, bearY - h * 0.055, w * 0.018, 0, Math.PI * 2);
      ctx.fill();
      // Eye shine
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(bearX - w * 0.048, bearY - h * 0.062, w * 0.007, 0, Math.PI * 2);
      ctx.arc(bearX + w * 0.062, bearY - h * 0.062, w * 0.007, 0, Math.PI * 2);
      ctx.fill();
      // Nose
      ctx.fillStyle = "#5D3838";
      ctx.beginPath();
      ctx.arc(bearX, bearY - h * 0.027, w * 0.014, 0, Math.PI * 2);
      ctx.fill();

      // Play button with gradient
      const btnW = w * 0.64;
      const btnH = h * 0.095;
      const btnX = x + (w - btnW) / 2;
      const btnY = y + h * 0.53;
      const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
      btnGrad.addColorStop(0, "#FF6B9D");
      btnGrad.addColorStop(1, "#FF4081");
      ctx.save();
      ctx.shadowColor = "rgba(255,64,129,0.5)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = btnGrad;
      drawPill(ctx, btnX, btnY, btnW, btnH);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.max(13, w * 0.062)}px "Fredoka", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎮 PLAY NOW!", x + w / 2, btnY + btnH / 2);

      // Title card at top
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#FFFFFF";
      drawRoundRect(ctx, x + w * 0.1, y + h * 0.05, w * 0.8, h * 0.09, 14);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#FF7043";
      ctx.font = `bold ${Math.max(11, w * 0.048)}px "Fredoka", sans-serif`;
      ctx.fillText("⭐ PLAYLAND ⭐", x + w / 2, y + h * 0.1);
      break;
    }

    case "procedural:kids-gameplay": {
      ctx.fillStyle = "#FFF9E6";
      ctx.fillRect(x + w * 0.06, y + h * 0.13, w * 0.88, h * 0.65);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ECC055";
      ctx.strokeRect(x + w * 0.06, y + h * 0.13, w * 0.88, h * 0.65);

      ctx.strokeStyle = "rgba(236,192,85,0.3)";
      ctx.beginPath();
      ctx.moveTo(x + w * 0.36, y + h * 0.13); ctx.lineTo(x + w * 0.36, y + h * 0.78);
      ctx.moveTo(x + w * 0.64, y + h * 0.13); ctx.lineTo(x + w * 0.64, y + h * 0.78);
      ctx.moveTo(x + w * 0.06, y + h * 0.35); ctx.lineTo(x + w * 0.94, y + h * 0.35);
      ctx.moveTo(x + w * 0.06, y + h * 0.56); ctx.lineTo(x + w * 0.94, y + h * 0.56);
      ctx.stroke();

      const shapes = [
        { sx: x + w * 0.21, sy: y + h * 0.24, color: "#FF5F7E", label: "🍎" },
        { sx: x + w * 0.50, sy: y + h * 0.24, color: "#FFE23B", label: "⭐" },
        { sx: x + w * 0.79, sy: y + h * 0.46, color: "#3CD4A0", label: "🦊" },
        { sx: x + w * 0.21, sy: y + h * 0.67, color: "#7366FF", label: "🌸" },
      ];
      shapes.forEach(({ sx, sy, color, label }) => {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(sx, sy, w * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `${Math.max(14, w * 0.065)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, sx, sy);
      });

      // Score bar with gradient
      const scoreGrad = ctx.createLinearGradient(x + w * 0.1, 0, x + w * 0.9, 0);
      scoreGrad.addColorStop(0, "#5E3BEE");
      scoreGrad.addColorStop(1, "#8B5CF6");
      ctx.save();
      ctx.shadowColor = "rgba(94,59,238,0.4)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = scoreGrad;
      drawRoundRect(ctx, x + w * 0.1, y + h * 0.04, w * 0.8, h * 0.07, 10);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.max(11, w * 0.046)}px "Fredoka", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🔥 Score: 14,250", x + w / 2, y + h * 0.077);
      break;
    }

    case "procedural:kids-avatar": {
      ctx.fillStyle = "#FFE8E0";
      ctx.fillRect(x, y + h * 0.08, w, h * 0.84);

      const avatarX = x + w / 2;
      const avatarY = y + h * 0.44;

      // Rabbit body
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.08)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(avatarX, avatarY + h * 0.06, w * 0.22, h * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY - h * 0.02, w * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Ears
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(avatarX - w * 0.13, avatarY - h * 0.15, w * 0.06, h * 0.13, -0.15, 0, Math.PI * 2);
      ctx.ellipse(avatarX + w * 0.13, avatarY - h * 0.15, w * 0.06, h * 0.13, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFB6C1";
      ctx.beginPath();
      ctx.ellipse(avatarX - w * 0.13, avatarY - h * 0.15, w * 0.032, h * 0.08, -0.15, 0, Math.PI * 2);
      ctx.ellipse(avatarX + w * 0.13, avatarY - h * 0.15, w * 0.032, h * 0.08, 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Pirate hat
      const hatGrad = ctx.createLinearGradient(avatarX, avatarY - h * 0.22, avatarX, avatarY - h * 0.09);
      hatGrad.addColorStop(0, "#2D3748");
      hatGrad.addColorStop(1, "#1A202C");
      ctx.fillStyle = hatGrad;
      ctx.beginPath();
      ctx.moveTo(avatarX - w * 0.28, avatarY - h * 0.09);
      ctx.lineTo(avatarX + w * 0.28, avatarY - h * 0.09);
      ctx.quadraticCurveTo(avatarX + w * 0.22, avatarY - h * 0.2, avatarX, avatarY - h * 0.22);
      ctx.quadraticCurveTo(avatarX - w * 0.22, avatarY - h * 0.2, avatarX - w * 0.28, avatarY - h * 0.09);
      ctx.fill();
      ctx.fillStyle = "#F6E05E";
      ctx.beginPath();
      ctx.arc(avatarX, avatarY - h * 0.16, w * 0.036, 0, Math.PI * 2);
      ctx.fill();

      // Eyes and face details
      ctx.fillStyle = "#1A202C";
      ctx.beginPath();
      ctx.arc(avatarX - w * 0.08, avatarY - h * 0.02, w * 0.02, 0, Math.PI * 2);
      ctx.arc(avatarX + w * 0.08, avatarY - h * 0.02, w * 0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FF7B94";
      ctx.beginPath();
      ctx.arc(avatarX - w * 0.14, avatarY + h * 0.02, w * 0.038, 0, Math.PI * 2);
      ctx.arc(avatarX + w * 0.14, avatarY + h * 0.02, w * 0.038, 0, Math.PI * 2);
      ctx.fill();

      // Wardrobe panel
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.08)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#FFFFFF";
      drawRoundRect(ctx, x + w * 0.05, y + h * 0.72, w * 0.9, h * 0.2, 14);
      ctx.fill();
      ctx.restore();
      const colors = ["#FF5F7E", "#4299E1", "#38A169", "#9F7AEA"];
      colors.forEach((c, idx) => {
        ctx.save();
        ctx.shadowColor = c;
        ctx.shadowBlur = 8;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x + w * 0.18 + idx * w * 0.21, y + h * 0.82, w * 0.075, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      break;
    }

    case "procedural:kids-rewards": {
      ctx.fillStyle = "#FFF8E1";
      ctx.fillRect(x, y, w, h);

      // Trophy with glow
      ctx.save();
      ctx.shadowColor = "rgba(255,215,0,0.5)";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#FFD700";
      ctx.strokeStyle = "#E2A300";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.28, y + h * 0.2);
      ctx.lineTo(x + w * 0.72, y + h * 0.2);
      ctx.quadraticCurveTo(x + w * 0.72, y + h * 0.48, x + w * 0.5, y + h * 0.52);
      ctx.quadraticCurveTo(x + w * 0.28, y + h * 0.48, x + w * 0.28, y + h * 0.2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "#E2A300";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Trophy handles
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(x + w * 0.22, y + h * 0.31, w * 0.08, Math.PI * 0.3, Math.PI * 1.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + w * 0.78, y + h * 0.31, w * 0.08, -Math.PI * 0.1, Math.PI * 0.7);
      ctx.stroke();

      // Trophy stem & base
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(x + w * 0.45, y + h * 0.52, w * 0.1, h * 0.14);
      drawRoundRect(ctx, x + w * 0.27, y + h * 0.65, w * 0.46, h * 0.07, 8);
      ctx.fill();

      // #1 inside cup
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${w * 0.14}px "Fredoka", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("1", x + w / 2, y + h * 0.38);

      // Stars scattered
      const starPositions = [
        { sx: x + w * 0.12, sy: y + h * 0.18 },
        { sx: x + w * 0.88, sy: y + h * 0.22 },
        { sx: x + w * 0.08, sy: y + h * 0.55 },
        { sx: x + w * 0.92, sy: y + h * 0.6 },
      ];
      ctx.font = `${w * 0.1}px sans-serif`;
      starPositions.forEach(({ sx, sy }) => ctx.fillText("⭐", sx, sy));

      // Celebration banner
      const bannerGrad = ctx.createLinearGradient(x + w * 0.06, 0, x + w * 0.94, 0);
      bannerGrad.addColorStop(0, "#38A169");
      bannerGrad.addColorStop(1, "#48BB78");
      ctx.fillStyle = bannerGrad;
      drawRoundRect(ctx, x + w * 0.06, y + h * 0.78, w * 0.88, h * 0.1, 12);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.max(12, w * 0.05)}px "Fredoka", sans-serif`;
      ctx.fillText("🎉 LEVEL COMPLETE!", x + w / 2, y + h * 0.835);
      break;
    }

    case "procedural:kids-settings": {
      ctx.fillStyle = "#EBF8FF";
      ctx.fillRect(x, y, w, h);

      const headerGrad = ctx.createLinearGradient(x + w * 0.12, 0, x + w * 0.88, 0);
      headerGrad.addColorStop(0, "#7C3AED");
      headerGrad.addColorStop(1, "#9F67FA");
      ctx.save();
      ctx.shadowColor = "rgba(124,58,237,0.3)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = headerGrad;
      drawRoundRect(ctx, x + w * 0.1, y + h * 0.05, w * 0.8, h * 0.09, 14);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.max(11, w * 0.047)}px "Fredoka", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PARENT PORTAL", x + w / 2, y + h * 0.098);

      const options = ["🔊  Music & Sound Effects", "👶  Toddler Mode", "🔒  Parental Lock"];
      const toggles = [true, false, true];
      options.forEach((opt, idx) => {
        const cy = y + h * 0.2 + idx * h * 0.155;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.05)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#FFFFFF";
        drawRoundRect(ctx, x + w * 0.06, cy, w * 0.88, h * 0.12, 12);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#2D3748";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${Math.max(11, w * 0.044)}px sans-serif`;
        ctx.fillText(opt, x + w * 0.12, cy + h * 0.06);

        const swColor = toggles[idx] ? "#48BB78" : "#CBD5E0";
        ctx.save();
        if (toggles[idx]) { ctx.shadowColor = "rgba(72,187,120,0.3)"; ctx.shadowBlur = 8; }
        ctx.fillStyle = swColor;
        const swX = x + w * 0.72;
        const swY = cy + h * 0.038;
        const swW = w * 0.17;
        const swH = h * 0.043;
        drawPill(ctx, swX, swY, swW, swH);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        const knobX = toggles[idx] ? swX + swW - swH * 0.5 : swX + swH * 0.5;
        ctx.arc(knobX, swY + swH * 0.5, swH * 0.36, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#FFF0F3";
      drawRoundRect(ctx, x + w * 0.08, y + h * 0.71, w * 0.84, h * 0.18, 12);
      ctx.fill();
      ctx.fillStyle = "#E53E3E";
      ctx.font = `bold ${Math.max(10, w * 0.04)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("🔐 Verify Birth Year to Edit", x + w / 2, y + h * 0.77);
      ctx.fillStyle = "#1A202C";
      ctx.font = `bold ${Math.max(14, w * 0.058)}px monospace`;
      ctx.fillText("[ 1 9 X X ]", x + w / 2, y + h * 0.845);
      break;
    }

    case "procedural:prod-dashboard": {
      // Status bar
      ctx.fillStyle = "#161827";
      ctx.fillRect(x, y, w, h * 0.08);
      ctx.fillStyle = "#94A3B8";
      ctx.font = `600 ${Math.max(10, w * 0.035)}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("9:41", x + w * 0.08, y + h * 0.04);
      ctx.textAlign = "right";
      ctx.fillText("⚡ ●●●●", x + w * 0.92, y + h * 0.04);

      // Hero completion card
      const heroGrad = ctx.createLinearGradient(x + w * 0.06, y + h * 0.11, x + w * 0.94, y + h * 0.44);
      heroGrad.addColorStop(0, "#1E2030");
      heroGrad.addColorStop(1, "#252840");
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = heroGrad;
      drawRoundRect(ctx, x + w * 0.06, y + h * 0.11, w * 0.88, h * 0.33, 16);
      ctx.fill();
      ctx.restore();

      // Radial progress ring
      const rcx = x + w / 2;
      const rcy = y + h * 0.24;
      const rr = w * 0.16;
      ctx.strokeStyle = "#2D3555";
      ctx.lineWidth = w * 0.036;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(rcx, rcy, rr, 0, Math.PI * 2);
      ctx.stroke();

      // Gradient ring progress
      const ringGrad = ctx.createLinearGradient(rcx - rr, rcy, rcx + rr, rcy);
      ringGrad.addColorStop(0, "#38BDF8");
      ringGrad.addColorStop(1, "#818CF8");
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = w * 0.036;
      ctx.beginPath();
      ctx.arc(rcx, rcy, rr, -Math.PI / 2, Math.PI * 1.0);
      ctx.stroke();

      // Center percent
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${w * 0.08}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("84%", rcx, rcy);
      ctx.fillStyle = "#64748B";
      ctx.font = `${w * 0.033}px sans-serif`;
      ctx.fillText("DAILY FOCUS", rcx, rcy + h * 0.05);
      ctx.fillStyle = "#94A3B8";
      ctx.font = `500 ${w * 0.031}px sans-serif`;
      ctx.fillText("COMPLETION RATE", rcx, y + h * 0.41);

      // Task rows
      const tasks = ["🏋 Daily Workout", "💡 Learn Design", "📚 Reading Session"];
      tasks.forEach((task, idx) => {
        const ty = y + h * 0.49 + idx * h * 0.115;
        ctx.fillStyle = "#1A1F35";
        drawRoundRect(ctx, x + w * 0.06, ty, w * 0.88, h * 0.09, 10);
        ctx.fill();
        ctx.save();
        ctx.shadowColor = "#10B981";
        ctx.shadowBlur = 6;
        ctx.fillStyle = "#10B981";
        ctx.beginPath();
        ctx.arc(x + w * 0.15, ty + h * 0.045, w * 0.032, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#E2E8F0";
        ctx.textAlign = "left";
        ctx.font = `500 ${w * 0.038}px sans-serif`;
        ctx.fillText(task, x + w * 0.22, ty + h * 0.05);
        ctx.fillStyle = "#F59E0B";
        ctx.textAlign = "right";
        ctx.font = `bold ${w * 0.035}px sans-serif`;
        ctx.fillText(`🔥 ${12 + idx * 4}d`, x + w * 0.88, ty + h * 0.05);
      });
      break;
    }

    case "procedural:prod-tasks": {
      ctx.fillStyle = "#161827";
      ctx.fillRect(x, y, w, h * 0.13);
      ctx.fillStyle = "#E2E8F0";
      ctx.font = `bold ${Math.max(13, w * 0.052)}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TASKS ENGINE", x + w / 2, y + h * 0.065);

      const metrics = [
        { val: "42", label: "Tasks Done", color: "#FFFFFF" },
        { val: "18h", label: "Focus Hours", color: "#10B981" },
      ];
      metrics.forEach(({ val, label, color }, idx) => {
        const mx = idx === 0 ? x + w * 0.06 : x + w * 0.53;
        ctx.fillStyle = "#1A1B2F";
        drawRoundRect(ctx, mx, y + h * 0.16, w * 0.41, h * 0.12, 12);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.max(16, w * 0.065)}px "Space Grotesk", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(val, mx + w * 0.205, y + h * 0.22);
        ctx.fillStyle = "#64748B";
        ctx.font = `${Math.max(9, w * 0.034)}px sans-serif`;
        ctx.fillText(label, mx + w * 0.205, y + h * 0.263);
      });

      const items = [
        { done: true, title: "Review marketing copy", time: "10:30" },
        { done: true, title: "Deploy API middleware", time: "12:00" },
        { done: false, title: "Export screenshot ZIP", time: "2:00" },
        { done: false, title: "Configure Google Fonts", time: "3:45" },
        { done: false, title: "Write unit tests", time: "5:00" },
      ];
      items.forEach((item, idx) => {
        const ry = y + h * 0.32 + idx * h * 0.116;
        ctx.fillStyle = "#1E2030";
        drawRoundRect(ctx, x + w * 0.06, ry, w * 0.88, h * 0.09, 10);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = item.done ? "#10B981" : "#475569";
        ctx.fillStyle = item.done ? "#10B981" : "transparent";
        ctx.beginPath();
        ctx.arc(x + w * 0.14, ry + h * 0.045, w * 0.033, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (item.done) {
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `bold ${Math.max(8, w * 0.033)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("✓", x + w * 0.14, ry + h * 0.047);
        }
        ctx.fillStyle = item.done ? "#64748B" : "#F1F5F9";
        ctx.textAlign = "left";
        ctx.font = `${item.done ? "" : "bold "}${Math.max(9, w * 0.037)}px sans-serif`;
        ctx.fillText(item.title, x + w * 0.22, ry + h * 0.05);
        ctx.fillStyle = "#38BDF8";
        ctx.textAlign = "right";
        ctx.font = `${Math.max(8, w * 0.033)}px sans-serif`;
        ctx.fillText(item.time, x + w * 0.9, ry + h * 0.05);
      });
      break;
    }

    case "procedural:prod-calendar": {
      // Week selector
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#1A1F35";
      drawRoundRect(ctx, x + w * 0.06, y + h * 0.06, w * 0.88, h * 0.14, 12);
      ctx.fill();
      ctx.restore();

      const days = ["M", "T", "W", "T", "F", "S", "S"];
      const dates = ["24", "25", "26", "27", "28", "29", "30"];
      days.forEach((day, idx) => {
        const dx = x + w * 0.1 + idx * w * 0.12;
        ctx.fillStyle = idx === 3 ? "#FFFFFF" : "#64748B";
        ctx.font = `bold ${Math.max(9, w * 0.037)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(day, dx, y + h * 0.09);
        if (idx === 3) {
          ctx.save();
          ctx.shadowColor = "rgba(56,189,248,0.4)";
          ctx.shadowBlur = 10;
          ctx.fillStyle = "#38BDF8";
          ctx.beginPath();
          ctx.arc(dx, y + h * 0.145, w * 0.046, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          ctx.fillStyle = "#000000";
        } else {
          ctx.fillStyle = "#E2E8F0";
        }
        ctx.fillText(dates[idx], dx, y + h * 0.147);
      });

      // Schedule blocks
      const hours = ["09:00", "10:30", "12:00", "14:00"];
      const sched = ["Architecture Sync", "Design Review", "Lunch Block", "Brainstorm"];
      const schedColors = ["#3B82F6", "#EC4899", "#10B981", "#8B5CF6"];
      hours.forEach((hBlock, idx) => {
        const sy = y + h * 0.24 + idx * h * 0.16;
        ctx.fillStyle = "#4A5568";
        ctx.textAlign = "left";
        ctx.font = `bold ${Math.max(10, w * 0.038)}px monospace`;
        ctx.textBaseline = "middle";
        ctx.fillText(hBlock, x + w * 0.06, sy + h * 0.05);
        ctx.save();
        ctx.shadowColor = schedColors[idx] + "55";
        ctx.shadowBlur = 8;
        ctx.fillStyle = schedColors[idx];
        drawRoundRect(ctx, x + w * 0.23, sy, w * 0.71, h * 0.115, 10);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.max(10, w * 0.04)}px sans-serif`;
        ctx.fillText(sched[idx], x + w * 0.28, sy + h * 0.046);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = `${Math.max(8, w * 0.032)}px sans-serif`;
        ctx.fillText("Sync with team", x + w * 0.28, sy + h * 0.085);
      });
      break;
    }

    case "procedural:prod-stats": {
      // Chart card
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#1A1B2F";
      drawRoundRect(ctx, x + w * 0.06, y + h * 0.08, w * 0.88, h * 0.4, 14);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.max(10, w * 0.038)}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("WEEKLY METRICS", x + w * 0.1, y + h * 0.13);
      ctx.fillStyle = "#10B981";
      ctx.font = `bold ${Math.max(9, w * 0.033)}px sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText("▲ 14%", x + w * 0.9, y + h * 0.13);

      // Line chart with gradient fill
      const points = [
        { px: 0.12, py: 0.41 }, { px: 0.28, py: 0.33 }, { px: 0.44, py: 0.38 },
        { px: 0.6, py: 0.23 }, { px: 0.76, py: 0.28 }, { px: 0.88, py: 0.19 },
      ];
      // Fill under curve
      const fillGrad = ctx.createLinearGradient(0, y + h * 0.19, 0, y + h * 0.43);
      fillGrad.addColorStop(0, "rgba(16,185,129,0.25)");
      fillGrad.addColorStop(1, "rgba(16,185,129,0)");
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.moveTo(x + w * points[0].px, y + h * points[0].py);
      for (let i = 1; i < points.length; i++) {
        const xc = x + w * (points[i - 1].px + points[i].px) / 2;
        const yc = y + h * (points[i - 1].py + points[i].py) / 2;
        ctx.quadraticCurveTo(xc, yc, x + w * points[i].px, y + h * points[i].py);
      }
      ctx.lineTo(x + w * points[points.length - 1].px, y + h * 0.45);
      ctx.lineTo(x + w * points[0].px, y + h * 0.45);
      ctx.closePath();
      ctx.fill();

      // Line stroke with gradient
      const lineGrad = ctx.createLinearGradient(x + w * 0.12, 0, x + w * 0.88, 0);
      lineGrad.addColorStop(0, "#38BDF8");
      lineGrad.addColorStop(1, "#10B981");
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x + w * points[0].px, y + h * points[0].py);
      for (let i = 1; i < points.length; i++) {
        const xc = x + w * (points[i - 1].px + points[i].px) / 2;
        const yc = y + h * (points[i - 1].py + points[i].py) / 2;
        ctx.quadraticCurveTo(xc, yc, x + w * points[i].px, y + h * points[i].py);
      }
      ctx.stroke();

      const labels = ["M", "T", "W", "T", "F", "S"];
      points.forEach((pt, idx) => {
        ctx.save();
        ctx.shadowColor = "#38BDF8";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#38BDF8";
        ctx.beginPath();
        ctx.arc(x + w * pt.px, y + h * pt.py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(x + w * pt.px, y + h * pt.py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#64748B";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${Math.max(8, w * 0.033)}px sans-serif`;
        ctx.fillText(labels[idx], x + w * pt.px, y + h * 0.455);
      });

      // Metric cards
      const metricCards = [
        { val: "92.8%", label: "Focus Score", color: "#38BDF8", x: x + w * 0.06 },
        { val: "+14%", label: "Week over Week", color: "#10B981", x: x + w * 0.53 },
      ];
      metricCards.forEach(({ val, label, color, x: mx }) => {
        ctx.fillStyle = "#1E2030";
        drawRoundRect(ctx, mx, y + h * 0.53, w * 0.41, h * 0.13, 10);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.max(14, w * 0.058)}px "Space Grotesk", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(val, mx + w * 0.205, y + h * 0.587);
        ctx.fillStyle = "#64748B";
        ctx.font = `${Math.max(9, w * 0.032)}px sans-serif`;
        ctx.fillText(label, mx + w * 0.205, y + h * 0.628);
      });

      // Tip banner with gradient
      const tipGrad = ctx.createLinearGradient(x + w * 0.06, 0, x + w * 0.94, 0);
      tipGrad.addColorStop(0, "#F6E05E");
      tipGrad.addColorStop(1, "#FBBF24");
      ctx.fillStyle = tipGrad;
      drawRoundRect(ctx, x + w * 0.06, y + h * 0.71, w * 0.88, h * 0.15, 12);
      ctx.fill();
      ctx.fillStyle = "#1A202C";
      ctx.font = `bold ${Math.max(10, w * 0.038)}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("🎯 PEAK FOCUS DETECTED", x + w * 0.1, y + h * 0.755);
      ctx.fillStyle = "#4A5568";
      ctx.font = `${Math.max(8, w * 0.032)}px sans-serif`;
      ctx.fillText("24% more focused after 10:00 AM", x + w * 0.1, y + h * 0.8);
      break;
    }

    case "procedural:prod-settings": {
      ctx.fillStyle = "#12131C";
      ctx.fillRect(x, y, w, h);

      // Cloud icon group
      const ccx = x + w / 2;
      const ccy = y + h * 0.22;
      const cloudGrad = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, w * 0.2);
      cloudGrad.addColorStop(0, "#3B82F6");
      cloudGrad.addColorStop(1, "#1D4ED8");
      ctx.save();
      ctx.shadowColor = "rgba(59,130,246,0.4)";
      ctx.shadowBlur = 24;
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(ccx - w * 0.08, ccy + h * 0.01, w * 0.09, 0, Math.PI * 2);
      ctx.arc(ccx + w * 0.08, ccy + h * 0.01, w * 0.09, 0, Math.PI * 2);
      ctx.arc(ccx, ccy - h * 0.02, w * 0.12, 0, Math.PI * 2);
      ctx.rect(ccx - w * 0.14, ccy - h * 0.005, w * 0.28, h * 0.055);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#93C5FD";
      ctx.font = `bold ${Math.max(10, w * 0.039)}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CLOUD SYNC ACTIVE", ccx, ccy + h * 0.1);

      const services = [
        { name: "Google Calendar", detail: "Real-time agenda sync", status: "Connected", color: "#4285F4" },
        { name: "GitHub Hooks", detail: "Commit → Focus mapping", status: "Active", color: "#6E40C9" },
        { name: "Slack Alerts", detail: "DND during deep work", status: "Muted", color: "#4A154B" },
      ];
      services.forEach((svc, idx) => {
        const sy = y + h * 0.39 + idx * h * 0.16;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#1E2030";
        drawRoundRect(ctx, x + w * 0.06, sy, w * 0.88, h * 0.12, 12);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.shadowColor = svc.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = svc.color;
        ctx.beginPath();
        ctx.arc(x + w * 0.14, sy + h * 0.06, w * 0.043, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.font = `bold ${Math.max(11, w * 0.042)}px sans-serif`;
        ctx.fillText(svc.name, x + w * 0.22, sy + h * 0.04);
        ctx.fillStyle = "#64748B";
        ctx.font = `${Math.max(9, w * 0.034)}px sans-serif`;
        ctx.fillText(svc.detail, x + w * 0.22, sy + h * 0.08);
        const badgeColor = svc.status === "Muted" ? "#64748B" : svc.status === "Active" ? "#10B981" : "#38BDF8";
        ctx.fillStyle = badgeColor;
        drawRoundRect(ctx, x + w * 0.7, sy + h * 0.035, w * 0.18, h * 0.048, 8);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.max(8, w * 0.03)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(svc.status, x + w * 0.79, sy + h * 0.059);
      });
      break;
    }

    default: {
      // Premium empty placeholder with upload hint
      const placeholderGrad = ctx.createLinearGradient(x, y, x + w, y + h);
      placeholderGrad.addColorStop(0, isDarkTheme ? "#1E2030" : "#F0F4F8");
      placeholderGrad.addColorStop(1, isDarkTheme ? "#12131C" : "#E2E8F0");
      ctx.fillStyle = placeholderGrad;
      ctx.fillRect(x, y, w, h);

      // Dashed border
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = isDarkTheme ? "#2D3748" : "#CBD5E0";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + w * 0.08, y + h * 0.08, w * 0.84, h * 0.84);
      ctx.setLineDash([]);

      ctx.fillStyle = isDarkTheme ? "#4A5568" : "#718096";
      ctx.font = `500 ${Math.max(12, w * 0.05)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Upload Screenshot", x + w / 2, y + h / 2 - h * 0.05);
      ctx.font = `${Math.max(10, w * 0.038)}px sans-serif`;
      ctx.fillStyle = isDarkTheme ? "#2D3748" : "#A0AEC0";
      ctx.fillText("or use a template", x + w / 2, y + h / 2 + h * 0.04);
    }
  }

  ctx.restore();
}

// ─── Luminance + Overlay Color Detection ──────────────────────────────────────

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function overlayColor(bgColor1: string, bgColor2: string): string {
  const c = bgColor2 || bgColor1;
  try {
    return luminance(c) > 0.5 ? "#1A202C" : "#FFFFFF";
  } catch {
    return "#FFFFFF";
  }
}

// ─── Overlay Effects ───────────────────────────────────────────────────────────

function drawOverlays(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  overlays: OverlayElement[],
  bgColor1: string,
  bgColor2: string
) {
  const color = overlayColor(bgColor1, bgColor2);

  for (const overlay of overlays) {
    if (!overlay.enabled) continue;

    ctx.save();
    ctx.globalAlpha = overlay.opacity;
    const s = overlay.scale;

    switch (overlay.type) {
      case "dust": {
        drawDustParticles(ctx, W, H, color, Math.floor(100 * s), 4 * s);
        break;
      }
      case "grain": {
        drawGrainTexture(ctx, W, H, overlay.opacity * 0.18, 1);
        break;
      }
    }

    ctx.restore();
  }
}

// ─── Device Accent Rendering ───────────────────────────────────────────────────

/**
 * Draw Dynamic Island (pill cutout) for modern iPhones
 */
function drawDynamicIsland(
  ctx: CanvasRenderingContext2D,
  mockX: number,
  mockY: number,
  mockW: number,
  bezelPadding: number
) {
  const islandW = mockW * 0.28;
  const islandH = mockW * 0.052;
  const islandX = mockX + (mockW - islandW) / 2;
  const islandY = mockY + bezelPadding * 0.55;

  // Draw the island as a black pill inset into the screen
  ctx.save();
  ctx.fillStyle = "#000000";
  drawPill(ctx, islandX, islandY, islandW, islandH);
  ctx.fill();

  // Subtle gloss reflection on the island
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.ellipse(
    islandX + islandW * 0.5,
    islandY + islandH * 0.28,
    islandW * 0.38,
    islandH * 0.2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a premium glass-like reflection gloss on the device screen
 */
function drawScreenGloss(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  screenW: number,
  screenH: number,
  screenRadius: number
) {
  ctx.save();
  ctx.beginPath();
  drawRoundRect(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.clip();

  // Top-left diagonal gloss sweep
  const glossGrad = ctx.createLinearGradient(
    screenX,
    screenY,
    screenX + screenW * 0.6,
    screenY + screenH * 0.35
  );
  glossGrad.addColorStop(0, "rgba(255,255,255,0.10)");
  glossGrad.addColorStop(0.45, "rgba(255,255,255,0.03)");
  glossGrad.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = glossGrad;
  ctx.fillRect(screenX, screenY, screenW, screenH);
  ctx.restore();
}

/**
 * Draw side buttons on the device frame
 */
function drawDeviceButtons(
  ctx: CanvasRenderingContext2D,
  mockX: number,
  mockY: number,
  mockW: number,
  mockH: number,
  isDark: boolean
) {
  const btnColor = isDark ? "#1A1F2E" : "#D1D5DB";
  const btnBorder = isDark ? "#0D0D12" : "#B0B5BC";
  ctx.fillStyle = btnColor;
  ctx.strokeStyle = btnBorder;
  ctx.lineWidth = 1;

  // Power button (right side)
  const powerBtnH = mockH * 0.095;
  const powerBtnW = mockW * 0.022;
  const powerBtnX = mockX + mockW - 1;
  const powerBtnY = mockY + mockH * 0.28;
  drawRoundRect(ctx, powerBtnX, powerBtnY, powerBtnW, powerBtnH, powerBtnW / 2);
  ctx.fill();
  ctx.stroke();

  // Volume up (left side)
  const volBtnH = mockH * 0.07;
  const volBtnW = mockW * 0.022;
  const volBtnX = mockX - volBtnW + 1;
  drawRoundRect(ctx, volBtnX, mockY + mockH * 0.23, volBtnW, volBtnH, volBtnW / 2);
  ctx.fill();
  ctx.stroke();
  // Volume down
  drawRoundRect(ctx, volBtnX, mockY + mockH * 0.32, volBtnW, volBtnH, volBtnW / 2);
  ctx.fill();
  ctx.stroke();

  // Mute switch (left side, above volume)
  const switchH = mockH * 0.04;
  drawRoundRect(ctx, volBtnX, mockY + mockH * 0.16, volBtnW, switchH, volBtnW / 2);
  ctx.fill();
  ctx.stroke();
}

// ─── Main Typography Renderer ──────────────────────────────────────────────────

/**
 * Draw headline text with optional letter-spacing and text shadow
 */
function drawStyledText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  color: string,
  x: number,
  y: number,
  maxWidth: number,
  align: CanvasTextAlign,
  lineHeight: number,
  letterSpacing: number = 0,
  shadow?: { color: string; blur: number; offsetX?: number; offsetY?: number }
): number {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";

  if (shadow) {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX ?? 0;
    ctx.shadowOffsetY = shadow.offsetY ?? 2;
  }

  const lines = wrapText(ctx, text, maxWidth);
  let currentY = y;

  lines.forEach((line) => {
    if (letterSpacing !== 0) {
      // Manual letter-spacing rendering
      const chars = line.split("");
      let cursorX = x;
      // Offset for text-align
      if (align === "center") {
        const totalW = ctx.measureText(line).width + letterSpacing * (chars.length - 1);
        cursorX = x - totalW / 2;
      } else if (align === "right") {
        const totalW = ctx.measureText(line).width + letterSpacing * (chars.length - 1);
        cursorX = x - totalW;
      }
      ctx.textAlign = "left";
      chars.forEach((ch) => {
        ctx.fillText(ch, cursorX, currentY);
        cursorX += ctx.measureText(ch).width + letterSpacing;
      });
      ctx.textAlign = align;
    } else {
      ctx.fillText(line, x, currentY);
    }
    currentY += lineHeight;
  });

  ctx.restore();
  return currentY;
}

// ─── Zoom Callout ──────────────────────────────────────────────────────────────

/**
 * Draws a frosted-glass magnifying lens panel over the canvas.
 * - Captures a horizontal slice of the device screen
 * - Re-renders it scaled up inside a rounded panel at a configurable position
 * - Applies a subtle dark overlay to the rest of the device screen for focus
 */
function drawZoomCallout(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  fp: ZoomCallout,
  screenX: number,
  screenY: number,
  screenW: number,
  screenH: number,
  screenRadius: number,
  W: number,
  H: number
) {
  // ── 1. Source region on the canvas (the slice we want to magnify) ──────────
  const srcCenterY = screenY + screenH * (fp.sourceY / 100);
  const srcH = screenH * (fp.sourceH / 100);
  const srcY = srcCenterY - srcH / 2;

  // ── 2. Snapshot that slice BEFORE drawing any overlay ──────────────────────
  // We use an offscreen canvas so we can draw it scaled later.
  const snapCanvas = document.createElement("canvas");
  snapCanvas.width = Math.round(screenW);
  snapCanvas.height = Math.round(srcH);
  const snapCtx = snapCanvas.getContext("2d")!;
  snapCtx.drawImage(
    canvas,
    Math.round(screenX), Math.round(srcY), Math.round(screenW), Math.round(srcH),
    0, 0, snapCanvas.width, snapCanvas.height
  );

  // ── 3. Dark overlay on the device screen (clipped to rounded bounds) ──────
  ctx.save();
  ctx.beginPath();
  drawRoundRect(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.clip();
  ctx.fillStyle = `rgba(0,0,0,${fp.overlayOpacity})`;
  // Top part of device screen (above source strip)
  if (srcY > screenY) {
    ctx.fillRect(screenX, screenY, screenW, srcY - screenY);
  }
  // Bottom part (below source strip)
  const srcBottom = srcY + srcH;
  if (srcBottom < screenY + screenH) {
    ctx.fillRect(screenX, srcBottom, screenW, (screenY + screenH) - srcBottom);
  }
  ctx.restore();

  // ── 4. Panel geometry — auto-positioned to follow sourceY ─────────────────
  const panelW = W * (fp.panelW / 100);
  const panelH = srcH * fp.zoom;
  const panelX = (W - panelW) / 2;
  // Panel tracks the source position: maps sourceY (0-100% of screen) to same
  // proportional position on the full canvas, plus optional offset nudge
  const panelAutoCenterY = screenY + screenH * (fp.sourceY / 100) + H * (fp.panelOffset / 100);
  const panelY = panelAutoCenterY - panelH / 2;
  const cornerR = Math.min(28, panelH * 0.12);

  // ── 5. Panel frosted glass background ─────────────────────────────────────
  ctx.save();

  // Outer glow / shadow
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 18;

  // Frosted glass fill — translucent dark panel
  ctx.fillStyle = "rgba(12,14,20,0.72)";
  drawRoundRect(ctx, panelX, panelY, panelW, panelH, cornerR);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Subtle border
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, panelX, panelY, panelW, panelH, cornerR);
  ctx.stroke();
  ctx.restore();

  // ── 6. Clip to panel and draw the magnified snapshot ──────────────────────
  ctx.save();
  drawRoundRect(ctx, panelX, panelY, panelW, panelH, cornerR);
  ctx.clip();

  ctx.drawImage(
    snapCanvas,
    0, 0, snapCanvas.width, snapCanvas.height,     // source: whole snapshot
    panelX, panelY, panelW, panelH                  // dest: fill the panel
  );

  // Inner edge darkening (top + bottom gradient inside panel for depth)
  const innerGradTop = ctx.createLinearGradient(0, panelY, 0, panelY + panelH * 0.12);
  innerGradTop.addColorStop(0, "rgba(0,0,0,0.32)");
  innerGradTop.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = innerGradTop;
  ctx.fillRect(panelX, panelY, panelW, panelH * 0.12);

  const innerGradBot = ctx.createLinearGradient(0, panelY + panelH * 0.88, 0, panelY + panelH);
  innerGradBot.addColorStop(0, "rgba(0,0,0,0)");
  innerGradBot.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = innerGradBot;
  ctx.fillRect(panelX, panelY + panelH * 0.88, panelW, panelH * 0.12);

  ctx.restore();
}

// ─── Main Export ───────────────────────────────────────────────────────────────

/**
 * Normalizes metrics relative to standard iPad/iPhone dimensions (e.g. 1242px width)
 * and draws the full frame with background, device mockup, and typography.
 */
export async function renderScreenshotOnCanvas(
  canvas: HTMLCanvasElement,
  screen: ScreenshotScreen,
  screenshotImageElement: HTMLImageElement | null,
  showDeviceFrame: boolean = true,
  screenshotCorners: "rounded" | "square" = "rounded"
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  // ── 1. BACKGROUND ─────────────────────────────────────────────────────────
  ctx.save();
  if (screen.backgroundType === "solid") {
    ctx.fillStyle = screen.backgroundColor1;
    ctx.fillRect(0, 0, W, H);
  } else if (screen.backgroundType === "linear-gradient") {
    const angleRad = (screen.gradientAngle * Math.PI) / 180;
    const r = Math.sqrt(W * W + H * H) / 2;
    const cx = W / 2;
    const cy = H / 2;
    const x0 = cx - Math.cos(angleRad) * r;
    const y0 = cy - Math.sin(angleRad) * r;
    const x1 = cx + Math.cos(angleRad) * r;
    const y1 = cy + Math.sin(angleRad) * r;
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, screen.backgroundColor1);
    grad.addColorStop(1, screen.backgroundColor2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else if (screen.backgroundType === "radial-gradient") {
    const cx = W / 2;
    const cy = H / 2;
    const rg = Math.max(W, H) * 0.85;
    const grad = ctx.createRadialGradient(cx, cy * 0.6, 10, cx, cy, rg);
    grad.addColorStop(0, screen.backgroundColor1);
    grad.addColorStop(1, screen.backgroundColor2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();

  // Grain texture is now loaded dynamically as a configurable overlay type in screen.overlays.
  const bgLum = luminance(screen.backgroundColor1);

  // ── 1.6 DECORATIVE OVERLAYS ────────────────────────────────────────────────
  if (screen.overlays?.length) {
    drawOverlays(ctx, W, H, screen.overlays, screen.backgroundColor1, screen.backgroundColor2);
  }

  // ── 2. TYPOGRAPHY SETUP ────────────────────────────────────────────────────
  const scaleRatio = W / 1242;
  const paddingX = W * 0.09;
  const align = screen.align as CanvasTextAlign;
  const xCoord = align === "left" ? paddingX : align === "right" ? W - paddingX : W / 2;
  const wrapW = W - paddingX * 2;

  // Use user-configured text shadow, or fall back to contrast-adaptive
  const ts = screen.textShadow;
  const headlineShadow = ts?.enabled
    ? { color: ts.color, blur: ts.blur, offsetX: ts.offsetX, offsetY: ts.offsetY }
    : undefined;
  const subtextShadow = headlineShadow;

  // Premium letter spacing: headlines get tight tracking, subtext gets 0
  const headlineLetterSpacing = screen.fontSizeHeadline * scaleRatio * 0.012;

  const fontHeadline = `${screen.headlineFontWeight} ${screen.fontSizeHeadline * scaleRatio}px "${screen.fontFamily || "Inter"}", system-ui, sans-serif`;
  const fontSubtext = `500 ${screen.fontSizeSubtext * scaleRatio}px "${screen.fontFamily || "Inter"}", system-ui, sans-serif`;

  const headlineLineH = screen.fontSizeHeadline * scaleRatio * (screen.lineHeightHeadline || 1.2);
  const subtextLineH = screen.fontSizeSubtext * scaleRatio * (screen.lineHeightSubtext || 1.4);

  // Measure line counts
  ctx.save();
  ctx.font = fontHeadline;
  const headlineLines = wrapText(ctx, screen.headline, wrapW);
  ctx.font = fontSubtext;
  const subtextLines = wrapText(ctx, screen.subtext, wrapW);
  ctx.restore();

  const headlineBlockH = headlineLines.length * headlineLineH;
  const subtextBlockH = subtextLines.length * subtextLineH;
  const gap = W * 0.025; // space between headline and subtext
  const totalTextH = headlineBlockH + gap + subtextBlockH;

  const drawTypographyBlock = (yStart: number): number => {
    let y = yStart;

    // Headline
    y = drawStyledText(
      ctx,
      screen.headline,
      fontHeadline,
      screen.textColorHeadline,
      xCoord,
      y,
      wrapW,
      align,
      headlineLineH,
      headlineLetterSpacing,
      headlineShadow
    );

    y += gap;

    // Subtext — slightly wider tracking for readability
    y = drawStyledText(
      ctx,
      screen.subtext,
      fontSubtext,
      screen.textColorSubtext,
      xCoord,
      y,
      wrapW,
      align,
      subtextLineH,
      0,
      subtextShadow
    );

    return y;
  };

  // ── 3. LAYOUT ──────────────────────────────────────────────────────────────
  let textBottomY = 0;
  let textBlockHeight = totalTextH;

  if (screen.layoutStyle === "text-top") {
    const topPad = H * 0.07;
    textBottomY = drawTypographyBlock(topPad);
  } else if (screen.layoutStyle === "text-bottom") {
    const textStartY = H * 0.93 - totalTextH;
    drawTypographyBlock(textStartY);
    textBlockHeight = totalTextH;
  } else if (screen.layoutStyle === "full-screenshot") {
    // Glass card near the bottom
    const cardPadH = W * 0.055;
    const cardPadV = W * 0.04;
    const cardH = totalTextH + cardPadV * 2;
    const cardW = W - paddingX * 1.5;
    const cardX = (W - cardW) / 2;
    const cardY = H * 0.88 - cardH;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 40;
    ctx.fillStyle = "rgba(8,8,12,0.72)";
    drawRoundRect(ctx, cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    drawTypographyBlock(cardY + cardPadV);
  }

  // ── 4. DEVICE MOCKUP ───────────────────────────────────────────────────────
  ctx.save();

  let mockW = 0;
  let mockH = 0;
  let mockX = 0;
  let mockY = 0;
  const isIphone = screen.deviceType === "iphone_portrait" || screen.deviceType === "iphone_69_portrait" || screen.deviceType === "iphone_67_portrait" || screen.deviceType === "iphone_61_portrait" || screen.deviceType === "iphone_55_portrait";
  const isAndroid = screen.deviceType === "android_portrait" || screen.deviceType === "android_pixel_portrait" || screen.deviceType === "android_samsung_portrait";
  const isIpad = screen.deviceType === "ipad_portrait";

  if (screen.deviceType === "iphone_portrait") {
    mockW = W * 0.62 * screen.deviceScale;
    mockH = mockW * (2688 / 1242);
  } else if (screen.deviceType === "iphone_69_portrait") {
    mockW = W * 0.62 * screen.deviceScale;
    mockH = mockW * (2736 / 1260);
  } else if (screen.deviceType === "iphone_67_portrait") {
    mockW = W * 0.62 * screen.deviceScale;
    mockH = mockW * (2778 / 1284);
  } else if (screen.deviceType === "iphone_61_portrait") {
    mockW = W * 0.62 * screen.deviceScale;
    mockH = mockW * (2556 / 1179);
  } else if (screen.deviceType === "iphone_55_portrait") {
    mockW = W * 0.62 * screen.deviceScale;
    mockH = mockW * (2208 / 1242);
  } else if (screen.deviceType === "ipad_portrait") {
    mockW = W * 0.75 * screen.deviceScale;
    mockH = mockW * (2732 / 2048);
  } else if (screen.deviceType === "android_portrait") {
    mockW = W * 0.61 * screen.deviceScale;
    mockH = mockW * (3120 / 1440);
  } else if (screen.deviceType === "android_pixel_portrait") {
    mockW = W * 0.61 * screen.deviceScale;
    mockH = mockW * (2400 / 1080);
  } else if (screen.deviceType === "android_samsung_portrait") {
    mockW = W * 0.61 * screen.deviceScale;
    mockH = mockW * (3088 / 1440);
  }

  mockX = (W - mockW) / 2 + (screen.deviceOffsetX * (W / 100));

  if (screen.layoutStyle === "text-top") {
    const availableY = H - textBottomY;
    mockY = textBottomY + (availableY - mockH) / 2 + (screen.deviceOffsetY * (H / 100));
    if (screen.deviceOffsetY === 0) {
      mockY = textBottomY + W * 0.07;
    }
  } else if (screen.layoutStyle === "text-bottom") {
    const availableY = H * 0.93 - textBlockHeight;
    mockY = (availableY - mockH) / 2 + (screen.deviceOffsetY * (H / 100));
    if (screen.deviceOffsetY === 0) {
      mockY = H * 0.055;
    }
  } else {
    mockY = (H - mockH) / 2 + (screen.deviceOffsetY * (H / 100));
  }

  // Rotate mockup around its center if deviceRotation is configured
  if (screen.deviceRotation) {
    const angleRad = (screen.deviceRotation * Math.PI) / 180;
    const centerX = mockX + mockW / 2;
    const centerY = mockY + mockH / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(angleRad);
    ctx.translate(-centerX, -centerY);
  }

  if (showDeviceFrame) {
    // ── 4b. DEVICE OUTER BEZEL ────────────────────────────────────────────────
    const bezelRadius = mockH * 0.065;

    // Multi-layer shadow for depth
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 22;
    ctx.fillStyle =
      screen.deviceColor === "dark"
        ? "#070708"
        : screen.deviceColor === "gold"
        ? "#F0E4AB"
        : screen.deviceColor === "spacegray"
        ? "#2C2C2E"
        : "#F5F5F7";
    drawRoundRect(ctx, mockX, mockY, mockW, mockH, bezelRadius);
    ctx.fill();
    ctx.restore();

    // Bezel itself
    ctx.fillStyle =
      screen.deviceColor === "dark"
        ? "#0A0A0C"
        : screen.deviceColor === "gold"
        ? "#EDD98A"
        : screen.deviceColor === "spacegray"
        ? "#2C2C2E"
        : "#E8E8EA";
    drawRoundRect(ctx, mockX, mockY, mockW, mockH, bezelRadius);
    ctx.fill();

    // Premium bezel edge line
    const bezelBorderGrad = ctx.createLinearGradient(mockX, mockY, mockX + mockW, mockY + mockH);
    if (screen.deviceColor === "dark") {
      bezelBorderGrad.addColorStop(0, "rgba(255,255,255,0.12)");
      bezelBorderGrad.addColorStop(0.5, "rgba(255,255,255,0.04)");
      bezelBorderGrad.addColorStop(1, "rgba(0,0,0,0.2)");
    } else {
      bezelBorderGrad.addColorStop(0, "rgba(255,255,255,0.85)");
      bezelBorderGrad.addColorStop(0.5, "rgba(200,200,200,0.4)");
      bezelBorderGrad.addColorStop(1, "rgba(120,120,120,0.3)");
    }
    ctx.strokeStyle = bezelBorderGrad;
    ctx.lineWidth = Math.max(1.5, mockW * 0.004);
    drawRoundRect(ctx, mockX, mockY, mockW, mockH, bezelRadius);
    ctx.stroke();

    // ── 4c. SCREEN AREA ───────────────────────────────────────────────────────
    const bezelPadding = mockW * 0.04;
    const screenX = mockX + bezelPadding;
    const screenY = mockY + bezelPadding;
    const screenW = mockW - bezelPadding * 2;
    const screenH = mockH - bezelPadding * 2;
    const screenRadius = screenshotCorners === "square" ? 0 : Math.max(bezelRadius - bezelPadding, 4);

    ctx.save();
    ctx.beginPath();
    drawRoundRect(ctx, screenX, screenY, screenW, screenH, screenRadius);
    ctx.clip();

    const hasUploadedScreenshot = screen.screenshotUrl && !screen.screenshotUrl.startsWith("procedural:");

    if (hasUploadedScreenshot && screenshotImageElement) {
      if (screen.screenshotFit === "cover") {
        const imgRatio = screenshotImageElement.width / screenshotImageElement.height;
        const screenRatio = screenW / screenH;
        let drawW, drawH, drawX, drawY;
        if (imgRatio > screenRatio) {
          drawH = screenH;
          drawW = screenH * imgRatio;
          drawX = screenX - (drawW - screenW) / 2;
          drawY = screenY;
        } else {
          drawW = screenW;
          drawH = screenW / imgRatio;
          drawX = screenX;
          drawY = screenY - (drawH - screenH) / 2;
        }
        ctx.drawImage(screenshotImageElement, drawX, drawY, drawW, drawH);
      } else {
        const imgRatio = screenshotImageElement.width / screenshotImageElement.height;
        const screenRatio = screenW / screenH;
        let drawW, drawH, drawX, drawY;
        if (imgRatio > screenRatio) {
          drawW = screenW;
          drawH = screenW / imgRatio;
          drawX = screenX;
          drawY = screenY + (screenH - drawH) / 2;
        } else {
          drawH = screenH;
          drawW = screenH * imgRatio;
          drawX = screenX + (screenW - drawW) / 2;
          drawY = screenY;
        }
        ctx.fillStyle = screen.deviceColor === "dark" ? "#1A202C" : "#EDF2F7";
        ctx.fillRect(screenX, screenY, screenW, screenH);
        ctx.drawImage(screenshotImageElement, drawX, drawY, drawW, drawH);
      }
    } else if (screen.screenshotUrl?.startsWith("procedural:")) {
      drawProceduralScreen(ctx, screenX, screenY, screenW, screenH, screen.screenshotUrl, screen.deviceColor);
    } else {
      drawProceduralScreen(ctx, screenX, screenY, screenW, screenH, "procedural:fallback_image", screen.deviceColor);
    }

    ctx.restore();

    // ── 4d. SCREEN GLOSS ──────────────────────────────────────────────────────
    drawScreenGloss(ctx, screenX, screenY, screenW, screenH, screenRadius);

    // ── 4e. DEVICE TOP ACCENTS ────────────────────────────────────────────────
    if (isIpad) {
      // iPad Camera
      ctx.fillStyle = screen.deviceColor === "dark" ? "#0A0A0C" : "#1A1A1C";
      ctx.beginPath();
      ctx.arc(mockX + mockW / 2, mockY + bezelPadding / 2, mockW * 0.013, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.arc(mockX + mockW / 2, mockY + bezelPadding / 2, mockW * 0.005, 0, Math.PI * 2);
      ctx.fill();
    } else if (isIphone) {
      // Dynamic Island is omitted because it is captured within simulator screenshots
    } else if (isAndroid) {
      // Punch-hole camera
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(screenX + screenW / 2, screenY + screenH * 0.038, screenW * 0.022, 0, Math.PI * 2);
      ctx.fill();
      // Inner camera lens
      ctx.fillStyle = "rgba(40,60,120,0.6)";
      ctx.beginPath();
      ctx.arc(screenX + screenW / 2, screenY + screenH * 0.038, screenW * 0.01, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // No device frame — draw screenshot directly at mockup position
    const hasUploadedScreenshot = screen.screenshotUrl && !screen.screenshotUrl.startsWith("procedural:");

    ctx.save();
    if (screenshotCorners === "rounded") {
      const bezelRadius = mockH * 0.065;
      ctx.beginPath();
      drawRoundRect(ctx, mockX, mockY, mockW, mockH, bezelRadius);
      ctx.clip();
    }
    if (hasUploadedScreenshot && screenshotImageElement) {
      if (screen.screenshotFit === "cover") {
        const imgRatio = screenshotImageElement.width / screenshotImageElement.height;
        const screenRatio = mockW / mockH;
        let drawW, drawH, drawX, drawY;
        if (imgRatio > screenRatio) {
          drawH = mockH;
          drawW = mockH * imgRatio;
          drawX = mockX - (drawW - mockW) / 2;
          drawY = mockY;
        } else {
          drawW = mockW;
          drawH = mockW / imgRatio;
          drawX = mockX;
          drawY = mockY - (drawH - mockH) / 2;
        }
        ctx.drawImage(screenshotImageElement, drawX, drawY, drawW, drawH);
      } else {
        const imgRatio = screenshotImageElement.width / screenshotImageElement.height;
        const screenRatio = mockW / mockH;
        let drawW, drawH, drawX, drawY;
        if (imgRatio > screenRatio) {
          drawW = mockW;
          drawH = mockW / imgRatio;
          drawX = mockX;
          drawY = mockY + (mockH - drawH) / 2;
        } else {
          drawH = mockH;
          drawW = mockH * imgRatio;
          drawX = mockX + (mockW - drawW) / 2;
          drawY = mockY;
        }
        ctx.fillStyle = "#1A202C";
        ctx.fillRect(mockX, mockY, mockW, mockH);
        ctx.drawImage(screenshotImageElement, drawX, drawY, drawW, drawH);
      }
    } else if (screen.screenshotUrl?.startsWith("procedural:")) {
      drawProceduralScreen(ctx, mockX, mockY, mockW, mockH, screen.screenshotUrl, screen.deviceColor);
    } else {
      drawProceduralScreen(ctx, mockX, mockY, mockW, mockH, "procedural:fallback_image", screen.deviceColor);
    }
    ctx.restore();
  }

  ctx.restore();

  // ── 5. FOCAL POINT MAGNIFIER ──────────────────────────────────────────────
  // Rendered last so it draws on top of the device frame
  const fp = screen.zoomCallout;
  if (fp?.enabled) {
    // Recompute screen bounds (rotation is already applied via ctx.save/rotate above)
    const _bezelPadding = mockW * 0.04;
    const _screenX = mockX + _bezelPadding;
    const _screenY = mockY + _bezelPadding;
    const _screenW = mockW - _bezelPadding * 2;
    const _screenH = mockH - _bezelPadding * 2;
    const _screenRadius = screenshotCorners === "square" ? 0 : Math.max(mockH * 0.065 - mockW * 0.04, 4);
    drawZoomCallout(ctx, canvas, fp, _screenX, _screenY, _screenW, _screenH, _screenRadius, W, H);
  }
}
