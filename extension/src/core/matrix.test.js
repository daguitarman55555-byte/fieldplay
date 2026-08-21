import{describe,expect,it}from'vitest';
import{addMatrices,determinant,hessianMatrix,inverseMatrix,jacobianMatrix,matrixLatex,matrixRank,multiplyMatrices,parseMatrix,resizeMatrix,runMatrixCommand,solveLinearSystem,transposeMatrix}from'./matrix.js';

describe('matrix tools',()=>{
  it('parses and renders nested-list matrices',()=>{expect(parseMatrix('[[1,2],[3,4]]')).toEqual([['1','2'],['3','4']]);expect(matrixLatex([['a','b'],['c','d']])).toContain('\\left[a,b\\right]');});
  it('adds and removes rows and columns without dropping existing cells',()=>{expect(resizeMatrix('[[1,2],[3,4]]',1,1)).toContain('\\left[0,0,0\\right]');expect(parseMatrix(resizeMatrix('[[1,2],[3,4]]',-1,-1))).toEqual([['1']]);});
  it('does standard numeric matrix operations',()=>{const a=parseMatrix('[[1,2],[3,4]]');expect(determinant(a)).toBe(-2);expect(transposeMatrix(a)).toEqual([['1','3'],['2','4']]);expect(addMatrices(a,a)).toEqual([[2,4],[6,8]]);expect(multiplyMatrices(a,a)).toEqual([[7,10],[15,22]]);expect(inverseMatrix(a)[0][0]).toBe(-2);expect(matrixRank(a)).toBe(2);expect(solveLinearSystem(a,[5,11])).toEqual([[1],[2]]);});
  it('builds Jacobian and Hessian matrices from the symbolic engine',()=>{expect(jacobianMatrix(['x^2','x*y'],['x','y'])).toHaveLength(2);const h=hessianMatrix('x^2+y^2',['x','y']);expect(h[0][0]).toBe('2');expect(h[0][1]).toBe('0');});
  it('runs compact commands',()=>{expect(runMatrixCommand('det',['[[1,2],[3,4]]'])).toBe('-2');expect(runMatrixCommand('matmul',['[[1,0],[0,1]]','[[2],[3]]'])).toContain('2');});
});
