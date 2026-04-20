import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runPipeline, parseJsonBlock, MODEL } from './llm-pipeline.js';
import { generateCharacterImage } from './generate-character-image.mjs';

const caseId = process.argv[2];
if (!caseId) {
  console.error('usage: npm run generate -- <case-id>');
  console.error('  example: npm run generate -- case-c');
  process.exit(1);
}

const SYSTEM =
  'You are a JSON generation step in a pipeline for the legal interrogation ' +
  "game 'The Operator'. Output only valid JSON matching the requested schema. " +
  'No markdown fences, no prose, no explanations.';

const STEP_1_SUSPECT = `You are generating a suspect for a legal interrogation game.

OUTPUT RULES:
- Return ONLY valid JSON
- No markdown, no explanation

OUTPUT:
{
  "suspect": {
    "name": string,
    "role": string,
    "profile": string,
    "motive": string,
    "secret": string,
    "credibility": number,
    "true_verdict": "GUILTY" | "NOT_GUILTY",
    "dossier": {
      "age": number,
      "identity_summary": string,
      "family": [ { "relation": string, "name": string, "note": string } ],
      "medical": [ { "condition": string, "polygraph_effect": string } ],
      "habits": [ { "habit": string, "polygraph_effect": string } ],
      "priors": [ string ],
      "pressure_points": [ string ],
      "modifiers": {
        "heart_rate_suppression": number,
        "heart_rate_baseline_shift": number,
        "gsr_sensitivity": number,
        "gsr_baseline_shift": number,
        "breathing_instability": number
      }
    }
  }
}

RULES:
- Realistic modern role (e.g. restaurant owner, contractor, CFO, landlord, doctor)
- The suspect must be morally ambiguous
- profile must include:
  - background
  - career
  - personality traits
  - one suspicious detail
  - one humanizing detail
- motive must connect to a potential lawsuit or wrongdoing
- secret must NOT be obvious but meaningful
- credibility must be 1-10 with subtle reasoning implied
- true_verdict is the ground truth the player must deduce from polygraph evidence:
  - "GUILTY" means the suspect actually is responsible (secret contains the real act)
  - "NOT_GUILTY" means the suspect is innocent of the charge even if the secret is shady
  - Pick the verdict that makes the case most interesting; mix both over time
  - IMPORTANT: NOT_GUILTY cases are harder and more interesting. Prioritize them.
    A NOT_GUILTY suspect must still have a REAL secondary secret causing displaced
    physiological guilt (e.g. protecting someone else, covering a separate minor crime,
    hiding an affair or financial shame). Their signals spike hard on the secondary
    secret but NOT on the core mechanism of the charged crime.

LAYERED SECRETS (REQUIRED):
- Every suspect must conceal AT LEAST TWO distinct things:
  PRIMARY SECRET: the fact directly relevant to the charge (may or may not be guilt)
  SECONDARY SECRET: something unrelated to the charge that causes genuine stress
    responses (e.g. an affair, financial shame, protecting a third party, a past
    mistake). This is the source of "displaced guilt" — signals that look like
    primary guilt but aren't. Document both in the "secret" field as:
    "PRIMARY: [charge-relevant secret]. SECONDARY: [unrelated stressor secret]."
- The secondary secret must be a genuine pressure point that produces high
  biometric responses. It must be distinguishable from the primary secret only
  by observing WHICH specific questions trigger spikes.

DOSSIER (background the player reads BEFORE interrogation):
- age: realistic age
- identity_summary: 1-2 sentence factual capsule (role, key credentials)
- family: 1-4 entries. Relatives or close partners with a SHORT note saying
  WHY they matter to the interrogation (leverage, dependency, conflict).
- medical: 0-3 entries. Each must include polygraph_effect explaining how the
  condition distorts readings (e.g. anxiety disorder -> elevated baseline
  GSR; pacemaker -> suppressed heart rate swings). Never invent diseases
  that conveniently reveal guilt. The goal is to let the player know which
  spikes to DISCOUNT.
- habits: 0-3 entries (medications, caffeine, sleep, substances). Each must
  include polygraph_effect. Examples: "Beta-blocker -> suppresses
  heart-rate response"; "High caffeine -> GSR baseline elevated"; "SSRI
  -> blunts sympathetic response".
- priors: 0-3 short factual bullets about prior incidents or proceedings.
  Not verdict-revealing.
- pressure_points: 1-3 short bullets describing emotional or situational
  leverage. This text is SHOWN DIRECTLY TO THE PLAYER on the case file
  ("Pressure Points" section). STRICT RULES:
  - NEVER write meta-game labels like "PRIMARY secret", "SECONDARY secret",
    "displaced guilt", "primary charge", or any equivalent. The player must
    deduce on their own which trigger relates to the actual charge.
  - DO NOT reveal which secret is the real crime versus misdirection.
  - DO NOT directly name what the secret is about (e.g. "protecting his
    partner", "an affair"); instead name the TRIGGER TOPIC (e.g. "mention
    of business partner's name", "questions about home life", "expense
    line items") and the EXPECTED BIOMETRIC PATTERN (e.g. "GSR surges
    while HR stays muted by medication").
  - You may hint at which tactics (EMPATHIC, TRAP, EVIDENCE, etc.) tend
    to land or backfire.
  Format: "[Trigger topic] — [expected biometric pattern] — [optional
  tactic hint]". Example: "Mention of her business partner's name — GSR
  surges sharply with breathing irregularity; HR spike masked by
  medication — EMPATHIC framing tends to open more than direct pressure."
- modifiers: numeric knobs that translate medical+habits into live polygraph
  distortion. MUST be consistent with the polygraph_effect notes. Defaults
  are 0/1; only deviate where the dossier justifies it.
  - heart_rate_suppression: 0.0-0.9. How much HR spike amplitude is muted.
    Beta-blockers (propranolol, bisoprolol) ~0.4-0.55; SSRI mild ~0.2;
    pacemaker ~0.6. Raise for each HR-suppressing agent (cap at 0.9).
  - heart_rate_baseline_shift: -12..+15 BPM additive shift on baseline.
    Hypertension +4..+10; heavy stimulant use +3..+8; bradycardia -5..-10.
  - gsr_sensitivity: 0.7-1.8 multiplier on sweat response amplitude.
    High caffeine 1.3-1.5; anxiety disorder 1.3-1.6; panic 1.5-1.8;
    anticholinergic meds / antiperspirant 0.7-0.85.
  - gsr_baseline_shift: -2..+4 uS additive shift on baseline skin
    conductance. Match chronic caffeine/anxiety patterns.
  - breathing_instability: 0.0-0.5 additive jitter on breath waveform.
    Anxiety/panic 0.2-0.35; COPD 0.25-0.4; asthma history 0.1-0.2.
  Note: medical conditions that mostly affect cognitive/neurological state
  (migraine, insomnia) still belong in medical[] for narrative context —
  they just don't get a direct numeric knob here, because the game only
  surfaces pulse, breathing, GSR, and fear to the player.
- Dossier MUST NOT spoil true_verdict. It can hint at motive/opportunity
  but must be believably available to an operator doing pre-interrogation
  research (public records, HR, medical disclosure forms).`;

const STEP_2_CASE = `You are generating a legal case context.

INPUT:
{{suspect_json}}

OUTPUT RULES:
- Return ONLY valid JSON

OUTPUT:
{
  "title": string,
  "context": string
}

RULES:
- Must describe a legal dispute or lawsuit
- Clearly define:
  - who is accusing whom
  - what happened
  - why the suspect is under investigation
- Must include ambiguity (not clearly guilty or innocent)
- Should naturally connect to the suspect's motive and secret
- Keep context concise (4-6 sentences)`;

const STEP_3_NODES = `You are generating a branching interrogation graph for a legal game.

INPUT:
Suspect:
{{suspect_json}}

Case:
{{case_json}}

OUTPUT RULES:
- Return ONLY valid JSON

OUTPUT SHAPE:
{
  "start_node": "node_01_intro",
  "nodes": {
    "<node_id>": {
      "theme": string,
      "description": string,
      "is_end_state": false,
      "choices": [
        {
          "type": string,
          "question": string,
          "answer": string,
          "mechanics": {
            "heart_rate": string,
            "breathing": string,
            "gsr": string,
            "cctv_visual": string,
            "korku_bari_delta": number,
            "gameplay_note": string
          },
          "next_node": string
        }
      ]
    },
    "<end_node_id>": {
      "theme": string,
      "description": string,
      "is_end_state": true,
      "result_text": string
    }
  }
}

RULES:

CORE DESIGN PRINCIPLE (CRITICAL):
- The interrogation ends; the CASE does NOT. After reaching an end node the
  player is taken to a verdict screen and must call GUILTY / NOT_GUILTY based
  on polygraph readings accumulated throughout the session. End nodes are
  interrogation OUTCOMES, not game endings.
- The polygraph signals (heart_rate, breathing, gsr) are the player's only
  hard evidence of deception. Align signals honestly with the suspect's
  true_verdict: the player must be able to read guilt or innocence from the
  biometrics.

SIGNAL TRUTH ALIGNMENT:
- The player sees four live channels: pulse, breathing, GSR, and a fear bar.
  Micro-expressions on the defendant portrait (cctv_visual) are the fifth.
  Align these around suspect.true_verdict.
- If suspect.true_verdict == "GUILTY":
  - On accusing/probing questions, suspect shows real deception tells
    (heart_rate SPIKE/MAX_SPIKE, gsr SURGE/MAX, breathing HOLDING_BREATH or
    HYPERVENTILATION, tense cctv_visual) even when the verbal answer stays
    composed.
  - Calm answers are available on empathy or soft-framing tactics.
  - Mechanism-test questions produce HIGH signals — the suspect knows the
    architecture and the specifics are incriminating.
- If suspect.true_verdict == "NOT_GUILTY":
  - Suspect WILL spike hard — but only on the SECONDARY secret (displaced
    guilt). Questions about the secondary secret should produce MAX_SPIKE/
    SURGE/HOLDING_BREATH clusters, making the player think they found guilt.
  - Questions about the PRIMARY charge mechanism must produce LOW/STABLE
    signals — the suspect genuinely lacks firsthand knowledge. The fear bar
    should DROP on the mechanism-test node.
  - Hard accusation questions may produce defensive spikes but NO sustained
    MAX GSR surges paired with HR MAX_SPIKE + HOLDING_BREATH on charge-
    specific questions.
  - The success node result_text MUST describe the signal DISTRIBUTION
    (which questions spiked vs. which were stable), not just the peak values,
    so the player can correctly conclude NOT_GUILTY despite a high overall
    fear bar.
- Never fake a confession for a NOT_GUILTY suspect; reserve MAX_SPIKE + MAX
  GSR + HOLDING_BREATH / HYPERVENTILATION clusters for GUILTY truths only.

NODE COUNT AND TOPOLOGY:
- 10 to 14 total nodes (minimum 10 — shorter graphs produce trivially easy cases)
- Must include:
  - node_01_intro (intro node)
  - 7-10 investigation nodes
  - 1-2 "clean outcome" end nodes (id contains "success", e.g. node_success_*)
    Differentiate variants if 2: node_success_breakdown (full emotional collapse
    with admission) vs. node_success_partial (controlled partial admission, suspect
    keeps composure but evidence is overwhelming). Each must have a distinct
    result_text describing a different final biometric pattern.
  - 2+ "degraded outcome" end nodes (id contains "fail", e.g. node_fail_*)
    Differentiate variants where possible: e.g. node_fail_lockdown (hard legal
    shutdown) vs. node_fail_deflection (soft stonewalling — session ends but
    suspect never overtly invoked counsel, leaving signal record ambiguous).

PATH LENGTH RULES (CRITICAL FOR GAMEPLAY DEPTH):
- No end node (success or fail) may be reachable in fewer than 6 node
  transitions from the start node. The player must pass through at least
  6 content nodes before any session can conclude.
- NEVER route a wrong-move choice directly to a fail end node from an early
  node (node_01_intro or the first three content nodes). Early wrong moves must
  instead route to a DEGRADED BRANCH — a regular content node that continues
  the interrogation under worse conditions (suspect more guarded, fewer
  productive paths open, biometric baseline shifted). Reserve direct fail-node
  routing for wrong moves made in the final 2 content nodes only.
- The graph must have at least TWO CONVERGENCE POINTS: two separate pairs of
  different choice paths that both lead to the same intermediate node. This
  ensures multiple routes stay viable across the full length of the session.
- Avoid pure linear chains (A→B→C→D→end). At least two nodes must each be
  reachable from multiple preceding nodes via different routes.
- Every investigation node after the 4th must present a meaningful tension
  between a productive direction and a subtly wrong direction — the session
  must never feel automatic in its second half.

MANDATORY NODE — MECHANISM TEST (CRITICAL FOR DIFFICULTY):
- One investigation node MUST be a mechanism-knowledge test: ask the suspect to
  explain HOW the alleged wrongdoing worked in technical/procedural detail.
  - GUILTY suspect: produces HIGH signals (HR SPIKE/MAX_SPIKE, GSR SURGE/MAX)
    because they know the architecture firsthand and the specifics are
    incriminating.
  - NOT_GUILTY suspect: produces LOW/STABLE signals because they lack
    firsthand knowledge of the mechanism — surface-level description, minor
    factual errors, genuine uncertainty. The fear bar may DROP here.
  This node is the primary tool for distinguishing primary guilt from
  displaced guilt. Without it the player cannot differentiate the two.

MANDATORY NODE — FOLLOW-UP EXPLOITATION:
- One investigation node placed AFTER the mechanism test must be a follow-up
  exploitation node: the operator confronts the suspect with a specific
  inconsistency or gap revealed by the mechanism test (or an earlier answer)
  and presses for clarification. This node must:
  - Reference something concrete the suspect said in a prior node.
  - Offer at least 3 choices: (a) precise forensic follow-up, (b) empathic
    reframe that invites explanation, (c) a premature escalation that
    surrenders the leverage.
  - Produce the session's second-highest biometric cluster on the correct path.

MANDATORY NODE — SUSPECT REFRAME ATTEMPT:
- One investigation node must be a reframe attempt: the suspect tries to
  actively shift the narrative — introducing a new explanation, volunteering
  a partial concession to pre-empt a harder question, or pivoting to blame a
  third party. The operator must choose how to handle it:
  - Accept the reframe (wrong move: biometrics go quiet, suspect regains ground)
  - Gently redirect back to the original thread (progress: moderate signal)
  - Directly challenge the reframe with a contradiction (high signal, high risk)

MANDATORY — RED HERRING PATH:
- One evidence path must be a red herring: a real piece of evidence that looks
  damning but actually confirms the SECONDARY secret, not the primary crime.
  Players who follow only this path will misread it as primary guilt. The path
  must not lead to the success node — it must route to a fail or ambiguous node
  where the evidence is real but the interpretation is wrong.

CHOICES PER NODE:
- At least THREE investigation nodes must offer 3 choices (not just 2).
- The third choice in each 3-choice node must look methodologically reasonable
  but subtly undermine the session — do NOT make wrong moves obviously
  aggressive or foolish. The player should only realize it was wrong after
  seeing the mechanic result.
- In the second half of the graph (nodes 5+), at least one node must offer
  a TACTICAL RESET option: a choice that pauses the pressure and lets the
  suspect breathe — wrong in the short term (korku_bari_delta negative)
  but can open a new path rather than routing immediately to fail.

NODE FIELDS (ALL nodes, including end nodes):
- theme: short scene label, 2-5 words, Title Case or descriptive phrase
- description: 1-2 sentences of PLAYER-VISIBLE narrative. Write only what the
  operator observes in the room: the suspect's visible posture, demeanor, or
  the physical/situational context of the moment (what is on the table, the
  atmosphere, the transition between topics). STRICT RULES for description:
  - NO references to secrets, primary/secondary secrets, or hidden motives.
  - NO biometric strategy, signal predictions, or gameplay advice.
  - NO meta-game language ("red herring", "mechanism test", "displaced guilt",
    "this evidence confirms the secondary secret", "biometrically explosive", etc.).
  - Write as if the player is sitting in the interrogation room right now.
    Describe only what a real observer would physically see or feel in that moment.
- is_end_state: boolean

NON-END NODES:
- is_end_state: false
- at least 2 choices
- NO result_text

END NODES:
- is_end_state: true
- result_text: interrogation-outcome summary (what state the suspect is in
  now — confessed, locked down, partial admission, evasive). Must NOT
  pre-declare guilt or innocence; the player still has to judge from the
  polygraph log.
- NO choices

CHOICE.type:
- Free-form UPPER_SNAKE_CASE descriptive label conveying the tactic
- Pick names that reflect the move: ANALYTICAL, EMPATHIC, FORENSIC_CALL_OUT,
  AGGRESSIVE, STRATEGIC, LEGAL_THREAT, MORAL_PRESSURE, NARROW_TARGET,
  SYSTEMIC_READ, GULLIBLE, TRAP, PRESSURE, EVIDENCE — or invent something
  equally specific to the scene
- Note: use EMPATHIC (not EMPATHETIC) to match existing data

ANSWER FIELD (CRITICAL):
- answer: The suspect's verbatim reply written in FIRST-PERSON DIRECT SPEECH.
  NEVER write third-person narration or stage directions
  (e.g. WRONG: "She pauses and says...", "He tenses, then replies...",
       "She hesitates. 'I don't know' she says.").
  Write ONLY what the suspect would literally say out loud, including
  hesitations expressed as ellipses (e.g. "I... I don't know"),
  deflections, evasions, partial admissions, or denials.
  No action descriptions. No narrator voice. No quoted speech within narration.

MECHANICS (choose the value that fits the suspect's reaction AND the
true_verdict — see SIGNAL TRUTH ALIGNMENT above):
- heart_rate: BASELINE | STABLE | RISE | INCREASE | SPIKE | MAX_SPIKE | DROP | ERRATIC
- breathing: BASELINE | CALM | DEEP | SHALLOW | HOLDING_BREATH | UNEVEN | HYPERVENTILATION | CRYING
- gsr: BASELINE | STABLE | INCREASE | SPIKE | SURGE | MAX | DECREASE
- cctv_visual: MUST be exactly one of these values (no compound or custom values):
  EYE_DART | LOOK_DOWN | RELIEVED_EXHALE | HAND_PINCH_UNDER_TABLE |
  DEFENSIVE_CROSS_ARMS | BREAKDOWN | STONE_FACE | EMPTY_STARE |
  JAW_TIGHTEN | RELEASED_SHOULDERS | LIP_PRESS | TEAR_POOLING
- korku_bari_delta: integer, roughly -50 to +50
  - negative = wrong move, suspect regains control
  - positive = right move, cracks the facade
- gameplay_note: short analyst-facing note tagging the signal
  (e.g. "LIE SIGNAL: ...", "PARTIAL TRUTH: ...", "WRONG MOVE: ...",
  "PROGRESS: ...", "CORRECT MOVE: ...")

GAMEPLAY DESIGN:
- At least one contradiction-discovery path (forensic / evidence-based)
- At least one misleading path that weakens the interrogation (pushes to a
  degraded end node where the suspect locks down)
- Strong questioning -> "success" end node (cleaner evidence pattern)
- Weak questioning -> "fail" end node (ambiguous evidence pattern)
- Remember: neither outcome decides the case; they just determine how much
  evidence the player carries into the verdict screen
- Answers must feel realistic (defensive, evasive, pressured, technical)

VALIDATION:
- All next_node values must refer to an existing node id in "nodes"
- start_node must exist in "nodes"`;

const STEP_4_EXTRAS = `You are generating only the remaining creative fields
for the final case assembly. Suspect, case, and nodes are already assembled
in code — do NOT reproduce them.

INPUT:
Suspect:
{{suspect_json}}

Case:
{{case_json}}

OUTPUT RULES:
- Return ONLY valid JSON
- No markdown, no explanation

OUTPUT:
{
  "fear_bar_description": string,
  "heart_rate_baseline": number,
  "gsr_baseline": number,
  "verdict_truth_text": string
}

RULES:
- fear_bar_description: 1-2 sentences describing what the fear bar tracks
  (emotional/psychological pressure on the suspect during the interrogation).
- heart_rate_baseline: BPM number. Start from ~70 and apply
  suspect.dossier.modifiers.heart_rate_baseline_shift if meaningful.
  Typical range 60-90.
- gsr_baseline: microsiemens number. Start from ~5 and apply
  suspect.dossier.modifiers.gsr_baseline_shift if meaningful.
  Typical range 4-10.
- verdict_truth_text: 2-3 sentence reveal of what the suspect actually did
  (or didn't do). Shown on the result screen after the player commits to a
  verdict. Must be consistent with suspect.secret, suspect.motive, and
  suspect.true_verdict:
  - If GUILTY: describe the suspect's real act of wrongdoing plainly.
  - If NOT_GUILTY: name the real culprit or cause, and clarify the suspect's
    secret was shady but not the crime charged.`;

const fill = (template, vars) =>
  Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, JSON.stringify(val, null, 2)),
    template
  );

const think = (budget) => ({ type: 'enabled', budget_tokens: budget });

const steps = [
  {
    // Complex creative profile — needs Sonnet reasoning quality
    name: 'suspect',
    model: MODEL.HEAVY,
    prompt: STEP_1_SUSPECT,
    parse: parseJsonBlock,
    thinking: think(4000),
    maxTokens: 12000,
  },
  {
    // Simple structured summary — Haiku is sufficient and much cheaper
    name: 'case',
    model: MODEL.LIGHT,
    prompt: (r) => fill(STEP_2_CASE, { suspect_json: r.suspect }),
    parse: parseJsonBlock,
    thinking: think(1024),
    maxTokens: 3000,
  },
  {
    // Most complex step — branching graph with 10-14 nodes — Opus for best quality
    name: 'nodes',
    model: MODEL.NODES,
    prompt: (r) => fill(STEP_3_NODES, { suspect_json: r.suspect, case_json: r.case }),
    parse: parseJsonBlock,
    thinking: think(10000),
    maxTokens: 50000,
  },
  {
    // Four simple fields — Haiku handles this well and much faster
    name: 'extras',
    model: MODEL.LIGHT,
    prompt: (r) => fill(STEP_4_EXTRAS, { suspect_json: r.suspect, case_json: r.case }),
    parse: parseJsonBlock,
    thinking: think(1024),
    maxTokens: 3000,
  },
];

const STEP_LABELS = {
  suspect: 'Working on suspect...',
  case: 'Working on case context...',
  nodes: 'Building interrogation nodes...',
  extras: 'Generating verdict text and baselines...',
};

const { results } = await runPipeline(steps, {
  system: SYSTEM,
  onStepStart: ({ name }) => console.log(STEP_LABELS[name] ?? `Working on ${name}...`),
  onStep: ({ name, text, stopReason }) => {
    const step = steps.find((s) => s.name === name);
    const model = step?.model ?? 'default';
    console.log(`[${name}] done — ${text.length} chars, model=${model}, stop_reason=${stopReason}`);
  },
});

const suspect = results.suspect.suspect;
const caseCtx = results.case;
const nodes = results.nodes;
const extras = results.extras;

const imageOutPath = resolve('assets', 'characters', `${caseId}.png`);
console.log('Generating character image...');
await generateCharacterImage(suspect, imageOutPath);

const finalOutput = {
  game_data: {
    title: caseCtx.title,
    suspect: {
      name: suspect.name,
      role: suspect.role,
      profile: suspect.profile,
    },
    system_config: {
      initial_fear_bar: 20,
      max_fear_bar: 100,
      fear_bar_description: extras.fear_bar_description,
      heart_rate_baseline: extras.heart_rate_baseline,
      gsr_baseline: extras.gsr_baseline,
    },
    context: caseCtx.context,
    true_verdict: suspect.true_verdict,
    verdict_truth_text: extras.verdict_truth_text,
    dossier: suspect.dossier,
    start_node: nodes.start_node,
    nodes: nodes.nodes,
    character_image: `./assets/characters/${caseId}.png`,
  },
};

const outPath = resolve('dialogs', `${caseId}.json`);
writeFileSync(outPath, JSON.stringify(finalOutput, null, 2));
console.log(`wrote ${outPath}`);

const casesListPath = resolve('js', 'game', 'cases-list.js');
const casesListSrc = readFileSync(casesListPath, 'utf8');
const title = finalOutput.game_data.title ?? caseId;
const language = finalOutput.game_data.language ?? 'en';
const newEntry = `  {\n    id: '${caseId}',\n    file: './dialogs/${caseId}.json',\n    label: '${title}',\n    language: '${language}',\n  },\n`;
const updated = casesListSrc.replace(/\];\s*$/, `${newEntry}];\n`);
writeFileSync(casesListPath, updated);
console.log(`added '${caseId}' to cases-list.js`);
