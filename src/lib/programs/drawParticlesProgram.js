import util from '../gl-utils';
import DrawParticleGraph from '../shaderGraph/DrawParticleGraph';
import makeUpdatePositionProgram from './updatePositionProgram';
import { encodeFloatRGBA } from '../utils/floatPacking.js';
import config from '../config';
import createAudioProgram from './audioProgram';

/**
 * This program manages particles life-cycle. It updates particles positions
 * and initiates drawing them on screen.
 * 
 * @param {Object} ctx rendering context. Holds WebGL state
 */
export default function drawParticlesProgram(ctx) {
  var gl = ctx.gl;

  var particleStateResolution, particleIndexBuffer;
  var numParticles;

  var currentVectorField = '';
  var updatePositionProgram = makeUpdatePositionProgram(ctx);
  var audioProgram;

  var drawProgram;
  initPrograms();

  return {
    updateParticlesCount,
    updateParticlesPositions,
    drawParticles,
    updateCode,
    updateColorMode,
    setIntegrator
  }
  function setIntegrator(method) { updatePositionProgram.setIntegrator(method); }

  function initPrograms() {
    // need to update the draw graph because color mode shader has changed.
    initDrawProgram();

    if (config.isAudioEnabled) {
      if (audioProgram) audioProgram.dispose();
      audioProgram = createAudioProgram(ctx);
    }
  }

  function initDrawProgram() {
    if (drawProgram) drawProgram.unload();

    const drawGraph = new DrawParticleGraph(ctx);
    const vertexShaderCode = drawGraph.getVertexShader(currentVectorField);
    drawProgram = util.createProgram(gl, vertexShaderCode, drawGraph.getFragmentShader());
  }

  function updateParticlesPositions() {
    if (!currentVectorField) return;

    ctx.frame += 1
    ctx.frameSeed = ctx.random();

    // TODO: Remove this.
    if (audioProgram) audioProgram.updateTextures();

    updatePositionProgram.updateParticlesPositions();
  }

  function updateColorMode() {
    initDrawProgram();
  }

  function updateCode(vfCode) {
    ctx.frame = 0;
    currentVectorField = vfCode;
    updatePositionProgram.updateCode(vfCode);

    initDrawProgram();
  }

  function updateParticlesCount() {
    particleStateResolution = ctx.particleStateResolution;
    numParticles = particleStateResolution * particleStateResolution;
    var particleIndices = new Float32Array(numParticles);
    var particleStateX = new Uint8Array(numParticles * 4);
    var particleStateY = new Uint8Array(numParticles * 4);

    var minX = ctx.bbox.minX; var minY = ctx.bbox.minY;
    var width = ctx.bbox.maxX - minX;
    var height = ctx.bbox.maxY - minY;
    for (var i = 0; i < numParticles; i++) {
      const position=spawnPosition(i,numParticles,ctx.spawnMode,ctx.random,minX,minY,width,height);
      encodeFloatRGBA(position.x, particleStateX, i * 4);
      encodeFloatRGBA(position.y, particleStateY, i * 4);

      particleIndices[i] = i;
    }

    if (particleIndexBuffer) gl.deleteBuffer(particleIndexBuffer);
    particleIndexBuffer = util.createBuffer(gl, particleIndices);

    updatePositionProgram.updateParticlesCount(particleStateX, particleStateY);
  }

  function drawParticles() {
    if (!currentVectorField) return;

    var program = drawProgram;
    gl.useProgram(program.program);
  
    util.bindAttribute(gl, particleIndexBuffer, program.a_index, 1);
    
    updatePositionProgram.prepareToDraw(program);
    ctx.inputs.updateBindings(program);
  
    gl.uniform1f(program.u_h, ctx.integrationTimeStep);
    if (program.u_speed != null) gl.uniform1f(program.u_speed, ctx.speedMultiplier);
    if (program.u_point_size != null) gl.uniform1f(program.u_point_size, ctx.particleSize);
    if (program.u_particle_opacity != null) gl.uniform1f(program.u_particle_opacity, ctx.particleOpacity);
    gl.uniform1f(program.frame, ctx.frame);
    gl.uniform1f(program.u_particles_res, particleStateResolution);
    var bbox = ctx.bbox;
    gl.uniform2f(program.u_min, bbox.minX, bbox.minY);
    gl.uniform2f(program.u_max, bbox.maxX, bbox.maxY);
  
    var cursor = ctx.cursor;
    gl.uniform4f(program.cursor, cursor.clickX, cursor.clickY, cursor.hoverX, cursor.hoverY);
    gl.drawArrays(gl.POINTS, 0, numParticles); 
  }
}

export function spawnPosition(index,count,mode,random,minX,minY,width,height){
  if(mode==='grid'){const n=Math.ceil(Math.sqrt(count));return{x:minX+((index%n)+.5)/n*width,y:minY+(Math.floor(index/n)+.5)/n*height};}
  if(mode==='ring'){const angle=index/count*Math.PI*2,radius=.34+random()*.12;return{x:minX+width*(.5+Math.cos(angle)*radius),y:minY+height*(.5+Math.sin(angle)*radius)};}
  return{x:minX+random()*width,y:minY+random()*height};
}
