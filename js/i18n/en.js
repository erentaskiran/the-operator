export const EN = {
  // title / common
  APP_TITLE: 'THE OPERATOR',
  GAME_SUBTITLE: '[ POLYGRAPH INTERROGATION SIMULATOR ]',
  GAME_TAGLINE: 'YOU REVEAL THE TRUTH',
  PRESS_ANY_KEY: '>> PRESS ANY KEY TO START <<',
  LOADING: 'Loading...',
  LOAD_FAIL_TITLE: 'Game could not be started',

  // menu
  MENU_CASE_SELECT: '[ CASE SELECTION ]',
  MENU_CASE_LOAD_ERROR: 'Case could not be loaded.',
  MENU_KEY_INSTRUCTIONS: 'NUMBER KEYS: SELECT CASE',
  MENU_ENTER_START: '>> ENTER: START <<',
  STAT_NEW: 'NEW',
  STAT_SHORT_CORRECT: 'COR',
  STAT_SHORT_FAIL: 'FAIL',
  STAT_COMPLETED: 'COMPLETED',
  STAT_ATTEMPTED: 'ATTEMPTED',
  STAT_FAILED: 'FAILED',
  LANG_TOGGLE_HINT: 'L: TR',

  // dossier
  DOSSIER_TITLE: '[ DEFENDANT DOSSIER ]',
  DOSSIER_IDENTITY: 'IDENTITY',
  DOSSIER_NAME: 'Name',
  DOSSIER_ROLE: 'Role',
  DOSSIER_AGE: 'Age',
  DOSSIER_FAMILY: 'FAMILY & RELATIONS',
  DOSSIER_HEALTH: 'HEALTH STATUS',
  DOSSIER_POLY_TAG: 'POLYGRAPH',
  DOSSIER_HABITS: 'HABITS / MEDICATION',
  DOSSIER_PRIORS: 'PAST RECORDS',
  DOSSIER_PRESSURE: 'PRESSURE POINTS',
  DOSSIER_CASE_SUMMARY: 'CASE SUMMARY',
  DOSSIER_START_BTN: '>> START INTERROGATION (ENTER) <<',
  DOSSIER_FOOTER: 'ESC: Menu  |  Scroll: Scroll',
  DOSSIER_DEFAULT_NAME: 'DEFENDANT',
  PLAY_OPERATOR_LABEL: 'OPERATOR',

  // verdict
  VERDICT_TITLE: '[ VERDICT PHASE ]',
  VERDICT_SUSPECT_PREFIX: 'DEFENDANT: ',
  VERDICT_SUMMARY_HEADER: 'INTERROGATION SUMMARY',
  VERDICT_EVIDENCE_HEADER: 'POLYGRAPH EVIDENCE',
  VERDICT_HEART: 'HEART',
  VERDICT_STATS_FEAR: 'STRESS METER FINAL:',
  VERDICT_STATS_QUESTIONS: 'QUESTIONS:',
  VERDICT_STATS_STRESS: 'STRESS SCORE:',
  VERDICT_PROMPT: 'READ THE POLYGRAPH. ARE YOU CONVINCED THE DEFENDANT IS GUILTY?',
  VERDICT_GUILTY_BTN: '[1] GUILTY',
  VERDICT_GUILTY_SUB: 'Polygraph caught their lies',
  VERDICT_NOT_GUILTY_BTN: '[2] NOT GUILTY',
  VERDICT_NOT_GUILTY_SUB: 'Insufficient evidence',
  VERDICT_INSTRUCTIONS: '1 / 2 / MOUSE: GIVE VERDICT',
  VERDICT_CONFIRM_TITLE: 'ARE YOU SURE?',
  VERDICT_CONFIRM_BODY: 'This verdict will close the case.',
  VERDICT_CONFIRM_YES: 'CONFIRM',
  VERDICT_CONFIRM_NO: 'CANCEL',
  VERDICT_NO_RECORD: 'No interrogation record.',
  VERDICT_WAVE_HR: 'HR',
  VERDICT_WAVE_BREATHING: 'BR',
  VERDICT_WAVE_GSR: 'GS',

  // bad end
  BAD_END_TITLE: '[ INTERROGATION FAILED ]',
  BAD_END_INSTRUCTIONS: 'ESC / ENTER / CLICK: Back to Menu',

  // result
  RESULT_CORRECT: '[ CORRECT VERDICT ]',
  RESULT_WRONG: '[ WRONG VERDICT ]',
  RESULT_YOUR_VERDICT: 'YOUR VERDICT:',
  RESULT_TRUE_VERDICT: 'TRUTH:',
  RESULT_TRUTH_STORY: 'THE TRUE STORY OF THE CASE',
  RESULT_INTERROGATION_RESULT: 'INTERROGATION RESULT',
  RESULT_INSTRUCTIONS: 'R: Replay  |  ESC: Menu',
  RESULT_ERROR: '[ ERROR ]',
  VERDICT_LABEL_GUILTY: 'GUILTY',
  VERDICT_LABEL_NOT_GUILTY: 'NOT GUILTY',

  // settings
  SETTINGS_TITLE: '[ SETTINGS ]',
  SETTINGS_LANGUAGE_LABEL: 'LANGUAGE',
  SETTINGS_SCROLL_LABEL: 'INVERT SCROLL',
  SETTINGS_SOUND_LABEL: 'SOUND',
  SETTINGS_SCROLL_ON: 'ON',
  SETTINGS_SCROLL_OFF: 'OFF',
  SETTINGS_LANGUAGE_EN: 'ENGLISH',
  SETTINGS_LANGUAGE_TR: 'TURKCE',
  SETTINGS_BACK: 'ESC: Back to Menu',
  MENU_SETTINGS_HINT: 'S: Settings',
  MENU_BRIEFING_HINT: 'B: Briefing',

  // briefing
  BRIEFING_TITLE: '[ OPERATOR BRIEFING ]',
  BRIEFING_HINT_NEXT: 'ENTER / → : Next',
  BRIEFING_HINT_BACK: '← : Back',
  BRIEFING_HINT_STATE: 'SPACE : Next state',
  BRIEFING_HINT_EXIT: 'ESC : Menu',
  BRIEFING_INTRO_TITLE: 'READING THE ROOM',
  BRIEFING_INTRO_BODY:
    'You read 5 sources together: PULSE, BREATHING, GSR, the STRESS meter, and the defendant portrait. No single channel is proof by itself. After each question, observe the change first, then verify it against dossier notes.',
  BRIEFING_PULSE_TITLE: 'PULSE',
  BRIEFING_PULSE_BODY:
    'On pulse, watch both beat density and sudden spikes. A hard question usually creates a rise; no visible reaction can sometimes be medication, not calmness. If the dossier mentions beta-blockers, do not trust a flat pulse on its own.',
  BRIEFING_BREATHING_TITLE: 'BREATHING',
  BRIEFING_BREATHING_BODY:
    'Breathing gives you rhythm. Regular/deep flow suggests control; shallow/fast flow suggests defensive pressure. A long flat segment followed by a sharp inhale can indicate breath-holding. If rhythm breaks at key moments, flag it.',
  BRIEFING_GSR_TITLE: 'GSR (SKIN CONDUCTANCE)',
  BRIEFING_GSR_BODY:
    'GSR is delayed compared to the spoken moment. You often see the rise shortly after the question, not instantly. Caffeine and anxiety can keep baseline high, so timing of the rise is often more valuable than raw height.',
  BRIEFING_FEAR_TITLE: 'STRESS METER',
  BRIEFING_FEAR_BODY:
    'The stress meter is a summary of interrogation pressure, not a lie detector on its own. It rises when your approach lands, and can drop on weak or mistimed pressure. High stress does not automatically mean guilty; it means your line is hitting.',
  BRIEFING_CCTV_TITLE: 'DEFENDANT PORTRAIT',
  BRIEFING_CCTV_BODY:
    'The portrait has no text labels, only visual cues. Red/jitter usually means tension, collapse-like motion suggests breakdown, cold/still look suggests control, and warm softening suggests relief. Always read portrait cues together with polygraph channels.',
  BRIEFING_MODIFIERS_TITLE: 'MEDICAL & HABITS',
  BRIEFING_MODIFIERS_BODY:
    'Medical and habit notes in the dossier directly affect gameplay. If you ignore "polygraph_effect" lines, your interpretation can be wrong even when the chart looks clear. Rule of thumb: dossier first, chart second.',
  BRIEFING_CLOSE_TITLE: 'YOU ARE THE OPERATOR',
  BRIEFING_CLOSE_BODY:
    'Safe decision flow: (1) ask, (2) observe changes across channels, (3) cross-check with dossier, (4) re-read from log before verdict. Do not commit on a single signal. Press ENTER to return to case selection.',

  // polygraph / UI
  POLY_HEADER: 'POLYGRAPH SIGNALS',
  POLY_FEAR: 'STRESS',
  POLY_PULSE: 'PULSE',
  POLY_BREATHING: 'BREATH',
  POLY_GSR: 'GSR',
  DIALOGUE_ANSWER_HEADER: '[ ANSWER ]',
  DIALOGUE_YOU_PREFIX: 'YOU: ',
  DIALOGUE_SKIP_HINT: 'Skip with ENTER',
  CHOICE_MODAL_TITLE: 'SELECT QUESTION',
  LOG_HEADER: '[ LOG ]',

  // pause menu
  PAUSE_TITLE: '[ PAUSED ]',
  PAUSE_CONTINUE: 'CONTINUE',
  PAUSE_SETTINGS: 'SETTINGS',
  PAUSE_QUIT: 'QUIT TO MENU',

  // tutorial
  TUTORIAL_NEXT: 'NEXT (ENTER / CLICK)',
  TUTORIAL_SKIP: 'ESC: SKIP',
  TUTORIAL_STEP: 'STEP',
  TUTORIAL_OF: '/',
  TUTORIAL_POLYGRAPH_TITLE: 'POLYGRAPH PANEL',
  TUTORIAL_POLYGRAPH_BODY:
    'Shows the suspect\u2019s pulse, brain and skin reactions. Colored bands during questions mark the intensity of their response.',
  TUTORIAL_DOSSIER_TITLE: 'DEFENDANT DOSSIER',
  TUTORIAL_DOSSIER_BODY:
    'Review medical notes, habits and pressure points. Some conditions can distort the polygraph readings.',
  TUTORIAL_LOG_TITLE: 'CONVERSATION LOG',
  TUTORIAL_LOG_BODY: 'Re-read everything that has been said during the interrogation here.',
  TUTORIAL_CHOICES_TITLE: 'QUESTIONS',
  TUTORIAL_CHOICES_BODY:
    'Click or press 1-9 to pick a question. Each one will provoke a different reaction.',

  // language / case filtering
  MENU_NO_CASES: 'NO CASES AVAILABLE FOR THIS LANGUAGE',
  WARN_LANG_MISMATCH: '! LANGUAGE CHANGED DURING CASE — CONTENT REMAINS IN ORIGINAL LANGUAGE',
};
