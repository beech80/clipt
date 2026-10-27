import { forwardRef, useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
import { DialogClose, DialogContent } from '@/components/ui/dialog';
import { PANEL_SIZES, panelSizeAfterDrag, type PanelSize } from '@/lib/mobile-controls';
import { useMobileControlsPreferences } from '@/hooks/useMobileControlsPreferences';
import './AdjustablePanel.css';

/** Presentation only: callers retain their existing Dialog, data and actions. */
export const AdjustablePanel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DialogContent> & { constrained?: boolean }>(
  ({ children, className = '', constrained = false, ...props }, ref) => {
    const [preferredSize, setSize] = useState<PanelSize>('half');
    const size = constrained ? 'full' : preferredSize;
    const drag = useRef<{ id: number; y: number; height: number } | null>(null);
    const panel = useRef<HTMLDivElement | null>(null);
    const [panelElement, setPanelElement] = useState<HTMLDivElement | null>(null);
    const bindPanel = useCallback((node: HTMLDivElement | null) => {
      panel.current = node; setPanelElement(node);
      if (typeof ref === 'function') ref(node); else if (ref) ref.current = node;
    }, [ref]);
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
    const step = (direction: number) => setSize(current => PANEL_SIZES[Math.max(0, Math.min(2, PANEL_SIZES.indexOf(current) + direction))]);
    const finishDrag = () => {
      drag.current = null;
      panel.current?.style.removeProperty('--clipt-drag-height');
      panel.current?.removeAttribute('data-dragging');
    };
    return <DialogContent {...props} ref={bindPanel}
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
        <div role="slider" tabIndex={0} aria-label="Panel height" aria-orientation="vertical" aria-valuemin={1} aria-valuemax={3}
          aria-valuenow={PANEL_SIZES.indexOf(size) + 1} aria-valuetext={size === 'half' ? 'Half screen' : size === 'expanded' ? '75 percent' : 'Full screen'}
          className="clipt-panel-handle"
          onPointerDown={event => { if (constrained || event.button !== 0 || drag.current) return; drag.current = { id: event.pointerId, y: event.clientY, height: panel.current?.getBoundingClientRect().height ?? 0 }; panel.current?.setAttribute('data-dragging', 'true'); event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerMove={event => {
            const active = drag.current, element = panel.current;
            if (!active || active.id !== event.pointerId || !element) return;
            const viewport = window.visualViewport?.height ?? window.innerHeight;
            const height = Math.max(Math.min(120, viewport / 2), Math.min(viewport - 16, active.height + active.y - event.clientY));
            element.style.setProperty('--clipt-drag-height', `${height}px`);
          }}
          onPointerUp={event => { if (drag.current?.id !== event.pointerId) return; const dy = event.clientY - drag.current.y; setSize(current => panelSizeAfterDrag(current, dy)); finishDrag(); }}
          onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}
          onKeyDown={event => { if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) { event.preventDefault(); if (event.key === 'Home') setSize('half'); else if (event.key === 'End') setSize('full'); else step(event.key === 'ArrowUp' ? 1 : -1); } }}>
          <span aria-hidden="true" />
        </div>
        <div role="group" aria-label="Panel size" className="clipt-panel-sizes">
          {PANEL_SIZES.map(value => <button key={value} type="button" aria-pressed={size === value} onClick={() => setSize(value)}>{value === 'half' ? '50%' : value === 'expanded' ? '75%' : 'Full'}</button>)}
        </div>
      </div>
      {children}
    </DialogContent>;
  });
AdjustablePanel.displayName = 'AdjustablePanel';
