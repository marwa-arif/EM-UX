import React, { useEffect, useRef, useCallback } from 'react'
import { Ic } from '../ui.jsx'
import { FilterTree } from './CanvasPanel.jsx'
import {
  classifyQuery, buildStepPlan, flattenPlan, selectTool, TOOLS,
  buildTacInputValues, formatTacVal, toolCallSummary, callTool,
  isChitChat, chitChatReply, STEP_THOUGHTS, STEP_THOUGHT_URLS, TEXT_ONLY_TIERS, detectEntity,
  TITLE_COMPLETION_LABELS,
} from '../pages/navigatorEngine.js'

const FILTER_TREE_ENTITY_DEFAULT = { graph: 'Identity', risk: 'Host', deep: 'Identity' };

const IcChevD   = () => <Ic size={12} path={<><path d="m6 9 6 6 6-6" /></>} />
const IcRun     = () => <Ic size={11} path={<><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" /></>} />
const IcAlert   = () => <Ic size={14} path={<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>} />

let exchangeSeq = 0

// ── Exchange factory — classify a query into a fresh exchange record ──
// `opts.mode` (ask/research/build) only ever biases classification/step-plan
// depth — see navigatorEngine.js's classifyQuery/buildStepPlan. `opts.forceTier`
// skips classification entirely (used by Build mode, where the tier is always
// 'build' rather than something classifyQuery would ever return on its own).
// `opts.textReply` forces a plain chit-chat-style bubble with custom copy
// (Build mode's "that's not a widget request" guidance) without matching the
// chit-chat greeting regex. `opts.pendingWidget` is stashed on the exchange
// so Build mode can materialize the widget once the trace finishes.
export function createExchange(query, opts = {}) {
  const id = `ex${++exchangeSeq}-${Date.now().toString(36)}`
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (opts.textReply) {
    return { id, query, time, chitChat: true, reply: opts.textReply, done: true, canvasOpen: false };
  }
  if (isChitChat(query)) {
    return { id, query, time, chitChat: true, reply: chitChatReply(query), done: true, canvasOpen: false };
  }
  const tier = opts.forceTier || classifyQuery(query, opts.mode);
  const tool = selectTool(tier);
  const needsApproval = !!(tool && TOOLS[tool].requiresApproval && tier !== 'quick');
  const plan = flattenPlan(buildStepPlan(query, tier, opts.mode));
  const steps = plan.map(item => item._phaseName
    ? item
    : { ...item, status: 'pending', thoughts: [], toolCallText: null, toolCallDone: false, expanded: false, chosenBranch: null });
  return {
    id, query, time, tier, tool,
    awaitingApproval: needsApproval,
    toolApproval: needsApproval ? { inputs: buildTacInputValues(tool, query), editing: false, fallbackTool: TOOLS[tool].fallback } : null,
    steps,
    stepCursor: 0,
    interrupt: null,
    liveMetrics: null,
    done: false,
    reasoningCollapsed: false,
    canvasOpen: false,
    feedback: null,
    canvasFeedback: null,
    followupChoice: null,
    elapsedMs: 0,
    pendingWidget: opts.pendingWidget || null,
  };
}

// ── Animation/orchestration hook — drives one exchange's step-by-step run ──
export function useReasoningEngine(exchange, live, onUpdate) {
  const tokenRef = useRef(0);
  const timeoutsRef = useRef([]);
  const intervalsRef = useRef([]);
  const exchangeRef = useRef(exchange);
  useEffect(() => { exchangeRef.current = exchange; }, [exchange]);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
  }, []);

  const schedule = useCallback((fn, ms) => {
    const tid = setTimeout(fn, ms);
    timeoutsRef.current.push(tid);
    return tid;
  }, []);

  const patch = useCallback((fn) => {
    onUpdate(exchangeRef.current.id, fn);
  }, [onUpdate]);

  // Elapsed-time ticker
  useEffect(() => {
    if (!live || exchange.chitChat || exchange.done) return;
    const start = Date.now() - (exchange.elapsedMs || 0);
    const iv = setInterval(() => { patch(ex => ({ ...ex, elapsedMs: Date.now() - start })); }, 250);
    intervalsRef.current.push(iv);
    return () => clearInterval(iv);
  }, [live, exchange.chitChat, exchange.done, exchange.id, patch]);

  // Main step-by-step driver
  useEffect(() => {
    if (!live || exchange.chitChat) return;
    if (exchange.awaitingApproval) return;
    if (exchange.done) return;
    if (exchange.interrupt && !exchange.interrupt.resolved) return;

    const token = ++tokenRef.current;
    const isQuick = exchange.tier === 'quick';
    runStep(exchange.stepCursor, token);

    function runStep(pos, tok) {
      const items = exchangeRef.current.steps;
      if (pos >= items.length) { finish(tok); return; }
      const item = items[pos];
      if (item._phaseName || item.status === 'done') { runStep(pos + 1, tok); return; }

      patch(ex => ({
        ...ex,
        stepCursor: pos,
        steps: ex.steps.map((s, i) => i === pos ? { ...s, status: 'active', expanded: true } : s),
      }));

      // "Quick" tier is meant to feel like a near-instant direct fetch — fewer
      // streamed thoughts and shorter per-step delays than the deeper tiers.
      const thoughtBank = STEP_THOUGHTS[item.icon] || [];
      const urlBank = STEP_THOUGHT_URLS[item.icon] || [];
      const chosenIdxs = thoughtBank.slice(0, isQuick ? 1 : 2).map((_, i) => i);

      const thoughtGap = isQuick ? 350 : 650;
      chosenIdxs.forEach((tIdx, order) => {
        schedule(() => {
          if (tokenRef.current !== tok) return;
          patch(ex => ({
            ...ex,
            steps: ex.steps.map((s, i) => i === pos
              ? { ...s, thoughts: [...s.thoughts, { text: thoughtBank[tIdx], url: urlBank[tIdx] }] }
              : s),
          }));
        }, 400 + order * thoughtGap);
      });

      const toolDelay = 400 + chosenIdxs.length * thoughtGap + 250;
      if (item.tool) {
        schedule(() => {
          if (tokenRef.current !== tok) return;
          const inputs = buildTacInputValues(item.tool, exchangeRef.current.query);
          const summary = toolCallSummary(item.tool, inputs);
          patch(ex => ({ ...ex, steps: ex.steps.map((s, i) => i === pos ? { ...s, toolCallText: summary } : s) }));
          callTool(item.tool, inputs);
        }, toolDelay);
      }

      if (item.liveMetrics) {
        let n = 0;
        const metricIv = setInterval(() => {
          n++;
          patch(ex => ({ ...ex, liveMetrics: { nodes: n * 37, edges: n * 61, paths: n * 12 } }));
        }, 180);
        intervalsRef.current.push(metricIv);
        schedule(() => clearInterval(metricIv), 3200);
      }

      const stepTotalDelay = item.liveMetrics ? 3800 : (isQuick ? 900 + Math.random() * 400 : 1800 + Math.random() * 700);

      schedule(() => {
        if (tokenRef.current !== tok) return;

        if (item.interrupt) {
          const nextItem = items[pos + 1];
          const branches = nextItem && nextItem.branching ? nextItem.branches : null;
          patch(ex => ({
            ...ex,
            stepCursor: pos + 1,
            steps: ex.steps.map((s, i) => i === pos ? { ...s, status: 'done', toolCallDone: true, expanded: false } : s),
            interrupt: {
              question: 'Multiple risk clusters detected — how should the analysis continue?',
              choices: branches || [{ label: 'Continue with default scope' }],
              targetStepIdx: branches ? pos + 1 : null,
              resolved: false,
            },
          }));
          return; // pause chain — resumed via resolveInterrupt()
        }

        if (item.branching && item.chosenBranch == null) {
          const chosen = Math.floor(Math.random() * item.branches.length);
          patch(ex => ({
            ...ex,
            steps: ex.steps.map((s, i) => i === pos ? { ...s, status: 'done', toolCallDone: true, chosenBranch: chosen, expanded: false } : s),
          }));
        } else {
          patch(ex => ({ ...ex, steps: ex.steps.map((s, i) => i === pos ? { ...s, status: 'done', toolCallDone: true, expanded: false } : s) }));
        }

        runStep(pos + 1, tok);
      }, stepTotalDelay);
    }

    function finish(tok) {
      if (tokenRef.current !== tok) return;
      patch(ex => ({ ...ex, done: true, canvasOpen: !TEXT_ONLY_TIERS.includes(ex.tier) }));
    }

    return () => { tokenRef.current++; clearTimers(); };
  }, [live, exchange.id, exchange.chitChat, exchange.awaitingApproval, exchange.done, exchange.interrupt, patch, schedule, clearTimers]);

  // Cleanup on unmount
  useEffect(() => () => { tokenRef.current++; clearTimers(); }, [clearTimers]);

  // Auto-collapse the whole reasoning section shortly after it finishes — run as its
  // own effect (not via `schedule`) so the main driver's cleanup-on-`done` transition
  // can't cancel this timeout before it fires. Deps deliberately exclude
  // `reasoningCollapsed`: this must fire exactly once per `done` transition, not
  // every time the user manually re-expands it afterward (that re-collapsed on its
  // own a few seconds later, which fought the user's click).
  useEffect(() => {
    if (!exchange.done || exchange.chitChat) return;
    const tid = setTimeout(() => { patch(ex => ({ ...ex, reasoningCollapsed: true })); }, 800);
    return () => clearTimeout(tid);
  }, [exchange.done, exchange.chitChat, patch]);

  const approve = useCallback(() => { patch(ex => ({ ...ex, awaitingApproval: false, toolApproval: null })); }, [patch]);

  const useFallback = useCallback(() => {
    patch(ex => {
      const fb = ex.toolApproval && ex.toolApproval.fallbackTool;
      if (!fb) return ex;
      return { ...ex, tool: fb, toolApproval: { inputs: buildTacInputValues(fb, ex.query), editing: false, fallbackTool: TOOLS[fb].fallback } };
    });
  }, [patch]);

  const toggleTacEdit = useCallback(() => {
    patch(ex => ({ ...ex, toolApproval: { ...ex.toolApproval, editing: !ex.toolApproval.editing } }));
  }, [patch]);

  const resolveInterrupt = useCallback((choiceIdx) => {
    patch(ex => {
      if (!ex.interrupt) return ex;
      let steps = ex.steps;
      if (ex.interrupt.targetStepIdx != null) {
        steps = steps.map((s, i) => i === ex.interrupt.targetStepIdx ? { ...s, chosenBranch: choiceIdx, status: 'done' } : s);
      }
      return { ...ex, steps, interrupt: { ...ex.interrupt, resolved: true } };
    });
  }, [patch]);

  const toggleStepExpand = useCallback((idx) => {
    patch(ex => ({ ...ex, steps: ex.steps.map((s, i) => i === idx ? { ...s, expanded: !s.expanded } : s) }));
  }, [patch]);

  const toggleReasoningCollapsed = useCallback(() => {
    patch(ex => ({ ...ex, reasoningCollapsed: !ex.reasoningCollapsed }));
  }, [patch]);

  const stop = useCallback(() => {
    tokenRef.current++;
    clearTimers();
  }, [clearTimers]);

  return { approve, useFallback, toggleTacEdit, resolveInterrupt, toggleStepExpand, toggleReasoningCollapsed, stop };
}

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function ToolApprovalCard({ tool, toolApproval, onApprove, onAdjust, onFallback }) {
  const t = TOOLS[tool];
  if (!t) return null;
  const fallbackFriendly = toolApproval.fallbackTool && TOOLS[toolApproval.fallbackTool] ? TOOLS[toolApproval.fallbackTool].label : null;
  const fallbackBtnLabel = t.fallbackLabel || (fallbackFriendly ? `Try ${fallbackFriendly}` : null);
  return (
    <div className="tool-approval-card">
      <div className="tac-status-bar">
        <span className="tac-status-dot" />
        <span className="tac-status-label">Ready to search</span>
        <span className="tac-status-sub">Review before running{toolApproval.fallbackTool ? ' · alternative available' : ''}</span>
      </div>
      <div className="tac-body">
        <div className="tac-tool-row"><span className="tac-tool-name">{t.label}</span></div>
        {t.description && <div style={{ fontSize: 12, color: 'var(--shell-text-muted)', marginTop: -4 }}>{t.description}</div>}
        <div className="tac-schema">
          <div className="tac-schema-hdr">What I&rsquo;ll use</div>
          {Object.keys(t.input).map(k => (
            <div className="tac-schema-row" key={k}>
              <span className="tac-field-name">{(t.inputLabels && t.inputLabels[k]) || k.replace(/_/g, ' ')}</span>
              {toolApproval.editing
                ? <input className="tac-field-input" defaultValue={formatTacVal(toolApproval.inputs[k])} style={{ flex: 1, font: 'inherit', fontSize: 12, border: '1px solid var(--shell-border)', borderRadius: 4, padding: '2px 6px', background: 'var(--ctrl-bg)', color: 'var(--shell-text)' }} />
                : <span className="tac-field-val">{formatTacVal(toolApproval.inputs[k])}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="tac-action-bar">
        <button className="ds-btn sz-md t-primary" onClick={onApprove}><IcRun /> {t.actionLabel}</button>
        <button className="ds-btn sz-md t-outline" onClick={onAdjust}>{toolApproval.editing ? 'Confirm' : 'Adjust'}</button>
        {fallbackBtnLabel && <button className="ds-btn sz-md t-secondary" onClick={onFallback}>{fallbackBtnLabel}</button>}
      </div>
    </div>
  );
}

function InterruptCard({ interrupt, onChoose }) {
  return (
    <div className="interrupt-card">
      <div className="interrupt-card-hdr">
        <span className="interrupt-card-icon"><IcAlert /></span>
        <span className="interrupt-card-title">Waiting for your direction</span>
      </div>
      <p className="interrupt-question">{interrupt.question}</p>
      <div className="interrupt-choices">
        {interrupt.choices.map((c, i) => (
          <button className="interrupt-choice" key={i} onClick={() => onChoose(i)}>
            <span className="interrupt-choice-dot" style={{ background: 'var(--pai-high-fg)' }} />
            <span className="interrupt-choice-body">
              <span className="interrupt-choice-label">{c.label}</span>
            </span>
            <span className="interrupt-choice-chev"><IcChevD /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepRow({ step, idx, onToggle, tier, entity }) {
  if (step._phaseName) return null;
  const status = step.status;
  const showFilterTree = step.expandable && ['graph', 'risk', 'deep'].includes(tier);
  const hasBody = step.thoughts.length > 0 || !!step.toolCallText || !!step.branching || showFilterTree;
  return (
    <div className={`sr-row ${status}${step.expanded ? ' sr-expanded' : ''}`}>
      <div className="sr-header" onClick={() => hasBody && onToggle(idx)}>
        <span className="sr-status">
          {status === 'active' && <span className="nr-step-spinner" />}
          {status === 'done' && <Ic size={13} path={<><polyline points="20 6 9 17 4 12" /></>} />}
        </span>
        <span className="sr-label">{step.label}</span>
        {hasBody && <span className="sr-chev"><IcChevD /></span>}
      </div>
      {hasBody && (
        <div className="sr-body">
          {step.thoughts.length > 0 && (
            <div className="sr-thoughts">
              {step.thoughts.map((th, i) => (
                <div className={`sr-thought${status === 'done' ? ' finished' : ''}`} key={i}>
                  {th.text}{status === 'active' && i === step.thoughts.length - 1 && <span className="sr-cursor" />}
                  {th.url && <span className="sr-thought-url">{th.url}</span>}
                </div>
              ))}
            </div>
          )}
          {step.toolCallText && (
            <div className={`sr-tool-call${step.toolCallDone ? ' done' : ''}`}>
              › {step.toolCallText}{!step.toolCallDone && <span className="sr-cursor" />}
            </div>
          )}
          {step.branching && (
            <div className="sr-branch-row">
              {step.branches.map((b, i) => (
                <span className={`sr-branch-opt${step.chosenBranch == null ? '' : (step.chosenBranch === i ? ' chosen' : ' unchosen')}`} key={i}>{b.label}</span>
              ))}
            </div>
          )}
          {showFilterTree && (status === 'active' || status === 'done') && (
            <FilterTree tier={tier} entity={entity || FILTER_TREE_ENTITY_DEFAULT[tier]} />
          )}
        </div>
      )}
    </div>
  );
}

// Groups a flat steps array (with `_phaseName` markers) into phase sections
function groupByPhase(steps) {
  const groups = [];
  let current = null;
  steps.forEach((s, i) => {
    if (s._phaseName) {
      current = { phase: s._phaseName, items: [] };
      groups.push(current);
    } else {
      if (!current) { current = { phase: null, items: [] }; groups.push(current); }
      current.items.push({ step: s, idx: i });
    }
  });
  return groups;
}

function PhaseGroup({ phase, items, collapsed, onToggleCollapse, onToggleStep, tier, entity }) {
  return (
    <div>
      <div className="phase-sep">
        <span className="phase-sep-lbl">{phase}</span>
        <span className="phase-sep-line" />
        <button className={`phase-sep-toggle${collapsed ? '' : ' open'}`} onClick={onToggleCollapse}><IcChevD /></button>
      </div>
      <div className={`phase-group${collapsed ? ' collapsed' : ''}`}>
        {items.map(({ step, idx }) => (
          <StepRow key={idx} step={step} idx={idx} onToggle={onToggleStep} tier={tier} entity={entity} />
        ))}
      </div>
    </div>
  );
}

export default function ReasoningEngine({ exchange, live, engine, phaseCollapsed, onTogglePhase }) {
  if (exchange.chitChat) return null;

  const entity = detectEntity(exchange.query, FILTER_TREE_ENTITY_DEFAULT[exchange.tier] || 'entity');
  const active = exchange.steps.find(s => s.status === 'active' && !s._phaseName);
  const title = exchange.done
    ? (TITLE_COMPLETION_LABELS[exchange.tier] || 'Analysis complete')
    : (active ? active.label : 'Preparing…');
  const totalCount = exchange.steps.filter(s => !s._phaseName).length;
  const isPhased = exchange.steps.some(s => s._phaseName);
  const groups = isPhased ? groupByPhase(exchange.steps) : null;
  const sectionCollapsed = !!exchange.reasoningCollapsed;

  return (
    <div>
      {exchange.awaitingApproval && exchange.toolApproval && (
        <ToolApprovalCard
          tool={exchange.tool}
          toolApproval={exchange.toolApproval}
          onApprove={engine.approve}
          onAdjust={engine.toggleTacEdit}
          onFallback={engine.useFallback}
        />
      )}

      {!exchange.awaitingApproval && (
        <div className="cv-reasoning">
          <div className="nr-bar" onClick={engine.toggleReasoningCollapsed} style={{ cursor: 'pointer' }}>
            <span className="nr-steps-label">{exchange.done ? title : `${totalCount} step${totalCount === 1 ? '' : 's'}`}</span>
            <span className="nr-elapsed">{formatElapsed(exchange.elapsedMs)}</span>
            <span className={`nr-collapse-btn${sectionCollapsed ? '' : ' open'}`}><IcChevD /></span>
          </div>

          {!sectionCollapsed && exchange.liveMetrics && !exchange.done && (
            <div className="live-metrics-row">
              <div className="live-metric"><span className="live-metric-val">{exchange.liveMetrics.nodes}</span><span className="live-metric-lbl">Nodes</span></div>
              <div className="live-metric"><span className="live-metric-val">{exchange.liveMetrics.edges}</span><span className="live-metric-lbl">Edges</span></div>
              <div className="live-metric"><span className="live-metric-val">{exchange.liveMetrics.paths}</span><span className="live-metric-lbl">Paths</span></div>
            </div>
          )}

          {!sectionCollapsed && (isPhased
            ? groups.map((g, i) => g.phase
              ? <PhaseGroup key={i} phase={g.phase} items={g.items}
                  collapsed={!!phaseCollapsed[g.phase]} onToggleCollapse={() => onTogglePhase(g.phase)} onToggleStep={engine.toggleStepExpand}
                  tier={exchange.tier} entity={entity} />
              : g.items.map(({ step, idx }) => <StepRow key={idx} step={step} idx={idx} onToggle={engine.toggleStepExpand} tier={exchange.tier} entity={entity} />))
            : exchange.steps.map((step, idx) => <StepRow key={idx} step={step} idx={idx} onToggle={engine.toggleStepExpand} tier={exchange.tier} entity={entity} />))}
        </div>
      )}

      {exchange.interrupt && !exchange.interrupt.resolved && (
        <InterruptCard interrupt={exchange.interrupt} onChoose={engine.resolveInterrupt} />
      )}
    </div>
  );
}
