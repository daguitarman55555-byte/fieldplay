<template>
  <div id="app">
    <div v-if='!webGLEnabled'>
      <div class='absolute no-webgl'>
        <h4>WebGL is not enabled :(</h4>
        <p>This website needs <a href='https://en.wikipedia.org/wiki/WebGL' class='highlighted'>WebGL</a> to perform numerical integration.
        </p> <p>
        You can try another browser. If problem persists - very likely your video card isn't supported then.
</p>
      </div>
    </div>
    <div v-if='webGLEnabled && !hideUI'>
      <vector-view v-if='vectorLinesEnabled'></vector-view>
      <ruler></ruler>
      <field-overlay :scene='scene'></field-overlay>
      <studio-status :scene='scene'></studio-status>
      <div class='controls-container' :style='getControlsContainerStyle()' ref='controls'>
        <controls></controls>
        <settings :scene='scene'></settings>
        <div ref='left' class='left resize'></div>
      </div>
      <share></share>
      <a href='#' @click.prevent='aboutVisible = !aboutVisible' class='about-link'>about...</a>
      <about @close='aboutVisible = false' v-if='aboutVisible'></about>
    </div>
  </div>
</template>

<script>
import Controls from './components/Controls.vue';
import Ruler from './components/Ruler.vue';
import Settings from './components/Settings.vue';
import Share from './components/Share.vue';
import About from './components/About.vue';
import bus from './lib/bus.js';
import isSmallScreen from './lib/isSmallScreen.js';
import VectorView from './components/VectorView.vue';
import StudioStatus from './components/StudioStatus.vue';
import FieldOverlay from './components/FieldOverlay.vue';
import config from './lib/config.js';
import createDrag from './lib/utils/drag.js';
import appState from './lib/appState.js';

const MIN_SETTINGS_WIDTH = 410;

export default {
  name: 'app',
  mounted() {
    this.scene = window.scene;
    bus.fire('scene-ready', window.scene);
    if (this.hideUI) return;
    this.updateControlsStyle = this.updateControlsStyle.bind(this);
    window.addEventListener('resize', this.updateControlsStyle, true);

    this.resizer = createDrag(this.$refs.left, dx => {
      this.width += dx;
      if (this.width < MIN_SETTINGS_WIDTH) this.width = MIN_SETTINGS_WIDTH;
    });
  },
  beforeUnmount() {
    if (this.resizer) this.resizer.dispose();
    window.removeEventListener('resize', this.updateControlsStyle, true);
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
  },
  data() {
    return {
      scene: null,
      width: MIN_SETTINGS_WIDTH,
      webGLEnabled: window.webGLEnabled,
      aboutVisible: false,
      hideUI: appState.getQS().get('ui') === 0 || appState.getQS().get('wallpaper') === 1,
      vectorLinesEnabled: config.vectorLinesEnabled
    };
  },
  components: {
    Controls,
    Ruler,
    Settings,
    Share,
    About,
    VectorView
    ,StudioStatus, FieldOverlay
  },
  methods: {
    getControlsContainerStyle() {
      if (isSmallScreen()) return { width: '100%' };

      return {width: this.width + 'px'};
    },
    updateControlsStyle() {
      if (!this.$refs.controls) return;
      this.$refs.controls.style.width = this.getControlsContainerStyle().width;
    }
  }
}
</script>

<style lang='stylus'>
@import './components/shared.styl';

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.controls-container {
  position: absolute;
  z-index: 10;
  max-height: 100%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);

  border: 1px solid primary-border;
  border-left: none;
  border-top: none;
  overflow: hidden;
  flex-direction: column;
  display: flex;
  left: 0;
  backdrop-filter: blur(18px);

  .settings {
    flex: 1;
  }
}
.resize {
  position: absolute;
}
.resize.left {
  right: -2px;
  height: 100%;
  width: 4px;
  cursor: ew-resize;
  background: transparent;
  top: 0;
}
.about-link {
  position: absolute;
  z-index: 9;
  left: 7px;
  bottom: 7px;
}

a {
  color: primary-text;
  text-decoration: none;
}
a.highlighted {
  color: white;
  border-bottom: 1px dashed white;
}
.no-webgl {
  width: 100%;
  color: hsla(215, 37%, 55%, 1);
  flex-direction: column; text-align: center;
  padding: 12px;
}
.no-webgl h4 {
  margin: 7px 0;
  font-size: 24px;
}
.ui-container {
  position: absolute;
}
@media (max-width: small-screen) {
  .controls-container {
    width: 100%;
  }
}
</style>
