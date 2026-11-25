// Core logic shared by the Vercel function (api/) and the local server (server.js)
const crypto=require('crypto'),fs=require('fs'),path=require('path');
const TB=['users','requests','quizzes','questions','attempts','attendance','fees','holidays','reports','reviews'];
let db,curVer=0;
const trim=()=>{const k=Object.keys(db.sessions);if(k.length>500)k.slice(0,k.length-500).forEach(x=>delete db.sessions[x])};
const id=()=>crypto.randomUUID(),now=()=>new Date().toISOString();
const hash=(pw,salt=crypto.randomBytes(16).toString('hex'))=>salt+':'+crypto.scryptSync(pw,salt,32).toString('hex');
const check=(pw,h)=>{const[s,x]=h.split(':');return crypto.timingSafeEqual(Buffer.from(hash(pw,s).split(':')[1]),Buffer.from(x))};
const err=(m,c=400)=>{throw Object.assign(new Error(m),{c})};


const pub=(x,admin)=>{const{pw,...r}=x;if(!admin){delete r.last_login;delete r.login_count}return r};
function data(u){const a=u.role=='admin',mine=r=>a||r.student_id==u.id||r.teacher_id==u.id,myQ=new Set(db.quizzes.filter(q=>q.teacher_id==u.id).map(q=>q.id));
 return{me:pub(u,1),profiles:db.users.map(x=>pub(x,a)),requests:db.requests.filter(mine),quizzes:db.quizzes,
  questions:db.questions.map(q=>a||myQ.has(q.quiz_id)?q:{...q,answer:undefined}),
  attempts:db.attempts.filter(x=>a||x.student_id==u.id||myQ.has(x.quiz_id)),attendance:db.attendance.filter(mine),fees:db.fees.filter(mine),
  reports:db.reports.filter(mine),holidays:db.holidays,reviews:db.reviews,notes:db.notes.filter(n=>n.to&&n.to.includes(u.id)&&Date.now()-n.at<120000),v:curVer,logins:a?db.logins.slice(-200).reverse():[]}}
function logIn(u,req,ok,email){db.logins.push({id:id(),user_id:u?.id,email,ok,ip:String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0],ua:req.headers['user-agent']||'',at:now()});
 if(db.logins.length>300)db.logins.splice(0,db.logins.length-300);let t=null;
 if(ok){u.last_login=now();u.login_count=(u.login_count||0)+1;t=crypto.randomBytes(24).toString('hex');db.sessions[t]=u.id}trim();return t}
function signup(req,b){const email=String(b.email||'').trim().toLowerCase(),name=String(b.name||'').trim().slice(0,80);
 if(!/^\S+@\S+\.\S+$/.test(email)||!name||String(b.password||'').length<6||!['student','teacher'].includes(b.role))err('Enter name, valid email, password (min 6 chars)');
 if(db.users.some(u=>u.email==email))err('Email already registered',409);
 const u={id:id(),role:b.role,name,email,pw:hash(b.password),created:now(),login_count:0,blocked:false,lat:null,lng:null};
 if(b.role=='teacher')Object.assign(u,{subject:String(b.subject||'Maths').slice(0,40),fee:1000,avail:'Mon-Fri 5-8 PM',quals:'',bio:''});
 db.users.push(u);return{token:logIn(u,req,true,email)}}
function login(req,b){const email=String(b.email||'').trim().toLowerCase(),u=db.users.find(x=>x.email==email);
 if(!u||!check(String(b.password||''),u.pw)){logIn(u,req,false,email);err('Wrong email or password',401)}
 if(u.blocked){logIn(u,req,false,email);err('Account blocked by admin',403)}return{token:logIn(u,req,true,email)}}

function act(u,b){const S=u.role=='student',T=u.role=='teacher',A=u.role=='admin',need=c=>{if(!c)err('Not allowed',403)};
 const user=(i,r)=>db.users.find(x=>x.id==i&&(!r||x.role==r)&&!x.blocked)||err('User not found',404);
 const enrolled=(t,s)=>db.requests.some(r=>r.teacher_id==t&&r.student_id==s&&r.status=='accepted');
 const ownQuiz=i=>db.quizzes.find(q=>q.id==i&&q.teacher_id==u.id)||err('Quiz not found',404);let note=null;
 switch(b.type){
 case'profile':for(const k of['name','subject','avail','quals','bio'])if(k in b)u[k]=String(b[k]).slice(0,500);
  for(const k of['fee','lat','lng'])if(k in b){const n=Number(b[k]);if(!Number.isFinite(n))err('Bad number');u[k]=n}break;
 case'mypw':if(!check(String(b.old||''),u.pw)||String(b.password||'').length<6)err('Wrong current password or new password too short');u.pw=hash(b.password);break;
 case'send':need(S);user(b.teacher_id,'teacher');db.requests=db.requests.filter(r=>!(r.student_id==u.id&&r.teacher_id==b.teacher_id&&r.status=='rejected'));
  if(db.requests.some(r=>r.student_id==u.id&&r.teacher_id==b.teacher_id))err('Already requested');
  db.requests.push({id:id(),student_id:u.id,teacher_id:b.teacher_id,status:'pending',created:now()});note=['📨 New tuition request from '+u.name,[b.teacher_id]];break;
 case'enroll':{need(T);user(b.student_id,'student');const r=db.requests.find(r=>r.teacher_id==u.id&&r.student_id==b.student_id);
  r?r.status='accepted':db.requests.push({id:id(),student_id:b.student_id,teacher_id:u.id,status:'accepted',created:now()});note=[u.name+' added you to their tuition',[b.student_id]];break}
 case'setreq':{need(T);const r=db.requests.find(r=>r.id==b.id&&r.teacher_id==u.id)||err('Not found',404);if(!['accepted','rejected'].includes(b.status))err('Bad status');r.status=b.status;note=['Your request was '+b.status,[r.student_id]];break}
 case'rate':{need(S&&enrolled(b.teacher_id,u.id));const n=Math.round(+b.rating);if(!(n>=1&&n<=5))err('Rating 1-5');const r=db.reviews.find(r=>r.teacher_id==b.teacher_id&&r.student_id==u.id);r?r.rating=n:db.reviews.push({id:id(),teacher_id:b.teacher_id,student_id:u.id,rating:n});break}
 case'report':{need(T&&enrolled(u.id,b.student_id));const t=String(b.text||'').trim().slice(0,2000);if(!t)err('Empty report');db.reports.push({id:id(),teacher_id:u.id,student_id:b.student_id,text:t,created:now()});note=['📄 New progress report',[b.student_id]];break}
 case'quiz':{need(T);const t=String(b.title||'').trim().slice(0,120);if(!t)err('Title required');db.quizzes.push({id:id(),teacher_id:u.id,title:t});break}
 case'question':{need(T);ownQuiz(b.quiz_id);const o=b.options;if(!b.q||!Array.isArray(o)||o.length!=4||o.some(x=>!String(x).trim())||![0,1,2,3].includes(b.answer))err('Need question, 4 options and correct answer');
  db.questions.push({id:id(),quiz_id:b.quiz_id,q:String(b.q).slice(0,500),options:o.map(x=>String(x).slice(0,200)),answer:b.answer});
  db.requests.filter(r=>r.teacher_id==u.id&&r.status=='accepted').length&&(note=['📝 Quiz updated: '+db.quizzes.find(q=>q.id==b.quiz_id).title,db.requests.filter(r=>r.teacher_id==u.id&&r.status=='accepted').map(r=>r.student_id)]);break}
 case'submit':{need(S);const q=db.quizzes.find(x=>x.id==b.quiz_id)||err('Quiz not found',404);need(enrolled(q.teacher_id,u.id));
  if(db.attempts.some(a=>a.quiz_id==q.id&&a.student_id==u.id))err('Already submitted');const qs=db.questions.filter(x=>x.quiz_id==q.id);if(!qs.length||!Array.isArray(b.answers))err('Bad submission');
  db.attempts.push({id:id(),quiz_id:q.id,student_id:u.id,answers:b.answers,auto:qs.filter((x,i)=>b.answers[i]===x.answer).length,max:qs.length,mark:null,remark:null,status:'pending'});note=['📥 New exam submission from '+u.name,[q.teacher_id]];break}
 case'grade':{need(T);const a=db.attempts.find(x=>x.id==b.id)||err('Not found',404);ownQuiz(a.quiz_id);a.mark=Math.min(a.max,Math.max(0,Math.round(+b.mark)||0));a.remark=String(b.remark||'').slice(0,1000);a.status='graded';note=['✅ Your exam was evaluated',[a.student_id]];break}
 case'mark':need(T&&enrolled(u.id,b.student_id)&&/^\d{4}-\d\d-\d\d$/.test(b.date));{const r=db.attendance.find(r=>r.teacher_id==u.id&&r.student_id==b.student_id&&r.date==b.date);r?r.present=!!b.present:db.attendance.push({id:id(),teacher_id:u.id,student_id:b.student_id,date:b.date,present:!!b.present})}break;
 case'fee':{need(T&&enrolled(u.id,b.student_id)&&/^\d{4}-\d\d$/.test(b.month));const i=db.fees.findIndex(f=>f.teacher_id==u.id&&f.student_id==b.student_id&&f.month==b.month);
  i>=0?db.fees.splice(i,1):(db.fees.push({id:id(),teacher_id:u.id,student_id:b.student_id,month:b.month}),note=['💰 Fee marked paid for '+b.month,[b.student_id]]);break}
 case'hol':need(T&&/^\d{4}-\d\d-\d\d$/.test(b.date)&&String(b.name||'').trim());db.holidays.push({id:id(),teacher_id:u.id,date:b.date,name:String(b.name).slice(0,60)});break;
 case'holdel':need(T);db.holidays=db.holidays.filter(h=>!(h.id==b.id&&h.teacher_id==u.id));break;
 case'block':{need(A);const t=db.users.find(x=>x.id==b.id);if(!t||t.role=='admin')err('Cannot block');t.blocked=!!b.blocked;break}
 case'resetpw':{need(A);const t=db.users.find(x=>x.id==b.id);if(!t||String(b.password||'').length<6)err('Min 6 chars');t.pw=hash(b.password);Object.keys(db.sessions).forEach(k=>db.sessions[k]==t.id&&delete db.sessions[k]);break}
 case'remove':{need(A);const t=db.users.find(x=>x.id==b.id);if(!t||t.role=='admin')err('Cannot remove');const qs=db.quizzes.filter(q=>q.teacher_id==t.id).map(q=>q.id);
  db.quizzes=db.quizzes.filter(q=>q.teacher_id!=t.id);db.questions=db.questions.filter(q=>!qs.includes(q.quiz_id));db.attempts=db.attempts.filter(a=>!qs.includes(a.quiz_id)&&a.student_id!=t.id);
  ['requests','attendance','fees','holidays','reports','reviews'].forEach(k=>db[k]=db[k].filter(r=>r.teacher_id!=t.id&&r.student_id!=t.id));
  db.users=db.users.filter(x=>x.id!=t.id);Object.keys(db.sessions).forEach(k=>db.sessions[k]==t.id&&delete db.sessions[k]);break}
 default:err('Unknown action')}
 if(note){db.notes.push({id:id(),msg:note[0],to:note[1],at:Date.now()});if(db.notes.length>50)db.notes.splice(0,db.notes.length-50)}}


/* ---------- storage: Upstash Redis (Vercel) or local file ---------- */
const RU=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL,RT=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
const FILE=process.env.DATA_FILE||path.join(__dirname,'..','data.json');
const redis=async(cmds,pipe)=>{const r=await fetch(RU+(pipe?'/pipeline':''),{method:'POST',headers:{Authorization:'Bearer '+RT},body:JSON.stringify(cmds)});const j=await r.json();if(j.error)throw new Error(j.error);return j};
let mem=null,memVer=0;
async function loadDB(){let raw;if(RU)raw=(await redis(['GET','htf:db'])).result;else{if(mem===null){try{mem=fs.readFileSync(FILE,'utf8')}catch(e){mem=''}}raw=mem}
 const d=raw?JSON.parse(raw):{};TB.forEach(t=>d[t]??=[]);d.sessions??={};d.logins??=[];d.notes??=[];
 if(!d.users.some(u=>u.role=='admin')){db=d;const e=(process.env.ADMIN_EMAIL||'admin@htf.com').toLowerCase(),p=process.env.ADMIN_PASSWORD||'admin123';
  d.users.push({id:id(),role:'admin',name:'Admin',email:e,pw:hash(p),created:now(),login_count:0});d.__seeded=1;console.log('Admin account created: '+e)}return d}
async function saveDB(d){const s=JSON.stringify(d);if(RU)await redis([['SET','htf:db',s],['INCR','htf:ver']],1);else{mem=s;memVer++;try{fs.writeFileSync(FILE,s)}catch(e){}}}
async function getVer(){return RU?Number((await redis(['GET','htf:ver'])).result||0):memVer}

/* ---------- request handler ---------- */
async function handle({method,path:p,headers,body,ip}){let d,dirty=false;
 try{if(p=='ver')return[200,{v:await getVer()}];
  d=await loadDB();db=d;dirty=!!d.__seeded;delete d.__seeded;const req={headers,socket:{remoteAddress:ip}};
  if(method=='POST'&&(p=='signup'||p=='login')){dirty=true;return[200,p=='signup'?signup(req,body):login(req,body)]}
  const tok=(headers.authorization||'').slice(7),u=db.users.find(x=>x.id==db.sessions[tok]);
  if(!u)err('Please sign in',401);if(u.blocked)err('Account blocked by admin',403);
  if(p=='logout'){delete db.sessions[tok];dirty=true;return[200,{ok:1}]}
  if(p=='data'){curVer=await getVer();return[200,data(u)]}
  if(p=='act'&&method=='POST'){dirty=true;act(u,body);return[200,{ok:1}]}
  return[404,{error:'Not found'}]
 }catch(e){if(!e.c)console.error(e);return[e.c||500,{error:e.c?e.message:'Server error'}]}
 finally{if(dirty&&d)await saveDB(d)}}
module.exports={handle};
