// Local dev server: node server.js  (same API code as Vercel, file storage in data.json)
const http=require('http'),fs=require('fs'),path=require('path'),{handle}=require('./lib/core');
const PORT=process.env.PORT||3000,PUB=path.join(__dirname,'public'),MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript'};
http.createServer(async(req,res)=>{const url=new URL(req.url,'http://x');
 if(url.pathname.startsWith('/api/')){let s='';for await(const c of req){s+=c;if(s.length>2e5)break}let body={};try{body=s?JSON.parse(s):{}}catch(e){}
  const[c,o]=await handle({method:req.method,path:url.pathname.slice(5),headers:req.headers,body,ip:req.socket.remoteAddress});
  res.writeHead(c,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify(o))}
 const f=path.normalize(path.join(PUB,url.pathname=='/'?'index.html':decodeURIComponent(url.pathname)));
 if(!f.startsWith(PUB)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('Not found')}
 res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)
}).listen(PORT,()=>console.log('http://localhost:'+PORT));
