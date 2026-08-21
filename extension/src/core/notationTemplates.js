export function notationTemplate(latex){
  if(endsCommand(latex,'mtx'))return{latex:`${latex.slice(0,-3)}\\left[\\left[0,0\\right],\\left[0,0\\right]\\right]`,left:3,matrix:true};
  let match=/^(?:pd|dp)([A-Za-z]*)\/(?:pd|dp)([A-Za-z])$/.exec(latex);if(match)return{latex:`\\frac{∂${match[1]}}{∂${match[2]}}${match[1]?'':'\\left(\\right)'}`,left:match[1]?0:1};
  match=/^d\/d([A-Za-z])$/.exec(latex);if(match)return{latex:`\\frac{d}{d${match[1]}}\\left(\\right)`,left:1};
  match=/(.*)\\frac\{(?:pd|dp)([^{}]+)\}\{(?:pd|dp)([A-Za-z])\}$/.exec(latex);if(match)return{latex:`${match[1]}\\frac{∂${match[2]}}{∂${match[3]}}`,left:0};
  match=/(.*)\\frac\{d\}\{d([A-Za-z])\}$/.exec(latex);if(match)return{latex:`${match[1]}\\frac{d}{d${match[2]}}\\left(\\right)`,left:1};
  match=/(.*)\\frac\{\\partial\}\{\\partial ([A-Za-z])\}$/.exec(latex);if(match)return{latex:`${match[1]}\\frac{\\partial}{\\partial ${match[2]}}\\left(\\right)`,left:1};
  match=/(.*)\\frac\{\\partial\}\{(?:p|\\partial )?d([A-Za-z])\}$/.exec(latex);if(match)return{latex:`${match[1]}\\frac{\\partial}{\\partial ${match[2]}}\\left(\\right)`,left:1};
  match=/(.*)\\frac\{d\^\{([^{}]+)\}\}\{d([A-Za-z])\^\{\2\}\}$/.exec(latex);if(match)return{latex:`${match[1]}\\frac{d^{${match[2]}}}{d${match[3]}^{${match[2]}}}\\left(\\right)`,left:1};
  match=/(.*)\\frac\{pd\}\{pd([A-Za-z])\}$/.exec(latex);if(match)return{latex:`${match[1]}\\frac{\\partial}{\\partial ${match[2]}}\\left(\\right)`,left:1};
  match=/(.*)\\frac\{pd\^\{([^{}]+)\}([^{}]*)\}\{pd([A-Za-z])\^\{\2\}\}$/.exec(latex);if(match)return{latex:`${match[1]}\\frac{\\partial^{${match[2]}}${match[3]}}{\\partial ${match[4]}^{${match[2]}}}`,left:0};
  match=/(.*)\\frac\{pd\^\{([^{}]+)\}([^{}]*)\}\{((?:pd[A-Za-z])+?)\}$/.exec(latex);if(match){const denominator=match[4].replace(/pd([A-Za-z])/g,'\\partial $1');return{latex:`${match[1]}\\frac{\\partial^{${match[2]}}${match[3]}}{${denominator}}${match[3]?'':'\\left(\\right)'}`,left:match[3]?0:1};}
  const operators=[['jacobian','\\operatorname{jacobian}\\left(\\left[\\right],\\left[x,y\\right]\\right)'],['hessian','\\operatorname{hessian}\\left(,\\left[x,y\\right]\\right)'],['laplacian','∇^{2}\\left(\\right)'],['magnitude','\\left\\|\\right\\|'],['grad','∇\\left(\\right)'],['curl','∇\\times\\left(\\right)'],['div','∇\\cdot\\left(\\right)']];for(const[command,template]of operators)if(endsCommand(latex,command))return{latex:`${latex.slice(0,-command.length)}${template}`,left:command==='jacobian'?6:command==='hessian'?5:1};
  const integrals=[['surfaceint','\\iint_{S}\\left(\\right)\\,dS'],['tripleint','\\iiint\\left(\\right)\\,dV'],['lineint','\\int_{C}\\left(\\right)\\,ds'],['iiintb','\\iiint_{ }^{ }\\left(\\right)\\,dV'],['iintb','\\iint_{ }^{ }\\left(\\right)\\,dA'],['intb','\\int_{ }^{ }\\left(\\right)\\,dx'],['iiint','\\iiint\\left(\\right)\\,dV'],['iint','\\iint\\left(\\right)\\,dA'],['oint','\\oint\\left(\\right)\\,ds'],['int','\\int\\left(\\right)\\,dx']];for(const[command,template]of integrals)if(endsCommand(latex,command))return{latex:`${latex.slice(0,-command.length)}${template}`,left:3};
  return null;
}

export function toggleIntegralBounds(latex,bounded){const operator='(?:\\\\int|\\\\iint|\\\\iiint|\\\\oint)';if(bounded)return latex.replace(new RegExp(`(${operator})(?!_)`),'$1_{ }^{ }');return latex.replace(new RegExp(`(${operator})_\\{[^{}]*\\}\\^\\{[^{}]*\\}`),'$1');}
function endsCommand(latex,command){if(!latex.endsWith(command))return false;const previous=latex.at(-command.length-1);return !previous||!/^[A-Za-z]$/.test(previous);}
