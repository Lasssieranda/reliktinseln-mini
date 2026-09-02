const HOLD_MS = 3000;

export function bindVersionHold(el: HTMLElement, onHold: () => void): { unbind: () => void } {
  let timer: number | null = null;

  const clear = (): void => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const start = (event: PointerEvent): void => {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    event.preventDefault();
    clear();
    timer = window.setTimeout(() => {
      timer = null;
      onHold();
    }, HOLD_MS);
  };

  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', clear);
  el.addEventListener('pointerleave', clear);
  el.addEventListener('pointercancel', clear);

  return {
    unbind() {
      clear();
      el.removeEventListener('pointerdown', start);
      el.removeEventListener('pointerup', clear);
      el.removeEventListener('pointerleave', clear);
      el.removeEventListener('pointercancel', clear);
    },
  };
}

export function openQaMenu(options: { onReset: () => void }): void {
  const existing = document.getElementById('qa-menu');
  existing?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'qa-menu';
  overlay.className = 'qa-overlay';

  const panel = document.createElement('div');
  panel.className = 'qa-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'QA-Menü');

  const title = document.createElement('h2');
  title.textContent = 'QA';

  const note = document.createElement('p');
  note.textContent = 'Kein Spieler-Feature.';

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'qa-btn';
  reset.textContent = 'Save-Reset';
  reset.addEventListener('click', () => {
    options.onReset();
    overlay.remove();
  });

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'qa-btn qa-btn-ghost';
  close.textContent = 'Schließen';
  close.addEventListener('click', () => overlay.remove());

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.remove();
    }
  });

  panel.append(title, note, reset, close);
  overlay.append(panel);
  document.body.append(overlay);
}
