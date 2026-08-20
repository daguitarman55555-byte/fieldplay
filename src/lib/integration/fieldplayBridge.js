import bus from '../bus.js';
import { compileGradientField, compileVectorField, parseParameters } from '../math/expression.js';
import { sampleField } from '../math/fieldSampler.js';

const MAX_POINTS = 10000;
const MESSAGE_METHODS = new Set(['getState', 'getViewport', 'setViewport', 'setExpressions', 'setGradientField', 'evaluate', 'sampleGrid', 'setPaused']);

export function createGradientFieldCode(expression, epsilon = 0.001) {
  return compileGradientField(expression, {}, epsilon).code;
}

export function installFieldPlayBridge(scene, target = window) {
  const listeners = new Set();
  let model = null, disposed = false, notificationQueued = false;
  const api = {
    version: 2,
    capabilities: Object.freeze({expressions:true, gradients:true, pointEvaluation:true, gridSampling:true, viewportSync:true, postMessage:true}),
    setVectorField: code => scene.vectorFieldEditorState.setCode(String(code)),
    async setExpressions({x, y, parameters={}, functions=''}={}) {
      const parsed=typeof parameters==='string'?parseParameters(parameters):numericParameters(parameters);
      return applyModel(compileVectorField(x,y,parsed,functions));
    },
    async setGradientField(expression, options={}) {
      const parameters=typeof options.parameters==='string'?parseParameters(options.parameters):numericParameters(options.parameters||{});
      return applyModel(compileGradientField(expression,parameters,options.epsilon));
    },
    setViewport(bounds) { scene.applyBoundingBox(validateBounds(bounds)); },
    getViewport: () => ({...scene.getBoundingBox()}),
    setPaused: value => scene.setPaused(Boolean(value)),
    evaluate(points,time=0) { requireModel();return normalizePoints(points).map(([x,y])=>model.evaluate(x,y,time)); },
    sampleGrid({bounds=scene.getBoundingBox(),cols=64,rows}={}) {
      requireModel();const width=clampInteger(cols,2,256),height=clampInteger(rows??Math.round(width*.65),2,256);
      const grid=sampleField(model,validateBounds(bounds),width,height);
      return {bounds:grid.bounds,cols:grid.cols,rows:grid.rows,fx:Array.from(grid.fx),fy:Array.from(grid.fy),magnitude:Array.from(grid.magnitude)};
    },
    getState:()=>({version:2,viewport:{...scene.getBoundingBox()},particles:scene.getParticlesCount(),paused:scene.getPaused?.()||false,field:describeModel(model),code:scene.vectorFieldEditorState.getCode()}),
    subscribe(listener){if(typeof listener!=='function')throw new TypeError('A listener function is required.');listeners.add(listener);return()=>listeners.delete(listener);},
    connectMessaging:options=>connectMessaging(api,target,options),
    dispose
  };
  const onField=next=>{model=next||null;notify();},onViewport=()=>notify();
  bus.on('studio-field-model',onField);bus.on('bbox-change',onViewport);
  target.FieldPlay=api;target.dispatchEvent?.(new CustomEvent('fieldplay:ready',{detail:api}));
  return api;

  async function applyModel(next){const result=await scene.vectorFieldEditorState.setCode(next.code);if(result?.error)throw new Error(result.error.error||result.error.message||'Shader compilation failed');model=next;bus.fire('studio-field-model',next);notify();return describeModel(next);}
  function notify(){if(notificationQueued||disposed)return;notificationQueued=true;queueMicrotask(()=>{notificationQueued=false;if(disposed)return;const state=api.getState();listeners.forEach(listener=>listener(state));target.dispatchEvent?.(new CustomEvent('fieldplay:state',{detail:state}));});}
  function requireModel(){if(!model)throw new Error('Apply an equation-based field before requesting numerical samples.');}
  function dispose(){if(disposed)return;disposed=true;bus.off('studio-field-model',onField);bus.off('bbox-change',onViewport);listeners.clear();if(target.FieldPlay===api)delete target.FieldPlay;}
}

export function connectMessaging(api,target=window,{allowedOrigins=[]}={}){
  if(!target.addEventListener)return()=>{};const origins=new Set(allowedOrigins.filter(Boolean));if(target.location?.origin)origins.add(target.location.origin);
  const onMessage=async event=>{const message=event.data;if(!message||message.type!=='fieldplay:command'||!origins.has(event.origin))return;const reply={type:'fieldplay:response',id:message.id};try{if(!MESSAGE_METHODS.has(message.method)||typeof api[message.method]!=='function')throw new Error(`Unsupported method: ${message.method}`);reply.result=await api[message.method](...(Array.isArray(message.args)?message.args:[]));}catch(error){reply.error=error?.message||String(error);}event.source?.postMessage(reply,event.origin);};
  target.addEventListener('message',onMessage);return()=>target.removeEventListener('message',onMessage);
}

function describeModel(value){if(!value)return null;if(value.expressions)return{type:'vector',expressions:{...value.expressions},parameters:{...value.parameters},functions:value.definitions||'',warnings:[...(value.warnings||[])]};if(value.expression)return{type:'gradient',expression:value.expression,parameters:{...value.parameters},epsilon:value.epsilon};return null;}
function numericParameters(value){if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('Parameters must be an object or parameter string.');const output={};for(const[key,raw]of Object.entries(value)){if(!/^[A-Za-z_]\w*$/.test(key))throw new Error(`Invalid parameter name: ${key}`);const number=Number(raw);if(!Number.isFinite(number))throw new Error(`Invalid parameter value: ${key}`);output[key]=number;}return output;}
function normalizePoints(points){if(!Array.isArray(points)||points.length>MAX_POINTS)throw new Error(`Provide an array of at most ${MAX_POINTS} points.`);return points.map((point,index)=>{const pair=Array.isArray(point)?point:[point?.x,point?.y],x=Number(pair[0]),y=Number(pair[1]);if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error(`Point ${index+1} is invalid.`);return[x,y];});}
function validateBounds(value){const bounds=Object.fromEntries(['minX','maxX','minY','maxY'].map(key=>[key,Number(value?.[key])]));if(!Object.values(bounds).every(Number.isFinite)||bounds.minX>=bounds.maxX||bounds.minY>=bounds.maxY)throw new Error('Viewport bounds must be finite and ordered.');return bounds;}
function clampInteger(value,min,max){const number=Math.round(Number(value));if(!Number.isFinite(number))throw new Error('Grid dimensions must be finite numbers.');return Math.min(max,Math.max(min,number));}
