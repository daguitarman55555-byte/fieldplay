<template>
  <div class='settings' :class='{collapsed: settingsPanel.collapsed}'>
    <div class='block vector-field' v-if='vectorField'>
      <div class='title'>Vector field <a class='reset-all' :class='{"syntax-visible": syntaxHelpVisible}' href='#' @click.prevent='syntaxHelpVisible = !syntaxHelpVisible'>Syntax</a></div>
      <div class='math-editor'>
        <label><span>dx/dt</span><math-expression-input v-model='xExpression' label='x velocity equation' @enter='applyMathField'/></label>
        <label><span>dy/dt</span><math-expression-input v-model='yExpression' label='y velocity equation' @enter='applyMathField'/></label>
        <label><span>Parameters</span><input v-model='parameterText' placeholder='a=1, b=0.25' @keyup.enter='applyMathField'></label>
        <div class='parameter-control' v-for='(value, name) in parameterValues' :key='name'>
          <span>{{name}}</span><input type='range' min='-10' max='10' step='.01' :value='value' @input='updateParameter(name, $event.target.value)'><output>{{Number(value).toFixed(2)}}</output>
        </div>
        <button @click='applyMathField'>Apply equations</button>
        <p class='math-error' v-if='mathError'>{{mathError}}</p>
      </div>
      <syntax v-if='syntaxHelpVisible' @close='syntaxHelpVisible = false'></syntax>
      <details class='advanced-code'><summary>Developer mode — advanced GLSL</summary>
      <code-editor :model='vectorField'></code-editor>
      </details>
      <input class='preset-search' v-model='presetSearch' placeholder='Search field presets'>
      <div class='preset-grid'>
        <button v-for='preset in filteredPresets' :key='preset.name' @click='applyPreset(preset)'>{{preset.name}}</button>
      </div>
      <div class='gradient-builder'>
        <div class='title small'>Gradient field</div>
        <p>Type an ordinary scalar equation to visualize its gradient ∇f.</p>
        <math-expression-input v-model='scalarExpression' label='scalar potential equation' @enter='applyGradient'/>
        <button type='button' @click='applyGradient'>Apply ∇f</button>
      </div>
    </div>
    <div class='block' v-if='showBindings'>
      <Inputs :vm='inputsModel'></Inputs>
    </div>
    <form class='block' @submit.prevent='onSubmit'>
      <div class='title'>Settings<a class='reset-all' href='?' title='set default settings'>reset all</a> </div>
      <div class='row'>
        <div class='col'>Particle color</div>
        <div class='col'> 
          <select v-model='selectedColorMode' @change='changeColor'>
              <option value='1'>Uniform</option>
              <option value='2'>Velocity</option>
              <option value='3'>Angle</option>
	            <option value='4'>Custom</option>
	        </select>
        </div>
        <help-icon @show='selectedColorHelp = !selectedColorHelp' :class='{open: selectedColorHelp}'></help-icon>
      </div>
      <div class='row help' v-if='selectedColorHelp'>
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
      <div class='row' v-if='soundAvailable'>
        <div class='col'>SoundCloud track</div>
        <div class='col'>
          <input type='text' v-model='soundCloudLink'>
          <a href='#' @click.prevent='loadSound'>load</a>
        </div>
      </div>
      <div class='overlay-controls'>
        <div class='title small'>Visualization layers</div>
        <label v-for='item in overlayToggles' :key='item.key'><input type='checkbox' v-model='overlay[item.key]' @change='publishOverlay'> {{item.label}}</label>
        <label class='range-label'>Arrow density <input type='range' min='8' max='42' v-model.number='overlay.arrowDensity' @input='publishOverlay'></label>
        <label class='range-label'>Overlay opacity <input type='range' min='.15' max='1' step='.05' v-model.number='overlay.opacity' @input='publishOverlay'></label>
        <label>Arrow colors <select v-model='overlay.palette' @change='publishOverlay'><option v-for='color in colorPalettes' :key='color.value' :value='color.value'>{{color.label}}</option></select></label>
        <label class='match-colors'><input type='checkbox' v-model='overlay.matchParticles' @change='publishOverlay'> Match particle colors</label>
        <label v-if='overlay.contours' class='range-label'>Contour quantity <select v-model='overlay.contourQuantity' @change='publishOverlay'><option value='magnitude'>Vector magnitude |F|</option><option value='divergence'>Divergence ∇·F</option><option value='curl'>2D curl</option><option value='potential'>Scalar potential f</option></select></label>
      </div>
      <div class='row' v-if='soundAvailable'>
        <audio ref='player' controls='' autoplay='' preload autobuffer></audio>
      </div>
      <div class='row'>
        <div class='col'>Particles count </div>
        <div class='col'><input type='number' :step='particleCountDelta' v-model='particlesCount' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
        <help-icon @show='particleCountHelpVisible = !particleCountHelpVisible' :class='{open: particleCountHelpVisible}'></help-icon>
      </div>
      <div class='row help' v-if='particleCountHelpVisible'>
        <div>
          <p>How many particles should be visible inside bounding box? Higher values produce denser plots, smaller values are faster to compute.</p>
          <p>Recommended value is between <b>10,000</b> and <b>100,000</b></p>
        </div>
      </div>
      <div class='row'>
        <div class='col'>Fade out speed</div>
        <div class='col'><input type='number' :step='fadeoutDelta'  v-model='fadeOutSpeed' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
        <help-icon @show='fadeoutDeltaHelp = !fadeoutDeltaHelp' :class='{open: fadeoutDeltaHelp}'></help-icon>
      </div>
      <div class='row help' v-if='fadeoutDeltaHelp'>
        <div>
          <p>Before a particle is moved to the next position, we multiply its transparency by this number. This gives a fading out trace behind the particle</p>
          <ul>
            <li>Setting this value to <b>1</b> will keep particle trace forever.</li>
            <li> Setting this value to <b>0</b> will leave no trace at all</li>
          </ul>
          <p>Recommended value is <b>0.998</b></p>
        </div>
      </div>
      <div class='row'>
        <div class='col'>Particle reset probability</div>
        <div class='col'><input type='number' :step='resetProbabilityDelta'  v-model='dropProbability' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
        <help-icon @show='resetProbabilityHelp = !resetProbabilityHelp' :class='{open: resetProbabilityHelp}'></help-icon>
      </div>
      <div class='row help' v-if='resetProbabilityHelp'>
        <div>
          <p>This is a probability that a particle will reset its position to a random location inside bounding box. This prevents particles from flying out of the screen.</p>
          <ul>
            <li>Setting this value to <b>1</b> will reset all particles on every frame. This can be a good option to "reset" an empty screen.</li>
            <li>Setting this value to <b>0</b> will prevent particles from jumping to a random spot. This can be a good option to trace particles trajectory.</li>
          </ul>
          <p>Default value is <b>0.009</b></p>
        </div>
      </div>
      <div class='row'>
        <div class='col'>Integration timestep</div>
        <div class='col'><input type='number' :step='integrationStepDelta' v-model='timeStep' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ></div>
        <help-icon @show='integrationStepHelp = !integrationStepHelp' :class='{open: integrationStepHelp}'></help-icon>
      </div>
      <div class='row help' v-if='integrationStepHelp'>
        <div>
          <p>This parameter defines how fast time flies for each particle (or, to be more accurate, this is the integration step of the classical Runge-Kutta method)</p>
          <ul>
            <li>Increasing this value makes particles fly faster at risk of missing proper curve's turns.</li>
            <li>Making this value smaller increases the accuracy of particle's trajectory, and makes them move slower.</li>
          </ul>
          <p>Default value is <b>0.01</b></p>
        </div>
      </div>
      <div class='studio-simulation-controls'>
        <div class='title small'>Numerical engine and style</div>
        <label>Performance <select v-model='performanceProfile' @change='applyPerformanceProfile'><option value='eco'>Eco</option><option value='balanced'>Balanced</option><option value='detail'>High detail</option><option value='custom'>Custom</option></select></label>
        <label>Integrator <select v-model='integrator' @change='applySimulation'><option value='euler'>Euler</option><option value='midpoint'>Midpoint (RK2)</option><option value='rk4'>Runge–Kutta 4</option></select></label>
        <label>Speed <input type='range' min='0' max='4' step='.05' v-model.number='speedMultiplier' @input='applySimulation'><output>{{speedMultiplier.toFixed(2)}}×</output></label>
        <label>Particle size <input type='range' min='1' max='8' step='.25' v-model.number='particleSize' @input='applyParticleStyle'><output>{{particleSize}} px</output></label>
        <label>Particle opacity <input type='range' min='.05' max='1' step='.05' v-model.number='particleOpacity' @input='applyParticleStyle'><output>{{particleOpacity}}</output></label>
        <label>Particle palette <select v-model='particlePalette' @change='applyParticlePalette'><option v-for='color in colorPalettes' :key='color.value' :value='color.value'>{{color.label}}</option><option value='custom'>Custom color</option></select></label>
        <label v-if='particlePalette===`custom`'>Custom particle color <input type='color' v-model='particleColor' @input='applyParticleColor'></label>
        <label>Background <input type='color' v-model='backgroundColor' @input='applyBackground'></label>
        <label>Seed <input type='number' v-model.number='seed' @change='applySpawn'></label>
        <label>Spawn <select v-model='spawnMode' @change='applySpawn'><option value='random'>Random</option><option value='grid'>Grid</option><option value='ring'>Ring</option></select></label>
        <label class='auto-quality'><input type='checkbox' v-model='adaptiveEnabled' @change='toggleAdaptive'> Adaptive performance</label>
      </div>
      <div class='bounding-box'>
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
    <section class='project-panel'>
      <div class='title'>Projects and history</div>
      <div class='history-buttons'><button @click='undo'>Undo</button><button @click='redo'>Redo</button><button @click='downloadPNG'>Export PNG</button></div>
      <div class='save-project'><input v-model='projectName' placeholder='Project name'><button @click='saveCurrentProject'>Save</button></div>
      <div class='saved-project' v-for='project in savedProjects' :key='project.name'><span>{{project.name}}</span><button @click='loadProject(project)'>Load</button><button @click='compareProject(project)'>Compare</button><button @click='removeProject(project.name)'>×</button></div>
      <label class='import-project'>Import project JSON<input type='file' accept='.json,application/json' @change='importProject'></label>
      <button v-if='comparisonActive' @click='clearComparison'>Clear comparison</button>
    </section>
    <section class='export-panel'>
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
import MathExpressionInput from './MathExpressionInput.vue';
import { compileGradientField, compileVectorField, parseParameters } from '../lib/math/expression.js';
import { STUDIO_PRESETS } from '../lib/studioPresets.js';
import { createAdaptiveQuality } from '../lib/wallpaper/adaptiveQuality.js';
import { createHistory, deleteProject, listProjects, saveProject } from '../lib/studioProjects.js';

// Temporary disable this until API is finished.
const soundAvailable = config.isAudioEnabled;

export default {
  name: 'Settings',
  props: ['scene'],
  components: {
    Syntax,
    HelpIcon,
    CodeEditor,
    Inputs,
    MathExpressionInput
  },
  mounted() {
    bus.on('scene-ready', this.onSceneReady, this);
    bus.on('bbox-change', this.updateBBox, this);
    bus.on('studio-randomize', this.randomizeStudioField, this);

    // The renderer starts before Vue is lazy-loaded. Initialize immediately
    // when the scene already exists instead of relying on an event that may
    // have fired before this component mounted.
    if (this.scene) this.onSceneReady(this.scene);

    if (soundAvailable) this.soundLoader = new SoundLoader(this.$refs.player);
    this.onHistoryKey=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?this.redo():this.undo();}};document.addEventListener('keydown',this.onHistoryKey);
  },
  beforeUnmount() {
    bus.off('scene-ready', this.onSceneReady, this);
    bus.off('bbox-change', this.updateBBox, this);
    bus.off('studio-randomize', this.randomizeStudioField, this);
    if (this.adaptiveController) this.adaptiveController.dispose();
    if (this.persistTimer) clearTimeout(this.persistTimer);
    document.removeEventListener('keydown',this.onHistoryKey);
  },
  data() {
    return {
      presets: STUDIO_PRESETS,
      presetSearch: '',
      copyLabel: 'Copy share link',
      scalarExpression: 'sin(x) * cos(y)',
      xExpression: '0.1*y',
      yExpression: '-0.2*y',
      parameterText: '',
      parameterValues: {},
      mathError: '',
      overlay:{grid:true,axes:true,arrows:true,heatmap:false,contours:false,critical:true,arrowDensity:22,opacity:.82,palette:'magnitude',matchParticles:false,contourQuantity:'magnitude',particlePalette:'cyan',particleColor:'#4ec4ff'},
      overlayToggles:[{key:'grid',label:'Grid'},{key:'axes',label:'Axes'},{key:'arrows',label:'Vector arrows'},{key:'heatmap',label:'Magnitude heatmap'},{key:'contours',label:'Contour lines'},{key:'critical',label:'Critical points'}],
      colorPalettes:[{value:'magnitude',label:'Magnitude (blue → red)'},{value:'cyan',label:'Cyan'},{value:'blue',label:'Blue'},{value:'teal',label:'Teal'},{value:'green',label:'Green'},{value:'gold',label:'Gold'},{value:'orange',label:'Orange'},{value:'red',label:'Red'},{value:'pink',label:'Pink'},{value:'violet',label:'Violet'},{value:'white',label:'White'},{value:'rainbow',label:'Direction rainbow'}],
      integrator:'rk4',speedMultiplier:1,performanceProfile:'balanced',particleSize:1.5,particleOpacity:1,particlePalette:'cyan',particleColor:'#4ec4ff',backgroundColor:'#13294f',seed:1337,spawnMode:'random',adaptiveEnabled:false,
      history:createHistory(),projectName:'My field',savedProjects:listProjects(),comparisonActive:false,restoring:false,
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
      if(Number(newValue)===4){if(this.scene)this.applyParticlePalette();return;}
      this.scene.setColorMode(newValue);
    },
    'vectorField.code'(newCode) {
      if(!newCode||this.restoring||newCode===this.currentModel?.code)return;
      this.currentModel=null;
      bus.fire('studio-field-model',null);
      this.mathError='Advanced GLSL is active. Mathematical overlays are hidden until you apply equations again.';
    },
    minX(newValue) { this.moveBoundingBox('minX', newValue) },
    maxX(newValue) { this.moveBoundingBox('maxX', newValue) },
    minY(newValue) { this.moveBoundingBox('minY', newValue) },
    maxY(newValue) { this.moveBoundingBox('maxY', newValue) },
  },
  computed: {
    filteredPresets() {
      const query=this.presetSearch.trim().toLowerCase();
      return query ? this.presets.filter(p=>`${p.name} ${p.x} ${p.y}`.toLowerCase().includes(query)) : this.presets;
    },
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
      this.xExpression=preset.x;this.yExpression=preset.y;await this.applyMathField();
      const cx=preset.center?.[0]||0, cy=preset.center?.[1]||0, half=preset.bounds/2;
      this.scene.applyBoundingBox({minX:cx-half,maxX:cx+half,minY:cy-half,maxY:cy+half});
    },
    randomizeStudioField(){const preset=this.presets[Math.floor(Math.random()*this.presets.length)];this.applyPreset(preset);},
    async applyMathField() {
      try { const parameters=parseParameters(this.parameterText);this.parameterValues={...parameters};const model=compileVectorField(this.xExpression,this.yExpression,parameters);const result=await this.vectorField.setCode(model.code);if(result?.error)throw new Error(result.error.error||result.error.message||'Shader compilation failed');this.mathError='';this.currentModel=model;bus.fire('studio-field-model',model);if(!this.restoring)this.history.push(this.projectSnapshot());this.persistStudioState();return model; } catch(error){this.mathError=error.message||String(error);return null;}
    },
    updateParameter(name,value){this.parameterValues[name]=Number(value);this.parameterText=Object.entries(this.parameterValues).map(([key,val])=>`${key}=${val}`).join(', ');this.applyMathField();},
    publishOverlay(){bus.fire('studio-overlay-options',{...this.overlay});this.queuePersist();},
    applySimulation(){this.scene.setIntegrator(this.integrator);this.scene.setSpeedMultiplier(this.speedMultiplier);this.queuePersist();},
    applyPerformanceProfile(){const profiles={eco:{particles:12000,integrator:'midpoint',density:14},balanced:{particles:25000,integrator:'rk4',density:22},detail:{particles:50000,integrator:'rk4',density:30}},profile=profiles[this.performanceProfile];if(!profile)return;this.particlesCount=profile.particles;this.integrator=profile.integrator;this.overlay.arrowDensity=profile.density;this.applySimulation();this.publishOverlay();},
    applySpawn(){this.scene.setSeed(this.seed);this.scene.setSpawnMode(this.spawnMode);this.persistStudioState();},
    applyParticleStyle(){this.scene.setParticleStyle({size:this.particleSize,opacity:this.particleOpacity});this.queuePersist();},
    applyParticlePalette(){if(this.particlePalette==='custom')return this.applyParticleColor();if(this.particlePalette==='magnitude'){this.selectedColorMode=2;this.scene.setColorMode(2);}else if(this.particlePalette==='rainbow'){this.selectedColorMode=3;this.scene.setColorMode(3);}else{this.selectedColorMode=4;this.scene.setColorFunction(particlePaletteShader(this.particlePalette,this.particleColor));}this.overlay.particlePalette=this.particlePalette;this.publishOverlay();this.queuePersist();},
    applyParticleColor(){this.selectedColorMode=4;this.scene.setColorFunction(particlePaletteShader('custom',this.particleColor));this.overlay.particlePalette='custom';this.overlay.particleColor=this.particleColor;this.publishOverlay();this.queuePersist();},
    applyBackground(){this.scene.setBackgroundColor(hexColor(this.backgroundColor));this.queuePersist();},
    toggleAdaptive(){if(this.adaptiveController){this.adaptiveController.dispose();this.adaptiveController=null;}if(this.adaptiveEnabled)this.adaptiveController=createAdaptiveQuality({scene:this.scene,quality:'auto',maxParticles:100000,onChange:count=>{this.particlesCount=count;}});},
    projectSnapshot(){return{version:3,name:this.projectName,xExpression:this.xExpression,yExpression:this.yExpression,parameterText:this.parameterText,scalarExpression:this.scalarExpression,viewport:{...this.scene.getBoundingBox()},simulation:{particles:this.particlesCount,timeStep:this.timeStep,fade:this.fadeOutSpeed,drop:this.dropProbability,integrator:this.integrator,speed:this.speedMultiplier,performanceProfile:this.performanceProfile,seed:this.seed,spawnMode:this.spawnMode},appearance:{particlePalette:this.particlePalette,particleColor:this.particleColor,backgroundColor:this.backgroundColor,particleSize:this.particleSize,particleOpacity:this.particleOpacity,overlay:{...this.overlay}}};},
    async restoreSnapshot(snapshot){if(!snapshot)return;this.restoring=true;try{this.xExpression=snapshot.xExpression;this.yExpression=snapshot.yExpression;this.parameterText=snapshot.parameterText||'';this.scalarExpression=snapshot.scalarExpression||this.scalarExpression;if(snapshot.viewport)this.scene.applyBoundingBox(snapshot.viewport);if(snapshot.simulation){Object.assign(this,{particlesCount:snapshot.simulation.particles,timeStep:snapshot.simulation.timeStep,fadeOutSpeed:snapshot.simulation.fade,dropProbability:snapshot.simulation.drop,integrator:snapshot.simulation.integrator||'rk4',speedMultiplier:snapshot.simulation.speed??1,performanceProfile:snapshot.simulation.performanceProfile||'custom',seed:snapshot.simulation.seed??1337,spawnMode:snapshot.simulation.spawnMode||'random'});this.applySimulation();this.applySpawn();}if(snapshot.appearance){Object.assign(this,snapshot.appearance);if(snapshot.appearance.overlay)this.overlay={...this.overlay,...snapshot.appearance.overlay};if(!snapshot.version&&this.overlay.palette==='cyan')this.overlay.palette='magnitude';this.applyParticleStyle();this.applyParticlePalette();this.applyBackground();this.publishOverlay();}await this.applyMathField();}finally{this.restoring=false;}},
    persistStudioState(){if(this.scene&&!this.restoring)try{const snapshot=this.projectSnapshot();snapshot.code=this.currentModel?.code;localStorage.setItem('fieldplay-studio-current',JSON.stringify(snapshot));const url=new URL(location.href);url.searchParams.set('sx',this.xExpression);url.searchParams.set('sy',this.yExpression);if(this.parameterText)url.searchParams.set('sp',this.parameterText);else url.searchParams.delete('sp');history.replaceState(null,'',url);}catch(error){}},
    queuePersist(){if(this.restoring||!this.scene)return;clearTimeout(this.persistTimer);this.persistTimer=setTimeout(()=>this.persistStudioState(),180);},
    undo(){this.restoreSnapshot(this.history.undo());},redo(){this.restoreSnapshot(this.history.redo());},
    saveCurrentProject(){this.savedProjects=saveProject(this.projectSnapshot());},
    async loadProject(project){this.projectName=project.name;await this.restoreSnapshot(project);this.history.push(project);},
    removeProject(name){this.savedProjects=deleteProject(name);},
    compareProject(project){try{const model=compileVectorField(project.xExpression,project.yExpression,parseParameters(project.parameterText));bus.fire('studio-compare-model',model);this.comparisonActive=true;}catch(error){this.mathError=error.message;}},
    clearComparison(){bus.fire('studio-compare-model',null);this.comparisonActive=false;},
    async importProject(event){const file=event.target.files?.[0];if(!file)return;try{const project=JSON.parse(await file.text());if(!project.xExpression||!project.yExpression)throw new Error('Not a FieldPlay Studio project');this.projectName=project.name||file.name.replace(/\.json$/,'');await this.restoreSnapshot(project);this.savedProjects=saveProject(this.projectSnapshot());}catch(error){this.mathError=error.message;}event.target.value='';},
    downloadPNG(){const canvases=[...document.querySelectorAll('canvas')];const out=document.createElement('canvas');out.width=innerWidth*(devicePixelRatio||1);out.height=innerHeight*(devicePixelRatio||1);const ctx=out.getContext('2d');ctx.scale(devicePixelRatio||1,devicePixelRatio||1);canvases.forEach(canvas=>ctx.drawImage(canvas,parseFloat(canvas.style.left)||0,parseFloat(canvas.style.top)||0,innerWidth,innerHeight));const link=document.createElement('a');link.download='fieldplay.png';link.href=out.toDataURL('image/png');link.click();},
    async copyShareLink() {
      await navigator.clipboard.writeText(location.href);
      this.copyLabel='Copied'; setTimeout(()=>this.copyLabel='Copy share link',1200);
    },
    downloadState() {
      const blob=new Blob([JSON.stringify(this.projectSnapshot(),null,2)],{type:'application/json'});
      const link=document.createElement('a'); link.href=URL.createObjectURL(blob); link.download='fieldplay-state.json'; link.click();
      setTimeout(()=>URL.revokeObjectURL(link.href),0);
    },
    async applyGradient() {
      try {const model=compileGradientField(this.scalarExpression,parseParameters(this.parameterText));const result=await this.vectorField.setCode(model.code);if(result?.error)throw new Error(result.error.error||'Shader compilation failed');this.mathError='';this.currentModel=model;bus.fire('studio-field-model',model);if(!this.restoring)this.history.push(this.projectSnapshot());this.persistStudioState();}catch(error){this.mathError=error.message||String(error);}
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
      if(this.initializedScene===scene)return;
      this.initializedScene=scene;
      this.vectorField = scene.vectorFieldEditorState;
      this.particlesCount = scene.getParticlesCount();
      this.fadeOutSpeed = scene.getFadeOutSpeed();
      this.dropProbability = scene.getDropProbability();
      this.timeStep = scene.getIntegrationTimeStep();
      this.selectedColorMode = scene.getColorMode();
      this.integrator=scene.getIntegrator();this.speedMultiplier=scene.getSpeedMultiplier();const style=scene.getParticleStyle();this.particleSize=style.size;this.particleOpacity=style.opacity;
      this.updateBBox();
      this.$nextTick(async()=>{let saved=null;const params=new URLSearchParams(location.search),sx=params.get('sx'),sy=params.get('sy');if(sx!==null&&sy!==null)saved={xExpression:sx,yExpression:sy,parameterText:params.get('sp')||''};else try{saved=JSON.parse(localStorage.getItem('fieldplay-studio-current'));}catch(error){}const hasField=params.has('vf');let compatible=!hasField;if(saved&&hasField){try{compatible=saved.code===this.vectorField.code||compileVectorField(saved.xExpression,saved.yExpression,parseParameters(saved.parameterText)).code===this.vectorField.code;}catch(error){compatible=false;}}if(saved&&compatible)await this.restoreSnapshot(saved);else if(!hasField)await this.applyMathField();else{this.currentModel=null;bus.fire('studio-field-model',null);this.mathError='This URL contains an Advanced GLSL field. Apply equations to enable mathematical overlays.';}this.publishOverlay();});
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
function hexColor(value) { const text=String(value||'#000000').replace('#','');return {r:parseInt(text.slice(0,2),16)/255,g:parseInt(text.slice(2,4),16)/255,b:parseInt(text.slice(4,6),16)/255,a:1}; }
const SOLID_COLORS={cyan:'#4ec4ff',blue:'#4d96ff',teal:'#36d6bd',green:'#74d680',gold:'#ffbe54',orange:'#ff8a4c',red:'#fc6255',pink:'#ff6faf',violet:'#b273ff',white:'#e6f3ff'};
function particlePaletteShader(name,custom){
  if(name==='magnitude')return `vec3 studio_palette(float t){vec3 a=vec3(0.345,0.769,0.867),b=vec3(1.0,0.882,0.329),c=vec3(0.988,0.384,0.333);return t<0.65?mix(a,b,t/0.65):mix(b,c,(t-0.65)/0.35);} vec4 get_color(vec2 p){float s=clamp((length(get_velocity(p))-u_velocity_range.x)/max(0.000001,u_velocity_range.y-u_velocity_range.x),0.0,1.0);return vec4(studio_palette(s),1.0);}`;
  if(name==='rainbow')return `vec4 get_color(vec2 p){vec2 v=get_velocity(p);float h=(atan(v.y,v.x)+PI)/(2.0*PI);return vec4(hsv2rgb(vec3(h,0.82,1.0)),1.0);}`;
  const {r,g,b}=hexColor(name==='custom'?custom:(SOLID_COLORS[name]||SOLID_COLORS.cyan));return `vec4 get_color(vec2 p){return vec4(${r.toFixed(4)},${g.toFixed(4)},${b.toFixed(4)},1.0);}`;
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
.preset-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-top:12px; }
.preset-grid button, .export-panel button { padding:8px 5px; border:1px solid #294563; background:#071526; color:#9ec8ed; cursor:pointer; }
.preset-grid button:hover, .export-panel button:hover { border-color:#42aaf5; color:white; }
.export-panel { color:#9ab6d2; }
.export-panel p { font-size:13px; line-height:1.5; }
.export-panel>button { width:100%; margin:0 0 8px; }
.bridge-note { margin-top:14px; padding:12px; border-left:2px solid #42aaf5; background:#061121; font-size:12px; line-height:1.6; }
.project-panel { margin:14px 0;color:#9ab6d2; }
.project-panel button,.project-panel input { padding:7px;border:1px solid #294563;background:#071526;color:#dcecff; }
.history-buttons { display:grid;grid-template-columns:repeat(3,1fr);gap:6px; }
.save-project { display:grid;grid-template-columns:1fr auto;gap:6px;margin:8px 0; }
.saved-project { display:grid;grid-template-columns:1fr auto auto 28px;gap:4px;align-items:center;margin-top:4px;font-size:12px; }
.import-project { display:block;border:1px dashed #294563;padding:9px;margin-top:8px;text-align:center;cursor:pointer;font-size:12px; }
.import-project input { display:none; }
.gradient-builder {
  border-top: 1px solid #21334b;
  margin-top: 14px;
  padding-top: 14px;
  p { font-size: 12px; line-height: 1.4; color: #7893ad; }
  button { width: 100%; margin-top: 8px; padding: 9px; border: 1px solid #297ec1; color: white; background: #12558d; cursor: pointer; }
}
.math-editor { display:grid; gap:7px; margin-bottom:10px; }
.math-editor label { display:grid; grid-template-columns:76px 1fr; align-items:center; font:12px ui-monospace,monospace; color:#9ab6d2; }
.math-editor input { margin:0 !important; border:1px solid #2c4562 !important; background:#061121 !important; }
.parameter-control { display:grid;grid-template-columns:76px 1fr 44px;align-items:center;gap:6px;color:#9ab6d2;font:11px ui-monospace,monospace; }
.preset-search { box-sizing:border-box;margin:10px 0 0 !important;border:1px solid #2c4562 !important;background:#061121 !important; }
.math-editor button { padding:9px;border:1px solid #297ec1;color:white;background:#12558d;cursor:pointer; }
.math-error { color:#ff8f9b;font:12px/1.4 ui-monospace,monospace;margin:3px 0; }
.advanced-code { border-top:1px solid #21334b;padding-top:8px; }
.advanced-code summary { cursor:pointer;color:#7893ad;font-size:12px; }
.overlay-controls { display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0;padding:12px;background:#061121;border:1px solid #21334b; }
.overlay-controls .title { grid-column:1/-1; }
.overlay-controls label { font-size:12px;color:#9ab6d2; }
.overlay-controls .range-label { grid-column:1/-1;display:grid;grid-template-columns:110px 1fr;align-items:center; }
.studio-simulation-controls { display:grid;gap:9px;margin:16px 0;padding:12px;background:#061121;border:1px solid #21334b; }
.studio-simulation-controls label { display:grid;grid-template-columns:110px 1fr auto;align-items:center;gap:8px;font-size:12px;color:#9ab6d2; }
.studio-simulation-controls input[type='color'] { width:100%;height:28px;background:transparent;border:1px solid #294563; }
.studio-simulation-controls .auto-quality { grid-template-columns:auto 1fr; }
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
