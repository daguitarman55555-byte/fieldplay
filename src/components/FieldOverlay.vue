<template><canvas ref='canvas' class='field-overlay' aria-hidden='true'></canvas></template>
<script>
import bus from '../lib/bus.js';
import { findCriticalPoints } from '../lib/math/fieldAnalysis.js';
import { arrowSegment, contourSegments, createViewportTransform } from '../lib/math/overlayGeometry.js';
export default {
  props:['scene'],
  data:()=>({field:null,compareField:null,options:{grid:true,axes:true,arrows:true,heatmap:false,contours:false,critical:true,arrowDensity:22,opacity:.72,palette:'cyan'},timer:0}),
  mounted(){
    this.ctx=this.$refs.canvas.getContext('2d'); this.redraw=this.redraw.bind(this); this.onField=m=>{this.field=m;this.schedule();};this.onCompare=m=>{this.compareField=m;this.schedule();}; this.onOptions=o=>{Object.assign(this.options,o);this.schedule();};
    bus.on('studio-field-model',this.onField);bus.on('studio-compare-model',this.onCompare);bus.on('studio-overlay-options',this.onOptions);bus.on('bbox-change',this.schedule,this);window.addEventListener('resize',this.schedule);this.schedule();
  },
  beforeUnmount(){bus.off('studio-field-model',this.onField);bus.off('studio-compare-model',this.onCompare);bus.off('studio-overlay-options',this.onOptions);bus.off('bbox-change',this.schedule,this);window.removeEventListener('resize',this.schedule);clearTimeout(this.timer);},
  methods:{
    schedule(){clearTimeout(this.timer);this.timer=setTimeout(this.redraw,60);},
    redraw(){
      const canvas=this.$refs.canvas,dpr=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;if(canvas.width!==w*dpr||canvas.height!==h*dpr){canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';}this.ctx.setTransform(dpr,0,0,dpr,0,0);this.ctx.clearRect(0,0,w,h);
      const b=this.scene.getBoundingBox();if(!b)return;const transform=createViewportTransform(b,this.scene.getCanvasRect());const map=transform.point;
      if(this.options.heatmap&&this.field)this.drawHeatmap(w,h,b);if(this.options.grid)this.drawGrid(w,h,b,map);if(this.options.axes)this.drawAxes(w,h,b,map);if(this.options.arrows&&this.field)this.drawArrows(w,h,b,map,this.field,palette(this.options.palette,this.options.opacity));if(this.options.arrows&&this.compareField)this.drawArrows(w,h,b,map,this.compareField,'rgba(255,111,183,.62)');if(this.options.contours&&this.field?.scalar)this.drawContours(w,h,b);if(this.options.critical&&this.field)this.drawCritical(b,map);
    },
    drawGrid(w,h,b,map){const ctx=this.ctx,step=niceStep((b.maxX-b.minX)/10);ctx.strokeStyle='rgba(116,166,207,.16)';ctx.lineWidth=1;ctx.beginPath();for(let x=Math.ceil(b.minX/step)*step;x<=b.maxX;x+=step){const [px]=map(x,0);ctx.moveTo(px,0);ctx.lineTo(px,h);}for(let y=Math.ceil(b.minY/step)*step;y<=b.maxY;y+=step){const [,py]=map(0,y);ctx.moveTo(0,py);ctx.lineTo(w,py);}ctx.stroke();},
    drawAxes(w,h,b,map){const ctx=this.ctx,[x0,y0]=map(0,0);ctx.strokeStyle='rgba(205,230,250,.52)';ctx.lineWidth=1.25;ctx.beginPath();if(x0>=0&&x0<=w){ctx.moveTo(x0,0);ctx.lineTo(x0,h);}if(y0>=0&&y0<=h){ctx.moveTo(0,y0);ctx.lineTo(w,y0);}ctx.stroke();},
    drawArrows(w,h,b,map,field,color){const ctx=this.ctx,n=Math.max(8,Math.min(42,this.options.arrowDensity)),rect=this.scene.getCanvasRect(),aspect=rect.width/rect.height,nx=Math.round(n*aspect),maxLen=Math.min(rect.width/nx,rect.height/n)*.7,samples=[];let vmax=0;for(let iy=0;iy<n;iy++)for(let ix=0;ix<nx;ix++){const x=b.minX+(ix+.5)/nx*(b.maxX-b.minX),y=b.minY+(iy+.5)/n*(b.maxY-b.minY),v=field.evaluate(x,y),m=Math.hypot(...v);if(Number.isFinite(m)){vmax=Math.max(vmax,m);samples.push({x,y,v,m});}}const transform=createViewportTransform(b,rect);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.15;ctx.lineCap='round';samples.forEach(s=>{if(s.m<1e-10)return;const len=maxLen*(.3+.7*Math.sqrt(s.m/(vmax||1))),arrow=arrowSegment(transform,s.x,s.y,s.v[0],s.v[1],len);if(!arrow)return;ctx.beginPath();ctx.moveTo(arrow.x1,arrow.y1);ctx.lineTo(arrow.x2,arrow.y2);ctx.stroke();const head=Math.min(6,len*.3);ctx.beginPath();ctx.moveTo(arrow.x2,arrow.y2);ctx.lineTo(arrow.x2-head*Math.cos(arrow.angle-.55),arrow.y2-head*Math.sin(arrow.angle-.55));ctx.lineTo(arrow.x2-head*Math.cos(arrow.angle+.55),arrow.y2-head*Math.sin(arrow.angle+.55));ctx.closePath();ctx.fill();});},
    drawHeatmap(w,h,b){const ctx=this.ctx,rect=this.scene.getCanvasRect(),cols=90,rows=Math.max(20,Math.round(cols*rect.height/rect.width)),cw=rect.width/cols,ch=rect.height/rows,values=[],max=0;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const x=b.minX+(i+.5)/cols*(b.maxX-b.minX),y=b.maxY-(j+.5)/rows*(b.maxY-b.minY),v=this.field.evaluate(x,y),m=Math.log1p(Math.hypot(...v));max=Math.max(max,m);values.push(m);}values.forEach((v,k)=>{ctx.fillStyle=heat(v/(max||1));ctx.fillRect(rect.left+(k%cols)*cw,rect.top+Math.floor(k/cols)*ch,cw+1,ch+1);});},
    drawContours(w,h,b){const ctx=this.ctx,n=70,vals=[],min=Infinity,max=-Infinity;for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const v=this.field.scalar(b.minX+i/n*(b.maxX-b.minX),b.maxY-j/n*(b.maxY-b.minY));vals.push(v);if(Number.isFinite(v)){min=Math.min(min,v);max=Math.max(max,v);}}if(!Number.isFinite(min)||max===min)return;const rect=this.scene.getCanvasRect();ctx.save();ctx.translate(rect.left,rect.top);ctx.strokeStyle='rgba(255,255,255,.34)';ctx.lineWidth=.8;for(let l=1;l<9;l++){const level=min+l/9*(max-min),segments=contourSegments(vals,n,n,level,rect.width,rect.height);ctx.beginPath();segments.forEach(([a,c])=>{ctx.moveTo(a[0],a[1]);ctx.lineTo(c[0],c[1]);});ctx.stroke();}ctx.restore();},
    drawCritical(b,map){const ctx=this.ctx;findCriticalPoints(this.field.evaluate,b,{grid:22}).forEach(p=>{const [x,y]=map(p.x,p.y);ctx.fillStyle=p.classification==='saddle'?'#ffb454':'#ff5d8f';ctx.strokeStyle='#07111f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#dfefff';ctx.font='11px system-ui';ctx.fillText(p.classification,x+8,y-7);});}
  }
}
function niceStep(raw){const p=10**Math.floor(Math.log10(raw)),n=raw/p;return(n<2?1:n<5?2:5)*p;}
function palette(name,a){return name==='violet'?`rgba(178,115,255,${a})`:name==='gold'?`rgba(255,190,84,${a})`:name==='white'?`rgba(230,243,255,${a})`:`rgba(78,196,255,${a})`;}
function heat(t){return `rgba(${Math.round(24+105*t)},${Math.round(25+35*t)},${Math.round(75+120*t)},${.08+.24*t})`;}
</script>
<style>.field-overlay{position:fixed;inset:0;z-index:2;pointer-events:none}</style>
