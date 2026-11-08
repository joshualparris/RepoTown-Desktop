import {makeDistinctPerson} from './npc-wardrobe.js';
import {pose} from './npcs.js';
// Lazy allocation with a strict draw cap: population is not synonymous with street crowd.
export function createPopulationView(life,group,makeLabel){
  const models=new Map();
  return {models,syncPositions(){
    for(const p of models.values())if(p.fig.group.visible)p.fig.group.position.set(p.v.x,0,p.v.z);
  },update(dt,t,eye,overview,selection=null){
    for(const p of models.values())p.fig.group.visible=false;
    if(overview)return;
    const visible=(life.population?.additional||[]).filter(v=>!v.inside&&(!selection||selection.has(v))&&Math.hypot(v.x-eye.x,v.z-eye.z)<65)
      .sort((a,b)=>Math.hypot(a.x-eye.x,a.z-eye.z)-Math.hypot(b.x-eye.x,b.z-eye.z)).slice(0,48);
    for(const v of visible){let p=models.get(v.id);
      if(!p){const fig=makeDistinctPerson(v.populationId+':'+v.name,v),label=makeLabel(v.name+' · '+v.age,'interactive');label.position.set(0,2.4,0);fig.group.add(label);group.add(fig.group);p={fig,label,v};models.set(v.id,p);}
      p.fig.group.visible=true;p.fig.group.position.set(v.x,0,v.z);p.fig.group.rotation.y=v.heading;
      const dist=Math.hypot(v.x-eye.x,v.z-eye.z);
      p.fig.group.userData.setLod?.(dist>45?3:dist>22?2:dist>10?1:0);
      p.label.visible=dist<14;pose(p.fig,dt,t,v.path.length>0);
    }
  }};
}
