<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>onepost – app</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
:root{
  --bg:#06060a;--bg2:#0c0c12;--surface:rgba(255,255,255,0.04);--surface2:rgba(255,255,255,0.07);
  --border:rgba(255,255,255,0.08);--border-bright:rgba(255,255,255,0.15);
  --accent:#8b5cf6;--accent2:#a78bfa;--accent3:#c4b5fd;
  --text:#f8f8ff;--text2:rgba(248,248,255,0.6);--text3:rgba(248,248,255,0.35);
  --green:#34d399;--orange:#fb923c;--red:#f87171;
}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased;}
.orb{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0;}
.orb-1{width:500px;height:500px;background:rgba(139,92,246,0.07);top:-100px;left:-100px;}
.orb-2{width:400px;height:400px;background:rgba(96,165,250,0.04);bottom:0;right:-100px;}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:100;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:rgba(6,6,10,0.8);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);}
.logo{font-size:18px;font-weight:800;background:linear-gradient(135deg,#fff,var(--accent3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.nav-right{display:flex;align-items:center;gap:12px;}
.usage-pill{font-size:12px;color:var(--text2);background:var(--surface);border:1px solid var(--border);border-radius:100px;padding:4px 12px;}
.usage-pill span{color:var(--text);font-weight:700;}
.btn-upgrade{background:linear-gradient(135deg,var(--accent),#7c3aed);color:#fff;border:none;cursor:pointer;padding:7px 16px;border-radius:8px;font-size:13px;font-weight:700;transition:all .2s;display:none;}
.btn-upgrade:hover{transform:translateY(-1px);}
.btn-signout{background:transparent;color:var(--text3);border:1px solid var(--border);cursor:pointer;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:600;transition:all .2s;}
.btn-signout:hover{color:var(--text2);border-color:var(--border-bright);}

/* MAIN */
main{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:80px 24px 40px;}

.app-header{text-align:center;padding:32px 0 40px;}
.app-header h1{font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:8px;}
.app-header p{color:var(--text2);font-size:15px;}

.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
@media(max-width:800px){.grid{grid-template-columns:1fr;}}

/* INPUT PANEL */
.input-panel{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:14px;}
.panel-label{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:1.5px;}
textarea{background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:12px;padding:16px;color:var(--text);font-size:14px;font-family:inherit;line-height:1.65;resize:none;outline:none;transition:border-color .2s;min-height:240px;width:100%;}
textarea:focus{border-color:rgba(139,92,246,0.5);}
textarea::placeholder{color:var(--text3);}
.char-row{display:flex;justify-content:space-between;align-items:center;}
.char-count{font-size:11px;color:var(--text3);}
.btn-gen{background:linear-gradient(135deg,var(--accent),#7c3aed);color:#fff;border:none;cursor:pointer;padding:14px;border-radius:12px;font-size:15px;font-weight:700;transition:all .25s;box-shadow:0 0 30px rgba(139,92,246,0.25);display:flex;align-items:center;justify-content:center;gap:8px;width:100%;}
.btn-gen:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 0 50px rgba(139,92,246,0.4);}
.btn-gen:disabled{opacity:0.5;cursor:not-allowed;}
.spin{width:16px;height:16px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;display:none;}
@keyframes sp{to{transform:rotate(360deg)}}

/* OUTPUT PANEL */
.output-panel{display:flex;flex-direction:column;gap:12px;}
.out-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;transition:all .3s;}
.out-card.loading{opacity:0.4;}
.out-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.out-platform{font-size:13px;font-weight:700;display:flex;align-items:center;gap:7px;}
.btn-copy{background:var(--surface2);border:1px solid var(--border);color:var(--text2);cursor:pointer;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;transition:all .2s;}
.btn-copy:hover{border-color:var(--border-bright);color:var(--text);}
.btn-copy.ok{background:rgba(52,211,153,0.1);border-color:rgba(52,211,153,0.3);color:var(--green);}
.out-text{color:var(--text2);font-size:13px;line-height:1.65;white-space:pre-wrap;word-break:break-word;max-height:150px;overflow-y:auto;}
.out-text::-webkit-scrollbar{width:3px;}
.out-text::-webkit-scrollbar-thumb{background:var(--border);}

/* UPGRADE MODAL */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;display:none;align-items:center;justify-content:center;backdrop-filter:blur(4px);}
.modal-bg.show{display:flex;}
.modal{background:#0f0f18;border:1px solid rgba(139,92,246,0.3);border-radius:24px;padding:40px;max-width:400px;width:90%;text-align:center;box-shadow:0 0 80px rgba(139,92,246,0.2);}
.modal h2{font-size:24px;font-weight:800;letter-spacing:-0.5px;margin-bottom:10px;}
.modal p{color:var(--text2);font-size:15px;line-height:1.6;margin-bottom:28px;}
.modal-plans{display:flex;flex-direction:column;gap:10px;margin-bottom:20px;}
.modal-plan{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:all .2s;}
.modal-plan:hover,.modal-plan.sel{border-color:rgba(139,92,246,0.5);background:rgba(139,92,246,0.07);}
.modal-plan-name{font-weight:700;font-size:15px;}
.modal-plan-price{font-size:13px;color:var(--accent3);font-weight:700;}
.modal-plan-detail{font-size:12px;color:var(--text3);}
.btn-checkout{width:100%;background:linear-gradient(135deg,var(--accent),#7c3aed);color:#fff;border:none;cursor:pointer;padding:14px;border-radius:12px;font-size:15px;font-weight:700;transition:all .25s;box-shadow:0 0 30px rgba(139,92,246,0.3);}
.btn-checkout:hover{transform:translateY(-1px);}
.modal-close{background:transparent;border:none;color:var(--text3);cursor:pointer;font-size:13px;margin-top:12px;}

/* NOTIF */
.notif{position:fixed;bottom:24px;right:24px;z-index:999;background:rgba(20,20,28,0.95);border:1px solid var(--border-bright);border-radius:14px;padding:12px 18px;font-size:14px;display:flex;align-items:center;gap:10px;transform:translateY(80px);opacity:0;transition:all .35s cubic-bezier(.34,1.56,.64,1);backdrop-filter:blur(16px);}
.notif.show{transform:translateY(0);opacity:1;}
</style>
</head>
<body>

<div class="orb orb-1"></div>
<div class="orb orb-2"></div>

<!-- NAV -->
<nav>
  <div class="logo">onepost</div>
  <div class="nav-right">
    <div class="usage-pill" id="usagePill">loading…</div>
    <button class="btn-upgrade" id="upgradeBtn" onclick="showUpgrade()">Upgrade →</button>
    <button class="btn-signout" onclick="signOut()">Sign out</button>
  </div>
</nav>

<!-- MAIN -->
<main>
  <div class="app-header">
    <h1>What are you sharing today?</h1>
    <p>Paste your content — get five platform-ready posts in seconds.</p>
  </div>

  <div class="grid">
    <!-- INPUT -->
    <div class="input-panel">
      <span class="panel-label">Your Content</span>
      <textarea id="contentInput" placeholder="Paste your blog post, transcript, podcast notes, or any long-form content here..."></textarea>
      <div class="char-row">
        <span class="char-count" id="charCount">0 characters</span>
      </div>
      <button class="btn-gen" id="genBtn" onclick="generate()">
        <span id="btnTxt">✨ Generate all platforms</span>
        <div class="spin" id="spinner"></div>
      </button>
    </div>

    <!-- OUTPUT -->
    <div class="output-panel">
      <div class="out-card" id="card-twitter">
        <div class="out-head">
          <div class="out-platform">𝕏 &nbsp;Twitter / X Thread</div>
          <button class="btn-copy" onclick="doCopy('twitter',this)">Copy</button>
        </div>
        <div class="out-text" id="out-twitter">Your Twitter thread will appear here…</div>
      </div>
      <div class="out-card" id="card-linkedin">
        <div class="out-head">
          <div class="out-platform">💼 &nbsp;LinkedIn Post</div>
          <button class="btn-copy" onclick="doCopy('linkedin',this)">Copy</button>
        </div>
        <div class="out-text" id="out-linkedin">Your LinkedIn post will appear here…</div>
      </div>
      <div class="out-card" id="card-instagram">
        <div class="out-head">
          <div class="out-platform">📸 &nbsp;Instagram Caption</div>
          <button class="btn-copy" onclick="doCopy('instagram',this)">Copy</button>
        </div>
        <div class="out-text" id="out-instagram">Your Instagram caption will appear here…</div>
      </div>
      <div class="out-card" id="card-tiktok">
        <div class="out-head">
          <div class="out-platform">🎵 &nbsp;TikTok Hook</div>
          <button class="btn-copy" onclick="doCopy('tiktok',this)">Copy</button>
        </div>
        <div class="out-text" id="out-tiktok">Your TikTok hook will appear here…</div>
      </div>
      <div class="out-card" id="card-newsletter">
        <div class="out-head">
          <div class="out-platform">📧 &nbsp;Newsletter Intro</div>
          <button class="btn-copy" onclick="doCopy('newsletter',this)">Copy</button>
        </div>
        <div class="out-text" id="out-newsletter">Your newsletter intro will appear here…</div>
      </div>
    </div>
  </div>
</main>

<!-- UPGRADE MODAL -->
<div class="modal-bg" id="upgradeModal">
  <div class="modal">
    <h2>Upgrade your plan</h2>
    <p>You've used all your generations this month. Upgrade for unlimited access.</p>
    <div class="modal-plans">
      <div class="modal-plan sel" id="plan-pro" onclick="selectPlan('pro')">
        <div>
          <div class="modal-plan-name">Pro</div>
          <div class="modal-plan-detail">Unlimited generations · Custom voice</div>
        </div>
        <div class="modal-plan-price">€19 / mo</div>
      </div>
      <div class="modal-plan" id="plan-team" onclick="selectPlan('team')">
        <div>
          <div class="modal-plan-name">Team</div>
          <div class="modal-plan-detail">5 seats · Brand voice · API access</div>
        </div>
        <div class="modal-plan-price">€49 / mo</div>
      </div>
    </div>
    <button class="btn-checkout" onclick="checkout()">Start 7-day free trial →</button>
    <br>
    <button class="modal-close" onclick="closeUpgrade()">Maybe later</button>
  </div>
</div>

<div class="notif" id="notif"></div>

<script>
// ── CONFIG ──
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const STRIPE_LINKS = {
  pro:  'YOUR_STRIPE_PRO_PAYMENT_LINK',
  team: 'YOUR_STRIPE_TEAM_PAYMENT_LINK',
};

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let session = null;
let userPlan = 'trial';
let usageCount = 0;
let selectedPlan = 'pro';

// ── INIT ──
async function init() {
  const { data } = await sb.auth.getSession();
  if (!data.session) { window.location.href = '/login.html'; return; }
  session = data.session;
  await loadUsage();
}

async function loadUsage() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/usage?user_id=eq.${session.user.id}&select=count,plan`,
    { headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_ANON_KEY } }
  );
  const rows = await res.json();
  const u = rows[0] || { count: 0, plan: 'trial' };
  userPlan = u.plan;
  usageCount = u.count;

  const limits = { starter: 50, pro: '∞', team: '∞', trial: 10 };
  const lim = limits[userPlan];
  const used = lim === '∞' ? usageCount : `${usageCount} / ${lim}`;

  document.getElementById('usagePill').innerHTML = `<span>${used}</span> generations`;
  if (lim !== '∞') document.getElementById('upgradeBtn').style.display = 'inline-block';
}

// ── GENERATE ──
async function generate() {
  const content = document.getElementById('contentInput').value.trim();
  if (!content) return showNotif('⚠️ Paste some content first');

  const btn = document.getElementById('genBtn');
  const txt = document.getElementById('btnTxt');
  const spin = document.getElementById('spinner');
  btn.disabled = true; txt.style.display = 'none'; spin.style.display = 'block';

  const platforms = ['twitter','linkedin','instagram','tiktok','newsletter'];
  platforms.forEach(p => {
    document.getElementById(`out-${p}`).textContent = 'Generating…';
    document.getElementById(`card-${p}`).classList.add('loading');
  });

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ content })
    });

    if (res.status === 429) {
      showUpgrade();
      platforms.forEach(p => {
        document.getElementById(`out-${p}`).textContent = 'Upgrade to generate more.';
        document.getElementById(`card-${p}`).classList.remove('loading');
      });
      return;
    }

    const data = await res.json();
    platforms.forEach(p => {
      document.getElementById(`out-${p}`).textContent = data[p] || 'Error generating.';
      document.getElementById(`card-${p}`).classList.remove('loading');
    });

    usageCount++;
    await loadUsage();
    showNotif('✅ Generated!');
  } catch(e) {
    showNotif('❌ Something went wrong. Try again.');
    platforms.forEach(p => document.getElementById(`card-${p}`).classList.remove('loading'));
  }

  btn.disabled = false; txt.style.display = 'block'; spin.style.display = 'none';
}

// ── COPY ──
function doCopy(platform, btn) {
  const txt = document.getElementById(`out-${platform}`).textContent;
  if (txt.endsWith('here…') || txt === 'Generating…') return;
  navigator.clipboard.writeText(txt).then(() => {
    btn.textContent = 'Copied!'; btn.classList.add('ok');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('ok'); }, 2000);
  });
}

// ── UPGRADE ──
function showUpgrade() { document.getElementById('upgradeModal').classList.add('show'); }
function closeUpgrade() { document.getElementById('upgradeModal').classList.remove('show'); }
function selectPlan(p) {
  selectedPlan = p;
  document.querySelectorAll('.modal-plan').forEach(el => el.classList.remove('sel'));
  document.getElementById(`plan-${p}`).classList.add('sel');
}
function checkout() {
  const link = STRIPE_LINKS[selectedPlan];
  if (!link || link.startsWith('YOUR_')) return showNotif('⚠️ Stripe not configured yet');
  window.location.href = `${link}?prefilled_email=${session.user.email}`;
}

// ── SIGN OUT ──
async function signOut() {
  await sb.auth.signOut();
  window.location.href = '/login.html';
}

// ── CHAR COUNT ──
document.getElementById('contentInput').addEventListener('input', function() {
  document.getElementById('charCount').textContent = `${this.value.length} characters`;
});

// ── NOTIF ──
function showNotif(msg) {
  const el = document.getElementById('notif');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

init();
</script>
</body>
</html>
