// Planning-only graph audit; road strips are not active vehicle navigation edges.
import {PLANNED_ROADS} from './town-planning.js';
const bounds=r=>({x0:r.x-r.w/2,x1:r.x+r.w/2,z0:r.z-r.d/2,z1:r.z+r.d/2});
export function plannedRoadGraph(){
 const nodes=PLANNED_ROADS.map(r=>({id:r.id,role:r.role,driveable:false,centre:{x:r.x,z:r.z},length:Math.max(r.w,r.d),width:Math.min(r.w,r.d)}));
 const edges=[];
 for(let i=0;i<PLANNED_ROADS.length;i++)for(let j=i+1;j<PLANNED_ROADS.length;j++){
  const a=bounds(PLANNED_ROADS[i]),b=bounds(PLANNED_ROADS[j]);
  const x0=Math.max(a.x0,b.x0),x1=Math.min(a.x1,b.x1),z0=Math.max(a.z0,b.z0),z1=Math.min(a.z1,b.z1);
  if(x1>x0&&z1>z0)edges.push({from:PLANNED_ROADS[i].id,to:PLANNED_ROADS[j].id,point:{x:(x0+x1)/2,z:(z0+z1)/2},status:'visual-overlap-only'});
 }
 const adjacency=new Map(nodes.map(n=>[n.id,new Set()]));
 for(const e of edges){adjacency.get(e.from).add(e.to);adjacency.get(e.to).add(e.from);}
 const components=[],seen=new Set();
 for(const n of nodes){if(seen.has(n.id))continue;const queue=[n.id],component=[];seen.add(n.id);while(queue.length){const id=queue.shift();component.push(id);for(const next of adjacency.get(id))if(!seen.has(next)){seen.add(next);queue.push(next);}}components.push(component);}
 return {nodes,edges,components,connected:components.length===1,allDriveable:nodes.every(n=>n.driveable)};
}
