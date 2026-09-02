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

export function openQaMenu(options: { onReset: () => void; onSkipRelic1: () => void }): void {
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

  const skip1 = document.createElement('button');
  skip1.type = 'button';
  skip1.className = 'qa-btn';
  skip1.textContent = 'Skip Relikt 1';
  skip1.addEventListener('click', () => {
    options.onSkipRelic1();
    overlay.remove();
  });

  const skip2 = document.createElement('button');
  skip2.type = 'button';
  skip2.className = 'qa-btn';
  skip2.textContent = 'M4';
  skip2.disabled = true;
  skip2.setAttribute('aria-disabled', 'true');
  skip2.title = 'Skip Relikt 2 — M4';

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

  panel.append(title, note, reset, skip1, skip2, close);
  overlay.append(panel);
  document.body.append(overlay);
}
