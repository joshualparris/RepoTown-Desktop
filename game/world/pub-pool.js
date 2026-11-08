// Equal-mass rolling discs, fixed-step contact/cushion/pocket simulation in metres.
// Two-player eight-ball house rules; no spin, jump or certified tournament claim.
export const POOL={w:.915,h:1.83,r:.0254,friction:.18,ballRestitution:.94,cushionRestitution:.8,pocket:.052};
export function newPool(){const balls=[{id:0,x:POOL.w/2,y:POOL.h*.76,vx:0,vy:0,potted:false}];const rack=[1,9,2,10,8,3,11,4,12,5,13,6,14,7,15];let id=1;for(let row=0;row<5;row++)for(let c=0;c<=row;c++){const n=rack[id-1];balls.push({id:n,x:POOL.w/2+(c-row/2)*POOL.r*2.04,y:POOL.h*.25+row*POOL.r*1.77,vx:0,vy:0,potted:false});id++}return {version:1,balls,turn:0,groups:[null,null],winner:null,shots:0,last:'Break from the baulk end. Aim on the cloth, set power and shoot.',ballInHand:false}}
export function validPool(s){return !!s&&s.version===1&&[0,1].includes(s.turn)&&[null,0,1].includes(s.winner)&&Array.isArray(s.balls)&&s.balls.length===16&&new Set(s.balls.map(b=>b.id)).size===16&&s.balls.every(b=>Number.isInteger(b.id)&&b.id>=0&&b.id<=15&&typeof b.potted==='boolean'&&[b.x,b.y,b.vx,b.vy].every(Number.isFinite)&&b.x>=-1&&b.x<=POOL.w+1&&b.y>=-1&&b.y<=POOL.h+1&&Math.abs(b.vx)<20&&Math.abs(b.vy)<20)&&Array.isArray(s.groups)&&s.groups.length===2&&s.groups.every(g=>g===null||g==='red'||g==='yellow')&&Number.isInteger(s.shots)&&s.shots>=0&&s.shots<1e6&&typeof s.last==='string'&&s.last.length<500&&typeof s.ballInHand==='boolean'}
const group=id=>id===0||id===8?null:id<8?'red':'yellow';
const pockets=[[0,0],[POOL.w,0],[0,POOL.h/2],[POOL.w,POOL.h/2],[0,POOL.h],[POOL.w,POOL.h]];
export function poolStep(s,dt,events={potted:[],first:null,rail:false}){
 const {w,h,r}=POOL;
 for(const b of s.balls){if(b.potted)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(pockets.some(([x,y])=>Math.hypot(b.x-x,b.y-y)<POOL.pocket)){b.potted=true;b.vx=b.vy=0;events.potted.push(b.id);continue}
  if(b.x<r||b.x>w-r){b.x=Math.max(r,Math.min(w-r,b.x));b.vx*=-POOL.cushionRestitution;if(events.first!==null)events.rail=true}
  if(b.y<r||b.y>h-r){b.y=Math.max(r,Math.min(h-r,b.y));b.vy*=-POOL.cushionRestitution;if(events.first!==null)events.rail=true}
  const v=Math.hypot(b.vx,b.vy),f=Math.max(0,v-POOL.friction*dt);if(v){b.vx*=f/v;b.vy*=f/v}
 }
 for(let i=0;i<s.balls.length;i++)for(let j=i+1;j<s.balls.length;j++){const a=s.balls[i],b=s.balls[j];if(a.potted||b.potted)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=2*r)continue;if(d<1e-9){dx=1e-6;dy=0;d=1e-6}const nx=dx/d,ny=dy/d,overlap=(2*r-d)/2;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;const closing=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(closing>0){const impulse=(1+POOL.ballRestitution)*closing/2;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;if(events.first===null&&(a.id===0||b.id===0))events.first=a.id===0?b.id:a.id}}
 return events;
}
export function placeCue(s,x,y){if(!s.ballInHand)return false;const r=POOL.r;if(x<r||x>POOL.w-r||y<r||y>POOL.h-r||s.balls.some(b=>b.id!==0&&!b.potted&&Math.hypot(b.x-x,b.y-y)<2*r+.001))return false;Object.assign(s.balls.find(b=>b.id===0),{x,y,vx:0,vy:0,potted:false});s.ballInHand=false;return true}
export function poolShot(s,angle,power){
 if(!validPool(s)||s.winner!==null||s.ballInHand||!Number.isFinite(angle)||!Number.isFinite(power)||power<=0||power>1)return {frames:[],message:'Place the cue ball legally, then choose power between 1 and 100 percent.'};
 const cue=s.balls.find(b=>b.id===0),player=s.turn,g=s.groups[player],remaining=s.balls.filter(b=>!b.potted&&group(b.id)===g).length;cue.vx=Math.cos(angle)*power*3;cue.vy=Math.sin(angle)*power*3;const e={potted:[],first:null,rail:false},frames=[];
 for(let step=0;step<40*240;step++){poolStep(s,1/240,e);if(step%8===0)frames.push(s.balls.map(b=>({id:b.id,x:b.x,y:b.y,potted:b.potted})));if(s.balls.every(b=>b.potted||Math.hypot(b.vx,b.vy)<.002))break}
 for(const b of s.balls)b.vx=b.vy=0;
 const wrong=g&&e.first!==null&&(remaining?group(e.first)!==g:e.first!==8),foul=e.first===null||e.potted.includes(0)||wrong||(!e.rail&&!e.potted.length);
 if(e.potted.includes(8)){s.winner=!foul&&g&&remaining===0?player:1-player;s.last='Player '+(s.winner+1)+' wins: '+(s.winner===player?'legal black.':'black potted early or on a foul.');}
 else{if(!g&&!foul){const p=e.potted.find(id=>group(id));if(p){s.groups[player]=group(p);s.groups[1-player]=group(p)==='red'?'yellow':'red'}}const keep=!foul&&e.potted.some(id=>group(id)===s.groups[player]);if(!keep)s.turn=1-player;if(foul){s.ballInHand=true;cue.potted=true;s.last='Foul: opponent has ball in hand. Click an empty spot on the cloth.'}else s.last=keep?'Legal pot: play again.':'No legal pot: next player.'}
 s.shots++;return {frames,message:s.last};
}
