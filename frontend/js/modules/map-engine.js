/* ==========================================================================
   AVLOKAN - Live AOI Monitor Canvas Map Engine
   ========================================================================== */

/* ================= EO MAP ENGINE ================= */
const M={lat:22.8,lng:79.6,z:4.4,layers:{optical:true,sar:false,heat:true,labels:true},drag:null,hits:[],ox:0,oy:0};
let mapCv,mapCx;

const worldSize=()=>512*Math.pow(2,M.z);
const projX=lng=>(lng+180)/360*worldSize();
const projY=lat=>(90-lat)/180*worldSize();
const unprojLng=x=>x/worldSize()*360-180;
const unprojLat=y=>90-y/worldSize()*180;
function proj(lat,lng){return{x:projX(lng),y:projY(lat)}}

function hash(ix,iy){let n=(ix*374761393+iy*668265263)|0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296}
function vnoise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
 const a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);
 return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy}
function fbm(x,y){return .5*vnoise(x,y)+.25*vnoise(x*2.13+7.7,y*2.13)+.125*vnoise(x*4.7+13.1,y*4.7+3.3)+.0625*vnoise(x*9.9+31,y*9.9+17)}
function terrainAt(wx,wy){return{e:fbm(wx/260,wy/260),m:fbm(wx/95+40,wy/95+9),u:fbm(wx/60+80,wy/60+55)}}
function classify(t){
 if(t.e<.30)return TER.deep;if(t.e<.37)return TER.water;if(t.e<.405)return TER.sand;
 if(t.u>.67&&t.e<.62)return TER.urban;if(t.m>.63)return TER.forest;if(t.m>.46)return TER.grass;return TER.arid}

function rrect(x,px,py,w,h,r){x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath()}

function drawGrat(x,w,h){
 const W=worldSize(),degPx=360/W;
 const steps=[30,15,10,5,2,1,.5,.25,.125];
 const st=steps.find(s=>s/degPx>=90)||steps[steps.length-1];
 const fmt=(v,p,n)=>(st<1?Math.abs(v).toFixed(1):Math.round(Math.abs(v)))+'°'+(v>=0?p:n);
 x.strokeStyle='rgba(64,58,44,.13)';x.fillStyle='rgba(64,58,44,.5)';x.font='9px ui-monospace,monospace';x.lineWidth=1;
 const l0=Math.floor(unprojLng(M.ox)/st)*st;
 for(let i=0;i<400;i++){const lng=l0+i*st,sx=projX(lng)-M.ox;
  if(sx>w)break;if(sx<0)continue;
  x.beginPath();x.moveTo(sx+.5,0);x.lineTo(sx+.5,h);x.stroke();x.fillText(fmt(lng,'E','W'),sx+3,12)}
 const a0=Math.floor(unprojLat(M.oy)/st)*st;
 for(let i=0;i<400;i++){const lat=a0-i*st,sy=projY(lat)-M.oy;
  if(sy>h)break;if(sy<0)continue;
  x.beginPath();x.moveTo(0,sy+.5);x.lineTo(w,sy+.5);x.stroke();x.fillText(fmt(lat,'N','S'),4,sy-3)}}

/* terrain cache */
const PAD=160;
let terrCv=document.createElement('canvas'),terrCx=terrCv.getContext('2d');
let terrOx=-1,terrOy=-1,terrW=0,terrH=0;

function drawAOI(x,a,w,h){
 const p=proj(a.lat,a.lng),sx=p.x-M.ox,sy=p.y-M.oy;
 const kmPx=360/worldSize()*111.32*Math.cos(a.lat*Math.PI/180);
 const r=Math.max(16,a.rad/kmPx);
 if(sx<-r-100||sy<-r-100||sx>w+r+100||sy>h+r+100)return;
 const col=colOf(a.status);
 if(M.layers.heat){
  [[.30,-.24,.5,'124,154,120'],[-.26,.32,.42,'123,166,163']].forEach(b=>{
   const bx=sx+r*b[0],by=sy+r*b[1],br=Math.max(10,r*b[2]);
   const g=x.createRadialGradient(bx,by,2,bx,by,br);
   g.addColorStop(0,`rgba(${b[3]},.5)`);g.addColorStop(1,`rgba(${b[3]},0)`);
   x.fillStyle=g;x.beginPath();x.arc(bx,by,br,0,7);x.fill()})}
 x.strokeStyle=col;x.lineWidth=1.6;x.setLineDash([6,5]);
 x.beginPath();x.arc(sx,sy,r,0,7);x.stroke();x.setLineDash([]);
 x.fillStyle='#fbf8ef';x.strokeStyle=col;x.lineWidth=2.5;
 x.beginPath();x.arc(sx,sy,7,0,7);x.fill();x.stroke();
 x.fillStyle=col;x.beginPath();x.arc(sx,sy,3.2,0,7);x.fill();
 if(M.layers.labels){
  const lbl=a.name.split('—')[0].trim();
  x.font='700 10.5px Segoe UI,sans-serif';
  const tw=x.measureText(lbl).width+16;
  const lx=clamp(sx-tw/2,4,w-tw-4),ly=sy-r-30<8?sy+13:sy-r-30;
  x.fillStyle='rgba(251,248,239,.94)';x.strokeStyle='rgba(211,202,176,.9)';x.lineWidth=1;
  rrect(x,lx,ly,tw,20,7);x.fill();x.stroke();
  x.fillStyle='#403a2c';x.fillText(lbl,lx+8,ly+13.5);
  x.fillStyle=col;x.beginPath();x.arc(lx+tw-8,ly+10,3,0,7);x.fill()}
 M.hits.push({x:sx,y:sy,r:Math.max(r,16),a})}

function renderTerrain(w,h){
 terrCv.width=w+PAD*2;terrCv.height=h+PAD*2;
 const x=terrCx,cell=8,sar=M.layers.sar;
 for(let py=0;py<terrCv.height;py+=cell){
  for(let px=0;px<terrCv.width;px+=cell){
   const wx=px+terrOx,wy=py+terrOy;
   const t=terrainAt(wx,wy);
   x.fillStyle=classify(t);x.fillRect(px,py,cell,cell);
   if(sar){
    x.fillStyle='rgba(168,148,173,.30)';x.fillRect(px,py,cell,cell);
    if(hash((wx>>2)+900,(wy>>2)+700)>.87){x.fillStyle='rgba(111,90,119,.45)';x.fillRect(px,py,cell,cell)}}}}}

function renderMap(){
 const body=document.getElementById('mapBody');
 const w=body.clientWidth,h=body.clientHeight;
 if(!w||!h)return;
 M.w=w;M.h=h;
 if(mapCv.width!==w||mapCv.height!==h){mapCv.width=w;mapCv.height=h}
 const W=worldSize();
 M.ox=clamp(projX(M.lng)-w/2,0,Math.max(0,W-w));
 M.oy=clamp(projY(M.lat)-h/2,0,Math.max(0,W-h));
 if(terrOx<0||terrW!==w||terrH!==h||Math.abs(M.ox-PAD-terrOx)>PAD||Math.abs(M.oy-PAD-terrOy)>PAD){
  terrOx=M.ox-PAD;terrOy=M.oy-PAD;terrW=w;terrH=h;renderTerrain(w,h)}
 const x=mapCx;
 x.clearRect(0,0,w,h);
 x.drawImage(terrCv,Math.round(terrOx-M.ox),Math.round(terrOy-M.oy));
 drawGrat(x,w,h);
 M.hits=[];
 AOIS.forEach(a=>drawAOI(x,a,w,h));
 const gsd=360*111320/W*Math.cos(M.lat*Math.PI/180);
 document.getElementById('mapGsd').textContent='GSD ≈ '+(gsd>=1000?(gsd/1000).toFixed(2)+' km/px':Math.round(gsd)+' m/px');
 needRender=false}

function initMap(){
 mapCv=document.getElementById('eoMap');mapCx=mapCv.getContext('2d');
 mapCv.style.cursor='grab';
 mapCv.addEventListener('pointerdown',e=>{mapCv.setPointerCapture(e.pointerId);
  M.drag={sx:e.clientX,sy:e.clientY,ox:M.ox,oy:M.oy,moved:0};mapCv.style.cursor='grabbing'});
 mapCv.addEventListener('pointermove',e=>{
  const r=mapCv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
  if(M.drag){
   const dx=e.clientX-M.drag.sx,dy=e.clientY-M.drag.sy;
   M.drag.moved=Math.max(M.drag.moved,Math.abs(dx)+Math.abs(dy));
   const W=worldSize();
   const nox=clamp(M.drag.ox-dx,0,Math.max(0,W-M.w));
   const noy=clamp(M.drag.oy-dy,0,Math.max(0,W-M.h));
   M.lng=unprojLng(nox+M.w/2);M.lat=clamp(unprojLat(noy+M.h/2),-78,78);
   needRender=true}
  else{
   const lat=unprojLat(M.oy+my),lng=unprojLng(M.ox+mx);
   document.getElementById('mapCoords').textContent=
    Math.abs(lat).toFixed(4)+'°'+(lat>=0?'N':'S')+'  '+Math.abs(lng).toFixed(4)+'°'+(lng>=0?'E':'W')}});
 mapCv.addEventListener('pointerup',e=>{
  const wasClick=M.drag&&M.drag.moved<6;
  M.drag=null;mapCv.style.cursor='grab';
  if(wasClick){
   const r=mapCv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
   let best=null,bd=1e9;
   M.hits.forEach(hh=>{const d=Math.hypot(hh.x-mx,hh.y-my);if(d<hh.r&&d<bd){bd=d;best=hh.a}});
   if(best)openInv(best.id)}});
 mapCv.addEventListener('wheel',e=>{
  e.preventDefault();
  const r=mapCv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
  const gx=unprojLng(M.ox+mx),gy=unprojLat(M.oy+my);
  M.z=clamp(M.z+(e.deltaY<0?.5:-.5),3,9);
  const nx=projX(gx)-mx,ny=projY(gy)-my;
  M.lng=unprojLng(nx+M.w/2);M.lat=clamp(unprojLat(ny+M.h/2),-78,78);
  terrOx=-1;needRender=true},{passive:false});
 terrOx=-1;needRender=true}

function zoomStep(d){M.z=clamp(M.z+d,3,9);terrOx=-1;needRender=true}
function mapHome(){M.lat=22.8;M.lng=79.6;M.z=4.4;terrOx=-1;needRender=true}
function toggleLayer(el){
 const l=el.dataset.l;
 M.layers[l]=!M.layers[l];
 el.classList.toggle('on',M.layers[l]);
 if(l==='sar')terrOx=-1;
 needRender=true}

function pump(){
 if(needRender&&mapCx&&!document.getElementById('app').classList.contains('hidden')&&App.route==='dashboard')renderMap();
 requestAnimationFrame(pump)}
