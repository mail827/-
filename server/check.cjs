require('dotenv').config();
const p = new (require('@prisma/client').PrismaClient)();
p.idPhoto.findFirst({where:{status:'GENERATING'},orderBy:{createdAt:'desc'}}).then(async r=>{
  if(!r){console.log('GENERATING 건 없음');process.exit();}
  console.log('id:', r.id);
  console.log('requestId:', r.resultUrl);
  const res = await fetch('https://queue.fal.run/fal-ai/nano-banana-2/requests/'+r.resultUrl+'/status',{
    headers:{Authorization:'Key '+process.env.FAL_API_KEY}
  });
  const t = await res.text();
  console.log('fal status:', t);
  process.exit();
});
