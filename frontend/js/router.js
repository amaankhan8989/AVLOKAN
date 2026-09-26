/* ==========================================================================
   AVLOKAN - Router, Navigation & Authentication
   ========================================================================== */

/* ================= ROUTER / AUTH ================= */
function go(id){
 document.querySelectorAll('.pages .view').forEach(v=>v.classList.toggle('active',v.id==='view-'+id));
 document.querySelectorAll('.snav').forEach(n=>n.classList.toggle('active',n.dataset.go===id));
 document.getElementById('crumb').innerHTML='AVLOKAN / <b>'+TITLES[id]+'</b>';
 App.route=id;window.scrollTo(0,0);
 if(window.innerWidth<=900)toggleSide(false)}
function toggleSide(force){
 const s=document.getElementById('sidebar'),sc=document.getElementById('scrim');
 const open=(force!==undefined)?force:!s.classList.contains('open');
 s.classList.toggle('open',open);sc.classList.toggle('on',open)}
function doLogin(){
 const b=document.getElementById('loginBtn');
 b.disabled=true;b.innerHTML='<span class="spinner"></span> Authenticating against local directory…';
 setTimeout(()=>{
  App.user={name:'Analyst 01',role:'Senior Imagery Analyst'};
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  toast('Welcome, '+App.user.name+' — secure session established','success');
  setTimeout(()=>{initMap();animCounters()},60)},1100)}
function logout(){
 document.getElementById('app').classList.add('hidden');
 document.getElementById('view-login').classList.remove('hidden');
 const b=document.getElementById('loginBtn');
 b.disabled=false;b.textContent='Sign In — Secure Console';
 toast('Session terminated — console locked')}
