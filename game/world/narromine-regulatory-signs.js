// Original vector faces for existing observed objects; no new sign locations.
// NSW visual references and limits: docs/NARROMINE_REGULATORY_SIGN_FACES.md.
import * as THREE from 'three';

export const REGULATORY_SIGN_TYPES = Object.freeze(['stop', 'giveway', 'keepLeft', 'noEntry']);
// Dimensions are visual estimates, not a survey of the individual signs.
const specs = {
  stop: { width: .76, height: .76 },
  giveway: { width: .78, height: .70 },
  keepLeft: { width: .45, height: .60 },
  noEntry: { width: .45, height: .60 },
};
const WHITE = '#f4f4f0', RED = '#c8202a', BLACK = '#161616';
let faceMaterial;
const rearMaterial = new THREE.MeshLambertMaterial({ color: 0x9fa5a8, side: THREE.BackSide });

// Normalised outline, +Y up. STOP has horizontal top/bottom edges; GIVE WAY points down.
export function regulatorySignOutline(type) {
  if (!specs[type]) throw new RangeError('Unknown regulatory sign: ' + type);
  if (type === 'giveway') return [[-.5,.5],[0,-.5],[.5,.5]];
  if (type === 'stop') {
    const k = (Math.SQRT2 - 1) / 2;
    return [[-k,.5],[-.5,k],[-.5,-k],[-k,-.5],[k,-.5],[.5,-k],[.5,k],[k,.5]];
  }
  return [[-.5,.5],[-.5,-.5],[.5,-.5],[.5,.5]];
}

// A single atlas keeps the nineteen observed signs in one face-material batch.
// Canvas construction is shared by browser QA; no external images or fonts are fetched.
export function drawRegulatorySignAtlas(canvas) {
  canvas.width = canvas.height = 1024;
  const g = canvas.getContext('2d');
  const polygon = (points, fill) => {
    g.beginPath(); points.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y));
    g.closePath(); g.fillStyle = fill; g.fill();
  };
  const label = (text,y,size,colour=BLACK) => {
    g.fillStyle=colour; g.font=`bold ${size}px sans-serif`; g.textAlign='center'; g.textBaseline='middle';
    g.fillText(text,256,y);
  };
  g.clearRect(0,0,1024,1024);
  REGULATORY_SIGN_TYPES.forEach((type,i) => {
    g.save(); g.translate((i%2)*512,Math.floor(i/2)*512);
    const outline=regulatorySignOutline(type);
    const points = (scale) => outline.map(([x,y]) => [256+x*scale,256-y*scale]);
    if(type==='stop') {
      polygon(points(502),WHITE); polygon(points(475),RED);
      label('STOP',262,137,WHITE);
    } else if(type==='giveway') {
      polygon(points(502),RED); polygon(points(389),WHITE);
      label('GIVE',180,77); label('WAY',258,77);
    } else {
      g.fillStyle=WHITE; g.fillRect(0,0,512,512);
      g.strokeStyle=BLACK; g.lineWidth=9; g.strokeRect(7,7,498,498);
      if(type==='keepLeft') {
        label('KEEP',69,78); label('LEFT',151,78);
        // Down-left arrow, rendered on the front only (the rear is plain metal).
        polygon([[145,490],[145,330],[198,383],[365,216],[421,272],[254,439],[307,492]],BLACK);
      } else {
        label('NO',350,80); label('ENTRY',438,80);
        g.fillStyle=RED; g.beginPath(); g.ellipse(256,170,170,127.5,0,0,Math.PI*2); g.fill();
        g.fillStyle=WHITE; g.fillRect(119,147,274,46);
      }
    }
    g.restore();
  });
  return canvas;
}

function material() {
  if (!faceMaterial) {
    let map = null;
    if (typeof document !== 'undefined') {
      map = new THREE.CanvasTexture(drawRegulatorySignAtlas(document.createElement('canvas')));
      map.colorSpace=THREE.SRGBColorSpace;
    }
    faceMaterial=new THREE.MeshLambertMaterial({ color: map ? 0xffffff : 0xf4f4f0, map });
  }
  return faceMaterial;
}

export function createRegulatorySignFace(type) {
  const outline=regulatorySignOutline(type), {width,height}=specs[type];
  const shape=new THREE.Shape(outline.map(([x,y])=>new THREE.Vector2(x*width,y*height)));
  const geometry=new THREE.ShapeGeometry(shape);
  const positions=geometry.getAttribute('position'), uv=geometry.getAttribute('uv');
  const i=REGULATORY_SIGN_TYPES.indexOf(type), col=i%2, row=Math.floor(i/2);
  // CanvasTexture flips canvas rows; map local +Y to the top of its atlas cell.
  for(let j=0;j<uv.count;j++) uv.setXY(j,(col+positions.getX(j)/width+.5)/2,
    (1-row+positions.getY(j)/height+.5)/2);
  const group=new THREE.Group(); group.name='narromine-sign-face:'+type;
  const front=new THREE.Mesh(geometry,material()); front.position.z=.055;
  const rear=new THREE.Mesh(geometry,rearMaterial); rear.position.z=.049;
  group.add(front,rear);
  return group;
}
