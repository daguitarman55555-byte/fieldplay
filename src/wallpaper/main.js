import { subscribeToLively } from '../gate0/livelyAdapter';
import { createQualityController } from '../platform/qualityController';
import { createCosmicRenderer } from './renderer';

const canvas = document.querySelector('#wallpaper');
const renderer = createCosmicRenderer(canvas);
const quality = createQualityController();
let paused = false;
let gpuLoad = null;
let audioEnergy = 0;
let desiredAudio = 0;
let audioReactive = true;
let motion = .6;
let bloom = .58;
let last = performance.now();
let phase = 0;
let raf = 0;

subscribeToLively(state => {
  paused = state.paused;
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
  if (!paused && !raf) { last=performance.now(); raf=requestAnimationFrame(frame); }
});

window.livelyAudioListener = values => {
  let data = values;
  if (typeof values === 'string') {
    try { data = JSON.parse(values); } catch { data = []; }
  }
  desiredAudio = audioReactive && Array.isArray(data) ? data.slice(0,48).reduce((sum,n)=>sum+Number(n||0),0)/48 : 0;
};

document.addEventListener('visibilitychange', () => { paused=document.hidden; if(!paused&&!raf){last=performance.now();raf=requestAnimationFrame(frame);} });
renderer.gl.canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); paused=true; });
renderer.gl.canvas.addEventListener('webglcontextrestored', () => location.reload());

function frame(now){
  raf=0;
  if(paused) return;
  const frameMs=Math.min(100,now-last); last=now; phase+=frameMs/1000;
  audioEnergy+=(desiredAudio-audioEnergy)*.08;
  const profile=quality.sample({frameMs,gpuLoad});
  renderer.render({time:phase,motion,bloom,audioEnergy,scale:profile.scale,steps:profile.steps});
  const delay=Math.max(0,1000/profile.targetFps-(performance.now()-now));
  if(delay>4) setTimeout(()=>{if(!paused&&!raf)raf=requestAnimationFrame(frame);},delay); else raf=requestAnimationFrame(frame);
}
function finite(value){const n=Number(value);return Number.isFinite(n)?n:null;}
raf=requestAnimationFrame(frame);
