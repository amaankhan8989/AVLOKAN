/* ==========================================================================
   AVLOKAN - Mission Dashboard & AOI Registry
   ========================================================================== */

/* ================= DASHBOARD ================= */
function animCounters(){
 document.querySelectorAll('[data-count]').forEach(el=>{
  const target=+el.dataset.count,dur=1000,t0=performance.now();
  (function step(now){
   const p=Math.min(1,(now-t0)/dur);
   el.textContent=Math.round(target*(1-Math.pow(1-p,3))).toLocaleString('en-IN');
   if(p<1)requestAnimationFrame(step)})(t0)})}
function tickClock(){
 document.getElementById('clock').textContent=
  new Date().toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour12:false})+' IST'}

/* ================= AOI LIST ================= */
function renderAoiList(){
 document.getElementById('aoiList').innerHTML=AOIS.map(a=>`
  <div class="aoi-row" onclick="openInv('${a.id}')">
   <span class="aoi-dot" style="background:${colOf(a.status)}"></span>
   <div><div class="aoi-n">${a.name}</div>
   <div class="aoi-m mono">${a.lat.toFixed(3)}°N ${a.lng.toFixed(3)}°E · r=${a.rad} km · conf ${a.conf}%</div></div>
   <span class="aoi-go">→</span>
  </div>`).join('')}

/* ================= STUBS ================= */
function renderStubs(){
 Object.entries(STUBS).forEach(([id,s])=>{
  const el=document.getElementById('view-'+id);if(!el)return;
  el.innerHTML=`<div class="panel stub">
   <div class="si">${ICONS[s.icon]}</div>
   <h2>${s.title}</h2>
   <p>${s.desc}</p>
   <div class="ph">Scheduled — Build Phase ${s.phase}</div>
   <div class="flowstrip">${flowStrip(s.flow)}</div>
   <button class="btn btn-ghost" onclick="go('dashboard')">← Back to Dashboard</button>
  </div>`})}
