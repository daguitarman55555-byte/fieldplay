import BaseShaderNode from './BaseShaderNode';

export default class RungeKuttaIntegrator extends BaseShaderNode {
  constructor (method = 'rk4') {
    super();
    this.method = ['euler','midpoint','rk4'].includes(method) ? method : 'rk4';
  }

  setMethod(method) { this.method = ['euler','midpoint','rk4'].includes(method) ? method : 'rk4'; }

  getDefines() {
    return `
uniform float u_h;
uniform float u_speed;
`
  }

  getFunctions() {
    return `
vec2 rk4(const vec2 point) {
  vec2 k1 = get_velocity( point ) * u_speed;
  vec2 k2 = get_velocity( point + k1 * u_h * 0.5) * u_speed;
  vec2 k3 = get_velocity( point + k2 * u_h * 0.5) * u_speed;
  vec2 k4 = get_velocity( point + k3 * u_h) * u_speed;

  return k1 * u_h / 6. + k2 * u_h/3. + k3 * u_h/3. + k4 * u_h/6.;
}
vec2 midpoint(const vec2 point) {
  vec2 k1 = get_velocity(point) * u_speed;
  return get_velocity(point + k1 * u_h * 0.5) * u_speed * u_h;
}
vec2 euler(const vec2 point) {
  return get_velocity(point) * u_speed * u_h;
}`
  }

  getMainBody() {
    return `
  vec2 velocity = ${this.method}(pos);
`
  }
}
