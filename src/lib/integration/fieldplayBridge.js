export function createGradientFieldCode(expression, epsilon = 0.001) {
  const source = sanitizeExpression(expression);
  const e = clampEpsilon(epsilon);
  return `float scalar_field(vec2 p) {
  float x = p.x;
  float y = p.y;
  return ${source};
}

vec2 get_velocity(vec2 p) {
  float e = ${e.toFixed(6)};
  float dx = scalar_field(p + vec2(e, 0.0)) - scalar_field(p - vec2(e, 0.0));
  float dy = scalar_field(p + vec2(0.0, e)) - scalar_field(p - vec2(0.0, e));
  return vec2(dx, dy) / (2.0 * e);
}`;
}

export function installFieldPlayBridge(scene, target = window) {
  const listeners = new Set();
  const api = {
    version: 1,
    setVectorField: code => scene.vectorFieldEditorState.setCode(String(code)),
    setGradientField: (expression, options) => scene.vectorFieldEditorState.setCode(createGradientFieldCode(expression, options?.epsilon)),
    setViewport: bounds => scene.applyBoundingBox(bounds),
    getViewport: () => ({ ...scene.getBoundingBox() }),
    getState: () => ({ viewport: { ...scene.getBoundingBox() }, particles: scene.getParticlesCount(), code: scene.vectorFieldEditorState.getCode() }),
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); }
  };
  const unsubscribe = scene.onFrame(() => listeners.forEach(listener => listener(api.getState())));
  api.dispose = () => { unsubscribe(); listeners.clear(); delete target.FieldPlay; };
  target.FieldPlay = api;
  target.dispatchEvent?.(new CustomEvent('fieldplay:ready', { detail: api }));
  return api;
}

function sanitizeExpression(value) {
  const source=String(value||'').trim();
  if(!source || source.length>500 || /[{};#]/.test(source)) throw new Error('Use a single GLSL scalar expression.');
  return source;
}
function clampEpsilon(value) { const number=Number(value); return Number.isFinite(number)?Math.min(.1,Math.max(.000001,number)):.001; }
