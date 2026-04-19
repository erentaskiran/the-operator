import { drawRect, drawText } from '../draw.js';
import { registerScene, setScene } from '../sceneManager.js';
import {
  getMousePos,
  isScrollInverted,
  toggleScrollInverted,
  wasKeyPressed,
  wasMousePressed,
} from '../input.js';
import { COLORS, DESIGN_H, DESIGN_W, UI_FONT } from '../ui/theme.js';
import { drawSceneBackground } from '../ui/background.js';
import { drawPanel } from '../ui/panel.js';
import { t, getLanguage, setLanguage } from '../i18n/index.js';

let langLeftRect = null;
let langRightRect = null;
let scrollToggleRect = null;
const LANGS = ['en', 'tr'];

function inRect(point, rect) {
  return (
    rect &&
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

function cycleLanguage(dir) {
  const idx = LANGS.indexOf(getLanguage());
  const next = LANGS[(idx + dir + LANGS.length) % LANGS.length];
  setLanguage(next);
}

function drawSettingsScene(ctx) {
  drawSceneBackground(ctx);

  const panelX = 80;
  const panelY = 60;
  const panelW = DESIGN_W - 160;
  const panelH = DESIGN_H - 120;
  drawPanel(ctx, panelX, panelY, panelW, panelH, { border: COLORS.amber });

  drawText(ctx, t('SETTINGS_TITLE'), DESIGN_W / 2, panelY + 18, {
    align: 'center',
    size: 14,
    color: COLORS.amberBright,
    font: UI_FONT,
    baseline: 'middle',
  });

  drawRect(ctx, panelX + 16, panelY + 32, panelW - 32, 1, COLORS.amberDim);

  // Language row
  const rowY = panelY + 60;
  drawText(ctx, t('SETTINGS_LANGUAGE_LABEL'), panelX + 24, rowY, {
    size: 12,
    color: COLORS.cream,
    font: UI_FONT,
    baseline: 'middle',
  });

  const arrowW = 20;
  const arrowH = 20;
  const labelW = 90;
  const rowRight = panelX + panelW - 24;
  const labelX = rowRight - labelW / 2 - arrowW;
  const leftArrowX = labelX - labelW / 2 - arrowW - 4;
  const rightArrowX = labelX + labelW / 2 + 4;

  const mouse = getMousePos();
  langLeftRect = { x: leftArrowX, y: rowY - arrowH / 2, w: arrowW, h: arrowH };
  langRightRect = { x: rightArrowX, y: rowY - arrowH / 2, w: arrowW, h: arrowH };

  const leftHover = inRect(mouse, langLeftRect);
  const rightHover = inRect(mouse, langRightRect);

  drawPanel(ctx, langLeftRect.x, langLeftRect.y, arrowW, arrowH, {
    border: leftHover ? COLORS.amberBright : COLORS.amberDim,
    fill: leftHover ? 'rgba(60,36,14,0.8)' : COLORS.panelFillLight,
  });
  drawText(ctx, '<', langLeftRect.x + arrowW / 2, rowY, {
    align: 'center',
    size: 12,
    color: leftHover ? COLORS.amberBright : COLORS.cream,
    font: UI_FONT,
    baseline: 'middle',
  });

  drawPanel(ctx, langRightRect.x, langRightRect.y, arrowW, arrowH, {
    border: rightHover ? COLORS.amberBright : COLORS.amberDim,
    fill: rightHover ? 'rgba(60,36,14,0.8)' : COLORS.panelFillLight,
  });
  drawText(ctx, '>', langRightRect.x + arrowW / 2, rowY, {
    align: 'center',
    size: 12,
    color: rightHover ? COLORS.amberBright : COLORS.cream,
    font: UI_FONT,
    baseline: 'middle',
  });

  const langLabel = getLanguage() === 'en' ? t('SETTINGS_LANGUAGE_EN') : t('SETTINGS_LANGUAGE_TR');
  drawText(ctx, langLabel, labelX, rowY, {
    align: 'center',
    size: 12,
    color: COLORS.amberBright,
    font: UI_FONT,
    baseline: 'middle',
  });

  // Invert scroll row
  const scrollRowY = rowY + 34;
  drawText(ctx, t('SETTINGS_SCROLL_LABEL'), panelX + 24, scrollRowY, {
    size: 12,
    color: COLORS.cream,
    font: UI_FONT,
    baseline: 'middle',
  });

  scrollToggleRect = {
    x: rowRight - 92,
    y: scrollRowY - 10,
    w: 92,
    h: 20,
  };
  const scrollHover = inRect(mouse, scrollToggleRect);
  drawPanel(ctx, scrollToggleRect.x, scrollToggleRect.y, scrollToggleRect.w, scrollToggleRect.h, {
    border: scrollHover ? COLORS.amberBright : COLORS.amberDim,
    fill: scrollHover ? 'rgba(60,36,14,0.8)' : COLORS.panelFillLight,
  });

  const scrollLabel = isScrollInverted() ? t('SETTINGS_SCROLL_ON') : t('SETTINGS_SCROLL_OFF');
  drawText(ctx, scrollLabel, scrollToggleRect.x + scrollToggleRect.w / 2, scrollRowY, {
    align: 'center',
    size: 12,
    color: scrollHover ? COLORS.amberBright : COLORS.cream,
    font: UI_FONT,
    baseline: 'middle',
  });

  drawText(ctx, t('SETTINGS_BACK'), DESIGN_W / 2, panelY + panelH - 16, {
    align: 'center',
    size: 11,
    color: COLORS.creamDim,
    font: UI_FONT,
    baseline: 'middle',
  });
}

export function registerSettingsScene(_canvas, ctx) {
  registerScene('settings', {
    enter() {
      langLeftRect = null;
      langRightRect = null;
      scrollToggleRect = null;
    },
    update() {
      if (wasKeyPressed('escape')) {
        setScene('menu');
        return;
      }
      if (wasKeyPressed('arrowleft') || wasKeyPressed('a')) {
        cycleLanguage(-1);
        return;
      }
      if (wasKeyPressed('arrowright') || wasKeyPressed('d')) {
        cycleLanguage(1);
        return;
      }
      if (wasKeyPressed('i')) {
        toggleScrollInverted();
        return;
      }
      if (wasMousePressed(0)) {
        const mouse = getMousePos();
        if (inRect(mouse, langLeftRect)) {
          cycleLanguage(-1);
          return;
        }
        if (inRect(mouse, langRightRect)) {
          cycleLanguage(1);
          return;
        }
        if (inRect(mouse, scrollToggleRect)) {
          toggleScrollInverted();
          return;
        }
      }
    },
    render() {
      drawSettingsScene(ctx);
    },
  });
}
