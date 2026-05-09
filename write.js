const fs = require('fs');
const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>KAU Esports - Tournament AR</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    canvas.a-canvas { background: transparent !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; }
    video { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; z-index: -1 !important; }
    #ar-hint { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.78); color: #00E676; font-family: 'Segoe UI', system-ui, sans-serif; font-size: clamp(0.75rem, 3.8vw, 0.95rem); font-weight: 600; padding: 11px 24px; border-radius: 999px; border: 1.5px solid #00E676; white-space: nowrap; z-index: 9999; pointer-events: none; transition: opacity 0.6s ease; }
    #ar-hint.hidden { opacity: 0; }
  </style>
  <script src="https://aframe.io/releases/1.4.0/aframe.min.js"><\/script>
  <script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js"><\/script>
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
    import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
    const app = initializeApp({ apiKey: "AIzaSyCqbp0pJAyTi9SfSS6Ah8DYNucWhfRs5-o", authDomain: "kauesports-83131.firebaseapp.com", projectId: "kauesports-83131", storageBucket: "kauesports-83131.firebasestorage.app", messagingSenderId: "1021860460145", appId: "1:1021860460145:web:1d24517d2ab254e443cdd0" });
    const db = getFirestore(app);

    function formatDate(d) { if (!d) return 'TBD'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    function truncate(s, max) { if (!s || s === 'null') return '\u2014'; return s.length > max ? s.substring(0, max - 1) + '\u2026' : s; }

    function plane(w, h, color, pos, opacity) {
      const p = document.createElement('a-plane');
      p.setAttribute('width', w); p.setAttribute('height', h);
      p.setAttribute('color', color); p.setAttribute('position', pos);
      p.setAttribute('opacity', opacity != null ? opacity : 1);
      return p;
    }
    function txt(value, pos, color, width) {
      const t = document.createElement('a-text');
      t.setAttribute('value', value); t.setAttribute('position', pos);
      t.setAttribute('align', 'center'); t.setAttribute('color', color);
      t.setAttribute('width', width); t.setAttribute('wrapCount', '18');
      return t;
    }

    function buildCards(tournaments) {
      const marker = document.querySelector('a-marker');
      if (!marker) return;
      marker.querySelectorAll('.ar-card, .ar-header').forEach(el => el.remove());
      const count = tournaments.length;
      const spacing = 0.88, cW = 0.80, cH = 1.32, cY = 0.72;
      const totalW = (count - 1) * spacing;
      marker.setAttribute('scale', '0.72 0.72 0.72');

      const bannerY = cY + cH / 2 + 0.24;
      const bannerW = Math.max(totalW + cW + 0.22, 2.8);
      const hb = plane(bannerW + 0.04, 0.34, '#00C853', '0 ' + bannerY + ' -0.01'); hb.classList.add('ar-header'); marker.appendChild(hb);
      const hf = plane(bannerW, 0.30, '#FFFFFF', '0 ' + bannerY + ' 0'); hf.classList.add('ar-header'); marker.appendChild(hf);
      const ht = txt('KAU ESPORTS TOURNAMENTS', '0 ' + bannerY + ' 0.001', '#006B2C', '4.2'); ht.classList.add('ar-header'); marker.appendChild(ht);

      const sColor = { upcoming: '#00C853', ongoing: '#00E676', active: '#00E676', completed: '#546E7A', cancelled: '#EF5350' };

      tournaments.forEach((t, i) => {
        const x = -totalW / 2 + i * spacing;
        const g = document.createElement('a-entity');
        const status = (t.status || 'upcoming').toLowerCase();
        const sc = sColor[status] || '#00C853';
        g.classList.add('ar-card');
        g.setAttribute('position', x + ' 0.04 0');

        g.appendChild(plane(cW + 0.06, cH + 0.06, '#000000', '0.04 ' + (cY - 0.04) + ' -0.015', 0.40));
        g.appendChild(plane(cW + 0.04, cH + 0.04, '#00C853', '0 ' + cY + ' -0.005'));
        g.appendChild(plane(cW, cH, '#FFFFFF', '0 ' + cY + ' 0'));
        const stripH = cH * 0.22;
        g.appendChild(plane(cW, stripH, '#00C853', '0 ' + (cY + cH / 2 - stripH / 2) + ' 0.001'));

        const top = cY + cH * 0.36;
        g.appendChild(txt(truncate(t.game || 'Game', 10), '0 ' + top + ' 0.002', '#FFFFFF', '1.80'));
        g.appendChild(txt(truncate(t.name || 'Tournament', 16), '0 ' + (top - 0.17) + ' 0.002', '#004D1F', '1.40'));

        const divY = top - 0.28;
        g.appendChild(plane(cW * 0.84, 0.007, '#00C853', '0 ' + divY + ' 0.002'));

        const rowStart = divY - 0.09, rowGap = 0.128;
        [['Format: ' + truncate(t.format || '\u2014', 12), '#1B5E20'],['Start: ' + formatDate(t.startDate), '#1A1A1A'],['End:   ' + formatDate(t.endDate), '#1A1A1A'],['Players: ' + (t.registeredPlayers || 0) + '/' + (t.maxPlayers || '?'), '#1A1A1A']].forEach(([val, col], ri) => { g.appendChild(txt(val, '0 ' + (rowStart - ri * rowGap) + ' 0.002', col, '1.22')); });

        const barY = rowStart - 4 * rowGap - 0.035;
        const barW = cW * 0.80;
        g.appendChild(plane(barW, 0.044, '#C8E6C9', '0 ' + barY + ' 0.002'));
        const ratio = Math.min((t.registeredPlayers || 0) / (t.maxPlayers || 1), 1);
        if (ratio > 0) { const fw = barW * ratio; g.appendChild(plane(fw, 0.044, '#00C853', (-barW / 2 + fw / 2) + ' ' + barY + ' 0.003')); }

        const badgeY = barY - 0.10;
        const bTxt = (status === 'completed' || status === 'cancelled') ? '#FFFFFF' : '#003A1A';
        g.appendChild(plane(0.50, 0.110, sc, '0 ' + badgeY + ' 0.002'));
        g.appendChild(txt(status.toUpperCase(), '0 ' + badgeY + ' 0.004', bTxt, '0.85'));
        marker.appendChild(g);
      });
    }

    function ensureVideoPlays() { const v = document.querySelector('video'); if (!v) return false; v.setAttribute('playsinline', 'true'); v.setAttribute('webkit-playsinline', 'true'); v.muted = true; v.play().catch(() => {}); return true; }

    async function loadTournaments() { try { const snap = await getDocs(collection(db, 'tournaments')); const rows = []; snap.forEach(doc => rows.push({ id: doc.id, ...doc.data() })); const order = { ongoing: 0, active: 0, upcoming: 1, completed: 2, cancelled: 3 }; rows.sort((a, b) => (order[(a.status || 'upcoming').toLowerCase()] ?? 9) - (order[(b.status || 'upcoming').toLowerCase()] ?? 9)); buildCards(rows); } catch (err) { console.error('Firebase error:', err); } }

    document.addEventListener('DOMContentLoaded', () => {
      const scene = document.querySelector('a-scene');
      const hint = document.getElementById('ar-hint');
      scene.addEventListener('loaded', () => {
        loadTournaments();
        let attempts = 0;
        const iv = setInterval(() => { if (ensureVideoPlays() || ++attempts > 20) clearInterval(iv); }, 250);
        document.querySelector('a-marker').addEventListener('markerFound', () => { hint.classList.add('hidden'); }, { once: true });
      });
    });
  <\/script>
</head>
<body style="margin:0;overflow:hidden;">
  <div id="ar-hint">Point camera at the Hiro marker</div>
  <a-scene embedded renderer="alpha: true; antialias: true; precision: medium;" arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;" vr-mode-ui="enabled: false">
    <a-marker preset="hiro" smooth="true" smoothCount="10" smoothTolerance="0.01" smoothThreshold="2"></a-marker>
    <a-entity camera></a-entity>
  </a-scene>
</body>
</html>`;
fs.writeFileSync('c:/Users/mkhal/Desktop/AR/lab1/tournaments-ar.html', html, 'utf8');
console.log('Written', html.length, 'chars, lines:', html.split('\n').length);