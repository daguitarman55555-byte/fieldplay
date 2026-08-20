const KEY='fieldplay:studio-projects:v1';
export function createHistory(limit=50){let entries=[],index=-1;return{push(value){const json=JSON.stringify(value);if(index>=0&&JSON.stringify(entries[index])===json)return;entries=entries.slice(0,index+1);entries.push(JSON.parse(json));if(entries.length>limit)entries.shift();index=entries.length-1;},undo(){if(index<=0)return null;return clone(entries[--index]);},redo(){if(index>=entries.length-1)return null;return clone(entries[++index]);},canUndo:()=>index>0,canRedo:()=>index<entries.length-1};}
export function listProjects(storage=localStorage){try{return JSON.parse(storage.getItem(KEY)||'[]');}catch{return[];}}
export function saveProject(project,storage=localStorage){const projects=listProjects(storage).filter(x=>x.name!==project.name);projects.unshift({...clone(project),savedAt:new Date().toISOString()});storage.setItem(KEY,JSON.stringify(projects.slice(0,30)));return projects;}
export function deleteProject(name,storage=localStorage){const projects=listProjects(storage).filter(x=>x.name!==name);storage.setItem(KEY,JSON.stringify(projects));return projects;}
function clone(value){return JSON.parse(JSON.stringify(value));}
