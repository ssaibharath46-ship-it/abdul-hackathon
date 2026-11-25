const{handle}=require('../lib/core');
module.exports=async(req,res)=>{let body=req.body;if(typeof body=='string'){try{body=JSON.parse(body)}catch(e){body={}}}
 const[c,o]=await handle({method:req.method,path:new URL(req.url,'http://x').pathname.replace(/^\/api\/?/,''),headers:req.headers,body:body||{},ip:String(req.headers['x-forwarded-for']||'').split(',')[0]});
 res.setHeader('Cache-Control','no-store');res.status(c).json(o)};
