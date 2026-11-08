import {latteArtPanel} from './latte-art.js';
import {esc} from './interactions.js';
export function choices(title,body,options){return {title,body,actions:options};}
export function skillPanel(step,done,cancel,sound){
 const [stepId,label,target]=step,id=stepId.split(':').at(-1);
 if(id==='latte-art')return latteArtPanel(done,cancel,sound);
 return {title:label+' · skill challenge',body:'<p>Stop the moving marker in the green zone. Timing changes preparation quality; a miss can be retried.</p><canvas id="work-skill" width="540" height="250" style="width:100%;max-width:540px;border-radius:12px;background:#182e35" aria-label="Animated preparation and timing meter"></canvas><p id="work-skill-readout" role="status">Ready</p><button id="work-skill-stop" type="button" style="padding:16px;font-size:18px">Stop / Space</button> <button id="work-skill-assisted" type="button">Assisted preparation</button><p class="dim">Assisted mode has no timing requirement. These are game recipes and timings.</p>',
 actions:[{label:'Put down tools / cancel',run:()=>{cancel();return null;}}],
 mount(root){
  const canvas=root.querySelector('#work-skill'),ctx=canvas.getContext('2d'),read=root.querySelector('#work-skill-readout');let start=performance.now(),value=0,finished=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finish=assisted=>{if(finished)return;finished=true;removeEventListener('keydown',key);const score=assisted?.75:Math.max(0,1-Math.abs(value-target)/.3);done(score);};
  const key=e=>{if(e.code==='Space'&&!e.repeat&&canvas.isConnected){e.preventDefault();e.stopPropagation();finish(false);}};
  addEventListener('keydown',key);root.querySelector('#work-skill-stop').onclick=()=>finish(false);root.querySelector('#work-skill-assisted').onclick=()=>finish(true);
  function draw(t){
   if(finished||!canvas.isConnected){removeEventListener('keydown',key);return;}
   const elapsed=(t-start)/1000;value=(Math.sin(elapsed*(reduced?.9:2.2)-Math.PI/2)+1)/2;
   ctx.clearRect(0,0,540,250);ctx.fillStyle='#e8eee5';ctx.font='bold 20px system-ui';ctx.fillText(label,18,30);
   const coffee=['grind','tamp','extract','steam','pour','fill','steep'].includes(id);
   if(coffee){
    ctx.fillStyle='#c1c9c8';ctx.fillRect(70,55,160,85);ctx.fillStyle='#253d45';ctx.fillRect(85,70,130,45);
    ctx.fillStyle='#f6ede0';ctx.beginPath();ctx.roundRect(290,100,90,65,12);ctx.fill();ctx.strokeStyle='#f6ede0';ctx.lineWidth=8;ctx.beginPath();ctx.arc(385,125,19,-Math.PI/2,Math.PI/2);ctx.stroke();
    ctx.fillStyle=id==='steam'?'#e8e5d9':'#75492e';ctx.fillRect(298,150-value*40,74,value*40);
    if(['extract','pour','fill'].includes(id)){ctx.strokeStyle=id==='fill'?'#8ac6d7':'#c09861';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(222,126);ctx.quadraticCurveTo(255,65,330,112);ctx.stroke();}
    if(id==='steam'||id==='steep'){ctx.strokeStyle='#c3d6d17a';ctx.lineWidth=3;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(310+i*16,95);ctx.quadraticCurveTo(300+i*16+Math.sin(elapsed*3+i)*10,70,315+i*16,48);ctx.stroke();}}
    if(id==='pour'){ctx.strokeStyle='#fff2db';ctx.lineWidth=3;for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(333,125+i*3,5+i*4,3,Math.sin(elapsed)*.1,0,Math.PI*2);ctx.stroke();}}
   }else{
    ctx.fillStyle='#89918a';ctx.fillRect(75,60,175,110);ctx.fillStyle='#1b2226';ctx.fillRect(88,75,148,75);
    ctx.fillStyle='#f7eee0';ctx.beginPath();ctx.ellipse(350,130,70,30,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=['tray','bake'].includes(id)?'#c3914d':'#f0ca75';ctx.beginPath();ctx.ellipse(350,120,44,18,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#e7a848';ctx.fillRect(92,142,140*value,7);ctx.strokeStyle='#ddd';ctx.beginPath();ctx.moveTo(300+value*80,55);ctx.lineTo(315+value*80,100);ctx.stroke();
   }
   const x=25,w=490;ctx.fillStyle='#45616b';ctx.fillRect(x,198,w,24);ctx.fillStyle='#75ba87';ctx.fillRect(x+w*(target-.1),198,w*.2,24);ctx.fillStyle='#fff3b6';ctx.fillRect(x+w*value-3,192,6,36);
   read.textContent='Target '+Math.round(target*100)+'% · marker '+Math.round(value*100)+'%';
   requestAnimationFrame(draw);
  }
  sound?.(id);requestAnimationFrame(draw);
 }};
}
