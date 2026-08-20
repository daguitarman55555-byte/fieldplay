import { subscribeToLively, subscribeToLivelyAudio } from '../gate0/livelyAdapter';
import { createQualityController } from '../platform/qualityController';
import { createCosmicRenderer } from './renderer';
import { AUTO_INTERVALS, PALETTES, SCENES, createSceneController } from './sceneController';

const canvas = document.querySelector('#wallpaper');
const renderer = createCosmicRenderer(canvas);
const quality = createQualityController();
const scenes = createSceneController();
let hostPaused = false;
let hidden = document.hidden;
let gpuLoad = null;
let audioEnergy = 0;
let desiredAudio = 0;
let audioReactive = true;
let motion = .6;
let bloom = .58;
let palette = 0;
let last = performance.now();
let phase = 0;
let raf = 0;

subscribeToLively(state => {
  hostPaused = state.paused;
  gpuLoad = finite(state.system?.CurrentGpu3D);
  const props = state.properties;
  if (props.quality !== undefined) quality.configure({ profile: ['eco','wallpaper','showcase'][Number(props.quality)] });
  if (props.targetFps !== undefined) quality.configure({ targetFps: [20,30,60][Number(props.targetFps)] });
  if (props.motion !== undefined) motion = Number(props.motion) / 100;
  if (props.bloom !== undefined) bloom = Number(props.bloom) / 100;
  if (props.audioReactive !== undefined) {
    audioReactive = props.audioReactive === true || props.audioReactive === 'true';
    if (!audioReactive) desiredAudio = 0;
  }
  if (props.scene !== undefined) scenes.configure({ scene: Number(props.scene) === 0 ? 'auto' : SCENES[Number(props.scene) - 1] });
  if (props.palette !== undefined) palette = Math.max(0, PALETTES.indexOf(PALETTES[Number(props.palette)]));
  if (props.autoChange !== undefined) scenes.configure({ interval: AUTO_INTERVALS[Number(props.autoChange)] });
  if (props.seed !== undefined) scenes.configure({ seed: props.seed });
  if (!isPaused() && !raf) { last=performance.now(); raf=requestAnimationFrame(frame); }
});

subscribeToLivelyAudio(values => {
  let data = values;
  if (typeof values === 'string') {
    try { data = JSON.parse(values); } catch { data = []; }
  }
  desiredAudio = audioReactive && Array.isArray(data) ? data.slice(0,48).reduce((sum,n)=>sum+Number(n||0),0)/48 : 0;
});

document.addEventListener('visibilitychange', () => { hidden=document.hidden; if(!isPaused()&&!raf){last=performance.now();raf=requestAnimationFrame(frame);} });
renderer.gl.canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); hostPaused=true; });
renderer.gl.canvas.addEventListener('webglcontextrestored', () => location.reload());

function frame(now){
  raf=0;
  if(isPaused()) return;
  const frameMs=Math.min(100,now-last); last=now; phase+=frameMs/1000;
  audioEnergy+=(desiredAudio-audioEnergy)*.08;
  const profile=quality.sample({frameMs,gpuLoad});
  const activeScene=scenes.update(frameMs);
  renderer.render({time:phase,motion,bloom,audioEnergy,scale:profile.scale,steps:profile.steps,scene:activeScene.index,palette,seed:activeScene.seed});
  const delay=Math.max(0,1000/profile.targetFps-(performance.now()-now));
  if(delay>4) setTimeout(()=>{if(!isPaused()&&!raf)raf=requestAnimationFrame(frame);},delay); else raf=requestAnimationFrame(frame);
}
function finite(value){const n=Number(value);return Number.isFinite(n)?n:null;}
function isPaused(){return hostPaused||hidden;}
raf=requestAnimationFrame(frame);
