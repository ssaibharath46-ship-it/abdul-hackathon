const CFG={center:[17.385,78.4867]};
const $=i=>document.getElementById(i),E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SUBJ=['Maths','Physics','Chemistry','Biology','English','Computer Science'];
const localDate=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10)};
const today=localDate(new Date());
const MODES=['home','online','hybrid'];
let me=null,S={},ui={mode:'in',rad:12,subj:'',q:'',sort:'near',m:0,d:today,r:'student',chat:null,theme:(()=>{try{return localStorage.getItem('htf_theme')||'dark'}catch(e){return'dark'}})()},map,view='',dirty=0;
document.documentElement.dataset.theme=ui.theme==='light'?'light':'dark';
const NAV={
  student:[['home','Home'],['find','Find tutors'],['tutors','My tutors'],['book','Bookings'],['chat','Chat'],['hw','Homework'],['quizzes','Quizzes'],['progress','Progress'],['cal','Calendar']],
  teacher:[['home','Home'],['req','Requests'],['stu','Students'],['book','Bookings'],['chat','Chat'],['hw','Homework'],['quiz','Quizzes'],['att','Attendance'],['fee','Fees'],['cal','Calendar'],['prof','Profile']],
  admin:[['adm','Control room']]
};
const P=id=>S.profiles?.find(p=>p.id==id)||{name:'(removed)'};
const km=(a,b)=>{if(a.lat==null||b.lat==null)return 999;const r=x=>x*Math.PI/180,d=r(b.lat-a.lat),e=r(b.lng-a.lng),h=Math.sin(d/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(e/2)**2;return 12742*Math.asin(Math.sqrt(h))};
const toast=(m,bad)=>{const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3600)};
const rq=(t,s)=>S.requests.find(r=>r.teacher_id==t&&r.student_id==s);
const acc=()=>S.requests.filter(r=>r.status=='accepted'&&(me.role=='student'?r.student_id==me.id:r.teacher_id==me.id));
const rating=t=>{const r=S.reviews.filter(x=>x.teacher_id==t);return r.length?(r.reduce((a,b)=>a+b.rating,0)/r.length).toFixed(1):null};
const ratingLabel=t=>{const n=rating(t),c=S.reviews.filter(x=>x.teacher_id==t).length;return n?`${n}★ (${c})`:'New tutor'};
const pct=(t,s)=>{const a=S.attendance.filter(x=>x.teacher_id==t&&x.student_id==s);return a.length?Math.round(a.filter(x=>x.present).length/a.length*100):null};
const qavg=(t,s)=>{const a=S.attempts.filter(x=>x.student_id==s&&x.status=='graded'&&S.quizzes.find(q=>q.id==x.quiz_id)?.teacher_id==t);return a.length?Math.round(a.reduce((p,x)=>p+x.mark/x.max*100,0)/a.length):null};
const months=()=>[...Array(6)].map((_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);return localDate(d).slice(0,7)});
const paid=(t,s,m)=>S.fees.some(f=>f.teacher_id==t&&f.student_id==s&&f.month==m);
const bar=v=>`<div class="bar"><i style="width:${v||0}%"></i></div>`;
const ini=n=>(n||'?').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
const isFav=t=>(S.favorites||[]).some(f=>f.teacher_id==t&&f.student_id==me.id);
const unread=()=>(S.messages||[]).filter(m=>m.to==me.id&&!m.read).length;
const unreadFrom=id=>(S.messages||[]).filter(m=>m.from==id&&m.to==me.id&&!m.read).length;
const fmt=s=>s?new Date(s).toLocaleString():'—';

let tok=null,es,seen=new Set(),lastV;try{tok=localStorage.getItem('htf_tok')}catch(e){}
const API=async(p,body)=>{const r=await fetch('/api/'+p,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(tok||'')},body:body?JSON.stringify(body):undefined});const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j.error||'Request failed');e.s=r.status;throw e}return j};
const A=async(type,d={})=>{try{await API('act',{type,...d});await refresh(1);return 1}catch(e){if(e.s==401||e.s==403)logout(e.message);else toast(e.message,1)}};
async function refresh(f){try{S=await API('data');me=S.me;lastV=S.v;for(const n of S.notes||[])if(!seen.has(n.id)){seen.add(n.id);toast(n.msg)}R(f)}catch(e){if(e.s==401||e.s==403)logout(e.message);else toast(e.message,1)}}
function R(f){if(!f&&$('app').contains(document.activeElement)&&document.activeElement.matches('input,textarea,select')){dirty=1;return}
 dirty=0;if(map){map.remove();map=null}$('app').innerHTML=me?shell():auth();if($('map'))drawMap();if($('thread')){$('thread').scrollTop=1e9}}
document.addEventListener('focusout',()=>{if(dirty)setTimeout(()=>{if(!document.activeElement.matches?.('input,textarea,select,button'))R(1)},700)});
function go(v){view=v;ui.take=ui.qz=null;if(v!='chat')ui.chat=null;R(1)}
function toggleTheme(){ui.theme=ui.theme=='light'?'dark':'light';document.documentElement.dataset.theme=ui.theme;try{localStorage.setItem('htf_theme',ui.theme)}catch(e){}}
function burst(){const c=document.createElement('canvas');c.className='confetti';c.width=innerWidth;c.height=innerHeight;c.style.cssText='position:fixed;inset:0;width:100%;height:100%';document.body.append(c);
 const x=c.getContext('2d'),bits=[...Array(80)].map(()=>({x:innerWidth/2,y:innerHeight/3,vx:(Math.random()-.5)*12,vy:Math.random()*-10-4,c:`hsl(${Math.random()*40+10},90%,60%)`,s:Math.random()*7+3}));
 let n=0;(function tick(){x.clearRect(0,0,c.width,c.height);bits.forEach(b=>{b.vy+=.28;b.x+=b.vx;b.y+=b.vy;x.fillStyle=b.c;x.fillRect(b.x,b.y,b.s,b.s*0.6)});if(++n<90)requestAnimationFrame(tick);else c.remove()})()}

function auth(){const up=ui.mode=='up';
 return `<div class="hero-auth">
  <div class="splash">
    <div class="brand"><div class="logo">✦</div><b>Lumina Tutors</b></div>
    <h1 class="headline">Find a brilliant <span class="grad">home tutor</span> around the corner.</h1>
    <p class="mu">Live map of tutors in Hyderabad, class bookings, chat, homework, quizzes and fee tracking — built for students, teachers and admins.</p>
    <div class="pills"><span class="pill">🗺 OpenStreetMap</span><span class="pill">⚡ Live updates</span><span class="pill">💬 Chat</span><span class="pill">📅 Book a class</span><span class="pill">📝 Quizzes</span></div>
    <div class="feat">
      <div><b>Students</b><div class="mu">Filter by subject, distance, fee & mode. Favourite tutors and book slots.</div></div>
      <div><b>Teachers</b><div class="mu">Accept requests, mark attendance, assign homework, evaluate exams.</div></div>
    </div>
  </div>
  <div class="card" style="animation-delay:.1s">
    <h2>${up?'Join Lumina':'Welcome back'}</h2>
    <div class="row"><button class="s ${up?'':'on'}" onclick="ui.mode='in';R(1)">Sign in</button><button class="s ${up?'on':''}" onclick="ui.mode='up';R(1)">Create account</button></div>
    ${up?`<label>I am a</label><select onchange="ui.r=this.value;R(1)"><option value="student">Student looking for a tutor</option><option value="teacher" ${ui.r=='teacher'?'selected':''}>Teacher offering tuition</option></select>
    <label>Full name</label><input id="nm" placeholder="Your name">${ui.r=='teacher'?`<label>Subject</label><select id="sj">${SUBJ.map(s=>`<option>${s}</option>`).join('')}</select>`:''}`:''}
    <label>Email</label><input id="em" type="email" placeholder="you@email.com" autocomplete="username">
    <label>Password</label><input id="pw" type="password" placeholder="Min 6 characters" autocomplete="current-password" onkeydown="event.key=='Enter'&&(ui.mode=='up'?signup():signin())">
    <button onclick="${up?'signup()':'signin()'}">${up?'Create account':'Sign in'}</button>
    ${up?'':`<p class="mu" style="margin-top:14px">Try a demo (password <b>demo123</b>)</p>
    <div class="row">
      <button class="s" onclick="demo('aisha@htf.com')">Student · Aisha</button>
      <button class="s" onclick="demo('priya@htf.com')">Tutor · Priya</button>
      <button class="s" onclick="demo('admin@htf.com','admin123')">Admin</button>
    </div>`}
  </div>
 </div>`}
async function enter(r){tok=r.token;try{localStorage.setItem('htf_tok',tok)}catch(e){}burst();await boot()}
async function signin(){try{await enter(await API('login',{email:$('em').value.trim(),password:$('pw').value}))}catch(e){toast(e.message,1)}}
async function signup(){const nm=$('nm').value.trim(),pw=$('pw').value;if(!nm||pw.length<6)return toast('Name required, password min 6 chars',1);
 try{await enter(await API('signup',{name:nm,email:$('em').value.trim(),password:pw,role:ui.r,subject:ui.r=='teacher'?$('sj').value:null}))}catch(e){toast(e.message,1)}}
async function demo(email,pw='demo123'){try{await enter(await API('login',{email,password:pw}))}catch(e){toast(e.message,1)}}
async function logout(m){clearInterval(es);es=null;try{await API('logout',{})}catch(e){}tok=null;try{localStorage.removeItem('htf_tok')}catch(e){}me=null;S={};if(m)toast(m,1);R(1)}
async function boot(){try{S=await API('data');me=S.me}catch(e){tok=null;me=null;R(1);return}
 view=NAV[me.role][0][0];seen=new Set((S.notes||[]).map(n=>n.id));lastV=S.v;R(1);await initLoc();clearInterval(es);es=setInterval(poll,4000)}
const poll=async()=>{if(document.hidden||!tok)return;try{const j=await API('ver');if(j.v!=lastV)await refresh(0)}catch(e){}};
document.addEventListener('visibilitychange',poll);
const myPw=async()=>{const o=prompt('Current password'),n=o&&prompt('New password (min 6 chars)');if(n&&await A('mypw',{old:o,password:n}))toast('Password changed')};

const setLoc=(la,ln)=>A('profile',{lat:la,lng:ln});
async function initLoc(){if(me.lat!=null||me.role=='admin')return;let la=CFG.center[0],ln=CFG.center[1];try{const p=await new Promise((o,x)=>navigator.geolocation.getCurrentPosition(o,x,{timeout:5000}));la=p.coords.latitude;ln=p.coords.longitude}catch(e){la+=(Math.random()-.5)*.04;ln+=(Math.random()-.5)*.04}await setLoc(la,ln)}
const geo=()=>navigator.geolocation?.getCurrentPosition(p=>setLoc(p.coords.latitude,p.coords.longitude),()=>toast('Location permission denied',1));
const pin=c=>L.divIcon({className:'',html:`<div class="pin ${c}"></div>`,iconSize:[18,18],iconAnchor:[9,9]});
function drawMap(){const el=$('map');if(me.lat==null)return;map=L.map(el).setView([me.lat,me.lng],ui.rad>20?10:13);
 L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{attribution:'© OSM © CARTO',maxZoom:19}).addTo(map);
 const you=L.marker([me.lat,me.lng],{draggable:true,icon:pin('you')}).addTo(map).bindTooltip('You — drag to move');
 you.on('dragend',e=>{const p=e.target.getLatLng();setLoc(p.lat,p.lng)});map.on('click',e=>setLoc(e.latlng.lat,e.latlng.lng));
 if(view=='find'){const c=L.circle([me.lat,me.lng],{radius:ui.rad*1000,color:'#ff6b4a',weight:2,fillOpacity:.08}).addTo(map);
  (ui.list||[]).forEach(t=>L.marker([t.lat,t.lng],{icon:pin('')}).addTo(map).bindPopup(`<b>${E(t.name)}</b><br>${E(t.subject)} · ₹${t.fee}/mo<br>${t.d.toFixed(1)} km<br>${rq(t.id,me.id)?E(rq(t.id,me.id).status):`<button onclick="sendReq('${t.id}')">Send request</button>`}`));
  map.fitBounds(c.getBounds(),{animate:true,padding:[16,16]})}}

function shell(){const u=unread();
 return`<div class="top">
  <div class="brand"><div class="logo">✦</div><div><b>Lumina Tutors</b><div class="mu">${E(me.name)} · ${me.role}</div></div></div>
  <span class="row">
    <button class="s theme-btn" title="Theme" onclick="toggleTheme();R(1)">${ui.theme=='light'?'☾':'☀'}</button>
    <button class="s" onclick="myPw()">Password</button>
    <button class="s" onclick="logout()">Sign out</button>
  </span>
 </div>
 <div class="nav">${NAV[me.role].map(n=>`<button class="s ${view==n[0]?'on':''}" onclick="go('${n[0]}')">${n[1]}${n[0]=='chat'&&u?`<span class="unread">${u}</span>`:''}</button>`).join('')}</div>
 ${V[view]()}`}

function calendar(tids){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()+ui.m);const ym=localDate(d).slice(0,7),n=new Date(d.getFullYear(),d.getMonth()+1,0).getDate(),hs=S.holidays.filter(h=>tids.includes(h.teacher_id)&&h.date.startsWith(ym));
 const books=(S.bookings||[]).filter(b=>tids.includes(b.teacher_id)&&b.date.startsWith(ym)&&b.status!='declined'&&b.status!='cancelled');
 return`<div class="row"><button class="s" onclick="ui.m--;R(1)">‹</button><b>${d.toLocaleString('en',{month:'long',year:'numeric'})}</b><button class="s" onclick="ui.m++;R(1)">›</button></div><br><div class="cal">${['S','M','T','W','T','F','S'].map(x=>`<b>${x}</b>`).join('')}${'<span></span>'.repeat(d.getDay())}${[...Array(n)].map((_,i)=>{const ds=ym+'-'+String(i+1).padStart(2,'0'),h=hs.filter(x=>x.date==ds),bk=books.filter(x=>x.date==ds);return`<div class="${h.length||bk.length?'h':''}">${i+1}${h.map(x=>`<br>${E(x.name)}`).join('')}${bk.map(x=>`<br>🕒 ${x.time}`).join('')}</div>`}).join('')}</div>`}

const addTut=()=>{const L=S.profiles.filter(u=>u.role=='teacher'&&!u.blocked&&!S.requests.some(r=>r.student_id==me.id&&r.teacher_id==u.id&&r.status!='rejected'));return`<div class="card"><b>Add any tutor</b> <span class="mu">(any distance — sends a request)</span><div class="row"><select id="at" style="flex:1"><option value="">Select tutor…</option>${L.map(u=>`<option value="${u.id}">${E(u.name)} · ${E(u.subject)}</option>`).join('')}</select><button onclick="const v=$('at').value;v?sendReq(v):toast('Select a tutor',1)">Add</button></div></div>`};
const addStu=()=>{const ids=acc().map(r=>r.student_id),L=S.profiles.filter(u=>u.role=='student'&&!u.blocked&&!ids.includes(u.id));return`<div class="card"><b>Add any student to your tuition</b><div class="row"><select id="as" style="flex:1"><option value="">Select student…</option>${L.map(u=>`<option value="${u.id}">${E(u.name)} (${E(u.email)})</option>`).join('')}</select><button onclick="const v=$('as').value;v?enroll(v):toast('Select a student',1)">Add</button></div></div>`};

function tutorCard(t,extra=''){
  const r=rq(t.id,me.id),fav=isFav(t.id);
  return `<div class="card tutor-card">
    <div class="row" style="justify-content:space-between">
      <div class="row"><div class="avatar">${ini(t.name)}</div><div><b>${E(t.name)}</b><div class="mu">${E(t.subject)} · ${E(t.city||'Hyderabad')}</div></div></div>
      <button class="s" onclick="A('fav',{teacher_id:'${t.id}'})">${fav?'♥':'♡'}</button>
    </div>
    <div class="row" style="margin:8px 0"><span class="tag">${E(t.mode||'home')}</span><span class="stars">${ratingLabel(t.id)}</span><span class="price">₹${t.fee}<span class="mu">/mo</span></span></div>
    ${t.d!=null?`<div class="mu">${t.d.toFixed(1)} km away · ${E(t.experience||'—')} yrs</div>`:''}
    <div class="mu">🕒 ${E(t.avail)}</div>
    <p>${E(t.bio)}</p>
    ${extra}
    ${r&&r.status!='rejected'?`<span class="tag">${r.status}</span> ${r.status=='accepted'?`<button class="s" onclick="openChat('${t.id}')">Chat</button>`:''}`:`<button onclick="sendReq('${t.id}')">${r?'Request again':'Send request'}</button>`}
  </div>`}

function peers(){
  if(me.role=='student')return acc().map(r=>P(r.teacher_id));
  if(me.role=='teacher')return acc().map(r=>P(r.student_id)).concat(S.requests.filter(r=>r.teacher_id==me.id&&r.status=='pending').map(r=>P(r.student_id)));
  return S.profiles.filter(p=>p.id!=me.id);
}

const V={
home(){
  if(me.role=='student'){
    const A=acc(),due=A.filter(r=>!paid(r.teacher_id,me.id,months()[0])).length,hw=(S.homework||[]).filter(h=>!h.done).length,next=(S.bookings||[]).filter(b=>b.student_id==me.id&&b.status=='accepted'&&b.date>=today).sort((a,b)=>a.date.localeCompare(b.date))[0];
    return `<div class="card"><h2 class="display">Good ${new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, ${E(me.name.split(' ')[0])}.</h2>
      <p class="mu">Your learning studio — live tutors, homework and upcoming classes.</p></div>
      <div class="stats">
        <div class="card stat"><span class="mu">Active tutors</span><b>${A.length}</b></div>
        <div class="card stat"><span class="mu">Homework due</span><b>${hw}</b></div>
        <div class="card stat"><span class="mu">Fees due</span><b>${due}</b></div>
        <div class="card stat"><span class="mu">Unread chats</span><b>${unread()}</b></div>
      </div>
      <div class="card">${next?`<b>Next class</b><p>${E(P(next.teacher_id).name)} · ${next.date} at ${next.time}<br><span class="mu">${E(next.topic)}</span></p>`:'<b>No upcoming class</b><p class="mu">Book a slot from Bookings once a tutor accepts you.</p>'}
      <button onclick="go('find')">Find tutors nearby</button> <button class="s" onclick="go('hw')">Homework</button></div>
      <div class="card"><h3>My details</h3><div class="row">
        <div style="flex:1"><label>Class / grade</label><input id="sg" value="${E(me.grade||'')}"></div>
        <div style="flex:1"><label>Board</label><input id="sb" value="${E(me.board||'')}"></div>
        <div style="flex:1"><label>Phone</label><input id="sp" value="${E(me.phone||'')}"></div>
        <div style="flex:1"><label>Area</label><input id="sc" value="${E(me.city||'')}"></div>
      </div><button onclick="saveStudent()">Save details</button></div>`}
  if(me.role=='teacher'){
    const pending=S.requests.filter(r=>r.teacher_id==me.id&&r.status=='pending').length,st=acc().length,bk=(S.bookings||[]).filter(b=>b.teacher_id==me.id&&b.status=='pending').length,ex=S.attempts.filter(a=>a.status=='pending'&&S.quizzes.some(q=>q.id==a.quiz_id&&q.teacher_id==me.id)).length;
    return `<div class="card"><h2 class="display">Studio dashboard</h2><p class="mu">${E(me.subject||'Tutor')} · ₹${me.fee||0}/month · ${E(me.mode||'home')} tuition</p></div>
      <div class="stats">
        <div class="card stat"><span class="mu">Students</span><b>${st}</b></div>
        <div class="card stat"><span class="mu">New requests</span><b>${pending}</b></div>
        <div class="card stat"><span class="mu">Booking inbox</span><b>${bk}</b></div>
        <div class="card stat"><span class="mu">Exams to grade</span><b>${ex}</b></div>
      </div>
      <div class="row"><button onclick="go('req')">Review requests</button><button class="s" onclick="go('att')">Mark attendance</button><button class="s" onclick="go('quiz')">Quizzes</button></div>`}
  return V.adm();
},
find(){const q=(ui.q||'').toLowerCase();
 let L=S.profiles.filter(u=>u.role=='teacher'&&!u.blocked&&u.lat!=null&&(!ui.subj||u.subject==ui.subj)&&( !q || (u.name+' '+u.subject+' '+(u.city||'')+' '+(u.bio||'')).toLowerCase().includes(q))).map(t=>({...t,d:km(me,t)})).filter(t=>t.d<=ui.rad);
 if(ui.sort=='fee')L.sort((a,b)=>a.fee-b.fee);else if(ui.sort=='rate')L.sort((a,b)=>(rating(b.id)||0)-(rating(a.id)||0));else L.sort((a,b)=>a.d-b.d);
 ui.list=L;
 return`<div class="card"><div class="row">
   <div style="flex:1;min-width:160px"><label>Search</label><input value="${E(ui.q)}" placeholder="Name, area, keyword" oninput="ui.q=this.value" onchange="R(1)"></div>
   <div><label>Subject</label><select onchange="ui.subj=this.value;R(1)"><option value="">All</option>${SUBJ.map(s=>`<option ${ui.subj==s?'selected':''}>${s}</option>`).join('')}</select></div>
   <div><label>Sort</label><select onchange="ui.sort=this.value;R(1)"><option value="near" ${ui.sort=='near'?'selected':''}>Nearest</option><option value="fee" ${ui.sort=='fee'?'selected':''}>Lowest fee</option><option value="rate" ${ui.sort=='rate'?'selected':''}>Top rated</option></select></div>
   <div style="flex:1;min-width:160px"><label>Radius: ${ui.rad} km</label><input type="range" min="1" max="50" value="${ui.rad}" oninput="this.previousElementSibling.textContent='Radius: '+this.value+' km'" onchange="ui.rad=+this.value;R(1)"></div>
   <button class="s" onclick="geo()">📍 My location</button>
 </div><div id="map"></div><div class="mu">Drag the coral pin or click the map. Green pins = nearby tutors. Live search + sort.</div></div>${addTut()}
 <div class="g">${L.map(t=>tutorCard(t)).join('')||'<div class="empty card"><span>🔭</span>No tutors in this radius — stretch the slider.</div>'}</div>`},
tutors(){const L=S.requests.filter(r=>r.student_id==me.id);
 return L.length?L.map(r=>{const t=P(r.teacher_id),rv=S.reviews.find(x=>x.teacher_id==r.teacher_id&&x.student_id==me.id);
  return`<div class="card"><div class="row"><div class="avatar">${ini(t.name)}</div><div><b>${E(t.name)}</b> · ${E(t.subject)} <span class="tag ${r.status=='accepted'?'t-ok':r.status=='rejected'?'t-no':'t-wa'}">${r.status}</span></div></div>
  ${r.status=='accepted'?`<div class="mu" style="margin:8px 0">${rv?'Your rating: '+rv.rating+'★':`Rate: ${[1,2,3,4,5].map(n=>`<button class="s" onclick="rate('${r.teacher_id}',${n})">${n}★</button>`).join('')}`}</div>
  <div class="row"><button class="s" onclick="openChat('${t.id}')">Chat</button><button class="s" onclick="go('book')">Book class</button></div>
  ${S.reports.filter(x=>x.teacher_id==r.teacher_id&&x.student_id==me.id).map(x=>`<div class="card"><b>Progress report</b> <span class="mu">${x.created.slice(0,10)}</span><br>${E(x.text)}</div>`).join('')}`:''}</div>`}).join(''):'<div class="empty card"><span>🌱</span>No requests yet. Use Find tutors.</div>'},
book(){
  const mine=(S.bookings||[]).filter(b=>me.role=='student'?b.student_id==me.id:b.teacher_id==me.id).sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time));
  const form=me.role=='student'?`<div class="card"><h3>Book a class</h3><div class="row">
    <select id="bt" style="flex:1"><option value="">Your tutor…</option>${acc().map(r=>`<option value="${r.teacher_id}">${E(P(r.teacher_id).name)}</option>`).join('')}</select>
    <input type="date" id="bd" value="${today}" style="width:auto"><input type="time" id="btime" value="17:00" style="width:auto">
    <input id="btopic" placeholder="Topic (e.g. Trigonometry)" style="flex:1">
    <button onclick="bookClass()">Request slot</button></div><p class="mu">Tutor confirms the slot. It then appears on the holiday/class calendar.</p></div>`:'<div class="card"><h3>Incoming bookings</h3><p class="mu">Accept, decline, or mark a session done.</p></div>';
  return form+(mine.map(b=>{const other=P(me.role=='student'?b.teacher_id:b.student_id);
    return `<div class="card"><div class="row" style="justify-content:space-between"><div><b>${E(other.name)}</b> · ${b.date} ${b.time}<div class="mu">${E(b.topic)}</div></div><span class="tag">${b.status}</span></div>
    ${me.role=='teacher'&&b.status=='pending'?`<div class="row" style="margin-top:8px"><button class="ok" onclick="A('setbook',{id:'${b.id}',status:'accepted'})">Accept</button><button class="no" onclick="A('setbook',{id:'${b.id}',status:'declined'})">Decline</button></div>`:''}
    ${me.role=='teacher'&&b.status=='accepted'?`<button class="s" style="margin-top:8px" onclick="A('setbook',{id:'${b.id}',status:'done'})">Mark completed</button>`:''}
    ${me.role=='student'&&(b.status=='pending'||b.status=='accepted')?`<button class="s" style="margin-top:8px" onclick="A('setbook',{id:'${b.id}',status:'cancelled'})">Cancel</button>`:''}
    </div>`}).join('')||'<div class="empty card"><span>📅</span>No bookings yet.</div>')},
chat(){
  const people=peers().filter((p,i,a)=>p&&p.id&&a.findIndex(x=>x.id==p.id)==i);
  if(!people.length)return '<div class="empty card"><span>💬</span>Connect with a tutor or student to start chatting.</div>';
  const pid=ui.chat||people[0].id;ui.chat=pid;
  const msgs=(S.messages||[]).filter(m=>(m.from==me.id&&m.to==pid)||(m.from==pid&&m.to==me.id));
  return `<div class="g" style="grid-template-columns:220px 1fr">
    <div class="card chat-list"><b>Conversations</b>${people.map(p=>`<button class="s ${p.id==pid?'on':''}" onclick="openChat('${p.id}')">${E(p.name)}${unreadFrom(p.id)?`<span class="unread">${unreadFrom(p.id)}</span>`:''}<div class="mu">${E(p.role)}</div></button>`).join('')}</div>
    <div class="card"><b>Chat with ${E(P(pid).name)}</b>
      <div class="chat" id="thread">${msgs.map(m=>`<div class="bubble ${m.from==me.id?'me':''}">${E(m.text)}<div class="mu" style="opacity:.7">${new Date(m.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></div>`).join('')||'<p class="mu">Say hello — messages sync live.</p>'}</div>
      <div class="row"><input id="mx" placeholder="Write a message…" onkeydown="event.key=='Enter'&&sendMsg('${pid}')" style="flex:1;margin:0"><button onclick="sendMsg('${pid}')">Send</button></div>
    </div></div>`},
hw(){
  const list=(S.homework||[]).slice().sort((a,b)=> (a.due||'').localeCompare(b.due||''));
  const form=me.role=='teacher'?`<div class="card"><h3>Assign homework</h3><div class="row">
    <select id="hs" style="flex:1"><option value="">Student…</option>${acc().map(r=>`<option value="${r.student_id}">${E(P(r.student_id).name)}</option>`).join('')}</select>
    <input id="ht" placeholder="Title" style="flex:1"><input type="date" id="hdue" style="width:auto"></div>
    <textarea id="hx" placeholder="Instructions…"></textarea><button onclick="addHw()">Assign</button></div>`:'<div class="card"><h3>Your homework</h3><p class="mu">Mark complete when you finish. Teachers see it live.</p></div>';
  return form+(list.map(h=>`<div class="card"><div class="row" style="justify-content:space-between"><b>${E(h.title)}</b><span class="tag ${h.done?'t-ok':'t-wa'}">${h.done?'Done':'Open'}</span></div>
    <div class="mu">${me.role=='student'?E(P(h.teacher_id).name):E(P(h.student_id).name)} · due ${E(h.due||'—')}</div>
    <p>${E(h.text)}</p>
    ${me.role=='student'&&!h.done?`<button onclick="A('hwdone',{id:'${h.id}'})">Mark done</button>`:''}
    ${me.role=='teacher'?`<button class="s" onclick="A('hwdel',{id:'${h.id}'})">Remove</button>`:''}
  </div>`).join('')||'<div class="empty card"><span>📚</span>No homework yet.</div>')},
quizzes(){const tids=acc().map(r=>r.teacher_id);if(ui.take){const q=S.quizzes.find(x=>x.id==ui.take),qs=S.questions.filter(x=>x.quiz_id==q.id);return`<div class="card"><h3>${E(q.title)}</h3>${qs.map((x,i)=>`<p><b>${i+1}. ${E(x.q)}</b></p>${x.options.map((o,j)=>`<label style="display:block;color:var(--tx)"><input type="radio" name="q${i}" value="${j}" style="width:auto"> ${E(o)}</label>`).join('')}`).join('')}<br><button onclick="submitQ('${q.id}')">Submit exam</button> <button class="s" onclick="ui.take=null;R(1)">Cancel</button></div>`}
 return S.quizzes.filter(q=>tids.includes(q.teacher_id)&&S.questions.some(x=>x.quiz_id==q.id)).map(q=>{const a=S.attempts.find(x=>x.quiz_id==q.id&&x.student_id==me.id);return`<div class="card"><b>${E(q.title)}</b> <span class="mu">by ${E(P(q.teacher_id).name)} · ${S.questions.filter(x=>x.quiz_id==q.id).length} questions</span><br>${!a?`<button onclick="ui.take='${q.id}';R(1)">Start exam</button>`:a.status=='graded'?`<b class="t-ok">Score: ${a.mark}/${a.max}</b><br>Teacher report: ${E(a.remark)}`:'<span class="t-wa">Submitted · awaiting teacher evaluation</span>'}</div>`}).join('')||'<div class="empty card"><span>📝</span>No quizzes available.</div>'},
progress(){const A=acc();return A.length?A.map(r=>{const t=P(r.teacher_id),p=pct(t.id,me.id),q=qavg(t.id,me.id);return`<div class="card"><b>${E(t.name)}</b> · ${E(t.subject)}<p>Attendance: ${p==null?'—':p+'%'}${bar(p)}</p><p>Quiz average: ${q==null?'—':q+'%'}${bar(q)}</p><b>Monthly fee (₹${t.fee})</b><div class="row">${months().map(m=>`<span class="tag ${paid(t.id,me.id,m)?'t-ok':'t-no'}">${m}: ${paid(t.id,me.id,m)?'Paid':'Due'}</span>`).join('')}</div><br><b>Recent attendance</b><div class="mu">${S.attendance.filter(x=>x.teacher_id==t.id&&x.student_id==me.id).sort((a,b)=>a.date>b.date?1:-1).slice(-10).map(x=>x.date+(x.present?' ✔':' ✘')).join(' · ')||'No records'}</div></div>`}).join(''):'<div class="empty card"><span>📈</span>Join a tutor to see progress.</div>'},
cal(){const tids=me.role=='student'?acc().map(r=>r.teacher_id):[me.id];return`<div class="card"><h3>Classes & holidays</h3>${calendar(tids)}${me.role=='teacher'?`<br><b>Add holiday</b><div class="row"><input type="date" id="hd" style="width:auto"><input id="hn" placeholder="Holiday name" style="width:auto"><button onclick="addHol()">Add</button></div>${S.holidays.filter(h=>h.teacher_id==me.id).sort((a,b)=>a.date>b.date?1:-1).map(h=>`<div>${h.date} – ${E(h.name)} <button class="s" onclick="A('holdel',{id:'${h.id}'})">✕</button></div>`).join('')}`:''}</div>`},
req(){const L=S.requests.filter(r=>r.teacher_id==me.id);return L.map(r=>`<div class="card"><b>${E(P(r.student_id).name)}</b> <span class="tag">${r.status}</span> ${r.status=='pending'?`<button class="ok" onclick="setReq('${r.id}','accepted')">Accept</button> <button class="no" onclick="setReq('${r.id}','rejected')">Reject</button>`:''} ${r.status=='accepted'?`<button class="s" onclick="openChat('${r.student_id}')">Chat</button>`:''}</div>`).join('')||'<div class="empty card"><span>📬</span>No requests yet.</div>'},
stu(){return addStu()+acc().map(r=>{const s=P(r.student_id),p=pct(me.id,s.id),q=qavg(me.id,s.id);return`<div class="card"><b>${E(s.name)}</b><div class="mu">${E(s.grade||'')} · ${E(s.board||'')} · Attendance ${p==null?'—':p+'%'} · Quiz avg ${q==null?'—':q+'%'} · This month fee: ${paid(me.id,s.id,months()[0])?'Paid':'Due'}</div>${S.reports.filter(x=>x.teacher_id==me.id&&x.student_id==s.id).map(x=>`<div class="mu">📝 ${x.created.slice(0,10)}: ${E(x.text)}</div>`).join('')}<textarea id="rp${s.id}" placeholder="Write progress report…"></textarea><button onclick="addRep('${s.id}')">Send report</button> <button class="s" onclick="openChat('${s.id}')">Chat</button></div>`}).join('')||'<p class="mu">No students yet.</p>'},
quiz(){if(ui.qz){const q=S.quizzes.find(x=>x.id==ui.qz),qs=S.questions.filter(x=>x.quiz_id==q.id),A=S.attempts.filter(a=>a.quiz_id==q.id);return`<button class="s" onclick="ui.qz=null;R(1)">← Back</button><div class="card"><h3>${E(q.title)}</h3>${qs.map((x,i)=>`<div><b>${i+1}. ${E(x.q)}</b><div class="mu">${x.options.map((o,j)=>(j==x.answer?'✅ ':'')+E(o)).join(' | ')}</div></div>`).join('')}<hr><b>Add question</b><input id="qq" placeholder="Question">${[0,1,2,3].map(i=>`<input id="o${i}" placeholder="Option ${i+1}">`).join('')}<label>Correct option</label><select id="qa">${[1,2,3,4].map((n,i)=>`<option value="${i}">${n}</option>`).join('')}</select><button onclick="addQ('${q.id}')">Add question</button></div>
 <div class="card"><h3>Student submissions</h3>${A.map(a=>`<div class="card"><b>${E(P(a.student_id).name)}</b> · auto score ${a.auto}/${a.max} <span class="tag">${a.status}</span><div class="row"><input type="number" id="mk${a.id}" value="${a.mark??a.auto}" style="width:90px"><input id="rm${a.id}" value="${E(a.remark||'')}" placeholder="Report / remark" style="flex:1"><button onclick="grade('${a.id}')">Publish report</button></div></div>`).join('')||'<p class="mu">No submissions yet.</p>'}</div>`}
 return`<div class="card"><b>Create quiz</b><input id="qt" placeholder="Quiz title"><button onclick="addQuiz()">Create</button></div>${S.quizzes.filter(q=>q.teacher_id==me.id).map(q=>`<div class="card"><b>${E(q.title)}</b> <span class="mu">${S.questions.filter(x=>x.quiz_id==q.id).length} questions · ${S.attempts.filter(a=>a.quiz_id==q.id).length} submissions</span> <button onclick="ui.qz='${q.id}';R(1)">Open</button></div>`).join('')}`},
att(){return`<div class="card"><label>Date</label><input type="date" value="${ui.d}" onchange="ui.d=this.value;R(1)" style="width:auto">${acc().map(r=>{const s=P(r.student_id),x=S.attendance.find(a=>a.teacher_id==me.id&&a.student_id==s.id&&a.date==ui.d);return`<div class="row" style="justify-content:space-between"><span>${E(s.name)} <span class="mu">${pct(me.id,s.id)??'—'}%</span></span><span><button class="s ${x?.present?'on':''}" onclick="mark('${s.id}',true)">Present</button> <button class="s ${x&&!x.present?'on':''}" onclick="mark('${s.id}',false)">Absent</button></span></div>`}).join('')||'<p class="mu">No students.</p>'}</div>`},
fee(){return`<div class="card"><p>Monthly fee: ₹${me.fee} (change in Profile)</p><div class="scroll"><table><tr><th>Student</th>${months().map(m=>`<th>${m}</th>`).join('')}</tr>${acc().map(r=>`<tr><td>${E(P(r.student_id).name)}</td>${months().map(m=>`<td><button class="s ${paid(me.id,r.student_id,m)?'on':''}" onclick="togFee('${r.student_id}','${m}')">${paid(me.id,r.student_id,m)?'Paid':'Due'}</button></td>`).join('')}</tr>`).join('')}</table></div></div>`},
prof(){return`<div class="card"><label>Name</label><input id="pn" value="${E(me.name)}"><label>Subject</label><select id="ps">${SUBJ.map(s=>`<option ${me.subject==s?'selected':''}>${s}</option>`).join('')}</select>
<label>Mode</label><select id="pm">${MODES.map(m=>`<option ${me.mode==m?'selected':''}>${m}</option>`).join('')}</select>
<label>Experience (years)</label><input id="pe" type="number" value="${me.experience||1}">
<label>City / area</label><input id="pc" value="${E(me.city||'')}">
<label>Phone</label><input id="pp" value="${E(me.phone||'')}">
<label>Monthly fee (₹)</label><input id="pf" type="number" value="${me.fee}"><label>Availability</label><input id="pa" value="${E(me.avail)}"><label>Qualifications</label><input id="pq" value="${E(me.quals)}"><label>About</label><textarea id="pb">${E(me.bio)}</textarea><label>Your tuition location — drag the pin or click the map</label><div id="map"></div><button onclick="saveProf()">Save profile</button> <button class="s" onclick="geo()">📍 Use my location</button></div>`},
adm(){const U=S.profiles.filter(u=>u.role!='admin');
 return`<div class="card"><h2 class="display">Control room</h2><p class="mu">Live accounts, logins and enrolments.</p></div>
<div class="stats"><div class="card stat"><span class="mu">Teachers</span><b>${U.filter(u=>u.role=='teacher').length}</b></div><div class="card stat"><span class="mu">Students</span><b>${U.filter(u=>u.role=='student').length}</b></div><div class="card stat"><span class="mu">Enrolments</span><b>${S.requests.filter(r=>r.status=='accepted').length}</b></div><div class="card stat"><span class="mu">Messages</span><b>${(S.messages||[]).length}</b></div></div>
<div class="card scroll"><h3>All accounts</h3><table><tr><th>Name</th><th>Role</th><th>Email</th><th>Joined</th><th>Last login</th><th>Logins</th><th>Status</th><th></th></tr>${U.map(u=>`<tr><td>${E(u.name)}</td><td>${u.role}</td><td>${E(u.email)}</td><td>${fmt(u.created)}</td><td>${fmt(u.last_login)}</td><td>${u.login_count||0}</td><td class="${u.blocked?'t-no':'t-ok'}">${u.blocked?'Blocked':'Active'}</td><td><button class="s" onclick="blk('${u.id}',${!u.blocked})">${u.blocked?'Unblock':'Block'}</button> <button class="s" onclick="resetPw('${u.id}')">Reset password</button> <button class="no" onclick="delU('${u.id}')">Remove</button></td></tr>`).join('')}</table></div>
<div class="card scroll"><h3>Login activity</h3><table><tr><th>Time</th><th>Email</th><th>Result</th><th>IP</th><th>Device</th></tr>${S.logins.map(l=>`<tr><td>${fmt(l.at)}</td><td>${E(l.email)}</td><td class="${l.ok?'t-ok':'t-no'}">${l.ok?'Success':'Failed'}</td><td>${E(l.ip)}</td><td class="mu">${E((l.ua||'').slice(0,50))}</td></tr>`).join('')}</table></div>`}};

const sendReq=t=>A('send',{teacher_id:t});
const enroll=s=>A('enroll',{student_id:s});
const setReq=(id,status)=>{A('setreq',{id,status});if(status=='accepted')burst()};
const rate=(t,n)=>A('rate',{teacher_id:t,rating:n});
const addRep=s=>{const t=$('rp'+s).value.trim();if(t)A('report',{student_id:s,text:t})};
const addQuiz=()=>{const t=$('qt').value.trim();if(t)A('quiz',{title:t})};
const addQ=id=>{const o=[0,1,2,3].map(i=>$('o'+i).value.trim()),q=$('qq').value.trim();if(!q||o.some(x=>!x))return toast('Enter question and 4 options',1);A('question',{quiz_id:id,q,options:o,answer:+$('qa').value})};
function submitQ(id){const n=S.questions.filter(x=>x.quiz_id==id).length,ans=[...Array(n)].map((_,i)=>{const c=document.querySelector(`input[name=q${i}]:checked`);return c?+c.value:-1});ui.take=null;burst();A('submit',{quiz_id:id,answers:ans})}
const grade=id=>A('grade',{id,mark:+$('mk'+id).value,remark:$('rm'+id).value});
const mark=(s,present)=>A('mark',{student_id:s,date:ui.d,present});
const togFee=(s,month)=>A('fee',{student_id:s,month});
const addHol=()=>{if($('hd').value&&$('hn').value)A('hol',{date:$('hd').value,name:$('hn').value})};
const saveProf=async()=>{if(await A('profile',{name:$('pn').value,subject:$('ps').value,fee:+$('pf').value,avail:$('pa').value,quals:$('pq').value,bio:$('pb').value,mode:$('pm').value,experience:+$('pe').value,city:$('pc').value,phone:$('pp').value}))toast('Profile saved')};
const saveStudent=async()=>{if(await A('profile',{grade:$('sg').value,board:$('sb').value,phone:$('sp').value,city:$('sc').value}))toast('Details saved')};
const blk=(id,b)=>A('block',{id,blocked:b});
const delU=id=>confirm('Remove this user and all their data?')&&A('remove',{id});
const resetPw=id=>{const p=prompt('New password for this user (min 6 chars)');if(p)A('resetpw',{id,password:p})};
function openChat(id){ui.chat=id;view='chat';A('readmsg',{from:id})}
async function sendMsg(to){const t=$('mx')?.value.trim();if(!t)return;if(await A('msg',{to,text:t})){}}
function bookClass(){const teacher_id=$('bt').value,date=$('bd').value,time=$('btime').value,topic=$('btopic').value;if(!teacher_id)return toast('Pick a tutor',1);A('book',{teacher_id,date,time,topic})}
function addHw(){const student_id=$('hs').value,title=$('ht').value.trim(),due=$('hdue').value,text=$('hx').value;if(!student_id||!title)return toast('Student and title required',1);A('hw',{student_id,title,due,text})}
if(tok)boot();else R(1);
