import { forwardRef, useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties } from 'react';
import { DialogClose, DialogContent } from '@/components/ui/dialog';
import { PANEL_SIZES, type PanelSize } from '@/lib/mobile-controls';
import { useMobileControlsPreferences } from '@/hooks/useMobileControlsPreferences';
import './AdjustablePanel.css';
import { PANEL_HEIGHT_KEY, panelHeightFraction, readPanelHeight } from '@/lib/panel-height';

/** Presentation only: callers retain their existing Dialog, data and actions. */
export const AdjustablePanel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DialogContent> & { constrained?: boolean }>(
  ({ children, className = '', constrained = false, ...props }, ref) => {
    const [preferredSize, setSize] = useState<PanelSize>('half');
    const drag = useRef<{ id: number; y: number; height: number; available: number } | null>(null);
    const panel = useRef<HTMLDivElement | null>(null);
    const [panelElement, setPanelElement] = useState<HTMLDivElement | null>(null);
    const bindPanel = useCallback((node: HTMLDivElement | null) => {
      panel.current = node; setPanelElement(node);
      if (typeof ref === 'function') ref(node); else if (ref) ref.current = node;
    }, [ref]);
    const [customHeight, setCustomHeight] = useState<number | null>(null);
    const size: PanelSize = constrained || (customHeight !== null && customHeight >= .98) ? 'full' : customHeight !== null ? customHeight >= .68 ? 'expanded' : 'half' : preferredSize;
    const { preferences } = useMobileControlsPreferences();
    useEffect(() => {
      if (size !== 'full' || !panelElement) return;
      const background = Array.from(document.body.children).filter((element): element is HTMLElement => element instanceof HTMLElement && !element.contains(panelElement));
      const previous = background.map(element => [element, element.inert, element.getAttribute('data-clipt-panel-inert')] as const);
      background.forEach(element => { if (!element.inert) element.setAttribute('data-clipt-panel-inert', 'true'); element.inert = true; });
      return () => { previous.forEach(([element, inert, marker]) => {
        element.inert = inert;
        if (marker === null) element.removeAttribute('data-clipt-panel-inert'); else element.setAttribute('data-clipt-panel-inert', marker);
      }); };
    }, [size, panelElement]);
    const persistenceKey = () => props.id ? props.id + (window.innerWidth > window.innerHeight ? ':landscape' : ':portrait') : '';
    const saveHeight = (fraction: number | null) => {
      setCustomHeight(fraction);
      const key = persistenceKey();
      if (!key) return;
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(PANEL_HEIGHT_KEY) || '{}');
        const data = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored as Record<string, unknown> : {};
        if (fraction === null) delete data[key]; else data[key] = fraction;
        localStorage.setItem(PANEL_HEIGHT_KEY, JSON.stringify(data));
      } catch { /* The chosen height still works for this session. */ }
    };
    const chooseSize = (value: PanelSize) => { saveHeight(null); setSize(value); };
    useEffect(() => {
      if (!props.id || constrained) return;
      const restore = () => {
        try { const saved=readPanelHeight(localStorage.getItem(PANEL_HEIGHT_KEY), persistenceKey());const available=Math.max(44,(window.visualViewport?.height??window.innerHeight)-16);setCustomHeight(saved===null?null:panelHeightFraction(saved*available,available)); }
        catch { /* Storage can be unavailable in private browsing. */ }
      };
      restore(); window.addEventListener('resize', restore); window.addEventListener('orientationchange', restore);
      return () => { window.removeEventListener('resize', restore); window.removeEventListener('orientationchange', restore); };
    }, [props.id, constrained]);
    const step = (direction: number) => { if (customHeight !== null) saveHeight(Math.max(.25, Math.min(1, customHeight + direction * .1))); else setSize(current => PANEL_SIZES[Math.max(0, Math.min(2, PANEL_SIZES.indexOf(current) + direction))]); };
    const finishDrag = () => {
      drag.current = null;
      panel.current?.style.removeProperty('--clipt-drag-height');
      panel.current?.removeAttribute('data-dragging');
    };
    return <DialogContent {...props} ref={bindPanel}
      style={{...props.style, ...(customHeight !== null && !constrained ? {'--clipt-custom-height': customHeight} as CSSProperties : {})}}
      data-custom-height={customHeight !== null && !constrained ? 'true' : undefined}
      aria-modal={size === 'full' ? true : undefined} data-sliding-panel data-panel-size={size} data-constrained={constrained} data-hand={preferences.hand}
      onKeyDown={event => {
        props.onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== 'Tab' || size !== 'full') return;
        const targets = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]') ?? [])
          .filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
        const first = targets[0], last = targets.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
      className={`clipt-sliding-panel ${className}`}>
      <div className="clipt-panel-resizer">
        <DialogClose className="clipt-panel-close" aria-label="Close">×</DialogClose>
        <div role="slider" tabIndex={0} aria-label="Panel height" aria-orientation="vertical" aria-valuemin={1} aria-valuemax={100}
          aria-valuenow={Math.round((constrained ? 1 : customHeight ?? (size === 'half' ? .5 : size === 'expanded' ? .75 : 1)) * 100)} aria-valuetext={customHeight !== null && !constrained ? Math.round(customHeight * 100) + ' percent' : size === 'half' ? 'Half screen' : size === 'expanded' ? '75 percent' : 'Full screen'}
          className="clipt-panel-handle"
          onPointerDown={event => { if (constrained || event.button !== 0 || drag.current) return; drag.current = { id: event.pointerId, y: event.clientY, height: panel.current?.getBoundingClientRect().height ?? 0, available: Math.max(44, (window.visualViewport?.height ?? window.innerHeight) - 16) }; panel.current?.setAttribute('data-dragging', 'true'); event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerMove={event => {
            const active = drag.current, element = panel.current;
            if (!active || active.id !== event.pointerId || !element) return;
            const height = panelHeightFraction(active.height + active.y - event.clientY, active.available) * active.available;
            element.style.setProperty('--clipt-drag-height', `${height}px`);
          }}
          onPointerUp={event => { if (drag.current?.id !== event.pointerId) return; const active = drag.current; const dy = event.clientY - active.y;
            const fraction = panelHeightFraction(active.height - dy, active.available);
            saveHeight(fraction); setSize(fraction >= .98 ? 'full' : fraction >= .68 ? 'expanded' : 'half'); finishDrag(); }}
          onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}
          onKeyDown={event => { if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) { event.preventDefault(); if (event.key === 'Home') chooseSize('half'); else if (event.key === 'End') chooseSize('full'); else step(event.key === 'ArrowUp' ? 1 : -1); } }}>
          <span aria-hidden="true" />
        </div>
        <div role="group" aria-label="Panel size" className="clipt-panel-sizes">
          {PANEL_SIZES.map(value => <button key={value} type="button" aria-pressed={customHeight === null && size === value} onClick={() => chooseSize(value)}>{value === 'half' ? '50%' : value === 'expanded' ? '75%' : 'Full'}</button>)}
        </div>
      </div>
      {children}
    </DialogContent>;
  });
AdjustablePanel.displayName = 'AdjustablePanel';
