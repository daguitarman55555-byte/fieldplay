import { describe, expect, it } from 'vitest';
import RungeKuttaIntegrator from './RungeKuttaIntegrator.js';

describe('RungeKuttaIntegrator', () => {
  it.each(['euler','midpoint','rk4'])('generates the %s method', method => {
    const node=new RungeKuttaIntegrator();
    node.setMethod(method);
    expect(node.getMainBody()).toContain(`${method}(`);
    expect(node.getDefines()).toContain('u_speed');
  });

  it('falls back to RK4 for unknown methods', () => {
    const node=new RungeKuttaIntegrator();
    node.setMethod('not-a-method');
    expect(node.getMainBody()).toContain('rk4(');
  });
});
