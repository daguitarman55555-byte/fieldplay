export const STUDIO_PRESETS = [
  { name: 'Saddle', code: field('p.x', '-p.y'), bounds: 8 },
  { name: 'Vortex', code: field('-p.y', 'p.x'), bounds: 8 },
  { name: 'Spiral sink', code: field('-0.22*p.x - p.y', 'p.x - 0.22*p.y'), bounds: 10 },
  { name: 'Double gyre', code: field('sin(p.y) + 0.35*sin(2.0*p.x)', 'sin(p.x) - 0.35*sin(2.0*p.y)'), bounds: 12 },
  { name: 'Dipole', code: field('(p.x*p.x-p.y*p.y)/pow(dot(p,p)+0.2,2.0)', '(2.0*p.x*p.y)/pow(dot(p,p)+0.2,2.0)'), bounds: 7 },
  { name: 'Lotka–Volterra', code: field('p.x*(1.0-p.y)', 'p.y*(p.x-1.0)'), bounds: 6, center: [1,1] }
];

function field(x, y) {
  return `vec2 get_velocity(vec2 p) {
  return vec2(${x}, ${y});
}`;
}
