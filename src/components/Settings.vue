<template>
  <div class='settings' :class='{collapsed: settingsPanel.collapsed}'>
    <nav class='studio-tabs'>
      <button v-for='tab in tabs' :key='tab' :class='{active: activeTab === tab}' @click='activeTab = tab'>{{tab}}</button>
    </nav>
    <div class='block vector-field' v-if='vectorField && activeTab === "Field"'>
      <div class='title'>Vector field <a class='reset-all' :class='{"syntax-visible": syntaxHelpVisible}' href='#' @click.prevent='syntaxHelpVisible = !syntaxHelpVisible'>Syntax</a></div>
      <syntax v-if='syntaxHelpVisible' @close='syntaxHelpVisible = false'></syntax>
      <code-editor :model='vectorField'></code-editor>
      <div class='preset-grid'>
        <button v-for='preset in presets' :key='preset.name' @click='applyPreset(preset)'>{{preset.name}}</button>
      </div>
      <div class='gradient-builder'>
        <div class='title small'>Gradient field</div>
        <p>Enter a scalar GLSL expression to visualize ∇f.</p>
        <input type='text' v-model='scalarExpression' placeholder='sin(x) * cos(y)'>
        <button type='button' @click='applyGradient'>Apply ∇f</button>
      </div>
    </div>
    <div class='block' v-if='showBindings'>
      <Inputs :vm='inputsModel'></Inputs>
    </div>
    <form class='block' v-show='activeTab === "Simulation" || activeTab === "Appearance"' @submit.prevent='onSubmit'>
      <div class='title'>Settings<a class='reset-all' href='?' title='set default settings'>reset all</a> </div>
      <div class='row' v-show='activeTab === "Appearance"'>
        <div class='col'>Particle color</div>
        <div class='col'> 
          <select v-model='selectedColorMode' @change='changeColor'>
              <option value='1'>Uniform</option>
              <option value='2'>Velocity</option>
              <option value='3'>Angle</option>
	        </select>
        </div>
        <help-icon @show='selectedColorHelp = !selectedColorHelp' :class='{open: selectedColorHelp}'></help-icon>
      </div>
      <div class='row help' v-if='selectedColorHelp && activeTab === "Appearance"'>
        <div>
          <p>Defines background color for a vector field zone. Each particle entering into this zone wll be colored accordingly</p>
          <ul>
            <li><i>Uniform color</i> gives all particles the same color</li>
            <li><i>Velocity color</i>  makes particles "hotter" if they move faster, and "colder" if they move slower. Notable exception is when you have singularities in field. Then all colors are the same.</li>
            <li><i>Angle color</i> highlights zones based on velocity vector angle.</li>
          </ul>
          <p>Default value is "Uniform"</p>
        </div>
      </div>
      <div class='row' v-if='soundAvailable && activeTab === "Appearance"'>
        <div class='col'>SoundCloud track</div>
        <div class='col'>
          <input type='text' v-model='soundCloudLink'>
          <a href='#' @click.prevent='loadSound'>load</a>
        </div>
      </div>
      <div class='row' v-if='soundAvailable && activeTab === "Appearance"'>
        <audio ref='player' controls='' autoplay='' preload autobuffer></audio>
      </div>
      <div class='row' v-show='activeTab === "Simulation"'>
        <div class='col'>Particles count </div>
        <div class='col'><input type='number' :step='particleCountDelta' v-model='particlesCount' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
        <help-icon @show='particleCountHelpVisible = !particleCountHelpVisible' :class='{open: particleCountHelpVisible}'></help-icon>
      </div>
      <div class='row help' v-if='particleCountHelpVisible && activeTab === "Simulation"'>
        <div>
          <p>How many particles should be visible inside bounding box? Higher values produce denser plots, smaller values are faster to compute.</p>
          <p>Recommended value is between <b>10,000</b> and <b>100,000</b></p>
        </div>
      </div>
      <div class='row' v-show='activeTab === "Simulation"'>
        <div class='col'>Fade out speed</div>
        <div class='col'><input type='number' :step='fadeoutDelta'  v-model='fadeOutSpeed' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
        <help-icon @show='fadeoutDeltaHelp = !fadeoutDeltaHelp' :class='{open: fadeoutDeltaHelp}'></help-icon>
      </div>
      <div class='row help' v-if='fadeoutDeltaHelp && activeTab === "Simulation"'>
        <div>
          <p>Before a particle is moved to the next position, we multiply its transparency by this number. This gives a fading out trace behind the particle</p>
          <ul>
            <li>Setting this value to <b>1</b> will keep particle trace forever.</li>
            <li> Setting this value to <b>0</b> will leave no trace at all</li>
          </ul>
          <p>Recommended value is <b>0.998</b></p>
        </div>
      </div>
      <div class='row' v-show='activeTab === "Simulation"'>
        <div class='col'>Particle reset probability</div>
        <div class='col'><input type='number' :step='resetProbabilityDelta'  v-model='dropProbability' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
        <help-icon @show='resetProbabilityHelp = !resetProbabilityHelp' :class='{open: resetProbabilityHelp}'></help-icon>
      </div>
      <div class='row help' v-if='resetProbabilityHelp && activeTab === "Simulation"'>
        <div>
          <p>This is a probability that a particle will reset its position to a random location inside bounding box. This prevents particles from flying out of the screen.</p>
          <ul>
            <li>Setting this value to <b>1</b> will reset all particles on every frame. This can be a good option to "reset" an empty screen.</li>
            <li>Setting this value to <b>0</b> will prevent particles from jumping to a random spot. This can be a good option to trace particles trajectory.</li>
          </ul>
          <p>Default value is <b>0.009</b></p>
        </div>
      </div>
      <div class='row' v-show='activeTab === "Simulation"'>
        <div class='col'>Integration timestep</div>
        <div class='col'><input type='number' :step='integrationStepDelta' v-model='timeStep' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ></div>
        <help-icon @show='integrationStepHelp = !integrationStepHelp' :class='{open: integrationStepHelp}'></help-icon>
      </div>
      <div class='row help' v-if='integrationStepHelp && activeTab === "Simulation"'>
        <div>
          <p>This parameter defines how fast time flies for each particle (or, to be more accurate, this is the integration step of the classical Runge-Kutta method)</p>
          <ul>
            <li>Increasing this value makes particles fly faster at risk of missing proper curve's turns.</li>
            <li>Making this value smaller increases the accuracy of particle's trajectory, and makes them move slower.</li>
          </ul>
          <p>Default value is <b>0.01</b></p>
        </div>
      </div>
      <div class='bounding-box' v-show='activeTab === "Simulation"'>
        <div class='col title'>bounds</div>
        <div class='row'>
          <div class='col  center'><input type='number' v-model.lazy='minY' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
        </div>
        <div class='row'>
          <div class='col min-x'><input type='number' v-model.lazy='minX' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
          <a class='col reset' href='#' @click.prevent='goToOrigin' title='navigate to point (0,0)'>go to origin</a>
          <div class='col max-x'><input type='number' v-model.lazy='maxX' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
        </div>
        <div class='row center'>
          <div class='col center'><input type='number' v-model.lazy='maxY' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
        </div>
      </div>
    </form>
    <section class='export-panel' v-show='activeTab === "Export"'>
      <div class='title'>Share and embed</div>
      <p>The current field and viewport already live in the URL. Copy it to share an exact scene.</p>
      <button @click='copyShareLink'>{{copyLabel}}</button>
      <button @click='downloadState'>Download state JSON</button>
      <div class='bridge-note'><b>Embedding API ready</b><br><code>window.FieldPlay</code> exposes field, gradient, viewport, and subscription controls for a future Desmos overlay.</div>
    </section>
  </div>
</template>
<script>
// TODO: This file becomes too big. Need to split.
import bus from '../lib/bus.js';
import isSmallScreen from '../lib/isSmallScreen.js';
import appState from '../lib/appState.js';
import SoundLoader from '../lib/sound/soundLoader.js';
import SoundCloudAudioSource from '../lib/sound/audioSource.js';
import config from '../lib/config.js';
import Syntax from './help/Syntax.vue';
import HelpIcon from './help/Icon.vue';
import CodeEditor from './CodeEditor.vue';
import Inputs from './Inputs.vue';
import { createGradientFieldCode } from '../lib/integration/fieldplayBridge.js';
import { STUDIO_PRESETS } from '../lib/studioPresets.js';

// Temporary disable this until API is finished.
const soundAvailable = config.isAudioEnabled;

export default {
  name: 'Settings',
  props: ['scene'],
  components: {
    Syntax,
    HelpIcon,
    CodeEditor,
    Inputs
  },
  mounted() {
    bus.on('scene-ready', this.onSceneReady, this);
    bus.on('bbox-change', this.updateBBox, this);

    // The renderer starts before Vue is lazy-loaded. Initialize immediately
    // when the scene already exists instead of relying on an event that may
    // have fired before this component mounted.
    if (this.scene) this.onSceneReady(this.scene);

    if (soundAvailable) this.soundLoader = new SoundLoader(this.$refs.player);
  },
  beforeUnmount() {
    bus.off('scene-ready', this.onSceneReady, this);
    bus.off('bbox-change', this.updateBBox, this);
  },
  data() {
    return {
      tabs: ['Field', 'Appearance', 'Simulation', 'Export'],
      activeTab: 'Field',
      presets: STUDIO_PRESETS,
      copyLabel: 'Copy share link',
      scalarExpression: 'sin(x) * cos(y)',
      soundCloudLink: 'https://soundcloud.com/mrfijiwiji/yours-truly',
      vectorField: null,
      settingsPanel: appState.settingsPanel,
      inputsModel: scene.inputsModel,
      showBindings: config.showBindings,
      particlesCount: 0,
      fadeOutSpeed: 0,
      dropProbability: 0,
      timeStep: 0,
      selectedColorMode: 0,
      soundAvailable: soundAvailable,
      // TODO: Need something better for help management?
      selectedColorHelp: false,
      syntaxHelpVisible: false,
      particleCountHelpVisible: false,
      fadeoutDeltaHelp: false,
      resetProbabilityHelp: false,
      integrationStepHelp: false,
      minX: 0, minY: 0,
      maxX: 0, maxY: 0
    };
  },
  watch: {
    'settingsPanel.collapsed': function(newValue) {
      bus.fire('settings-collapsed', newValue);
    },
    particlesCount(newValue, oldValue) {
      this.scene.setParticlesCount(parseInt(newValue, 10));
    },
    timeStep(newValue, oldValue) {
      this.scene.setIntegrationTimeStep(newValue);
    },
    fadeOutSpeed(newValue, oldValue) {
      this.scene.setFadeOutSpeed(newValue);
    },
    dropProbability(newValue, oldValue) {
      this.scene.setDropProbability(newValue);
    },
    selectedColorMode(newValue) {
      this.scene.setColorMode(newValue);
    },
    minX(newValue) { this.moveBoundingBox('minX', newValue) },
    maxX(newValue) { this.moveBoundingBox('maxX', newValue) },
    minY(newValue) { this.moveBoundingBox('minY', newValue) },
    maxY(newValue) { this.moveBoundingBox('maxY', newValue) },
  },
  computed: {
    particleCountDelta() {
      return exponentialStep(this.particlesCount);
    },
    integrationStepDelta() {
      var timeStep = this.timeStep;
      return exponentialStep(timeStep);
    },
    resetProbabilityDelta() {
      return exponentialStep(this.dropProbability);
    },
    fadeoutDelta() {
      var fadeOutSpeed = Number.parseFloat(this.fadeOutSpeed);

      var exp = Math.round(Math.log10(1 % fadeOutSpeed)) ;
      var dt = Math.pow(10, exp);
      if (dt + fadeOutSpeed >= 1) {
        dt /= 10;
      }
      return dt;
    }
  },
  methods: {
    async applyPreset(preset) {
      await this.vectorField.setCode(preset.code);
      const cx=preset.center?.[0]||0, cy=preset.center?.[1]||0, half=preset.bounds/2;
      this.scene.applyBoundingBox({minX:cx-half,maxX:cx+half,minY:cy-half,maxY:cy+half});
    },
    async copyShareLink() {
      await navigator.clipboard.writeText(location.href);
      this.copyLabel='Copied'; setTimeout(()=>this.copyLabel='Copy share link',1200);
    },
    downloadState() {
      const blob=new Blob([JSON.stringify(window.FieldPlay.getState(),null,2)],{type:'application/json'});
      const link=document.createElement('a'); link.href=URL.createObjectURL(blob); link.download='fieldplay-state.json'; link.click();
      setTimeout(()=>URL.revokeObjectURL(link.href),0);
    },
    applyGradient() {
      this.vectorField.setCode(createGradientFieldCode(this.scalarExpression));
    },
    moveBoundingBox(key, value) {
      if (this.ignoreBbox) {
        return;
      } 
      this.scene.moveBoundingBox({[key]: value});
    },
    loadSound() {
      if (!this.soundLoader) return;
      this.soundLoader.loadStream(this.soundCloudLink).then(e => {
        if (!this.audioSource) {
          this.audioSource = new SoundCloudAudioSource(this.$refs.player); 
        }
        this.audioSource.playStream(this.soundLoader.streamUrl())
      });
      // TODO: Error handling
    },
    goToOrigin() {
      this.scene.resetBoundingBox();
    },  
    onSubmit() {
      if (isSmallScreen()) {
        appState.settingsPanel.collapsed = true;
      }
    },
    changeColor(e) {
      this.selectedColorMode = e.target.value;
    },

    updateBackground(rgba) {
      this.scene.setBackgroundColor(rgba);
    },

    onSceneReady(scene) {
      this.vectorField = scene.vectorFieldEditorState;
      this.particlesCount = scene.getParticlesCount();
      this.fadeOutSpeed = scene.getFadeOutSpeed();
      this.dropProbability = scene.getDropProbability();
      this.timeStep = scene.getIntegrationTimeStep();
      this.selectedColorMode = scene.getColorMode();
      this.updateBBox();
    },

    updateBBox() {
      this.ignoreBbox = true;
      var bbox = this.scene.getBoundingBox();
      this.minX = bbox.minX;
      this.maxX = bbox.maxX;

      // Y is weird in my implementation. I know..
      this.minY = bbox.minY;
      this.maxY = bbox.maxY;
      if (this.prevBboxReset) clearTimeout(this.prevBboxReset);

      this.prevBboxReset = setTimeout(() => {
        this.ignoreBbox = false
        this.prevBboxReset = 0
      }, 50);
    },
  }
}

function exponentialStep(value) {
  var dt = Math.pow(10, Math.floor(Math.log10(value)));
  if (value - dt === 0) {
    // This is odd case when you are increasing number, but otherwise it's a good adjustment.
    return dt/10;
  }
  return dt;
}

function toColorString({r, g, b, a}) {
  if (a === 1.0) {
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hex(x) {
  let value = x.toString(16).toUpperCase();
  if (value.length === 1) value = '0' + value;
  return value;
}
</script>

<style lang='stylus'>
@import "./shared.styl";
@import "./glsl-theme.styl";

help-background = rgb(7, 12, 23);

.settings {
  color: secondary-text;
  left: 0;
  overflow-y: auto;
  border-top: 1px solid secondary-text;
  background: rgba(3, 10, 23, .96);
  width: 100%;
  padding: 7px 7px 7px 7px;
}
.studio-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid #21334b;
  margin: -7px -7px 16px;
  button { padding: 12px 4px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #7893ad; cursor: pointer; }
  button.active { color: #62c3ff; border-bottom-color: #42aaf5; }
}
.preset-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-top:12px; }
.preset-grid button, .export-panel button { padding:8px 5px; border:1px solid #294563; background:#071526; color:#9ec8ed; cursor:pointer; }
.preset-grid button:hover, .export-panel button:hover { border-color:#42aaf5; color:white; }
.export-panel { color:#9ab6d2; }
.export-panel p { font-size:13px; line-height:1.5; }
.export-panel>button { width:100%; margin:0 0 8px; }
.bridge-note { margin-top:14px; padding:12px; border-left:2px solid #42aaf5; background:#061121; font-size:12px; line-height:1.6; }
.gradient-builder {
  border-top: 1px solid #21334b;
  margin-top: 14px;
  padding-top: 14px;
  p { font-size: 12px; line-height: 1.4; color: #7893ad; }
  input { margin: 0 !important; border: 1px solid #2c4562 !important; background: #061121 !important; }
  button { width: 100%; margin-top: 8px; padding: 9px; border: 1px solid #297ec1; color: white; background: #12558d; cursor: pointer; }
}
.title.small { font-size: 14px; }
.settings.collapsed {
  display: none;
}

.title {
  margin-bottom: 7px;
  color: primary-text;
  font-size: 18px;
}
.block {
  .col {
    align-items: center;
    display: flex;
  }
  .row {
    margin-top: 4px;
  }
  select {
    margin-left: 14px;
  }

  input[type='text'],
  input[type='number'] {
    background: transparent;
    color: primary-text;
    border: 1px solid transparent;
    padding: 7px;
    font-size: 16px;
    width: 100%;
    margin-left: 7px;
    &:focus {
      outline-offset: 0;
      outline: none;
      border: 1px dashed;
      background: #13294f;
    }
    &:invalid {
      box-shadow:none;
    }
  }
}

.help {
  margin: -7px;
  margin-bottom: 7px;
  padding: 7px 7px 14px 7px;
  background: help-background;
}
.title {
  a {
    float: right;
    font-size: 12px;
    font-style: italic;
    color: help-text-color;
    height: 30px;
    margin: -5px;
    padding: 7px;
  }

  a.syntax-visible {
    background: help-background;
    color: white;
    font-style: normal;
  }
}
form.block {
  margin-top: 12px;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
}
.vector-field {
  pre.error {
    color: rgba(250, 232, 55, 1);
    overflow-y: auto;
  }
  pre.error.detail {
    overflow: none;
    white-space: normal;
    .hl {
      background-color: #172A4D;
      color: red;
      font-weight: bold;
    }
  }

  textarea {
    background: transparent;
    color: white;
    font-family: monospace;
    margin-top: 14px;
    padding: 0;
    padding-left: 14px;
    width: settings-width - 14px;
    font-size: 14px;
    border: 1px solid transparent;
    &:focus {
      outline: none;
      border: 1px dashed;
      background: #13294f;
    }
  }
}

.row {
  display: flex;
  flex-direction: row;
}

.center {
  justify-content: center;
}

audio {
  width: 100%;
}

.col {
  flex: 1;
}
a {
  text-decoration: none;
}

a.action {
  color: white;
  font-size: 16px;
}

a.help-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  margin-right: -7px;
  svg {
    fill: secondary-text;
  }
  &.open {
    background: help-background;
    svg {
      fill: primary-text;
    }
  }
}
.row.help {
  margin-top: 0;
}

.reset {
  text-decoration: none;
  color: white;
  display: flex;
  justify-content: center;
}

.bounding-box {
  position: relative;
  .title {
    position: absolute;
    bottom: 0;
    font-size: 12px;
    left: 0;
    color: ternary-text;
  }
  .reset {
    font-size: 16px;
  }

  input[type='number'] {
    width: 100px;
    margin: 0;
    font-size: 12px;
    text-align: center;
    color: secondary-text;
  }
  input:invalid {
      box-shadow: none;
  }
  .max-x {
    justify-content: flex-end;
  }
}

@media (max-width: small-screen) {
  .settings {
    .title {
      font-size: 14px;
      text-align: left;
    }
  }
}

</style>
