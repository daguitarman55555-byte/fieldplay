export const STUDIO_PRESETS = [
  preset('Saddle','x','-y',8),
  preset('Vortex','-y','x',8),
  preset('Spiral sink','-0.22*x-y','x-0.22*y',10),
  preset('Spiral source','0.18*x-y','x+0.18*y',10),
  preset('Radial source','x','y',8),
  preset('Radial sink','-x','-y',8),
  preset('Double gyre','sin(y)+0.35*sin(2*x)','sin(x)-0.35*sin(2*y)',12),
  preset('Wave lattice','sin(y)','cos(x)',12),
  preset('Cellular flow','sin(x)*cos(y)','-cos(x)*sin(y)',12),
  preset('Shear flow','y','0',10),
  preset('Cubic saddle','x^3-3*x*y^2','y^3-3*x^2*y',7),
  preset('Dipole','(x^2-y^2)/((x^2+y^2+0.2)^2)','(2*x*y)/((x^2+y^2+0.2)^2)',7),
  {...preset('Lotka–Volterra','x*(1-y)','y*(x-1)',6),center:[1,1]}
];
function preset(name,x,y,bounds){return{name,x,y,bounds};}
