// Repository Town vehicle catalogue: illustrative dynamics, not roadworthy certification.
// Speeds are mechanical capabilities. The public town remains posted at 50 km/h;
// the CHEAT-only closed-course override uncaps that game speed limit.
export const VEHICLE_DYNAMICS=Object.freeze({
 hatch:{name:'Economy hatchback',kind:'car',width:1.65,length:3.4,topKmh:165,zeroTo100:12.3,redline:6100,idle:780,gears:5,shifts:[18,36,59,90],tone:'inline4',maxFuel:42},
 sedan:{name:'Family sedan',kind:'car',width:1.84,length:4.4,topKmh:195,zeroTo100:9.7,redline:6300,idle:750,gears:6,shifts:[16,31,52,77,108],tone:'inline4',maxFuel:55},
 ute:{name:'Work ute',kind:'car',width:1.9,length:4.7,topKmh:180,zeroTo100:11.7,redline:4600,idle:720,gears:6,shifts:[15,31,49,72,98],tone:'diesel',maxFuel:70},
 van:{name:'Delivery van',kind:'car',width:2.05,length:5.4,topKmh:145,zeroTo100:17,redline:4400,idle:720,gears:6,shifts:[13,27,43,60,87],tone:'diesel',maxFuel:70},
 truck:{name:'Rigid truck',kind:'car',width:2.25,length:6.6,topKmh:105,zeroTo100:33,redline:3000,idle:670,gears:6,shifts:[11,22,36,52,73],tone:'diesel',maxFuel:100},
 supercar:{name:'Ferrari 488 GTB–inspired V8 (fictional model)',kind:'car',width:1.95,length:4.57,topKmh:330,zeroTo100:3.0,redline:8000,idle:900,gears:7,shifts:[34,66,105,152,206,266],tone:'v8',maxFuel:78},
 gt:{name:'Grand touring coupe',kind:'car',width:1.92,length:4.55,topKmh:255,zeroTo100:5.6,redline:7200,idle:850,gears:7,shifts:[28,53,89,127,168,214],tone:'v6',maxFuel:65},
 muscle:{name:'V8 muscle coupe',kind:'car',width:1.96,length:4.8,topKmh:250,zeroTo100:5.0,redline:6700,idle:790,gears:6,shifts:[32,61,99,148,202],tone:'v8',maxFuel:65},
 motorbike:{name:'650cc road motorbike',kind:'bike',width:.78,length:2.15,topKmh:205,zeroTo100:4.2,redline:11000,idle:1250,gears:6,shifts:[31,57,91,128,170],tone:'bike4',maxFuel:15},
 scooter:{name:'125cc urban scooter',kind:'bike',width:.72,length:1.93,topKmh:95,zeroTo100:19,redline:8500,idle:1400,gears:1,shifts:[],tone:'single',maxFuel:7}
});
export const SPEED_LIMIT_TOWN_KMH=50;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function vehicleSpec(model){return VEHICLE_DYNAMICS[model]||VEHICLE_DYNAMICS.hatch;}
export function transmissionFor(model,speedMs,throttle=0){
 const spec=vehicleSpec(model),kmh=Math.abs(speedMs)*3.6;
 if(kmh<.25 && Math.abs(throttle)<.1)return {gear:'N',rpm:spec.idle,gearNumber:0};
 if(speedMs<-.2||throttle<-.2&&kmh<.3)return {gear:'R',rpm:Math.min(spec.redline*.6, spec.idle+kmh*220),gearNumber:-1};
 const gearNumber=spec.shifts.filter(k=>kmh>=k).length+1;
 const min=gearNumber===1?0:spec.shifts[gearNumber-2],max=spec.shifts[gearNumber-1]??spec.topKmh;
 const fraction=clamp((kmh-min)/Math.max(8,max-min),0,1);
 const rpm=Math.round(clamp(spec.idle+(.32+.68*fraction)*(spec.redline-spec.idle),spec.idle,spec.redline)/25)*25;
 return {gear:String(gearNumber),rpm,gearNumber};
}
export function intendedSpeedMs(model,throttle,{unrestricted=false,limitKmh=SPEED_LIMIT_TOWN_KMH}={}){
 const spec=vehicleSpec(model);
 // The posted limit where the vehicle is (town streets, or 100 on the Mitchell Highway), never above the vehicle's top speed.
 const cap=unrestricted?spec.topKmh:Math.min(limitKmh,spec.topKmh);
 return clamp(throttle,-.32,1)*cap/3.6;
}
export function accelerationMs2(model,speedMs,throttle){
 const spec=vehicleSpec(model);
 const maxAccel=(100/3.6)/spec.zeroTo100;
 const fraction=clamp(Math.abs(speedMs)*3.6/spec.topKmh,0,1);
 return maxAccel*(1.22-.72*fraction)*Math.max(.3,Math.abs(throttle));
}
