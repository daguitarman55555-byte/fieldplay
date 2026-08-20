function result(id, label, required, pass, details, value = null) {
  return { id, label, required, pass, details, value };
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || 'Shader compilation failed');
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, `#version 300 es
    precision highp float;
    const vec2 positions[3] = vec2[3](vec2(-1., -1.), vec2(3., -1.), vec2(-1., 3.));
    void main() { gl_Position = vec4(positions[gl_VertexID], 0., 1.); }
  `);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
    precision highp float;
    uniform vec4 u_color;
    out vec4 color;
    void main() { color = u_color; }
  `);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message || 'Program linking failed');
  }
  return program;
}

function testTarget(gl, internalFormat, format, type) {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texStorage2D(gl.TEXTURE_2D, 1, internalFormat, 2, 2);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(framebuffer);
  gl.deleteTexture(texture);
  return status === gl.FRAMEBUFFER_COMPLETE;
}

function testFloatBlend(gl) {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  const program = createProgram(gl);
  const vao = gl.createVertexArray();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, 1, 1);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('RGBA16F framebuffer incomplete');

  gl.viewport(0, 0, 1, 1);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.bindVertexArray(vao);
  gl.uniform4f(gl.getUniformLocation(program, 'u_color'), 0.25, 0.125, 0.0625, 0.5);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.disable(gl.BLEND);

  const pixel = new Float32Array(4);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixel);
  const error = gl.getError();
  const expected = [0.5, 0.25, 0.125, 1];
  const accurate = error === gl.NO_ERROR && expected.every((value, index) => Math.abs(pixel[index] - value) < 0.01);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteVertexArray(vao);
  gl.deleteProgram(program);
  gl.deleteFramebuffer(framebuffer);
  gl.deleteTexture(texture);
  return { accurate, pixel: Array.from(pixel), error };
}

function precision(gl, shaderType) {
  const value = gl.getShaderPrecisionFormat(shaderType, gl.HIGH_FLOAT);
  return value ? { precision: value.precision, rangeMin: value.rangeMin, rangeMax: value.rangeMax } : null;
}

export function runWebGLDiagnostics(canvas) {
  const startedAt = performance.now();
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance'
  });
  if (!gl) {
    return {
      gl: null,
      durationMs: performance.now() - startedAt,
      renderer: {},
      tests: [result('webgl2', 'WebGL 2 context', true, false, 'Context creation failed')]
    };
  }

  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = {
    vendor: gl.getParameter(gl.VENDOR),
    renderer: gl.getParameter(gl.RENDERER),
    unmaskedVendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
    unmaskedRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
    version: gl.getParameter(gl.VERSION),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
  };

  const floatColor = gl.getExtension('EXT_color_buffer_float');
  const floatBlend = gl.getExtension('EXT_float_blend');
  const extensions = {
    EXT_color_buffer_float: Boolean(floatColor),
    EXT_float_blend: Boolean(floatBlend),
    KHR_parallel_shader_compile: Boolean(gl.getExtension('KHR_parallel_shader_compile')),
    EXT_disjoint_timer_query_webgl2: Boolean(gl.getExtension('EXT_disjoint_timer_query_webgl2')),
    WEBGL_lose_context: Boolean(gl.getExtension('WEBGL_lose_context'))
  };

  const tests = [result('webgl2', 'WebGL 2 context', true, true, renderer.version)];
  tests.push(result('float-color', 'EXT_color_buffer_float', true, extensions.EXT_color_buffer_float, extensions.EXT_color_buffer_float ? 'Available' : 'Missing'));

  let rgba16f = false;
  let rg32f = false;
  if (floatColor) {
    rgba16f = testTarget(gl, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    rg32f = testTarget(gl, gl.RG32F, gl.RG, gl.FLOAT);
  }
  tests.push(result('rgba16f', 'RGBA16F render target', true, rgba16f, rgba16f ? 'Framebuffer complete' : 'Framebuffer incomplete'));
  tests.push(result('rg32f', 'RG32F render target', false, rg32f, rg32f ? 'Framebuffer complete' : 'Optional fallback required'));

  let blend = { accurate: false, pixel: [], error: null };
  if (rgba16f) {
    try { blend = testFloatBlend(gl); } catch (error) { blend.error = error.message; }
  }
  tests.push(result('hdr-blend', 'RGBA16F additive blending', true, blend.accurate, blend.accurate ? `Readback ${blend.pixel.map(x => x.toFixed(3)).join(', ')}` : `Incorrect result: ${blend.error || blend.pixel.join(', ')}`, blend.pixel));

  const vertexPrecision = precision(gl, gl.VERTEX_SHADER);
  const fragmentPrecision = precision(gl, gl.FRAGMENT_SHADER);
  const highpPass = vertexPrecision?.precision >= 23 && fragmentPrecision?.precision >= 23;
  tests.push(result('highp', 'High precision float', true, highpPass, `Vertex ${vertexPrecision?.precision ?? 'n/a'} bits · Fragment ${fragmentPrecision?.precision ?? 'n/a'} bits`, { vertexPrecision, fragmentPrecision }));

  Object.entries(extensions).filter(([name]) => name !== 'EXT_color_buffer_float').forEach(([name, available]) => {
    tests.push(result(name, name, false, available, available ? 'Available' : 'Optional'));
  });

  const limits = {
    MAX_TEXTURE_SIZE: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    MAX_RENDERBUFFER_SIZE: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    MAX_COLOR_ATTACHMENTS: gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
    MAX_DRAW_BUFFERS: gl.getParameter(gl.MAX_DRAW_BUFFERS)
  };

  return { gl, durationMs: performance.now() - startedAt, renderer, extensions, limits, tests };
}

export function forceContextCycle(gl, onLost, onRestored) {
  const extension = gl?.getExtension('WEBGL_lose_context');
  if (!extension) return false;
  onLost?.();
  extension.loseContext();
  window.setTimeout(() => {
    extension.restoreContext();
    onRestored?.();
  }, 750);
  return true;
}
