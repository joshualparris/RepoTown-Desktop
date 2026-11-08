// Architectural cues are illustrative, not exact replicas or claims of a national "default".
import { dossierFor } from './country-dossiers.js';
// 193 UN members and the Holy See + Palestine. One distinct design per country.
// Each cue describes a real regional house tradition; cultures within countries are diverse.
const groups = [
['Africa', `
Algeria|Casbah inner-courtyard house|courtyard
Angola|Coastal veranda house|veranda
Benin|Atakora earthen compound|courtyard
Botswana|Tswana homestead courtyard|courtyard
Burkina Faso|Kassena painted earthen house|thatch
Burundi|Highland thatched homestead|thatch
Cabo Verde|Creole island veranda|veranda
Cameroon|Grassfields timber house|gable
Central African Republic|Forest timber dwelling|stilt
Chad|Sahelian adobe compound|courtyard
Comoros|Swahili coral-stone home|stone
Congo|Congo River raised timber house|stilt
Côte d'Ivoire|Northern mudbrick homestead|thatch
Democratic Republic of the Congo|Riverine timber home|stilt
Djibouti|Coastal limestone courtyard|courtyard
Egypt|Nile mudbrick courtyard house|courtyard
Equatorial Guinea|Tropical timber veranda|veranda
Eritrea|Asmara stone terrace|stone
Eswatini|Nguni homestead thatch|thatch
Ethiopia|Highland round tukul|dome
Gabon|Equatorial timber veranda|veranda
Gambia|Mandinka compound courtyard|courtyard
Ghana|Ashanti courtyard compound|courtyard
Guinea|Fouta Djallon thatched house|thatch
Guinea-Bissau|Bijagós island timber house|stilt
Kenya|Swahili coastal courtyard|courtyard
Lesotho|Basotho stone rondavel|dome
Liberia|Coastal raised veranda|stilt
Libya|Tripoli inward courtyard|courtyard
Madagascar|Highland steep-roofed house|gable
Malawi|Lakeshore brick and thatch|thatch
Mali|Sudano-Sahelian earthen dwelling|courtyard
Mauritania|Saharan courtyard home|courtyard
Mauritius|Creole timber veranda|veranda
Morocco|Medina riad courtyard|courtyard
Mozambique|Makuti coastal veranda|thatch
Namibia|Southern African stone farmhouse|stone
Niger|Sahelian banco house|courtyard
Nigeria|Hausa courtyard compound|courtyard
Rwanda|Traditional highland homestead|thatch
São Tomé and Príncipe|Roça-style tropical veranda|veranda
Senegal|Saint-Louis timber balcony|veranda
Seychelles|Creole stilted veranda|stilt
Sierra Leone|Krio timber house|veranda
Somalia|Coastal stone courtyard|courtyard
South Africa|Cape Dutch gable house|gable
South Sudan|Nilotic round thatched house|dome
Sudan|Nubian mudbrick courtyard|courtyard
Tanzania|Swahili coastal veranda|veranda
Togo|Tamberma tower compound|tower
Tunisia|Whitewashed medina courtyard|courtyard
Uganda|Lake Victoria thatched homestead|thatch
Zambia|Village thatched homestead|thatch
Zimbabwe|Shona stone and thatch|stone
`],
['Asia', `
Afghanistan|Mountain mudbrick courtyard|courtyard
Armenia|Tuff-stone mountain house|stone
Azerbaijan|Sheki timber balcony|veranda
Bahrain|Gulf wind-tower courtyard|tower
Bangladesh|Bengal raised veranda house|stilt
Bhutan|Himalayan rammed-earth timber house|chalet
Brunei|Kampong Ayer stilt home|stilt
Cambodia|Khmer raised timber home|stilt
China|Siheyuan courtyard residence|courtyard
Cyprus|Mediterranean stone courtyard|courtyard
Georgia|Tbilisi timber balcony house|veranda
India|Haveli courtyard residence|courtyard
Indonesia|Rumah panggung raised home|stilt
Iran|Persian windcatcher courtyard|tower
Iraq|Baghdad inward courtyard|courtyard
Israel|Jerusalem stone courtyard house|stone
Japan|Machiya timber townhouse|terrace
Jordan|Levantine limestone courtyard|stone
Kazakhstan|Steppe timber-and-adobe house|gable
Kuwait|Gulf shaded courtyard home|courtyard
Kyrgyzstan|Tian Shan timber mountain house|chalet
Laos|Lao raised wooden dwelling|stilt
Lebanon|Triple-arched stone townhouse|stone
Malaysia|Rumah Melayu stilt house|stilt
Maldives|Coral-stone island home|stone
Mongolia|Steppe ger-inspired circular dwelling|dome
Myanmar|Burmese teak raised house|stilt
Nepal|Newari brick courtyard home|courtyard
North Korea|Korean hanok courtyard|hip
Oman|Omani fort-style adobe courtyard|tower
Pakistan|Indus courtyard residence|courtyard
Palestine|Traditional Palestinian stone courtyard|stone
Philippines|Bahay kubo stilt cottage|stilt
Qatar|Gulf wind-tower residence|tower
Saudi Arabia|Najdi mudbrick courtyard|courtyard
Singapore|Shophouse five-foot way|terrace
South Korea|Hanok timber tiled roof|hip
Sri Lanka|Tropical walawwa veranda|veranda
Syria|Damascene courtyard house|courtyard
Tajikistan|Pamiri stone-and-timber house|stone
Thailand|Thai raised teak house|stilt
Timor-Leste|Uma lulik thatched house|thatch
Türkiye|Ottoman timber bay-window house|veranda
Turkmenistan|Central Asian courtyard dwelling|courtyard
United Arab Emirates|Barjeel windcatcher courtyard|tower
Uzbekistan|Bukharan courtyard residence|courtyard
Vietnam|Vietnamese tube townhouse|terrace
Yemen|Sana'a tower house|tower
`],
['Europe', `
Albania|Balkan stone tower dwelling|tower
Andorra|Pyrenean stone-and-slate house|chalet
Austria|Alpine chalet timber balcony|chalet
Belarus|Eastern European wooden cottage|gable
Belgium|Brick stepped-gable townhouse|terrace
Bosnia and Herzegovina|Ottoman Balkan courtyard|courtyard
Bulgaria|National Revival overhanging house|veranda
Croatia|Dalmatian limestone dwelling|stone
Czechia|Bohemian timber-framed cottage|gable
Denmark|Danish brick-and-thatch cottage|thatch
Estonia|Baltic timber log house|gable
Finland|Nordic log cabin|gable
France|French stone farmhouse|hip
Germany|Fachwerk timber-framed house|gable
Greece|Cycladic whitewashed house|flat
Holy See|Vatican-area Roman palazzo townhouse|terrace
Hungary|Hungarian porch farmhouse|veranda
Iceland|Turf-roofed timber cottage|thatch
Ireland|Irish stone cottage|gable
Italy|Tuscan stone terraced dwelling|stone
Latvia|Latvian timber farmhouse|gable
Liechtenstein|Alpine pitched-roof chalet|chalet
Lithuania|Baltic wooden farmhouse|gable
Luxembourg|Masonry slate-roof village house|gable
Malta|Limestone townhouse with balcony|terrace
Moldova|Moldovan clay-and-stone cottage|gable
Monaco|Riviera terraced apartment house|terrace
Montenegro|Adriatic stone mountain house|stone
Netherlands|Dutch narrow canal gable|terrace
North Macedonia|Ohrid overhanging timber house|veranda
Norway|Norwegian stave-inspired timber cottage|gable
Poland|Zakopane mountain timber house|chalet
Portugal|Azulejo-fronted tiled-roof house|hip
Romania|Maramureș timber farmhouse|gable
Russia|Russian izba log house|gable
San Marino|Apennine stone village house|stone
Serbia|Balkan timber-and-plaster house|veranda
Slovakia|Carpathian wooden folk house|gable
Slovenia|Alpine timber-roof farmhouse|chalet
Spain|Andalusian patio house|courtyard
Sweden|Falun-red timber cottage|gable
Switzerland|Swiss Alpine chalet|chalet
Ukraine|Ukrainian whitewashed khata|thatch
United Kingdom|British brick terrace|terrace
`],
['Americas', `
Antigua and Barbuda|Caribbean gingerbread veranda|veranda
Argentina|Pampas Italianate courtyard|courtyard
Bahamas|Bahamian pastel timber cottage|veranda
Barbados|Barbadian chattel house|veranda
Belize|Belizean raised wooden home|stilt
Bolivia|Andean adobe courtyard|courtyard
Brazil|Brazilian colonial veranda house|veranda
Canada|Canadian timber steep-gable cabin|gable
Chile|Chiloé palafito waterfront house|stilt
Colombia|Antioquian colourful balcony house|veranda
Costa Rica|Tropical adobe veranda|veranda
Cuba|Havana colonial courtyard|courtyard
Dominica|Creole timber veranda|veranda
Dominican Republic|Caribbean timber gallery house|veranda
Ecuador|Andean adobe courtyard|courtyard
El Salvador|Salvadoran adobe tile-roof home|hip
Grenada|Caribbean timber gallery|veranda
Guatemala|Antigua courtyard adobe|courtyard
Guyana|Guyanese stilted timber house|stilt
Haiti|Haitian gingerbread veranda|veranda
Honduras|Honduran adobe courtyard|courtyard
Jamaica|Jamaican Georgian veranda|veranda
Mexico|Mexican adobe patio house|courtyard
Nicaragua|Nicaraguan tile-roof patio|courtyard
Panama|Tropical raised timber home|stilt
Paraguay|Guaraní-influenced shaded veranda|veranda
Peru|Andean adobe courtyard house|courtyard
Saint Kitts and Nevis|Caribbean wooden veranda|veranda
Saint Lucia|Saint Lucian Creole veranda|veranda
Saint Vincent and the Grenadines|Windward island timber cottage|veranda
Suriname|Paramaribo wooden gallery house|veranda
Trinidad and Tobago|Caribbean fretwork veranda|veranda
United States|American timber porch house|gable
Uruguay|Uruguayan colonial patio house|courtyard
Venezuela|Venezuelan colonial courtyard|courtyard
`],
['Oceania', `
Australia|Australian weatherboard veranda|veranda
Fiji|Fijian bure thatched dwelling|thatch
Kiribati|Kiribati raised thatched home|stilt
Marshall Islands|Atoll timber-and-thatch home|stilt
Micronesia|Micronesian coastal raised house|stilt
Nauru|Tropical breezeway bungalow|veranda
New Zealand|New Zealand timber villa|veranda
Palau|Palauan community-house roof form|gable
Papua New Guinea|Sepik raised longhouse|stilt
Samoa|Samoan fale open pavilion|thatch
Solomon Islands|Island raised leaf-roof dwelling|stilt
Tonga|Tongan fale timber pavilion|thatch
Tuvalu|Atoll raised tropical dwelling|stilt
Vanuatu|Ni-Vanuatu natangura thatch house|thatch
`],
];
export const COUNTRY_HOMES = Object.freeze(groups.flatMap(([region, rows]) =>
 rows.trim().split('\n').map((line) => {
  const [country, tradition, profile] = line.split('|');
  return Object.freeze({country, tradition, profile, region});
 })
));
if (COUNTRY_HOMES.length !== 195 || new Set(COUNTRY_HOMES.map(c => c.country)).size !== 195)
 throw new Error('Country catalogue must contain 195 distinct countries (193 UN members + two observers).');

const PALETTES = {
 Africa: [0xc8ab80,0xb97f50,0xe3d2ad,0x9a7958,0xdac4a1],
 Asia: [0xb9a18a,0xe3c9a5,0xb59e7a,0xd6d1b9,0x9eaa9c],
 Europe: [0xe1d3bd,0xb9a99a,0xf0e6d8,0xc6b7a5,0xd6c2a6],
 Americas: [0xd1b48b,0xe8c7a2,0xb6bea5,0xd9b19f,0xf2d9b3],
 Oceania: [0xc4b48f,0xd4c9a8,0xabb8a2,0xd6b799,0xd8cba8],
};
const roofColors = [0x77523d,0x5e6265,0x854536,0xb28c53,0x595f4d,0x876f54,0x4d5b65,0xb97848];
const trimColors = [0xe9ddc5,0xf1e9db,0x614d3d,0x735943,0xc2a781,0xe4d7bd];
export function countryDesign(index, lotWidth) {
 const c = COUNTRY_HOMES[index];
 if (!c) throw new RangeError('No country for home ' + index);
 // Every width is unique down to centimetres, regardless of shared regional influences.
 const w = Math.min(lotWidth - 4, 7.5 + (index % 9)*0.23 + index*0.0031);
 const d = 7.4 + (index % 7)*0.32;
 const floors = 1 + (index % 5 === 0 ? 1 : 0) + (index % 37 === 0 ? 1 : 0);
 return Object.freeze({...c, index, w, d, floors, wall: PALETTES[c.region][index % 5],
   roof: roofColors[(index*3 + Math.floor(index/7)) % roofColors.length],
   trim: trimColors[(index*7 + Math.floor(index/3)) % trimColors.length]});
}

// Lightweight mesh primitives, one merged house draw call plus optional glass.
// Every house keeps a solid rectangular footprint with a clear path from the front door.
// Forms vary by architectural cue: pitches, pitched hip roofs, arcades, eaves, balconies,
// thatch, courtyards, elevated floors, towers and terraces.
export function buildCountryHome(b, design) {
 const dossier = dossierFor(design.country);
 // A researched country house (country-dossiers.js) sets its own period colours.
 const {w,d,floors,index:i,profile} = design;
 const wall = dossier?.exterior?.wall ?? design.wall, roof = dossier?.exterior?.roof ?? design.roof, trim = dossier?.exterior?.trim ?? design.trim;
 const elevated = profile === 'stilt' ? 1.35 : 0;
 const floorH = 2.95 + (i % 4)*0.12, h = floors * floorH;
 const angle = 0.33 + (i % 7)*0.055;
 // Main envelope is intentionally conservative: wall collision applies all the way to ground.
 b.box(wall,w,h,d,0,elevated+h/2,0);
 b.box(0x3f3028,1.65,2.42,0.07,0,elevated+1.21,d/2+0.045);
 b.box(trim,2.05,0.18,0.45,0,elevated+2.5,d/2+0.16);
 const win = 0x9fd3ea;
 for(let level=0;level<floors;level++) {
   const y=elevated+level*floorH+1.58;
   for(const x of [-w*.33,w*.33]) {
     if(level===0 && Math.abs(x)<1.3)continue;
     b.box(win,1.05,1.22,.07,x,y,d/2+.055);
     b.box(trim,1.22,.1,.25,x,y-.67,d/2+.1);
   }
   for(const x of [-w/2-.045,w/2+.045]) {
     b.box(win,.07,1.05,1.15,x,y,-d*.16);
   }
 }
 if(elevated) {
   for(const x of [-w*.38,w*.38]) for(const z of [-d*.37,d*.37])
     b.box(trim,.35,elevated,.35,x,elevated/2,z);
   for(let step=0;step<4;step++) b.box(trim,2.05,.18,.48,0,(step+1)*elevated/5,d/2+.35+step*.4);
 }
 const roofY=elevated+h;
 const gable=(pitch=angle, colour=roof)=>{
   const half=w/2+.55, rise=half*Math.tan(pitch), slant=Math.hypot(half,rise);
   for(const side of [-1,1]) b.add('box',colour,slant,.18,d+.9,side*half/2,roofY+rise/2,0,0,0,-side*pitch);
   b.box(trim,w*.72,.14,.16,0,roofY+rise*.68,d/2+.035);
 };
 if(['gable','chalet','thatch','stone','veranda','stilt'].includes(profile)) {
   gable(profile==='chalet' ? .62 : profile==='thatch' ? .53 : angle, profile==='thatch' ? 0xa78b58 : roof);
 } else if(profile==='hip' || profile==='pagoda') {
   b.pyramid(roof,w+1.2,2.2+(i%4)*.3,d+1.1,0,roofY+1.1,0);
 } else if(profile==='dome') {
   b.ball(roof,Math.min(w,d)*.46,0,roofY,0,.6);
 } else {
   b.box(roof,w+.85,.26,d+.85,0,roofY+.13,0);
   b.box(trim,w+.95,.18,.22,0,roofY+.28,d/2);
 }
 if(profile==='courtyard') {
   // A small walled open-to-sky entrance patio signals an inward-facing layout.
   b.box(trim,w*.72,.2,2.1,0,.14,d/2+1.1);
   for(const side of [-1,1]) b.box(wall,.2,1.35,2.2,side*w*.36,.68,d/2+1.1);
 } else if(profile==='veranda'||profile==='chalet') {
   b.box(roof,w*.8,.18,1.8,0,elevated+2.85,d/2+.84);
   for(const side of [-1,1]) b.box(trim,.15,2.7,.15,side*w*.35,elevated+1.43,d/2+1.55);
   if(floors>1)b.box(trim,w*.75,.18,1.2,0,elevated+floorH,d/2+.58);
 } else if(profile==='terrace') {
   for(const x of [-w*.37,w*.37]) b.box(trim,.22,h,.22,x,elevated+h/2,d/2+.14);
   b.box(trim,w*.6,.2,.6,0,elevated+h*.53,d/2+.35);
 } else if(profile==='tower') {
   b.box(wall,2.1,3.5,2.1,-w*.26,roofY+1.75,-d*.2);
   b.pyramid(roof,2.6,1.6,2.6,-w*.26,roofY+4.3,-d*.2);
 } else if(profile==='thatch') {
   b.box(trim,w*.75,.1,.35,0,roofY+.6,d/2+.2);
 }
 // Each building has its own subtle window rhythm/roof accent, not just a recolour.
 for(let n=0;n<1+i%5;n++) b.box(trim,.17,.21,.12,-w*.38+n*.4,roofY+.34,d/2+.18);
 const yard=[];
 // Brick chimneys over each fireplace on a side wall, rising clear of the roof (dossier.exterior.chimneys).
 for(const c of dossier?.exterior?.chimneys||[]){
   const cz=Math.max(-d/2+.6,Math.min(d/2-.6,c.z(d))),cx=c.side*(w/2+.2);
   b.box(dossier.exterior.chimney,.75,h+2.3,.95,cx,elevated+(h+2.3)/2,cz);
   b.box(0x5a3a30,.9,.14,1.1,cx,elevated+h+2.37,cz);
   yard.push({x0:cx-.375,x1:cx+.375,z0:cz-.475,z1:cz+.475});
 }
 // A canted bay window projecting from one front room (the bay villa's defining feature).
 if(dossier?.exterior?.bay){
   const bx=dossier.exterior.bay*(w/2-2.1);
   b.box(wall,3.0,2.9,.9,bx,elevated+1.45,d/2+.45);
   b.box(0x9fd3ea,2.2,1.5,.06,bx,elevated+1.55,d/2+.92);
   b.box(trim,3.2,.2,1.1,bx,elevated+2.95,d/2+.45);
   b.box(roof,3.3,.18,1.25,bx,elevated+3.1,d/2+.5);
   yard.push({x0:bx-1.5,x1:bx+1.5,z0:d/2,z1:d/2+.9});
 }
 // A clipped hedge along the front boundary with a gate gap on the path (lot frontage 6 m ahead).
 if(dossier?.exterior?.hedge){
   const z=d/2+5.4,span=7.2;
   for(const side of [-1,1]){
     const x0=side<0?-span:1.2,x1=side<0?-1.2:span;
     b.box(dossier.exterior.hedge,x1-x0,1.6,.8,(x0+x1)/2,.8,z);
     yard.push({x0,x1,z0:z-.4,z1:z+.4});
   }
   for(const side of [-1,1])b.box(0xe9e2d0,.12,1.15,.12,side*1.2,.58,z);   // gate posts
 }
 if(dossier?.exterior?.tank){
   // Corrugated iron rainwater tank on a timber stand beside the kitchen, fed from the gutter.
   const tx=w/2+1.15,tz=-d/2+1.2;
   b.box(0x6b5440,1.7,.45,1.7,tx,.22,tz);
   b.cyl(dossier.exterior.tank,.8,1.9,tx,1.4,tz);
   b.cyl(0x8d9397,.84,.08,tx,2.38,tz);
   yard.push({x0:tx-.85,x1:tx+.85,z0:tz-.85,z1:tz+.85});
 }
 return {w,d,h:elevated+h+3,front:d/2,door:{x:0,w:1.65},yard};
}
