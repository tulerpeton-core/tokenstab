// Tiny runtime that renders a .dc.html design component with Preact.
// Supports: {{hole}} lookups in text/attributes, <sc-for list as>, <sc-if value>, <helmet>, on* events.
import { h, Component } from './vendor/preact.module.js';

const EVENT_MAP = { onclick: 'onClick', onpointerdown: 'onPointerDown', onpointermove: 'onPointerMove', onpointerup: 'onPointerUp', onpointercancel: 'onPointerCancel', onpointerenter: 'onPointerEnter', onpointerleave: 'onPointerLeave', onkeydown: 'onKeyDown', onsubmit: 'onSubmit', oninput: 'onInput' };
const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
const WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;

function lookup(ctx, path) {
  if (path === 'true') return true;
  if (path === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(path)) return +path;
  let v = ctx;
  for (const k of path.split('.')) { if (v == null) return undefined; v = v[k]; }
  return v;
}
function interp(str, ctx) {
  const m = WHOLE.exec(str);
  if (m) return lookup(ctx, m[1]);
  if (str.indexOf('{{') < 0) return str;
  return str.replace(HOLE, (_, p) => { const v = lookup(ctx, p); return v == null ? '' : String(v); });
}

// Parse the <x-dc> body once into a light tree we can render many times.
export function parseTemplate(html) {
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
  const helmet = [];
  const conv = (node) => {
    if (node.nodeType === 3) { const t = node.nodeValue; return /^\s*$/.test(t) ? null : { text: t }; }
    if (node.nodeType !== 1) return null;
    const tag = node.localName;
    if (tag === 'helmet') { helmet.push(node.innerHTML); return null; }
    const attrs = [];
    for (const a of node.attributes) attrs.push([a.name, a.value]);
    const kids = [];
    for (const c of node.childNodes) { const k = conv(c); if (k) kids.push(k); }
    return { tag, attrs, kids };
  };
  const root = [];
  for (const c of doc.body.childNodes) { const k = conv(c); if (k) root.push(k); }
  return { root, helmet };
}

export function injectHelmet(helmet) {
  for (const html of helmet) {
    const box = document.createElement('div');
    box.innerHTML = html;
    for (const el of [...box.children]) document.head.appendChild(el);
  }
}

function renderNodes(nodes, ctx, out) {
  for (const n of nodes) renderNode(n, ctx, out);
  return out;
}
function attr(n, name) { const a = n.attrs.find(x => x[0] === name); return a ? a[1] : null; }
function renderNode(n, ctx, out) {
  if (n.text != null) { out.push(interp(n.text, ctx)); return; }
  if (n.tag === 'sc-for') {
    const list = interp(attr(n, 'list') || '', ctx) || [];
    const as = attr(n, 'as') || 'item';
    list.forEach((item, i) => {
      const c = Object.assign({}, ctx, { [as]: item, $index: i });
      renderNodes(n.kids, c, out);
    });
    return;
  }
  if (n.tag === 'sc-if') { if (interp(attr(n, 'value') || '', ctx)) renderNodes(n.kids, ctx, out); return; }
  const props = {};
  const type = (attr(n, 'type') || '').toLowerCase();
  for (const [name, raw] of n.attrs) {
    if (name.startsWith('hint-')) continue;
    let v = interp(raw, ctx);
    if (name === 'onchange') { props[type === 'number' ? 'onChange' : 'onInput'] = v; continue; }
    if (name.startsWith('on')) { props[EVENT_MAP[name] || name] = v; continue; }
    if (name === 'disabled') { props.disabled = v === true || v === 'true' || v === ''; continue; }
    if (name === 'value') { props.value = v == null ? '' : v; continue; }
    props[name] = v;
  }
  out.push(h(n.tag, props, renderNodes(n.kids, ctx, [])));
}

export class DCLogic extends Component {
  render() {
    const tpl = this.constructor.tpl;
    const base = this.renderVals ? this.renderVals() : {};
    const vals = Object.assign({}, base, this.extraVals ? this.extraVals(base) : {});
    const out = renderNodes(tpl.root, vals, []);
    return out.length === 1 ? out[0] : h('div', null, out);
  }
}
