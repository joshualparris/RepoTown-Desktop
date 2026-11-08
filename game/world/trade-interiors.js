import { createKit } from './interior-kit.js';

// Three independent and walkable workplaces, not re-skinned copies of shops.
// All have a public entry aisle and an E-to-use service counter.
export function buildTradeInterior(site,makeLabel) {
  const estate=site.id==='realestate',dealer=site.id==='dealership';
  const name=estate?'Central West Property & Land':dealer?'High Street Motors':'Motor Workshop';
  const k=createKit(site,makeLabel,name);
  const { box,solid,cyl,model,add,text,seat }=k;
  const wall=estate?0xe2d5be:dealer?0xdde5ed:0xc2c7cb;
  const floor=estate?0xbca184:dealer?0x828d94:0x666d71;
  k.shell({wall,floor,ceiling:0xe7e7e2});
  if(estate){
    // Reception counter, property map, listing cards, agent desks and contracts.
    solid(4.6,.95,.75,-1.2,.48,-5.8,0x977756);
    box(4.8,.07,.83,-1.2,.98,-5.8,0xe0c5a4);
    for(const x of [-5.6,-3.7]) {
      solid(1.5,.72,.75,x,.36,-8.2,0x78634d);
      box(.72,.5,.06,x,1.13,-8.32,0x294d63);
      seat('desk'+x,'chair',x,-7.25,0);
    }
    solid(2.6,2.0,.35,5.0,1.0,-9.7,0x715c44);
    for(let n=0;n<12;n++){
      const x=-5.5+(n%4)*1.7,z=-1.7-Math.floor(n/4)*1.35;
      box(1.45,.84,.05,x,2.65,z-9,0xeadfc9);
      box(1.25,.44,.06,x,2.75,z-8.96,n%2?0x789e7d:0xb6a074);
    }
    // Waiting room and contract signing desk.
    solid(2.0,.72,1.1,3.8,.36,1.3,0x8b735a);
    for(const x of [2.5,5.0])seat('client'+x,'chair',x,2.3,Math.PI);
    text('Sales • Rentals • Conveyancing',0,3.65,-4.6,'room');
    add('register','Land titles & listings','civic-ledger','Inspect ownership, tenants, asking prices, mortgages and property listings.',-1.3,-4.2);
    add('contracts','Sales contract desk','info','A conveyancer checks title, mortgages and settlement. The agency receives a disclosed 2% fee.',3.6,0.1);
    add('rentals','Tenancy desk','info','Rental agreements survive a change of owner. Tenants have a bond and ongoing rent obligations.',-4.6,-4.0);
  } else if(dealer){
    // Showroom with three rendered cars, open display bonnet and sales counter.
    solid(3.7,.95,.8,-3.1,.47,-6.3,0x405567);
    box(3.9,.09,.95,-3.1,.99,-6.3,0xc9d6de);
    const vehicle=(x,z,colour)=>{
      solid(1.55,.65,2.9,x,.52,z,colour);
      box(1.35,.55,1.65,x,1.08,z-.15,0xc0d5e5);
      for(const dx of [-.82,.82])for(const dz of [-1,1])
        cyl(.28,.28,.22,x+dx,.27,z+dz,0x24282a,{rz:Math.PI/2});
      box(.8,.17,.06,x,.7,z+1.47,0xe8c8b0);
    };
    vehicle(-4.7,1.0,0x356e9f);vehicle(4.45,-1.4,0xc2b4a1);
    text('Used vehicles • Trade-ins • Registration',0,3.65,-5.1,'room');
    add('sales','Vehicle sales desk','civic-ledger','Browse registered used cars, utes, vans and trucks; buy only with cleared funds.',-3.1,-4.7);
    add('display','Used car showroom','info','Trade-ins have kilometre and condition reports. Dealership stock is finite, not infinitely replenished.',-4.5,3.1);
    add('rego','Registration and transfer','info','Motor registration has an expiry and roadworthy status. Repairs are handled next door by the workshop.',4.8,1.1);
  } else {
    // Hoist, accessible service bay, tool walls, tyre racks and parts counter.
    solid(4.6,.92,.8,-2.9,.46,-6.1,0x4c5760);
    // Rear parts cupboards and fluid cabinets keep the service bay walkable.
    solid(1.15,1.8,.65,-5.5,.9,-9.4,0x74828b);
    solid(1.15,1.8,.65,5.5,.9,-9.4,0x6d7478);
    box(4.8,.08,.84,-2.9,.96,-6.1,0xcdd1d3);
    for(const x of [-5.2,1.0]) {
      box(.23,2.35,.23,x,1.18,-1.8,0xe8b642);
      box(1.6,.15,3.8,x+.8,.57,-1.8,0x7c8991);
    }
    for(const z of [-8.8,-7.6,-6.4])for(const x of [3.5,4.6,5.7])
      cyl(.38,.38,.18,x,1.2,z,0x272a2a,{rz:Math.PI/2});
    for(let i=0;i<14;i++)box(.08,.34,.07,4.8,.8+(i%3)*.42,-4.0+Math.floor(i/3)*.24,
      [0xc05045,0x4b8aa0,0xbda346][i%3]);
    text('Vehicle service • Roadworthy checks • Repairs',0,3.65,-4.8,'room');
    add('workshop','Book repairs and servicing','civic-ledger','Pay for parts and labour. A vehicle must pass roadworthy checks before registration renewal.',-3.0,-4.75);
    add('hoist','Inspection hoist','info','Hydraulic posts lift a vehicle safely for braking, underbody and suspension inspection.',-4.6,2.3);
    add('parts','Tyres and parts','info','Tyres, fluids, filters, belts and batteries are inventoried for servicing and fleet maintenance.',4.6,-4.0);
  }
  k.placedProps.push({type:'workbench',room:0},{type:'counter',room:0},{type:'noticeboard',room:0});
  return k.finish({staff:{pos:{x:-1.5,z:-7.9},use:{x:-1.5,z:-4.7}}});
}
