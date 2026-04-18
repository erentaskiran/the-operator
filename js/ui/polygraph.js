import { drawRect, drawText } from "../draw.js";
import { clamp } from "../math.js";
import { COLORS, UI_FONT } from "./theme.js";

function drawLaneGrid(ctx, x, y, w, h) {
  drawRect(ctx, x, y, w, h, "rgba(10, 6, 3, 0.55)");
  for (let gy = y + 4; gy < y + h; gy += 6) {
    drawRect(ctx, x, gy, w, 1, "rgba(90, 60, 30, 0.08)");
  }
  for (let gx = x + 16; gx < x + w; gx += 16) {
    drawRect(ctx, gx, y, 1, h, "rgba(90, 60, 30, 0.08)");
  }
}

function sampleFromRing(buffer, sampleRate, secondsAgo, sampleAt) {
  if (typeof sampleAt === "function") {
    const offsetFloat = Math.max(0, secondsAgo * sampleRate);
    return sampleAt(offsetFloat);
  }
  if (!buffer || buffer.count <= 0) {
    return 0;
  }
  const offset = Math.floor(secondsAgo * sampleRate);
  if (offset >= buffer.count) {
    const oldestIdx = (buffer.head - buffer.count + buffer.size * 4) % buffer.size;
    return buffer.data[oldestIdx];
  }
  const idx = (buffer.head - 1 - offset + buffer.size * 4) % buffer.size;
  return buffer.data[idx];
}

function drawLaneWave(ctx, x, y, w, h, color, buffer, sampleRate, type, sampleAt) {
  if (!buffer || buffer.count <= 1) {
    return;
  }

  const midY = y + h / 2;
  const gain = type === "heart" ? h * 0.4 : type === "eeg" ? h * 0.43 : h * 0.72;
  const secondsWindow = 8;

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  for (let pass = 2; pass >= 0; pass -= 1) {
    ctx.beginPath();
    const alpha = pass === 0 ? 0.95 : pass === 1 ? 0.42 : 0.2;
    ctx.strokeStyle = `rgba(${color === COLORS.pulse ? "224,72,72" : color === COLORS.eeg ? "227,193,58" : "92,207,125"},${alpha})`;
    ctx.lineWidth = pass === 0 ? 1.15 : pass === 1 ? 2.1 : 3.6;

    const step = 1;
    for (let i = 0; i <= w; i += step) {
      const nx = i / w;
      const secondsAgo = (1 - nx) * secondsWindow;
      const sample = sampleFromRing(buffer, sampleRate, secondsAgo, sampleAt);
      const py = clamp(midY - sample * gain, y + 1, y + h - 1);
      if (i === 0) {
        ctx.moveTo(x + i, py);
      } else {
        ctx.lineTo(x + i, py);
      }
    }
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  const cursor = x + w - 2;
  const latestSample = sampleFromRing(buffer, sampleRate, 0, sampleAt);
  drawRect(ctx, cursor, y + 1, 1, h - 2, "rgba(255, 210, 150, 0.2)");

  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(cursor, clamp(midY - latestSample * gain, y + 1, y + h - 1), 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function readout(type, profile, biometricReadout) {
  if (biometricReadout) {
    if (type === "heart") {
      return `${Math.round(biometricReadout.bpm)} BPM`;
    }
    if (type === "eeg") {
      return `${biometricReadout.eegUv.toFixed(1)} uV`;
    }
    return `${biometricReadout.gsrUs.toFixed(1)} uS`;
  }

  if (type === "heart") {
    return `${Math.round(40 + profile.freq * 22)} BPM`;
  }
  if (type === "eeg") {
    return `${(0.05 + profile.amp * 0.35).toFixed(2)} mV`;
  }
  return `${Math.round(8 + profile.amp * 42)} uS`;
}


function drawLane(
  ctx,
  x,
  y,
  w,
  h,
  {
    label,
    color,
    profile,
    type,
    time,
    metric,
    flash = 0,
    buffer,
    sampleRate,
    biometricReadout,
    sampleAt,
  },
) {
  const labelW = 48;
  const valueW = 130;

  const waveX = x + labelW;
  const waveW = w - labelW - valueW;

  drawLaneGrid(ctx, waveX, y + 2, waveW, h - 4);

  const sweepX = waveX + ((time * 28) % waveW);
  drawRect(ctx, sweepX - 8, y + 2, 7, h - 4, "rgba(255, 210, 150, 0.06)");
  drawRect(ctx, sweepX - 1, y + 2, 2, h - 4, "rgba(255, 210, 150, 0.15)");

  drawLaneWave(ctx, waveX, y + 2, waveW, h - 4, color, buffer, sampleRate, type, sampleAt);

  if (flash > 0.001) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.4, flash * 0.4);
    drawRect(ctx, waveX, y + 2, waveW, h - 4, color);
    ctx.restore();
  }

  drawText(ctx, label, x + 4, y + h / 2, {
    size: 12,
    color,
    font: UI_FONT,
    baseline: "middle",
  });


  drawText(ctx, `${readout(type, profile, biometricReadout)} ${metric}`, x + w - 4, y + h / 2, {
    size: 16,
    color: COLORS.cream,
    align: "right",
    font: UI_FONT,
    baseline: "middle",
  });
}

export function drawPolygraph(ctx, x, y, w, h, data) {
  const { waves, time, metrics, fearBar, maxFearBar, fearFlash = 0, laneFlash = {}, biometric } = data;

  const bioBuffers = biometric?.buffers || {};
  const bioRate = biometric?.sampleRate || {};
  const bioReadout = biometric?.readout || null;
  const bioSampleAt = biometric?.sampleAt || null;

  drawRect(ctx, x, y, w, h, COLORS.panelSolid);
  drawRect(ctx, x, y, w, 1, COLORS.amber);

  const headerH = 16;
  drawText(ctx, "POLYGRAPH ANALYSIS", x + 6, y + headerH / 2 + 1, {
    size: 12,
    color: COLORS.amberBright,
    font: UI_FONT,
    baseline: "middle",
  });

  const fearValText = `${Math.round(fearBar)}/${maxFearBar}`;
  const fearValX = x + w - 6;
  const fearValWidth = 36;
  const fearBarW = 56;
  const fearBarX = fearValX - fearValWidth - fearBarW;
  const fearLabelX = fearBarX - 4;
  const fearMidY = y + headerH / 2 + 1;

  drawText(ctx, "FEAR", fearLabelX, fearMidY, {
    size: 12,
    color: COLORS.cream,
    align: "right",
    font: UI_FONT,
    baseline: "middle",
  });

  drawRect(ctx, fearBarX, y + headerH / 2 - 3, fearBarW, 6, COLORS.fearTrack);
  const ratio = clamp(fearBar / maxFearBar, 0, 1);
  drawRect(ctx, fearBarX, y + headerH / 2 - 3, fearBarW * ratio, 6, COLORS.fear);
  if (fearFlash > 0.001) {
    drawRect(
      ctx,
      fearBarX,
      y + headerH / 2 - 3,
      fearBarW,
      6,
      `rgba(255, 220, 150, ${Math.min(0.75, fearFlash * 0.75)})`,
    );
  }

  drawText(ctx, fearValText, fearValX, fearMidY, {
    size: 12,
    color: COLORS.cream,
    align: "right",
    font: UI_FONT,
    baseline: "middle",
  });

  drawRect(ctx, x, y + headerH, w, 1, COLORS.amberDim);

  const lanesY = y + headerH + 2;
  const lanesH = h - headerH - 4;
  const laneH = Math.floor(lanesH / 3);

  drawLane(ctx, x, lanesY, w, laneH, {
    label: "PULSE",
    color: COLORS.pulse,
    profile: waves.heartRate,
    type: "heart",
    time,
    metric: metrics.heartRate,
    flash: laneFlash.heartRate || 0,
    buffer: bioBuffers.heartRate,
    sampleRate: bioRate.heartRate || 250,
    biometricReadout: bioReadout,
    sampleAt: bioSampleAt ? (offsetFloat) => bioSampleAt("heartRate", offsetFloat) : null,
  });

  drawLane(ctx, x, lanesY + laneH, w, laneH, {
    label: "EEG",
    color: COLORS.eeg,
    profile: waves.eeg,
    type: "eeg",
    time,
    metric: metrics.eeg,
    flash: laneFlash.eeg || 0,
    buffer: bioBuffers.eeg,
    sampleRate: bioRate.eeg || 256,
    biometricReadout: bioReadout,
    sampleAt: bioSampleAt ? (offsetFloat) => bioSampleAt("eeg", offsetFloat) : null,
  });

  drawLane(ctx, x, lanesY + laneH * 2, w, laneH, {
    label: "GSR",
    color: COLORS.gsr,
    profile: waves.gsr,
    type: "gsr",
    time,
    metric: metrics.gsr,
    flash: laneFlash.gsr || 0,
    buffer: bioBuffers.gsr,
    sampleRate: bioRate.gsr || 64,
    biometricReadout: bioReadout,
    sampleAt: bioSampleAt ? (offsetFloat) => bioSampleAt("gsr", offsetFloat) : null,
  });
}
