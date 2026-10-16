// Applies findings of the 16.10 live check to a design App.dc.html (built-in catalog + audio formula).
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  let s = fs.readFileSync(f, 'utf8');
  const rep = (a, b) => { if (s.split(a).length !== 2) throw new Error(f + ': not found ' + a.slice(0, 70)); s = s.split(a).join(b); };
  rep("if (m.flat != null) return m.flat;\nreturn this.r2(Math.ceil(m.per1k * p.chars / 1000 / m.step - 1e-9) * m.step);",
      "if (m.flat != null) return m.flat;\nif (m.block) return this.r2(m.per1k * Math.ceil(p.chars / m.block) * m.block / 1000);\nreturn this.r2(Math.ceil(m.per1k * p.chars / 1000 / m.step - 1e-9) * m.step);");
  rep("{ id: 'el3', name: 'ElevenLabs v3', per1k: 3, step: 0.25 }", "{ id: 'el3', name: 'ElevenLabs v3', per1k: 3, block: 50 }");
  rep("{ id: 'el4t', name: 'ElevenLabs v4 Turbo', per1k: 3, step: 0.25 }", "{ id: 'el4t', name: 'ElevenLabs v4 Turbo', per1k: 3, block: 50 }");
  rep("{ id: 'el4', name: 'ElevenLabs v4', flat: 1.15 }", "{ id: 'el4', name: 'ElevenLabs v4', per1k: 4.6, block: 50 }");
  rep("{ id: 'seedaudio', name: 'Seed Audio 1.0', per1k: 6.7, step: 0.1 }", "{ id: 'seedaudio', name: 'Seed Audio 1.0', per1k: 6.7, step: 0.05 }");
  rep("{ id: 'mm28', name: 'MiniMax Speech 2.8 HD', per1k: 3, step: 0.25 }", "{ id: 'mm28', name: 'MiniMax Speech 2.8 HD', per1k: 3, block: 50 }");
  rep("{ id: 'seedsp', name: 'Seed Speech', per1k: 2, step: 0.25 }", "{ id: 'seedsp', name: 'Seed Speech', per1k: 2, block: 50 }");
  rep("{ id: 'qwen3', name: 'Qwen Audio 3.0 TTS', per1k: 0.44, step: 0.01 }", "{ id: 'qwen3', name: 'Qwen Audio 3.0 TTS', per1k: 0.43, step: 0.01 }");
  rep("before: { '480p': 6, '720p': 6 }, ceil: true }", "before: { '480p': 6, '720p': 6, '4K': 26 }, ceil: true }");
  fs.writeFileSync(f, s);
  console.log('patched', f);
}
