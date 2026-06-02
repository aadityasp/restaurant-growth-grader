import { createServer } from 'node:http'
import { grade } from './grader.mjs'

const PORT = process.env.PORT || 8799

const PAGE = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Restaurant Growth Grader</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--paper:#F6F3EC;--ink:#191510;--soft:#6B6457;--line:#E3DCCD;--accent:#2742D6;--good:#1f9d6b;--warn:#d98324;--bad:#d1453b}
body{font-family:Inter,system-ui,sans-serif;background:var(--paper);color:var(--ink);line-height:1.5;-webkit-font-smoothing:antialiased}
.wrap{max-width:880px;margin:0 auto;padding:28px 20px 80px}
.brand{font-family:Fraunces,serif;font-weight:600;font-size:18px}
.tag{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--soft);text-transform:uppercase;letter-spacing:.14em}
.hero{margin-top:8vh;text-align:center}
h1{font-family:Fraunces,serif;font-weight:600;font-size:clamp(2rem,5.5vw,3.4rem);line-height:1.05;letter-spacing:-.5px}
h1 .em{font-style:italic;color:var(--accent)}
.sub{color:var(--soft);margin-top:14px;font-size:1.05rem}
.form{margin:28px auto 0;display:flex;gap:10px;max-width:560px}
input{flex:1;padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:#fff;font-size:15px;font-family:inherit}
input:focus{outline:none;border-color:var(--accent)}
button{padding:14px 20px;border:0;border-radius:12px;background:var(--ink);color:var(--paper);font-weight:600;font-size:15px;cursor:pointer;transition:background .2s}
button:hover{background:var(--accent)}
.chips{margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.chip{font-size:12px;color:var(--soft);border:1px solid var(--line);border-radius:999px;padding:6px 12px;cursor:pointer;background:#fff}
.chip:hover{border-color:var(--accent);color:var(--accent)}
.scan{margin-top:40px;max-width:520px;margin-inline:auto;display:none}
.scan.on{display:block}
.scanrow{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);font-size:14px;color:var(--soft);opacity:.4;transition:opacity .3s}
.scanrow.active{opacity:1;color:var(--ink)}
.scanrow .dot{width:16px;height:16px;border-radius:50%;border:2px solid var(--line);flex:0 0 auto}
.scanrow.done .dot{background:var(--accent);border-color:var(--accent)}
.report{display:none;margin-top:30px}
.report.on{display:block;animation:rise .5s ease}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.top{display:flex;gap:24px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px;flex-wrap:wrap}
.dial{position:relative;width:130px;height:130px;flex:0 0 auto}
.dial .num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.dial .num b{font-family:Fraunces,serif;font-size:34px;font-weight:600;line-height:1}
.dial .num span{font-size:11px;color:var(--soft)}
.summary{flex:1;min-width:240px}
.summary .tier{font-family:Fraunces,serif;font-size:22px;font-weight:600}
.risk{margin-top:8px;font-size:14px;color:var(--bad);font-weight:600}
.ai{margin-top:10px;font-size:14px;color:var(--ink);background:#EEF1FD;border:1px solid #cdd5fb;border-radius:10px;padding:10px 12px}
.ai .lab{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--accent);text-transform:uppercase;letter-spacing:.12em;display:block;margin-bottom:3px}
.dims{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}
.dim{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px}
.dim h3{font-size:13px;font-weight:600}
.dim .bar{height:6px;background:var(--line);border-radius:4px;margin:8px 0;overflow:hidden}
.dim .bar i{display:block;height:100%;border-radius:4px}
.dim .sc{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--soft)}
.sec{margin-top:26px}
.sec h2{font-family:Fraunces,serif;font-size:20px;font-weight:600;margin-bottom:12px}
.fix{display:flex;gap:12px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:13px 15px;margin-bottom:9px}
.fix .pri{font-family:'JetBrains Mono',monospace;font-weight:600;color:var(--accent)}
.fix .body .t{font-weight:600;font-size:14px}
.fix .body .a{font-size:12px;color:var(--soft);margin-top:2px}
.fix .flag{margin-left:auto;font-size:10px;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.1em;color:var(--bad);align-self:center;white-space:nowrap}
.checks{columns:2;column-gap:24px}
.ck{break-inside:avoid;display:flex;gap:8px;font-size:13px;padding:4px 0;color:var(--soft)}
.ck .m{font-weight:700}
.ck.ok .m{color:var(--good)}.ck.no .m{color:var(--bad)}
.note{background:#FBF1E6;border:1px solid #e9cfa6;border-radius:12px;padding:14px;font-size:13px;color:#7a5a2e;margin-top:18px}
.cta{margin-top:26px;background:var(--ink);color:var(--paper);border-radius:16px;padding:20px;text-align:center}
.cta b{font-family:Fraunces,serif;font-size:18px}
.cta p{color:#cfc8ba;font-size:13px;margin-top:4px}
.footer{margin-top:40px;text-align:center;font-size:12px;color:var(--soft);font-family:'JetBrains Mono',monospace}
.err{background:#FBF1E6;border:1px solid #e9cfa6;border-radius:12px;padding:16px;font-size:14px;color:#7a5a2e;margin-top:24px}
@media(max-width:620px){.dims{grid-template-columns:1fr}.checks{columns:1}}
</style></head><body>
<div class="wrap">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div class="brand">Growth Grader</div>
    <div class="tag">built by Aditya Appana</div>
  </div>

  <div class="hero" id="hero">
    <h1>Is your restaurant<br>winning <span class="em">online?</span></h1>
    <p class="sub">Drop your website in. In a few seconds you'll see your online health grade and exactly what's costing you orders.</p>
    <div class="form">
      <input id="url" placeholder="yourrestaurant.com" autocomplete="off"/>
      <button id="go">Grade it</button>
    </div>
    <div class="chips">
      <span class="chip" data-u="joespizzanyc.com">Joe's Pizza</span>
      <span class="chip" data-u="shakeshack.com">Shake Shack</span>
      <span class="chip" data-u="bleeckerstreetpizza.com">Bleecker St Pizza</span>
    </div>
  </div>

  <div class="scan" id="scan">
    <div class="scanrow" data-i="0"><span class="dot"></span> Reading your website</div>
    <div class="scanrow" data-i="1"><span class="dot"></span> Checking Google SEO signals</div>
    <div class="scanrow" data-i="2"><span class="dot"></span> Inspecting the guest experience</div>
    <div class="scanrow" data-i="3"><span class="dot"></span> Reviewing local listing readiness</div>
    <div class="scanrow" data-i="4"><span class="dot"></span> Writing your action plan with AI</div>
  </div>

  <div class="report" id="report"></div>
  <div class="footer">No phone number required. Prototype for Owner.com &middot; the real Grader gates this behind SMS.</div>
</div>
<script>
const $=s=>document.querySelector(s)
const steps=[...document.querySelectorAll('.scanrow')]
function color(p){return p>=85?'#1f9d6b':p>=70?'#3a8f5f':p>=50?'#d98324':'#d1453b'}
async function run(url){
  $('#hero').style.display='none';$('#report').className='report';$('#report').innerHTML=''
  const scan=$('#scan');scan.className='scan on';steps.forEach(s=>s.className='scanrow')
  let i=0;const t=setInterval(()=>{if(i>0)steps[i-1].classList.add('done');if(i<steps.length){steps[i].classList.add('active');i++}},620)
  let data
  try{const r=await fetch('/api/grade',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url})});data=await r.json()}
  catch(e){data={error:'net'}}
  // let the theater play a beat
  await new Promise(r=>setTimeout(r,Math.max(0,3400-(Date.now()%1))))
  clearInterval(t);steps.forEach(s=>s.classList.add('done','active'));scan.className='scan'
  render(data,url)
}
function render(d,url){
  const R=$('#report');R.className='report on'
  if(d.error){R.innerHTML='<div class="err"><b>We couldn\\'t read '+(d.business?.host||url)+'.</b><br>'+(d.note||'The site blocked our reader or is down.')+'</div>';return}
  const c=color(d.grade)
  const dash=2*Math.PI*56, off=dash*(1-d.grade/100)
  const dims=d.dimensions.map(x=>{const p=Math.round(x.score/x.max*100);return '<div class="dim"><h3>'+x.name+'</h3><div class="bar"><i style="width:'+p+'%;background:'+color(p)+'"></i></div><div class="sc">'+x.score+' / '+x.max+'</div></div>'}).join('')
  const fixes=d.fixes.map(f=>'<div class="fix"><span class="pri">'+String(f.priority).padStart(2,'0')+'</span><div class="body"><div class="t">'+f.title+'</div><div class="a">'+f.area+'</div></div>'+(f.critical?'<span class="flag">Critical</span>':'')+'</div>').join('')
  const allChecks=d.dimensions.flatMap(x=>x.checks).map(ck=>'<div class="ck '+(ck.ok?'ok':'no')+'"><span class="m">'+(ck.ok?'✓':'✕')+'</span>'+ck.label+'</div>').join('')
  R.innerHTML=
    '<div class="top"><svg class="dial" viewBox="0 0 130 130"><circle cx="65" cy="65" r="56" fill="none" stroke="#E3DCCD" stroke-width="10"/><circle cx="65" cy="65" r="56" fill="none" stroke="'+c+'" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+dash+'" stroke-dashoffset="'+off+'" transform="rotate(-90 65 65)"/></svg>'
    +'<div class="dial num" style="position:relative;width:0;height:0"></div>'
    +'<div class="summary"><div class="tier" style="color:'+c+'">'+d.tier+' &middot; '+d.grade+'/100</div>'
    +'<div style="font-size:13px;color:var(--soft);margin-top:2px">'+(d.business.title||d.business.host)+'</div>'
    +'<div class="risk">You could be losing ~$'+d.revenueAtRisk.toLocaleString()+'/mo from '+d.problemCount+' fixable issues</div>'
    +(d.ai?'<div class="ai"><span class="lab">AI growth advisor</span>'+d.ai+'</div>':'')
    +'</div></div>'
    +'<div class="dims">'+dims+'</div>'
    +'<div class="sec"><h2>Your priority fixes</h2>'+fixes+'</div>'
    +'<div class="sec"><h2>Everything we checked</h2><div class="checks">'+allChecks+'</div></div>'
    +'<div class="cta"><b>Fix all of this, automatically.</b><p>This is the on-ramp: from a free grade to an AI that rewrites the site, fills the gaps, and keeps you ahead of competitors.</p></div>'
  // place the number inside the dial
  R.querySelector('.top').insertAdjacentHTML('afterbegin','')
  const dial=R.querySelector('.dial');const n=document.createElement('div');n.className='num';n.innerHTML='<b style="color:'+c+'">'+d.grade+'</b><span>of 100</span>';dial.parentElement.querySelector('.dial').insertAdjacentElement('afterend',n);n.style.cssText='position:relative;margin-left:-130px;width:130px;height:130px;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none'
}
$('#go').onclick=()=>{const u=$('#url').value.trim();if(u)run(u)}
$('#url').addEventListener('keydown',e=>{if(e.key==='Enter'&&$('#url').value.trim())run($('#url').value.trim())})
document.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{$('#url').value=c.dataset.u;run(c.dataset.u)})
</script></body></html>`

const srv = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/grade') {
    let body = ''
    req.on('data', (d) => (body += d))
    req.on('end', async () => {
      try {
        const { url } = JSON.parse(body || '{}')
        const out = await grade(url)
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(out))
      } catch (e) {
        res.writeHead(500, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: 'server', message: String(e) }))
      }
    })
    return
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(PAGE)
})
srv.listen(PORT, () => console.log('Growth Grader on http://localhost:' + PORT))
