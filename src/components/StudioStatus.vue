<template>
  <footer class='studio-status' v-if='scene'>
    <span><b>{{fps}}</b> FPS</span>
    <span>{{particles.toLocaleString()}} particles</span>
    <span>x [{{bounds.minX}}, {{bounds.maxX}}]</span>
    <span>y [{{bounds.minY}}, {{bounds.maxY}}]</span>
  </footer>
</template>
<script>
export default {
  props: ['scene'],
  data: () => ({ fps: 0, particles: 0, bounds: {minX:0,maxX:0,minY:0,maxY:0}, frames: 0, started: performance.now() }),
  mounted() { this.unsubscribe=this.scene.onFrame(()=>this.sample()); this.sample(); },
  beforeUnmount() { if(this.unsubscribe)this.unsubscribe(); },
  methods: {
    sample() {
      this.frames += 1; const now=performance.now(); const elapsed=now-this.started;
      if(elapsed<500)return; this.fps=Math.round(this.frames*1000/elapsed); this.frames=0; this.started=now;
      this.particles=this.scene.getParticlesCount(); const b=this.scene.getBoundingBox();
      this.bounds=Object.fromEntries(Object.entries(b).map(([k,v])=>[k,Number(v).toFixed(2)]));
    }
  }
}
</script>
<style lang='stylus'>
.studio-status { position: fixed; left: 12px; bottom: 10px; z-index: 5; display: flex; gap: 18px; padding: 7px 10px; color: #7893ad; background: rgba(2,7,17,.76); border: 1px solid #1d334c; font: 11px/1.2 ui-monospace, monospace; pointer-events: none; }
.studio-status b { color: #6bd889; }
</style>
