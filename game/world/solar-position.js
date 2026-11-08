// Approximate solar position for Narromine, NSW, using the NOAA/GML General Solar
// Position Calculations equations (fractional year, declination, equation of time,
// hour angle and azimuth). https://gml.noaa.gov/grad/solcalc/solareqns.PDF
// Accuracy is suitable for game illumination, NOT surveying or solar-panel design.
// The simulated calendar is Australian civil dates independent of the visitor's timezone.
// World axes: +X east, -Z north, +Y up.
export const SOLAR_SITE = Object.freeze({ latitude: -32.232, longitude: 148.239, name: 'Narromine NSW' });
const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const clamp = (x,lo,hi) => Math.max(lo,Math.min(hi,x));

function firstSunday(year, month) {
  const weekday = new Date(Date.UTC(year,month-1,1)).getUTCDay();
  return 1 + ((7-weekday) % 7);
}

// NSW daylight saving starts on the first Sunday of October at 02:00 standard
// clock time, and ends on the first Sunday of April at 03:00 daylight clock time.
// No local machine timezone, geolocation, Intl string parsing or real-world clock.
export function nswUtcOffsetHours({ year,month,day,dayOfMonth }, minute=720) {
  // townDate().day is the *ordinal game day*, NOT the civil calendar day.
  const civilDay = dayOfMonth ?? day;
  if (month < 4 || month > 10) return 11;
  if (month > 4 && month < 10) return 10;
  if (month === 4) {
    const first = firstSunday(year,4);
    return civilDay < first || (civilDay === first && minute < 180) ? 11 : 10;
  }
  const first = firstSunday(year,10);
  return civilDay > first || (civilDay === first && minute >= 120) ? 11 : 10;
}

function dayOfYear({ year,month,day,dayOfMonth }) {
  const civilDay = dayOfMonth ?? day;
  return 1 + Math.round((Date.UTC(year,month-1,civilDay)-Date.UTC(year,0,1))/86400000);
}

export function solarPosition(date, minute, site=SOLAR_SITE) {
  const {latitude,longitude}=site;
  if (!Number.isFinite(latitude)||!Number.isFinite(longitude)||!Number.isFinite(minute)
      || Math.abs(latitude)>90||Math.abs(longitude)>180) throw new RangeError('Invalid solar date/location');
  const leap=new Date(Date.UTC(date.year,1,29)).getUTCDate()===29;
  const days=leap?366:365;
  const gamma=2*Math.PI/days*(dayOfYear(date)-1+(minute/60-12)/24);
  const eqtime=229.18*(0.000075+0.001868*Math.cos(gamma)-0.032077*Math.sin(gamma)
    -0.014615*Math.cos(2*gamma)-0.040849*Math.sin(2*gamma));
  const decl=0.006918-0.399912*Math.cos(gamma)+0.070257*Math.sin(gamma)
    -0.006758*Math.cos(2*gamma)+0.000907*Math.sin(2*gamma)
    -0.002697*Math.cos(3*gamma)+0.00148*Math.sin(3*gamma);
  const offset=nswUtcOffsetHours(date,minute);
  const solarMinutes=minute+eqtime+4*longitude-60*offset;
  const ha=(solarMinutes/4-180)*RAD;
  const lat=latitude*RAD;
  const elevation=Math.asin(clamp(Math.sin(lat)*Math.sin(decl)+
    Math.cos(lat)*Math.cos(decl)*Math.cos(ha),-1,1))*DEG;
  const azimuth=(180+Math.atan2(Math.sin(ha),
    Math.cos(ha)*Math.sin(lat)-Math.tan(decl)*Math.cos(lat))*DEG+360)%360;
  const el=elevation*RAD,az=azimuth*RAD,cosEl=Math.cos(el);
  return {
    elevation, azimuth, declination:decl*DEG, equationOfTime:eqtime,
    timezoneHours:offset, apparentDay:elevation > -0.833,
    // Unit vector from a ground observer *towards* the sun.
    direction: { x:Math.sin(az)*cosEl, y:Math.sin(el), z:-Math.cos(az)*cosEl },
  };
}

export function solarDaylight(elevation) {
  // Civil twilight begins near -6°; physically drawn shadows begin just above
  // the horizon. Smooth daylight makes street lamps fade rather than snap.
  const t=clamp((elevation+6)/17,0,1);
  return t*t*(3-2*t);
}

export function solarWarmth(elevation) {
  // 1 near the horizon, 0 at midday or midnight.
  if (elevation < -6 || elevation > 19) return 0;
  const t=clamp((elevation+6)/25,0,1);
  return (1-t)*t*4;
}

export function solarRiseSet(date,site=SOLAR_SITE) {
  // Find crossings of the apparent sunrise/sunset horizon, using the standard
  // -0.833° refraction + apparent solar disk correction. Approximate at sea level.
  const horizon=-0.833, steps=[], step=5;
  let prev=solarPosition(date,0,site).elevation-horizon;
  for(let m=step;m<=1440;m+=step){
    const next=solarPosition(date,Math.min(1439.999,m),site).elevation-horizon;
    if((prev<=0&&next>0)||(prev>=0&&next<0)){
      let a=m-step,b=m,fa=prev;
      for(let i=0;i<14;i++){
        const mid=(a+b)/2, fm=solarPosition(date,mid,site).elevation-horizon;
        if((fa<=0&&fm<=0)||(fa>=0&&fm>=0)){a=mid;fa=fm;}else b=mid;
      }
      steps.push({minute:(a+b)/2,type:prev<0?'rise':'set'});
    }
    prev=next;
  }
  return { sunrise:steps.find(x=>x.type==='rise')?.minute??null,
    sunset:steps.find(x=>x.type==='set')?.minute??null };
}
