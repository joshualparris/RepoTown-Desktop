// PUB-CODE/RTPUB-002/003/004/009/010/005: design-stage geometry and operation.
// A modelled dimension is NOT an approved building, fire, occupancy or access certificate.
export const PUB_PHYSICAL_PLAN_2026 = Object.freeze({
 id:'B:pub', address:'N8-S', classification:'provisional Class 6, verify all ancillary uses',
 footprint:Object.freeze({widthM:14,depthM:18,insideFrontZ:6,insideRearZ:-12,modelledStoreys:2,basementLevels:1,originalConstructionYear:null,
  siteBoundaryVerified:false,externalDischargeVerified:false,structuralDesignVerified:false}),
 occupancy:Object.freeze({gameplayPatronScenario:24,gameplayStaffScenario:3,totalScenario:27,legalMaximum:null,
  managementCounterIsNotActualNPCCount:true,requiredSanitaryFixtureSchedule:null}),
 exits:Object.freeze([
  Object.freeze({id:'pub:front-exit',x0:-1.05,x1:1.05,z:6,widthM:2.1,dischargeVerified:false}),
  Object.freeze({id:'pub:rear-fire-exit',x0:-1.05,x1:1.05,z:-12,widthM:2.1,dischargeVerified:false})
 ]),
 accessibleRoute:Object.freeze({entranceAtX:0,frontZ:6,publicRouteMinDesignM:1.2,thresholdRiseM:null,
  approachGradient:null,turningCirculationVerified:false,signageVerified:false}),
 sanitary:Object.freeze({id:'pub:accessible-wc',roomBounds:Object.freeze({x0:3.86,x1:6.9,z0:-11.9,z1:-8.16}),
  doorClearOpeningDesignM:1.4,pan:Object.freeze({x:6.28,z:-11.1}),
  basin:Object.freeze({x:4.26,z:-11.02}),ambulantFacilityVerified:false,
  accessibleCirculationVerified:false,actualRequiredWCCount:null,genderProvisionVerified:false}),
 fire:Object.freeze({frontAndRearSignsRepresented:true,twoEmergencyLuminaires:true,modelledEmergencyLuminaireCount:4,gameDischargeCollisionTested:true,fireScheduleApproved:false,
  rearExitDischargeVerified:false,detectorDesignVerified:false,fireHydrantSprinklerNeedDetermined:false})
});
export function pubScenarioAdmission(current,entering=1){
 if(!Number.isInteger(current)||current<0||!Number.isInteger(entering)||entering<0)throw new RangeError('Invalid scenario admissions');
 const maximum=PUB_PHYSICAL_PLAN_2026.occupancy.gameplayPatronScenario;
 return Object.freeze({accepted:current+entering<=maximum,patrons:current,proposed:current+entering,scenarioMaximum:maximum,legalMaximum:null});
}
export function pubExitLayout(){
 const [front,rear]=PUB_PHYSICAL_PLAN_2026.exits;
 return {separationM:Math.abs(front.z-rear.z),rearHasModelledDoor:true,
  rearFinalDischargeVerified:false,notLegalEgressAssessment:true};
}
export function pubExteriorRoute(site){
 const sign=site.side==='south'?-1:1,oz=site.originZ;
 if(!Number.isFinite(oz)||!Number.isFinite(site.x))throw new TypeError('Pub world origin required');
 return [{x:site.x,z:oz-13.2*sign},{x:site.x,z:oz-18.2*sign},{x:site.x+8*sign,z:oz-18.2*sign},{x:site.x+8*sign,z:oz+12.2*sign},{x:site.x,z:oz+12.2*sign}];
}
export function pubRearExitPose(site,colliders,radius=.46){
 const p=pubExteriorRoute(site)[0];
 const blocked=(colliders||[]).some(c=>p.x>c.x0-radius&&p.x<c.x1+radius&&p.z>c.z0-radius&&p.z<c.z1+radius);
 return blocked?null:{...p,yaw:site.side==='south'?Math.PI:0};
}

export function pubSecondaryExitPose(site,colliders,radius=.46){const sign=site.side==='south'?-1:1,p={x:site.x+8*sign,z:site.originZ-12.6*sign};return (colliders||[]).some(c=>p.x>c.x0-radius&&p.x<c.x1+radius&&p.z>c.z0-radius&&p.z<c.z1+radius)?null:{...p,yaw:site.side==='south'?Math.PI:0};}
