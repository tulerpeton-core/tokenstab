// Builds the app UI:  ui/app.html (the new design, all screens) + design/App.dc.html (logic class + receipt markup)
//   -> src/app.gen.js (template + logic class) and src/app.css (styles).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const oldDesign = fs.readFileSync(path.join(root, 'design', 'App.dc.html'), 'utf8');
let ui = fs.readFileSync(path.join(root, 'ui', 'app.html'), 'utf8');

function must(cond, msg) { if (!cond) throw new Error('build-ui: ' + msg); }

// ---- receipt: the same article markup the web viewer uses, with a live QR instead of the design's sample ----
const oldBody = oldDesign.match(/<x-dc>([\s\S]*)<\/x-dc>/)[1];
let article = oldBody.slice(oldBody.indexOf('<article class="print"'), oldBody.indexOf('</article>') + '</article>'.length);
must(article.startsWith('<article'), 'receipt markup not found');
article = article.replace(/<svg role="img" aria-label="\{\{L\.qrAria\}\}" width="64" height="64" viewBox="-1\.5 -1\.5 32 32"([^>]*)><rect x="-1\.5" y="-1\.5" width="32" height="32" fill="#FFFEFB"><\/rect><path d="[^"]*" fill="#16203A"><\/path><\/svg>/,
  (m, rest) => '<svg role="img" aria-label="{{L.qrAria}}" width="76" height="76" viewBox="{{qr.vb}}"' + rest + '><rect x="-2" y="-2" width="{{qr.box}}" height="{{qr.box}}" fill="#FFFEFB"></rect><path d="{{qr.d}}" fill="#16203A"></path></svg>');
must(article.indexOf('{{qr.d}}') >= 0, 'receipt QR not found');

// ---- window buttons (pin, minimize, close) used in every header ----
const wbtn = (aria, extra, svg) => `<button class="press" aria-label="${aria}" ${extra} style="width: 30px; height: 36px; border: 0; background: transparent; color: inherit; display: flex; align-items: center; justify-content: center">${svg}</button>`;
const WIN = '<span style="display: flex; color: inherit">'
  + wbtn('{{L.pin}}', 'aria-pressed="{{win.pinPressed}}" onClick="{{win.pin}}"', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity: {{win.pinOp}}"><path d="M9 3h6l-1 7 4 3H6l4-3z"></path><path d="M12 13v8"></path></svg>')
  + wbtn('{{L.minimize}}', 'onClick="{{win.min}}"', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"></path></svg>')
  + wbtn('{{L.close}}', 'onClick="{{win.close}}"', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>')
  + '</span>';

// ---- swipe-to-confirm button: the dark bar at the bottom of the screens ----
const SWIPE = `<div role="group" aria-label="{{sw.label}}" style="position: relative; flex: none; height: 76px; border-radius: 38px; background: #1D2527; overflow: hidden; user-select: none; -webkit-user-select: none; box-shadow: {{sw.barGlow}}; transition: box-shadow .3s ease">
<div aria-hidden="true" style="position: absolute; left: 0; top: 0; bottom: 0; width: {{sw.fillW}}px; border-radius: 38px; background: {{sw.trail}}; opacity: {{sw.trailOp}}; transition: {{sw.trFill}}"></div>
<sc-for list="{{sw.sparks}}" as="q" hint-placeholder-count="16"><span class="{{q.cls}}" aria-hidden="true" style="position: absolute; left: {{q.x}}px; top: {{q.y}}px; width: {{q.s}}px; height: {{q.s}}px; border-radius: 50%; background: {{sw.sparkColor}}; box-shadow: 0 0 8px 2px {{sw.sparkGlow}}; opacity: {{q.o}}; transform: scale({{q.sc}}); transition: opacity .3s ease, transform .3s ease; animation-delay: {{q.delay}}"></span></sc-for>
<div aria-hidden="true" style="position: absolute; left: 82px; right: 20px; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 16px; opacity: {{sw.labelOp}}; filter: blur({{sw.labelBlur}}px); transform: translateX({{sw.labelX}}px); transition: {{sw.trLabel}}"><span class="swtext" style="background-image: {{sw.textGrad}}">{{sw.label}}</span><span style="display: flex; letter-spacing: 0.12em; color: {{sw.acc}}"><span class="swchev">›</span><span class="swchev">›</span><span class="swchev">›</span></span></div>
<button aria-label="{{sw.label}}. {{N.swipeHint}}" onPointerDown="{{sw.down}}" onPointerMove="{{sw.move}}" onPointerUp="{{sw.up}}" onPointerCancel="{{sw.up}}" onClick="{{sw.click}}" style="position: absolute; top: 6px; left: {{sw.knobLeft}}; width: 64px; height: 64px; padding: 0; border: 0; border-radius: 50%; background: {{sw.knobBg}}; color: #1D2527; cursor: grab; touch-action: none; box-shadow: {{sw.knobShadow}}; transform: scale({{sw.knobScale}}); transition: {{sw.trKnob}}; display: flex; align-items: center; justify-content: center">
<svg width="22" height="22" viewBox="0 0 24 24" fill="{{sw.iconFill}}" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="transform: translateX({{sw.arrowX}}px); transition: transform .2s ease"><path d="{{sw.iconPath}}"></path></svg>
</button>
</div>`;

ui = ui.split('<!--WINCTL-->').join(WIN).split('<!--SWIPE-->').join(SWIPE);
must(ui.indexOf('<!--RECEIPT-->') >= 0, 'receipt placeholder missing');
ui = ui.replace('<!--RECEIPT-->', () => article);

const body = ui.match(/<x-dc>([\s\S]*)<\/x-dc>/)[1];
const code = oldDesign.match(/data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];
const out = `// GENERATED by tools/build-ui.js from ui/app.html and design/App.dc.html — do not edit by hand.
import { DCLogic } from './dc-runtime.js';
export const TEMPLATE = ${JSON.stringify(body)};
${code}
export { Component };
`;
fs.writeFileSync(path.join(root, 'src', 'app.gen.js'), out);

// The <helmet> styles go to a real stylesheet: Tauri's CSP blocks <style> tags injected at runtime.
const helmet = (body.match(/<helmet>([\s\S]*?)<\/helmet>/) || ['', ''])[1];
const css = [...helmet.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1].trim()).join('\n');
fs.writeFileSync(path.join(root, 'src', 'app.css'), '/* GENERATED by tools/build-ui.js from ui/app.html */\n' + css + '\n');
console.log('src/app.css written,', css.length, 'bytes');
console.log('src/app.gen.js written,', out.length, 'bytes');
