// 把一個完整的 HTML 頁面加密，做成需要密碼才能打開的頁面（和講義用同樣的 AES-GCM 加密）。
// 用法：LOCK_PW='密碼' node tools/lock-page.mjs 原始檔.html 輸出檔.html
// 輸出的頁面放在 repo 的子資料夾裡（例如 events/），左上角的「← 講義目錄」會連回 index。
import fs from 'fs';
import { webcrypto as crypto } from 'crypto';

const [src, out] = process.argv.slice(2), pw = process.env.LOCK_PW;
if (!src || !out || !pw) { console.error("用法：LOCK_PW='密碼' node tools/lock-page.mjs 原始檔.html 輸出檔.html"); process.exit(1); }

const html = fs.readFileSync(src, 'utf8');
const title = (html.match(/<title>([^<]*)<\/title>/i) || [, '講義'])[1].trim();
const b64 = u => Buffer.from(u).toString('base64');
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(html)));
const P = JSON.stringify({ s: b64(salt), i: b64(iv), c: b64(ct), t: title }).replace(/</g, '\\u003c');
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

fs.writeFileSync(out, `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title><link rel="icon" href="../eng.png"><link rel="apple-touch-icon" href="../eng.png"><style>
:root{--paper:#f3f6fb;--card:#fff;--ink:#1c2740;--mute:#5d6a85;--line:#d5ddec;--pen:#2456c9;--pen-ink:#fff;--bad:#c8402f;--zh:"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root{--paper:#121826;--card:#1b2335;--ink:#e8edf7;--mute:#9aa6bf;--line:#303b55;--pen:#7ea6ff;--pen-ink:#0d1424;--bad:#ff8a78;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 var(--zh);padding:20px 16px 48px}
main{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
.head{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}
.head h1{font:600 22px/1.3 var(--zh);margin:0;text-align:center;overflow-wrap:anywhere}
@media (max-width:520px){.head{grid-template-columns:1fr}.head h1{text-align:left}}
.back{justify-self:start;color:var(--pen);border:1.5px solid var(--pen);border-radius:10px;padding:6px 14px;text-decoration:none;font-weight:600;font-size:15px}
form{background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:22px 18px;display:flex;flex-direction:column;gap:14px}
input{font:inherit;color:var(--ink);background:var(--paper);border:0;border-bottom:3px solid var(--ink);padding:8px 6px;font-size:20px}
button{font:600 16px var(--zh);background:var(--pen);color:var(--pen-ink);border:0;border-radius:10px;padding:11px 18px;cursor:pointer}
button:disabled{opacity:.5}.mute{color:var(--mute);font-size:14px}.err{color:var(--bad);font-weight:600;min-height:1.6em;margin:0}
</style></head><body><main><div class="head"><a class="back" href="../">← 講義目錄</a><h1>${esc(title)}</h1><div></div></div>
<form id="f"><label class="mute" for="pw">請輸入密碼</label><input id="pw" type="password" autocomplete="off"><button id="go">打開</button><p class="err" id="msg"></p></form></main>
<script>
var P=${P};
function bytes(x){return Uint8Array.from(atob(x),function(c){return c.charCodeAt(0)})}
function get(k){try{return localStorage.getItem(k)||''}catch(e){return ''}}
function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
async function open(pw){
  var km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
  var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(P.s),iterations:200000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
  var html=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(P.i)},key,bytes(P.c)));
  put('page-pw:'+P.t,pw);if(!get('eng-pw'))put('eng-pw',pw);
  document.open();document.write(html);document.close()}
var f=document.getElementById('f'),inp=document.getElementById('pw'),msg=document.getElementById('msg'),go=document.getElementById('go');
f.onsubmit=function(e){e.preventDefault();if(!inp.value)return;go.disabled=true;msg.textContent='解鎖中…';
  open(inp.value).catch(function(){go.disabled=false;msg.textContent='密碼不對，再試一次。'})};
if(!window.crypto||!crypto.subtle){msg.textContent='這個瀏覽器無法打開上鎖的頁面，請用 Safari 或 Chrome 開啟 https 網址。';go.disabled=true}
else{var tries=[get('page-pw:'+P.t),get('eng-pw')].filter(function(p,i,a){return p&&a.indexOf(p)===i});
  (function next(){if(!tries.length)return inp.focus();open(tries.shift()).catch(next)})()}
</script></body></html>`);
console.log('已加密：' + out + '（' + title + '）');
