import{describe,expect,it}from'vitest';
import{parseDesmosVectorField}from'./desmosLatex.js';

describe('Desmos vector-field LaTeX',()=>{
  it('reads the tuple Desmos produces for f(x,y)=<x,-y>',()=>{
    expect(parseDesmosVectorField('f\\left(x,y\\right)=\\left(x,-y\\right)')).toMatchObject({name:'f',x:'x',y:'-y'});
  });
  it('reads angle-bracket vector notation',()=>{
    expect(parseDesmosVectorField('F\\left(x,y\\right)=\\left\\langle x,-y\\right\\rangle')).toMatchObject({name:'F',x:'x',y:'-y'});
  });
});
