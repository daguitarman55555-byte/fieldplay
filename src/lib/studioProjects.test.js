import{describe,expect,it}from'vitest';import{createHistory,deleteProject,listProjects,saveProject}from'./studioProjects';
describe('studio projects',()=>{
  it('supports bounded undo and redo',()=>{const h=createHistory();h.push({x:1});h.push({x:2});expect(h.undo()).toEqual({x:1});expect(h.redo()).toEqual({x:2});});
  it('saves, replaces and deletes named projects',()=>{const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};saveProject({name:'A',x:1},storage);saveProject({name:'A',x:2},storage);expect(listProjects(storage)).toHaveLength(1);expect(deleteProject('A',storage)).toEqual([]);});
});
