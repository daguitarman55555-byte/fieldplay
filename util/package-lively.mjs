import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const output = resolve(root, 'lively-package');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await cp(resolve(dist, 'assets'), resolve(output, 'assets'), { recursive: true });
await cp(resolve(root, 'LivelyInfo.json'), resolve(output, 'LivelyInfo.json'));
await cp(resolve(root, 'LivelyProperties.json'), resolve(output, 'LivelyProperties.json'));

const wallpaperHtml = await readFile(resolve(dist, 'wallpaper.html'), 'utf8');
await writeFile(resolve(output, 'wallpaper.html'), wallpaperHtml, 'utf8');
const gateHtml = await readFile(resolve(dist, 'gate0.html'), 'utf8');
await writeFile(resolve(output, 'gate0.html'), gateHtml, 'utf8');

console.log(`Lively package created at ${output}`);
