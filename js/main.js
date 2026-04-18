import { createGameLoop } from "./gameLoop.js";
import { endFrameInput, getMousePos, initInput, wasKeyPressed, wasMousePressed } from "./input.js";
import { clearCanvas, drawRect, drawText } from "./draw.js";
import { clamp } from "./math.js";
import { getCurrentSceneName, registerScene, renderScene, setScene, updateScene } from "./sceneManager.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

if (!canvas || !ctx) {
  throw new Error("Canvas could not be initialized.");
}

initInput(canvas);
canvas.width = 1024;
canvas.height = 576;

const UI_FONT = '"Courier New", monospace';
const PIXEL_SIZE = 3;
const CASES = [
  {
    id: "A",
    file: "./dialog.json",
    label: "CASE A - SILIKON VADISI SIZINTISI",
  },
  {
    id: "B",
    file: "./dialogb.json",
    label: "CASE B - SESSIZ COMMIT",
  },
];

const state = {
  gameData: null,
  loading: true,
  error: "",
  currentNodeId: "",
  currentNode: null,
  fearBar: 0,
  maxFearBar: 100,
  topLog: [],
  prompt: "",
  note: "",
  lastQuestion: "",
  lastAnswer: "",
  responseMode: false,
  responseTimer: 0,
  pendingNodeId: "",
  choiceRects: [],
  menuCaseRects: [],
  caseIndex: 0,
  caseDataById: {},
  metrics: {
    heartRate: "BASELINE",
    eeg: "BASELINE",
    gsr: "BASELINE",
    breathing: "BASELINE",
    cctvVisual: "NEUTRAL",
  },
  wave: {
    heartRate: { amp: 0.25, freq: 1.5, noise: 0.04 },
    eeg: { amp: 0.35, freq: 2.4, noise: 0.07 },
    gsr: { amp: 0.2, freq: 0.8, noise: 0.03 },
  },
  waveTarget: {
    heartRate: { amp: 0.25, freq: 1.5, noise: 0.04 },
    eeg: { amp: 0.35, freq: 2.4, noise: 0.07 },
    gsr: { amp: 0.2, freq: 0.8, noise: 0.03 },
  },
  time: 0,
};

function getSelectedCaseDef() {
  return CASES[state.caseIndex] || CASES[0];
}

function getSelectedCaseData() {
  const selected = getSelectedCaseDef();
  return state.caseDataById[selected.id] || null;
}

function setSelectedCase(index) {
  state.caseIndex = clamp(index, 0, CASES.length - 1);
  state.gameData = getSelectedCaseData();
}

function pushLog(text) {
  state.topLog.push(text);
  while (state.topLog.length > 5) {
    state.topLog.shift();
  }
}

function metricStyle(metric, value) {
  const base = {
    amp: 0.2,
    freq: 1.4,
    noise: 0.04,
  };

  const map = {
    BASELINE: { amp: 0.2, freq: 1.3, noise: 0.03 },
    DROP: { amp: 0.12, freq: 1.0, noise: 0.02 },
    DECREASE: { amp: 0.14, freq: 1.1, noise: 0.03 },
    INCREASE: { amp: 0.35, freq: 1.7, noise: 0.06 },
    SPIKE: { amp: 0.5, freq: 2.2, noise: 0.08 },
    MAX_SPIKE: { amp: 0.82, freq: 2.8, noise: 0.09 },
    ERRATIC: { amp: 0.72, freq: 3.2, noise: 0.12 },
    MAX: { amp: 0.9, freq: 2.9, noise: 0.1 },
    FLATLINE: { amp: 0.02, freq: 0.5, noise: 0.008 },
    CHAOTIC: { amp: 0.8, freq: 3.8, noise: 0.14 },
  };

  const style = map[value] || base;
  if (metric === "gsr") {
    return {
      amp: style.amp * 0.7,
      freq: Math.max(0.35, style.freq * 0.45),
      noise: style.noise * 0.5,
    };
  }

  if (metric === "eeg") {
    return {
      amp: style.amp * 0.9,
      freq: style.freq * 1.25,
      noise: style.noise * 1.1,
    };
  }

  return style;
}

function setWaveTargetsFromMechanics(mechanics) {
  state.waveTarget.heartRate = metricStyle("heartRate", mechanics.heart_rate);
  state.waveTarget.eeg = metricStyle("eeg", mechanics.eeg);
  state.waveTarget.gsr = metricStyle("gsr", mechanics.gsr);
}

function setNode(nodeId) {
  const node = state.gameData.nodes[nodeId];
  if (!node) {
    state.error = `Node not found: ${nodeId}`;
    setScene("result", { state, canvas, ctx });
    return;
  }

  state.currentNodeId = nodeId;
  state.currentNode = node;
  state.responseMode = false;
  state.responseTimer = 0;
  state.pendingNodeId = "";
  state.prompt = "";
  state.choiceRects = [];

  if (node.is_end_state) {
    setScene("result", { state, canvas, ctx });
  }
}

function resetRun() {
  const config = state.gameData.system_config;
  state.maxFearBar = config.max_fear_bar;
  state.fearBar = config.initial_fear_bar;
  state.topLog = [];
  state.lastQuestion = "";
  state.lastAnswer = "";
  pushLog(state.gameData.context);
  setNode(state.gameData.start_node);
}

function pickChoice(index) {
  if (!state.currentNode || state.responseMode || state.currentNode.is_end_state) {
    return;
  }

  const choice = state.currentNode.choices?.[index];
  if (!choice) {
    return;
  }

  const mechanics = choice.mechanics || {};
  state.prompt = `SEN: ${choice.question}`;
  state.lastQuestion = choice.question;
  state.lastAnswer = choice.answer;
  pushLog(`SEN: ${choice.question}`);
  pushLog(`OZAN: ${choice.answer}`);
  state.note = "";

  state.metrics.heartRate = mechanics.heart_rate || state.metrics.heartRate;
  state.metrics.eeg = mechanics.eeg || state.metrics.eeg;
  state.metrics.gsr = mechanics.gsr || state.metrics.gsr;
  state.metrics.breathing = mechanics.breathing || state.metrics.breathing;
  state.metrics.cctvVisual = mechanics.cctv_visual || state.metrics.cctvVisual;

  state.fearBar = clamp(state.fearBar + (mechanics.korku_bari_delta || 0), 0, state.maxFearBar);
  setWaveTargetsFromMechanics(mechanics);

  state.responseMode = true;
  state.responseTimer = 2.1;
  state.pendingNodeId = choice.next_node;
}

function updateWave(dt) {
  const metrics = ["heartRate", "eeg", "gsr"];
  for (const metric of metrics) {
    const curr = state.wave[metric];
    const target = state.waveTarget[metric];
    const smooth = Math.min(1, dt * 4.5);
    curr.amp += (target.amp - curr.amp) * smooth;
    curr.freq += (target.freq - curr.freq) * smooth;
    curr.noise += (target.noise - curr.noise) * smooth;
  }
}

function inRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function drawGridBackground() {
  clearCanvas(ctx, "#081018");

  for (let y = 0; y < canvas.height; y += PIXEL_SIZE) {
    const dark = y % (PIXEL_SIZE * 2) === 0 ? "#0a1620" : "#09141d";
    drawRect(ctx, 0, y, canvas.width, PIXEL_SIZE, dark);
  }

  for (let x = 0; x < canvas.width; x += 32) {
    drawRect(ctx, x, 0, 1, canvas.height, "rgba(33, 80, 96, 0.2)");
  }
}

function drawPanel(x, y, w, h, border = "#3da1c1", fill = "#0d1a24") {
  drawRect(ctx, x, y, w, h, fill);
  drawRect(ctx, x, y, w, 2, border);
  drawRect(ctx, x, y + h - 2, w, 2, border);
  drawRect(ctx, x, y, 2, h, border);
  drawRect(ctx, x + w - 2, y, 2, h, border);
}

function drawCharacter(x, y, w, h, palette, title, subtitle, facingLeft) {
  drawPanel(x, y, w, h, "#376e84", "#0f1f2a");
  const bodyX = x + w / 2 - 28;
  const bodyY = y + 36;

  drawRect(ctx, bodyX, bodyY, 56, 70, palette.body);
  drawRect(ctx, bodyX + 16, bodyY - 26, 24, 24, palette.face);
  drawRect(ctx, bodyX + 20, bodyY - 20, 4, 4, "#0b1217");
  drawRect(ctx, bodyX + 32, bodyY - 20, 4, 4, "#0b1217");

  if (facingLeft) {
    drawRect(ctx, bodyX + 12, bodyY + 24, 8, 6, palette.accent);
  } else {
    drawRect(ctx, bodyX + 36, bodyY + 24, 8, 6, palette.accent);
  }

  drawText(ctx, title, x + w / 2, y + h - 28, {
    align: "center",
    size: 18,
    color: "#d1f0ff",
    font: UI_FONT,
  });
  drawText(ctx, subtitle, x + w / 2, y + h - 10, {
    align: "center",
    size: 12,
    color: "#7db4c7",
    font: UI_FONT,
  });
}

function wrapTextLines(text, maxWidth, size = 12, font = UI_FONT) {
  const content = String(text || "").trim();
  if (!content) {
    return [];
  }

  const paragraphs = content.split(/\n+/);
  const lines = [];
  const prevFont = ctx.font;
  ctx.font = `${size}px ${font}`;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let line = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const candidate = `${line} ${words[i]}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = words[i];
      }
    }
    lines.push(line);
  }

  ctx.font = prevFont;
  return lines;
}

function drawWrappedText(text, x, y, maxWidth, options = {}) {
  const size = options.size ?? 12;
  const font = options.font ?? UI_FONT;
  const lineHeight = options.lineHeight ?? Math.round(size * 1.35);
  const maxLines = options.maxLines ?? Number.POSITIVE_INFINITY;
  const lines = wrapTextLines(text, maxWidth, size, font).slice(0, maxLines);

  for (let i = 0; i < lines.length; i += 1) {
    drawText(ctx, lines[i], x, y + i * lineHeight, {
      ...options,
      size,
      font,
    });
  }

  return lines.length;
}

function signalNoise(x, t) {
  return (
    Math.sin(x * 0.17 + t * 1.41) * 0.5 +
    Math.sin(x * 0.048 - t * 2.1) * 0.3 +
    Math.sin(x * 0.29 + t * 0.5) * 0.2
  );
}

function ekgPulse(phase) {
  if (phase < 0.02) {
    return phase * 12;
  }
  if (phase < 0.06) {
    return 0.22 - (phase - 0.02) * 9;
  }
  if (phase < 0.09) {
    return -0.18 + (phase - 0.06) * 4;
  }
  if (phase < 0.11) {
    return 1.35 - (phase - 0.09) * 52;
  }
  if (phase < 0.145) {
    return -0.42 + (phase - 0.11) * 10;
  }
  return Math.sin((phase - 0.145) * 8) * 0.06;
}

function drawWavePanel(x, y, w, h, title, value, profile, type) {
  drawPanel(x, y, w, h, "#2f7f95", "#09171f");
  drawText(ctx, title, x + 10, y + 20, {
    size: 14,
    color: "#8fd6ec",
    font: UI_FONT,
  });
  drawText(ctx, value, x + w - 10, y + 20, {
    size: 12,
    color: "#d2f3ff",
    align: "right",
    font: UI_FONT,
  });

  const px = x + 8;
  const py = y + 30;
  const pw = w - 16;
  const ph = h - 38;
  const midY = py + ph / 2;

  const sweep = (state.time * 180) % pw;
  drawRect(ctx, px, py, pw, ph, "rgba(0, 8, 12, 0.55)");
  drawRect(ctx, px + sweep - 8, py, 16, ph, "rgba(82, 175, 198, 0.08)");
  drawRect(ctx, px + sweep - 2, py, 4, ph, "rgba(170, 245, 255, 0.22)");

  for (let gy = py; gy <= py + ph; gy += 12) {
    drawRect(ctx, px, gy, pw, 1, "rgba(91, 153, 175, 0.18)");
  }
  for (let gx = px; gx <= px + pw; gx += 16) {
    drawRect(ctx, gx, py, 1, ph, "rgba(91, 153, 175, 0.16)");
  }

  const points = [];
  const t = state.time;

  for (let i = 0; i < pw; i += 1) {
    const nx = i / pw;
    const noise = signalNoise(i, t) * profile.noise;
    const artifact = Math.sin(t * 0.9 + nx * 80) > 0.995 ? 0.1 : 0;

    let sample = 0;
    if (type === "heart") {
      const cycle = (state.time * profile.freq + nx * 4.8) % 1;
      sample = ekgPulse(cycle) * profile.amp + Math.sin(state.time * 1.9 + nx * 4) * 0.02 + noise + artifact;
    } else if (type === "eeg") {
      sample =
        (Math.sin(state.time * profile.freq * 6 + nx * 30) * 0.45 +
          Math.sin(state.time * profile.freq * 8 - nx * 18) * 0.35 +
          Math.sin(state.time * profile.freq * 2 + nx * 10) * 0.25) *
          profile.amp +
        noise +
        artifact * 0.7;
    } else {
      sample =
        (Math.sin(state.time * profile.freq * 2 + nx * 6) * 0.34 +
          Math.sin(state.time * profile.freq * 0.8 - nx * 4) * 0.18 +
          (nx - 0.5) * 0.08) *
          profile.amp +
        noise +
        artifact * 0.35;
    }

    const yPos = midY - sample * (ph * 0.8);
    const xPos = px + i;
    points.push({ x: xPos, y: yPos });
  }

  ctx.save();
  ctx.shadowColor = "rgba(120, 255, 175, 0.65)";
  ctx.shadowBlur = 11;

  for (let trail = 3; trail >= 1; trail -= 1) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(120, 255, 175, ${0.08 * trail})`;
    ctx.lineWidth = 1 + trail;
    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      const tx = point.x - trail * 1.4;
      if (i === 0) {
        ctx.moveTo(tx, point.y);
      } else {
        ctx.lineTo(tx, point.y);
      }
    }
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.strokeStyle = "rgba(140, 255, 185, 0.5)";
  ctx.lineWidth = 3;
  for (let i = 0; i < points.length; i += 1) {
    if (i === 0) {
      ctx.moveTo(points[i].x, points[i].y);
    } else {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.strokeStyle = "#bfffff";
  ctx.lineWidth = 1.35;
  for (let i = 0; i < points.length; i += 1) {
    if (i === 0) {
      ctx.moveTo(points[i].x, points[i].y);
    } else {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }
  ctx.stroke();
  ctx.restore();

  drawRect(ctx, px, py + ph - 2, pw, 1, "rgba(70, 110, 122, 0.4)");
}

function drawFearBar(x, y, w, h) {
  drawPanel(x, y, w, h, "#8a4e58", "#241419");
  drawText(ctx, "KORKU BARI", x + 10, y + 18, {
    size: 13,
    color: "#ffbdc8",
    font: UI_FONT,
  });
  drawText(ctx, `${Math.round(state.fearBar)} / ${state.maxFearBar}`, x + w - 10, y + 18, {
    align: "right",
    size: 12,
    color: "#ffd7df",
    font: UI_FONT,
  });

  const fillRatio = clamp(state.fearBar / state.maxFearBar, 0, 1);
  const ix = x + 10;
  const iy = y + 30;
  const iw = w - 20;
  const ih = h - 40;
  drawRect(ctx, ix, iy, iw, ih, "#2d1b22");
  drawRect(ctx, ix, iy, iw * fillRatio, ih, "#ff5d73");
}

function drawConversationTop() {
  const node = state.currentNode;
  drawPanel(18, 16, canvas.width - 36, 178, "#3c7f93", "#0e1d28");

  drawText(ctx, state.gameData.title, 34, 42, {
    size: 20,
    color: "#d2f7ff",
    font: UI_FONT,
  });
  drawText(ctx, `Tema: ${node.theme}`, 34, 64, {
    size: 14,
    color: "#94d3e6",
    font: UI_FONT,
  });
  const maxWidth = canvas.width - 74;
  const descRows = drawWrappedText(node.description, 34, 86, maxWidth, {
    size: 13,
    color: "#c6e5ee",
    font: UI_FONT,
    lineHeight: 17,
    maxLines: 2,
  });

  const convoY = 86 + descRows * 17 + 6;
  const convoH = 178 - (convoY - 16) - 8;
  drawPanel(26, convoY, canvas.width - 52, convoH, "#4e8da4", "#102432");

  if (state.lastQuestion || state.lastAnswer) {
    drawWrappedText(`SEN: ${state.lastQuestion}`, 36, convoY + 18, canvas.width - 74, {
      size: 12,
      color: "#c8e8f3",
      font: UI_FONT,
      lineHeight: 14,
      maxLines: 2,
    });

    drawWrappedText(`OZAN: ${state.lastAnswer}`, 36, convoY + 50, canvas.width - 74, {
      size: 12,
      color: "#f7fff8",
      font: UI_FONT,
      lineHeight: 14,
      maxLines: 3,
    });
  } else {
    const latest = state.topLog[state.topLog.length - 1] || state.gameData.context;
    drawWrappedText(latest, 36, convoY + 26, canvas.width - 74, {
      size: 12,
      color: "#b6d7e3",
      font: UI_FONT,
      lineHeight: 15,
      maxLines: 4,
    });
  }
}

function drawChoiceButtons() {
  state.choiceRects = [];

  if (!state.currentNode || state.currentNode.is_end_state || state.responseMode) {
    drawText(ctx, "Cevap geliyor... (ENTER ile atla)", 26, canvas.height - 86, {
      size: 13,
      color: "#b9dce8",
      font: UI_FONT,
    });
    return;
  }

  const choices = state.currentNode.choices || [];
  let y = 358;
  const lineHeight = 14;
  const maxLines = 3;

  for (let i = 0; i < choices.length; i += 1) {
    const text = `${i + 1}. ${choices[i].question}`;
    const allLines = wrapTextLines(text, canvas.width - 64, 12, UI_FONT);
    const lines = allLines.slice(0, maxLines);
    const h = Math.max(44, 14 + lines.length * lineHeight + 10);
    const rect = { x: 22, y, w: canvas.width - 44, h, index: i };
    state.choiceRects.push(rect);

    drawPanel(rect.x, rect.y, rect.w, rect.h, "#4e8da4", "#10212c");
    drawWrappedText(text, rect.x + 10, rect.y + 22, rect.w - 20, {
      size: 12,
      color: "#e2f7ff",
      font: UI_FONT,
      lineHeight,
      maxLines,
    });

    y += h + 8;
  }
}

function drawPlayScene() {
  drawGridBackground();
  drawConversationTop();

  drawCharacter(22, 208, 300, 134, {
    body: "#2d7da1",
    face: "#f4d5b2",
    accent: "#f9fcff",
  }, "SEN", "Operator", false);

  drawCharacter(702, 208, 300, 134, {
    body: "#7c4459",
    face: "#efc1a1",
    accent: "#ffdb95",
  }, "OZAN", state.gameData.suspect.role, true);

  drawWavePanel(22, 486, 250, 84, "HEART RATE", state.metrics.heartRate, state.wave.heartRate, "heart");
  drawWavePanel(278, 486, 250, 84, "EEG", state.metrics.eeg, state.wave.eeg, "eeg");
  drawWavePanel(534, 486, 250, 84, "GSR", state.metrics.gsr, state.wave.gsr, "gsr");
  drawFearBar(790, 486, 212, 84);

  drawChoiceButtons();

  drawText(ctx, "1-9: Soru sec | Enter: Gec | R: Restart | ESC: Menu", canvas.width - 16, 16, {
    size: 12,
    color: "#78b1c2",
    align: "right",
    baseline: "top",
    font: UI_FONT,
  });
}

function drawMenuScene() {
  drawGridBackground();
  drawPanel(130, 130, canvas.width - 260, 320, "#3d89a1", "#0f1d29");
  state.menuCaseRects = [];

  const caseData = getSelectedCaseData();

  drawText(ctx, "THE OPERATOR", canvas.width / 2, 188, {
    align: "center",
    size: 42,
    color: "#d2f7ff",
    font: UI_FONT,
  });
  drawText(ctx, "CASE SECIMI", canvas.width / 2, 226, {
    align: "center",
    size: 16,
    color: "#90cadd",
    font: UI_FONT,
  });

  const startX = 182;
  const cardY = 246;
  const cardW = 300;
  const cardH = 74;
  const gap = 60;
  for (let i = 0; i < CASES.length; i += 1) {
    const x = startX + i * (cardW + gap);
    const selected = i === state.caseIndex;
    drawPanel(x, cardY, cardW, cardH, selected ? "#83d7ee" : "#3f7081", selected ? "#11303e" : "#10212c");
    drawText(ctx, `${i + 1}. ${CASES[i].label}`, x + 12, cardY + 28, {
      size: 13,
      color: selected ? "#e8fcff" : "#b5d7e3",
      font: UI_FONT,
    });

    state.menuCaseRects.push({ x, y: cardY, w: cardW, h: cardH, index: i });
  }

  if (caseData) {
    drawText(ctx, caseData.title, canvas.width / 2, 352, {
      align: "center",
      size: 14,
      color: "#d7f7ff",
      font: UI_FONT,
    });
    drawWrappedText(caseData.context, canvas.width / 2, 375, 640, {
      align: "center",
      size: 12,
      color: "#b9dce8",
      font: UI_FONT,
      lineHeight: 15,
      maxLines: 4,
    });
  } else {
    drawText(ctx, "Secilen vaka yuklenemedi.", canvas.width / 2, 372, {
      align: "center",
      size: 14,
      color: "#ffd0d8",
      font: UI_FONT,
    });
  }

  drawText(ctx, "1-2 veya ok tuslari: Vaka sec", canvas.width / 2, 448, {
    align: "center",
    size: 14,
    color: "#9bc9d7",
    font: UI_FONT,
  });

  drawText(ctx, "ENTER: Basla | Kartlara tiklayarak sec", canvas.width / 2, 475, {
    align: "center",
    size: 18,
    color: "#f1fff6",
    font: UI_FONT,
  });
}

function drawResultScene() {
  drawGridBackground();
  const endNode = state.currentNode;
  const success = state.currentNodeId.includes("success");
  const border = success ? "#4eb27d" : "#b25b6f";
  const fill = success ? "#12261d" : "#2a151b";
  drawPanel(100, 120, canvas.width - 200, 330, border, fill);

  drawText(ctx, endNode.theme.toUpperCase(), canvas.width / 2, 188, {
    align: "center",
    size: 34,
    color: success ? "#b7f8d2" : "#ffc1cf",
    font: UI_FONT,
  });
  drawText(ctx, endNode.description, canvas.width / 2, 246, {
    align: "center",
    size: 15,
    color: "#d7ebf2",
    font: UI_FONT,
  });
  drawText(ctx, endNode.result_text, canvas.width / 2, 282, {
    align: "center",
    size: 13,
    color: "#dff4ff",
    font: UI_FONT,
  });

  drawText(ctx, "R: Yeniden Oyna | ESC: Menu", canvas.width / 2, 380, {
    align: "center",
    size: 18,
    color: "#f4feff",
    font: UI_FONT,
  });
}

registerScene("menu", {
  update() {
    if (wasKeyPressed("1")) {
      setSelectedCase(0);
    }
    if (wasKeyPressed("2")) {
      setSelectedCase(1);
    }

    if (wasKeyPressed("arrowleft") || wasKeyPressed("arrowup") || wasKeyPressed("a") || wasKeyPressed("w")) {
      setSelectedCase(state.caseIndex - 1);
    }
    if (wasKeyPressed("arrowright") || wasKeyPressed("arrowdown") || wasKeyPressed("d") || wasKeyPressed("s")) {
      setSelectedCase(state.caseIndex + 1);
    }

    if (wasMousePressed(0) && state.menuCaseRects.length > 0) {
      const mouse = getMousePos();
      for (const rect of state.menuCaseRects) {
        if (inRect(mouse, rect)) {
          setSelectedCase(rect.index);
          break;
        }
      }
    }

    if (wasKeyPressed("enter") && state.gameData) {
      setScene("play", { state, canvas, ctx });
    }
  },
  render() {
    drawMenuScene();
  },
});

registerScene("play", {
  enter() {
    resetRun();
  },
  update(dt) {
    state.time += dt;
    updateWave(dt);

    if (wasKeyPressed("escape")) {
      setScene("menu", { state, canvas, ctx });
      return;
    }

    if (wasKeyPressed("r")) {
      resetRun();
      return;
    }

    if (state.responseMode) {
      if (wasKeyPressed("enter")) {
        state.responseTimer = 0;
      } else {
        state.responseTimer -= dt;
      }

      if (state.responseTimer <= 0 && state.pendingNodeId) {
        setNode(state.pendingNodeId);
      }
      return;
    }

    const choices = state.currentNode?.choices || [];
    for (let i = 0; i < Math.min(9, choices.length); i += 1) {
      if (wasKeyPressed(String(i + 1))) {
        pickChoice(i);
        return;
      }
    }

    if (wasMousePressed(0) && state.choiceRects.length > 0) {
      const mouse = getMousePos();
      for (const rect of state.choiceRects) {
        if (inRect(mouse, rect)) {
          pickChoice(rect.index);
          return;
        }
      }
    }
  },
  render() {
    drawPlayScene();
  },
});

registerScene("result", {
  update() {
    if (wasKeyPressed("r")) {
      resetRun();
      setScene("play", { state, canvas, ctx });
      return;
    }

    if (wasKeyPressed("escape")) {
      setScene("menu", { state, canvas, ctx });
    }
  },
  render() {
    if (state.error) {
      drawGridBackground();
      drawPanel(140, 180, canvas.width - 280, 180, "#b5586a", "#2a131a");
      drawText(ctx, "HATA", canvas.width / 2, 234, {
        align: "center",
        size: 28,
        color: "#ffc1d0",
        font: UI_FONT,
      });
      drawText(ctx, state.error, canvas.width / 2, 276, {
        align: "center",
        size: 14,
        color: "#ffe6ec",
        font: UI_FONT,
      });
      return;
    }

    drawResultScene();
  },
});

function update(dt) {
  updateScene(dt, { state, canvas, ctx });
  endFrameInput();
}

function render(alpha) {
  renderScene({ ctx, alpha, state, canvas });

  drawText(ctx, `SCENE: ${getCurrentSceneName().toUpperCase()}`, 10, canvas.height - 8, {
    size: 11,
    color: "#4f8ca0",
    baseline: "alphabetic",
    font: UI_FONT,
  });
}

const loop = createGameLoop({ update, render });

async function boot() {
  clearCanvas(ctx, "#0b1224");
  drawText(ctx, "Dosyalar yukleniyor...", canvas.width / 2, canvas.height / 2 - 10, {
    align: "center",
    size: 22,
    color: "#e0f5ff",
    font: UI_FONT,
  });

  const entries = await Promise.all(
    CASES.map(async (caseDef) => {
      const response = await fetch(caseDef.file);
      if (!response.ok) {
        throw new Error(`${caseDef.file} yuklenemedi.`);
      }

      const data = await response.json();
      return [caseDef.id, data.game_data];
    })
  );

  state.caseDataById = Object.fromEntries(entries);
  setSelectedCase(0);
  state.loading = false;

  setScene("menu", { state, canvas, ctx });
  loop.start();
}

boot().catch((error) => {
  state.error = error.message;
  state.loading = false;
  clearCanvas(ctx, "#2a1118");
  drawText(ctx, "Oyun baslatilamadi", canvas.width / 2, canvas.height / 2 - 8, {
    align: "center",
    size: 24,
    color: "#ffd0dc",
    font: UI_FONT,
  });
  drawText(ctx, error.message, canvas.width / 2, canvas.height / 2 + 22, {
    align: "center",
    size: 14,
    color: "#ffe7ee",
    font: UI_FONT,
  });
  throw error;
});
