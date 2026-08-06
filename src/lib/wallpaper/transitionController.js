export function createTransitionController(type) {
  if (type !== 'fade') return { cover: async () => {}, reveal: async () => {}, dispose: () => {} };

  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '2147483646', pointerEvents: 'none',
    background: '#13294F', opacity: '0', transition: 'opacity 650ms ease'
  });
  document.body.appendChild(overlay);

  return {
    async cover() {
      overlay.style.opacity = '1';
      await wait(680);
    },
    async reveal() {
      overlay.style.transitionDuration = '1050ms';
      overlay.style.opacity = '0';
      await wait(1080);
      overlay.style.transitionDuration = '650ms';
    },
    dispose() { overlay.remove(); }
  };
}

function wait(milliseconds) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}
