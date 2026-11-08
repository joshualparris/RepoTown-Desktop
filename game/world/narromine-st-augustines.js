// St Augustine's Catholic Church, [address redacted], Narromine.
// Survey-aligned OSM outline and 2023 NSW LiDAR; 1933 brick Romanesque details
// from historical architectural documentation (see docs/NARROMINE_ST_AUGUSTINES_EVIDENCE.md).
// Only exterior modelled. No third-party photographic pixels/textures included.
import * as THREE from 'three';
import { BUILDINGS } from './narromine-layout.js';

export const ST_AUGUSTINES_OSM_INDEX = 10;
export const ST_AUGUSTINES_MODEL_ID = 'narromine:st-augustines-catholic-church';
const COLOUR = Object.freeze({
  brick:0xa45a41, brickBand:0x813e2c, mortar:0xc6a584,
  tile:0x995344, tileShade:0x874235, tileRidge:0x673a32,
  stone:0xddc6a5, glass:0x263d47, joinery:0x47352f,
  step:0xa49b91, iron:0x77746b,
});

export function stAugustinesEvidence(buildings = BUILDINGS) {
  const site = buildings.find(b => b.osmIndex === ST_AUGUSTINES_OSM_INDEX);
  if (!site || site.kind !== 'church' || !/augustin/i.test(site.name)) {
    throw new Error('St Augustine church OSM footprint (index 10) missing or changed: stop rather than place fictional geometry');
  }
  if (!site.lidar || site.lidar[0] !== 2023) throw new Error('2023 NSW LiDAR evidence for St Augustine church unavailable');
  const [year, groundAhd, eave, ridge] = site.lidar;
  return Object.freeze({
    osmIndex: ST_AUGUSTINES_OSM_INDEX, name: 'St Augustine’s Catholic Church',
    address: '[address redacted], Narromine NSW 2821',
    footprint: site.pts.map(p => [...p]),
    lidar: { year, groundAhd, eave, ridge },
    exterior: { brick: 'local red brick', roof: 'Wunderlich semi-glazed tiled gable',
      style:'Inter-war Romanesque', built:1933, architect:'Peter Joseph Gannon',
      crossHeightM:2.18, documentedNaveWidthM:8.53, documentedNaveLengthM:18.29,
      documentedTranseptWidthM:14.63, documentedTranseptDepthM:6.71 },
  });
}
const g3=(triangles) => {
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(triangles.flat(),3));
  geometry.computeVertexNormals();
  return geometry;
};
const tri=(a,b,c)=>[...a,...b,...c];
const quad=(a,b,c,d)=>[...tri(a,b,c),...tri(a,c,d)];
export function churchFootprintColliders(pts, stepM = 1.25) {
  // Strip decomposition of the real, concave OSM outline: the old large AABB
  // blocked more than the building itself (including its approach).
  const lo=Math.min(...pts.map(p=>p[0])), hi=Math.max(...pts.map(p=>p[0]));
  const slices=Math.ceil((hi-lo)/stepM), out=[];
  for(let i=0;i<slices;i++){
    const x0=lo+(hi-lo)*i/slices,x1=lo+(hi-lo)*(i+1)/slices,x=(x0+x1)/2, hits=[];
    for(let j=0;j<pts.length;j++){
      const a=pts[j],b=pts[(j+1)%pts.length];
      if((a[0]<=x&&x<b[0])||(b[0]<=x&&x<a[0]))
        hits.push(a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]));
    }
    hits.sort((a,b)=>a-b);
    for(let j=0;j+1<hits.length;j+=2)if(hits[j+1]-hits[j]>0.45)
      out.push({x0:x0+0.08,x1:x1-0.08,z0:hits[j]+0.12,z1:hits[j+1]-0.12});
  }
  return out;
}

// Entirely original tile/brick patterns: there are no sourced image pixels
// or API requests. DataTexture also works in Node test runs without a DOM.
export function churchMaterialTexture(kind) {
  if(!['brick','terracotta'].includes(kind))throw new Error('Unknown church texture type');
  const W=512,H=512,bytes=new Uint8Array(W*H*4);
  const brick=kind==='brick',cellW=brick?32:64,cellH=brick?16:32;
  const cols=W/cellW,rows=H/cellH,variations=brick
    ? [[163,91,65],[172,101,73],[153,82,58],[184,107,77],[155,89,67],[176,96,69]]
    : [[153,76,57],[160,82,63],[145,69,54],[181,101,71],[158,78,56],[168,88,64]];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const row=Math.floor(y/cellH), offset=(row%2)*Math.floor(cellW/2);
    const run=(x+offset)%W,col=Math.floor(run/cellW),bx=run%cellW,by=y%cellH;
    const mortar=bx<2||by<2;
    const index=(row*67+col*59+Math.floor(row*col/7))%variations.length;
    const base=mortar?(brick?[190,160,134]:[88,52,42]):variations[index];
    const grain=((x*13+y*17+row*37+col*29)%17)-8;
    const bevel=!mortar&&(bx<=3||by<=3||by>cellH-4);
    const shade=bevel?-13:0;
    const k=(y*W+x)*4;
    for(let c=0;c<3;c++)bytes[k+c]=Math.max(0,Math.min(255,base[c]+grain+shade));
    bytes[k+3]=255;
  }
  const tex=new THREE.DataTexture(bytes,W,H,THREE.RGBAFormat);
  tex.name='St Augustine original procedural '+kind;
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.magFilter=THREE.LinearFilter;
  tex.minFilter=THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps=true;
  tex.needsUpdate=true;
  return tex;
}

export function buildNarromineStAugustines({ push, colliders=[], spots=[], town=null }={}) {
  if(typeof push!=='function')throw new Error('St Augustine church requires the existing Narromine batch geometry push()');
  const evidence=stAugustinesEvidence(), pts=evidence.footprint;
  const eave=evidence.lidar.eave, ridge=evidence.lidar.ridge;
  const front=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2];
  const rear=[(pts[6][0]+pts[7][0])/2,(pts[6][1]+pts[7][1])/2];
  const dx=front[0]-rear[0], dz=front[1]-rear[1], long=Math.hypot(dx,dz);
  const ux=dx/long,uz=dz/long, vx=-uz,vz=ux;
  const centre=[(front[0]+rear[0])/2,(front[1]+rear[1])/2],yaw=-Math.atan2(uz,ux);
  const half=long/2, naveW=8.53, naveL=Math.min(18.29,long-0.6);
  const naveStart=half-naveL, transeptX=naveStart+1.6;
  let features=0;
  const texturedMaterials = town?.add && typeof town.add === 'function' ? {
    brick:new THREE.MeshLambertMaterial({map:churchMaterialTexture('brick'),side:THREE.DoubleSide}),
    roof:new THREE.MeshLambertMaterial({map:churchMaterialTexture('terracotta'),side:THREE.DoubleSide}),
  } : null;
  let texturedSurfaces=0;
  // Face vertices are [x,y,z] and UVs are expressed in repeat tile units;
  // the base LiDAR model remains batched. Individual 2D texture overlays
  // avoid an extra geometry submission for every mortar line or roof tile.
  const textureFace=(material,points,uv,local=true)=>{
    if(!texturedMaterials)return;
    const v=new Float32Array([...points[0],...points[1],...points[2],
      ...points[0],...points[2],...points[3]]);
    const t=new Float32Array([...uv[0],...uv[1],...uv[2],
      ...uv[0],...uv[2],...uv[3]]);
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(v,3));
    geometry.setAttribute('uv',new THREE.BufferAttribute(t,2));
    geometry.computeVertexNormals();
    if(local)geometry.rotateY(yaw).translate(centre[0],0,centre[1]);
    const mesh=new THREE.Mesh(geometry,texturedMaterials[material]);
    mesh.name='St Augustine '+material+' procedural surface';
    mesh.receiveShadow=true;mesh.castShadow=false;
    town.add(mesh);texturedSurfaces++;
  };
  const textureTri=(material,points,uv)=>{
    if(!texturedMaterials)return;
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv.flat(),2));
    geometry.computeVertexNormals();
    geometry.rotateY(yaw).translate(centre[0],0,centre[1]);
    const mesh=new THREE.Mesh(geometry,texturedMaterials[material]);
    mesh.name='St Augustine front gable brick';
    mesh.receiveShadow=true;town.add(mesh);texturedSurfaces++;
  };
  const submit=(colour,geometry)=>{
    geometry.rotateY(yaw);
    geometry.translate(centre[0],0,centre[1]);
    push(colour,geometry); features++;
  };
  const cube=(colour,x,y,z,w,h,d)=>{
    const g=new THREE.BoxGeometry(w,h,d);
    g.translate(x,y,z);
    submit(colour,g);
  };
  const face=(colour,vertices)=>submit(colour,g3(vertices));
  const arch=(colour,x,y,z,r,tube,plane='yz',start=0,arc=Math.PI)=>{
    const g=new THREE.TorusGeometry(r,tube,6,24,arc);
    if(plane==='yz')g.rotateY(Math.PI/2);
    g.translate(x,y,z);
    submit(colour,g);
  };
  const roofX=(start,end,width,ey,ry,tiles=true)=>{
    const a=[start,ey,-width/2],b=[end,ey,-width/2],c=[end,ey,width/2],d=[start,ey,width/2];
    const re=[end,ry,0],rs=[start,ry,0];
    face(COLOUR.tile,quad(a,b,re,rs));
    face(COLOUR.tile,quad(rs,re,c,d));
    // Independent terracotta pattern, following both real roof slopes.
    const sloped=Math.hypot(width/2,ry-ey), tu=(end-start)/4, tv=sloped/2.65, o=.04;
    textureFace('roof',[[start,ey+o,-width/2],[end,ey+o,-width/2],
      [end,ry+o,0],[start,ry+o,0]],[[0,0],[tu,0],[tu,tv],[0,tv]]);
    textureFace('roof',[[start,ry+o,0],[end,ry+o,0],
      [end,ey+o,width/2],[start,ey+o,width/2]],[[0,0],[tu,0],[tu,tv],[0,tv]]);
    face(COLOUR.brick,tri(b,c,re));
    face(COLOUR.brick,tri(d,a,rs));
    cube(COLOUR.tileRidge,(start+end)/2,ry+0.02,0,end-start,0.11,0.14);
    if(tiles)for(const side of [-1,1])for(let k=1;k<Math.floor(width/2/0.5);k++){
      const z0=side*(k*.5),z1=side*(k*.5+0.055);
      const y0=ry-(ry-ey)*Math.abs(z0)/(width/2)+0.025;
      const y1=ry-(ry-ey)*Math.abs(z1)/(width/2)+0.025;
      face(k%3===0?COLOUR.tileShade:0xac6550,
        quad([start+.1,y0,z0],[end-.1,y0,z0],[end-.1,y1,z1],[start+.1,y1,z1]));
    }
  };
  const roofZ=(start,end,width,ey,ry)=>{
    const a=[-width/2,ey,start],b=[width/2,ey,start],c=[width/2,ey,end],d=[-width/2,ey,end];
    const rs=[0,ry,start],re=[0,ry,end];
    face(COLOUR.tileShade,quad(a,rs,re,d));
    face(COLOUR.tileShade,quad(rs,b,c,re));
    face(COLOUR.brick,tri(a,b,rs));
    face(COLOUR.brick,tri(c,d,re));
    cube(COLOUR.tileRidge,0,ry+.02,(start+end)/2,.11,.11,end-start);
  };
  // Preserve every boundary break in the mapped cruciform polygon, rather than
  // replacing it with a box that bleeds across neighbouring lots.
  const outline=new THREE.Shape(pts.map(([x,z])=>new THREE.Vector2(x,-z)));
  const walls=new THREE.ExtrudeGeometry(outline,{depth:eave,bevelEnabled:false,curveSegments:1});
  walls.rotateX(-Math.PI/2);push(COLOUR.brick,walls);features++;
  // Clad the entire documented OSM perimeter without inventing a second
  // footprint or adding opaque sheet-geometry through any neighbouring road.
  if(texturedMaterials){
    const mid=[pts.reduce((n,p)=>n+p[0],0)/pts.length,
      pts.reduce((n,p)=>n+p[1],0)/pts.length];
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+1)%pts.length],
        dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
      if(len<.1)continue;
      let nx=-dz/len,nz=dx/len;
      if((a[0]+b[0]-2*mid[0])*nx+(a[1]+b[1]-2*mid[1])*nz<0){nx=-nx;nz=-nz;}
      const o=.055;
      textureFace('brick',[[a[0]+nx*o,.02,a[1]+nz*o],
        [b[0]+nx*o,.02,b[1]+nz*o],
        [b[0]+nx*o,eave-.03,b[1]+nz*o],
        [a[0]+nx*o,eave-.03,a[1]+nz*o]],
      [[0,0],[len/3.84,0],[len/3.84,eave/2.368],[0,eave/2.368]],false);
    }
  }
  // The 1933 documented nave and transept dimensions are used as local roof
  // proportions, constrained to the measured 2023 eave/ridge envelope.
  roofX(naveStart,half,naveW+.5,eave,ridge);
  roofZ(-7.3,7.3,6.71+0.35,eave+0.06,Math.min(ridge-.6,9.95));
  roofX(-half,naveStart+.2,naveW-1.6,eave-0.15,ridge-1.9,false);
  // Distinct tall east-facing main entry gable, with warm brick pilasters,
  // recessed round-arched entrance and a small devotional statue niche.
  const frontX=half+0.06,entranceY=2.35;
  face(COLOUR.brick,tri([frontX,eave,-naveW/2],[frontX,eave,naveW/2],[frontX,ridge,0]));
  textureTri('brick',[[frontX+.045,eave+.015,-naveW/2],
    [frontX+.045,eave+.015,naveW/2],[frontX+.045,ridge+.015,0]],
    [[0,0],[naveW/3.84,0],[naveW/7.68,(ridge-eave)/2.368]]);
  for(const u of [-naveW/2+.35,naveW/2-.35]){
    cube(COLOUR.brickBand,frontX+.12,2.28,u,.42,4.56,.48);
    cube(COLOUR.stone,frontX+.17,4.58,u,.54,.16,.6);
  }
  cube(COLOUR.joinery,frontX+.18,entranceY/2,0,.11,entranceY,2.15);
  for(const u of [-1.18,1.18])cube(COLOUR.stone,frontX+.23,1.65,u,.18,3.3,.18);
  arch(COLOUR.stone,frontX+.23,3.25,0,1.18,.17,'yz',0,Math.PI);
  // Dark recessed upper niche, pale statue silhouette; no imagined sculpture texture.
  const disc=new THREE.CircleGeometry(.58,24);
  disc.rotateY(Math.PI/2);disc.translate(frontX+.18,8.1,0);submit(COLOUR.glass,disc);
  arch(COLOUR.stone,frontX+.22,8.1,0,.6,.1,'yz',0,Math.PI*2);
  cube(COLOUR.stone,frontX+.28,7.9,0,.12,.62,.25);
  const head=new THREE.SphereGeometry(.15,8,8);head.translate(frontX+.28,8.29,0);submit(COLOUR.stone,head);
  // 7ft 2in Celtic cross documented above the gabled parapet.
  const crossX=frontX-.2,crossBase=ridge+.08,crossH=2.18;
  cube(COLOUR.stone,crossX,crossBase+crossH/2,0,.2,crossH,.25);
  cube(COLOUR.stone,crossX,crossBase+crossH*.65,0,.2,.2,1.23);
  arch(COLOUR.stone,crossX+.015,crossBase+crossH*.65,0,.38,.07,'yz',0,Math.PI*2);
  // Repeated slender, tall windows and projecting sandstone arches, rather
  // than flat generic blue rectangles. Exact individual openings remain provisional.
  for(const side of [-1,1]){
    for(const t of [half-4.1,half-8.2,half-12.2]){
      const z=side*(naveW/2+.015),w=1.1;
      cube(COLOUR.glass,t,2.76,z,w,2.23,.09);
      cube(COLOUR.stone,t,1.61,z,w+.28,.11,.22);
      cube(COLOUR.stone,t-w/2-.08,2.76,z,.12,2.15,.15);
      cube(COLOUR.stone,t+w/2+.08,2.76,z,.12,2.15,.15);
      const circle=new THREE.CircleGeometry(w/2,16,0,Math.PI);
      if(side<0)circle.rotateY(Math.PI);
      circle.translate(t,3.86,z);
      submit(COLOUR.glass,circle);
      arch(COLOUR.stone,t,3.86,z,w/2+.07,.11,'xy',0,Math.PI);
    }
    // Transeept gable end, anchored in documented 14.63m cross-arm width.
    const zs=side*7.3;
    cube(COLOUR.glass,transeptX,2.93,zs+side*.045,1.1,1.95,.11);
    cube(COLOUR.stone,transeptX,1.91,zs+side*.14,1.35,.13,.27);
  }
  // Brick buttresses on side walls, visible as depth rather than painted lines.
  for(const side of [-1,1])for(const t of [half-2.4,half-6.5,half-10.8]){
    cube(COLOUR.brickBand,t,2.17,side*(naveW/2+.25),.65,4.34,.63);
    cube(COLOUR.stone,t,4.37,side*(naveW/2+.25),.76,.14,.75);
  }
  // Two shallow entrance steps remain outside the collision solids, so the
  // churchfront can be approached on foot from Dandaloo Street.
  cube(COLOUR.step,half+.78,.075,0,.92,.15,3.3);
  cube(COLOUR.step,half+.37,.16,0,.52,.32,2.75);

  const collisionStrips=churchFootprintColliders(pts);
  colliders.push(...collisionStrips);
  spots.push({key:ST_AUGUSTINES_MODEL_ID,label:evidence.name,
    pos:new THREE.Vector3(front[0]+ux*2.5,0,front[1]+uz*2.5),
    text:'[address redacted] · 1933 Inter-war Romanesque church built after the 1932 cyclone. Roof and location constrained by LiDAR and mapped footprint.'});
  return { evidence, stats:{geometryParts:features,footprintVertices:pts.length,collisionStrips:collisionStrips.length,
    front: [...front],centre:[...centre],eaveM:eave,ridgeM:ridge,modelId:ST_AUGUSTINES_MODEL_ID,
    texturedSurfaces} };
}
