import{build}from'esbuild';import{cp,mkdir,rm}from'node:fs/promises';import{resolve}from'node:path';
const root=resolve(import.meta.dirname),out=resolve(root,'dist');await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const name of['content','main-world'])await build({entryPoints:[resolve(root,'src',`${name}.js`)],outfile:resolve(out,`${name}.js`),bundle:true,minify:true,format:'iife',target:'chrome120',legalComments:'none'});
await Promise.all([cp(resolve(root,'manifest.json'),resolve(out,'manifest.json')),cp(resolve(root,'src/content.css'),resolve(out,'content.css'))]);
console.log(`Built extension in ${out}`);
