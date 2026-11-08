// Fictional, fixed household relations; keep original 99 worker IDs, names and homes.
// Spouses retain individual jobs, money, timetables and needs, share an actual house.
export const ORIGINAL_WORKERS=99;
export const EXPANSION_WORKERS=72;
export const MARRIED_COUPLES=55;
export const ORIGINAL_PARTNER_GENDERS=Object.freeze(["female","male","female","male","female","male","female","male","female","male","female","male","female","male","female","male","female","male","female","male","female","male","female","female","male","male","female","male","female","female","male","female","male","female","male","female","female","male","female","male","female","male","female","male","female","female","male","female","male","female","male","female","male","female","female"]);
export const EXPANSION_IDENTITIES=Object.freeze([
  {
    "firstName": "Adrian",
    "name": "Adrian Hart",
    "gender": "male",
    "surname": "Hart"
  },
  {
    "firstName": "Amelia",
    "name": "Amelia Turner",
    "gender": "female",
    "surname": "Turner"
  },
  {
    "firstName": "Benjamin",
    "name": "Benjamin Bennett",
    "gender": "male",
    "surname": "Bennett"
  },
  {
    "firstName": "Brianna",
    "name": "Brianna Cole",
    "gender": "female",
    "surname": "Cole"
  },
  {
    "firstName": "Callum",
    "name": "Callum Donovan",
    "gender": "male",
    "surname": "Donovan"
  },
  {
    "firstName": "Charlotte",
    "name": "Charlotte Brooks",
    "gender": "female",
    "surname": "Brooks"
  },
  {
    "firstName": "Declan",
    "name": "Declan Fleming",
    "gender": "male",
    "surname": "Fleming"
  },
  {
    "firstName": "Evelyn",
    "name": "Evelyn Ward",
    "gender": "female",
    "surname": "Ward"
  },
  {
    "firstName": "Elliot",
    "name": "Elliot Carter",
    "gender": "male",
    "surname": "Carter"
  },
  {
    "firstName": "Grace",
    "name": "Grace Morris",
    "gender": "female",
    "surname": "Morris"
  },
  {
    "firstName": "Finley",
    "name": "Finley Young",
    "gender": "male",
    "surname": "Young"
  },
  {
    "firstName": "Isabelle",
    "name": "Isabelle Mason",
    "gender": "female",
    "surname": "Mason"
  },
  {
    "firstName": "Graham",
    "name": "Graham Gibson",
    "gender": "male",
    "surname": "Gibson"
  },
  {
    "firstName": "Jessica",
    "name": "Jessica Wells",
    "gender": "female",
    "surname": "Wells"
  },
  {
    "firstName": "Hamish",
    "name": "Hamish Mercer",
    "gender": "male",
    "surname": "Mercer"
  },
  {
    "firstName": "Kate",
    "name": "Kate Collins",
    "gender": "female",
    "surname": "Collins"
  },
  {
    "firstName": "Isaac",
    "name": "Isaac Wright",
    "gender": "male",
    "surname": "Wright"
  },
  {
    "firstName": "Lauren",
    "name": "Lauren Doyle",
    "gender": "female",
    "surname": "Doyle"
  },
  {
    "firstName": "Jasper",
    "name": "Jasper McKenzie",
    "gender": "male",
    "surname": "McKenzie"
  },
  {
    "firstName": "Madeleine",
    "name": "Madeleine Archer",
    "gender": "female",
    "surname": "Archer"
  },
  {
    "firstName": "Keegan",
    "name": "Keegan Ellis",
    "gender": "male",
    "surname": "Ellis"
  },
  {
    "firstName": "Natalie",
    "name": "Natalie West",
    "gender": "female",
    "surname": "West"
  },
  {
    "firstName": "Liam",
    "name": "Liam Morgan",
    "gender": "male",
    "surname": "Morgan"
  },
  {
    "firstName": "Mitchell",
    "name": "Mitchell Palmer",
    "gender": "male",
    "surname": "Palmer"
  },
  {
    "firstName": "Penelope",
    "name": "Penelope Taylor",
    "gender": "female",
    "surname": "Taylor"
  },
  {
    "firstName": "Rebecca",
    "name": "Rebecca Olsen",
    "gender": "female",
    "surname": "Olsen"
  },
  {
    "firstName": "Nathan",
    "name": "Nathan Briggs",
    "gender": "male",
    "surname": "Briggs"
  },
  {
    "firstName": "Sophie",
    "name": "Sophie Dawson",
    "gender": "female",
    "surname": "Dawson"
  },
  {
    "firstName": "Oliver",
    "name": "Oliver Griffin",
    "gender": "male",
    "surname": "Griffin"
  },
  {
    "firstName": "Patrick",
    "name": "Patrick Hughes",
    "gender": "male",
    "surname": "Hughes"
  },
  {
    "firstName": "Victoria",
    "name": "Victoria Pearson",
    "gender": "female",
    "surname": "Pearson"
  },
  {
    "firstName": "Quentin",
    "name": "Quentin Reed",
    "gender": "male",
    "surname": "Reed"
  },
  {
    "firstName": "Alyssa",
    "name": "Alyssa Forbes",
    "gender": "female",
    "surname": "Forbes"
  },
  {
    "firstName": "Riley",
    "name": "Riley Wallace",
    "gender": "male",
    "surname": "Wallace"
  },
  {
    "firstName": "Bianca",
    "name": "Bianca Harris",
    "gender": "female",
    "surname": "Harris"
  },
  {
    "firstName": "Samuel",
    "name": "Samuel Blake",
    "gender": "male",
    "surname": "Blake"
  },
  {
    "firstName": "Tristan",
    "name": "Tristan Carroll",
    "gender": "male",
    "surname": "Carroll"
  },
  {
    "firstName": "Catherine",
    "name": "Catherine Henderson",
    "gender": "female",
    "surname": "Henderson"
  },
  {
    "firstName": "Vincent",
    "name": "Vincent Douglas",
    "gender": "male",
    "surname": "Douglas"
  },
  {
    "firstName": "Eliza",
    "name": "Eliza Murray",
    "gender": "female",
    "surname": "Murray"
  },
  {
    "firstName": "Wesley",
    "name": "Wesley Lawson",
    "gender": "male",
    "surname": "Lawson"
  },
  {
    "firstName": "Felicity",
    "name": "Felicity Cooper",
    "gender": "female",
    "surname": "Cooper"
  },
  {
    "firstName": "Xander",
    "name": "Xander Byrne",
    "gender": "male",
    "surname": "Byrne"
  },
  {
    "firstName": "Hannah",
    "name": "Hannah Kelly",
    "gender": "female",
    "surname": "Kelly"
  },
  {
    "firstName": "Yarran",
    "name": "Yarran Hawkins",
    "gender": "male",
    "surname": "Hawkins"
  },
  {
    "firstName": "Zachary",
    "name": "Zachary Mitchell",
    "gender": "male",
    "surname": "Mitchell"
  },
  {
    "firstName": "Jasmine",
    "name": "Jasmine Watson",
    "gender": "female",
    "surname": "Watson"
  },
  {
    "firstName": "Andrew",
    "name": "Andrew Reynolds",
    "gender": "male",
    "surname": "Reynolds"
  },
  {
    "firstName": "Katrina",
    "name": "Katrina Parker",
    "gender": "female",
    "surname": "Parker"
  },
  {
    "firstName": "Jordan",
    "name": "Jordan Abbott",
    "gender": "male",
    "surname": "Abbott"
  },
  {
    "firstName": "Marissa",
    "name": "Marissa Mills",
    "gender": "female",
    "surname": "Mills"
  },
  {
    "firstName": "Matteo",
    "name": "Matteo Gordon",
    "gender": "male",
    "surname": "Gordon"
  },
  {
    "firstName": "Nicole",
    "name": "Nicole Spencer",
    "gender": "female",
    "surname": "Spencer"
  },
  {
    "firstName": "Daniel",
    "name": "Daniel Sullivan",
    "gender": "male",
    "surname": "Sullivan"
  },
  {
    "firstName": "Brodie",
    "name": "Brodie Perry",
    "gender": "male",
    "surname": "Perry"
  },
  {
    "firstName": "Christian",
    "name": "Christian Atkins",
    "gender": "male",
    "surname": "Atkins"
  },
  {
    "firstName": "Phoebe",
    "name": "Phoebe Barlow",
    "gender": "female",
    "surname": "Barlow"
  },
  {
    "firstName": "Lewis",
    "name": "Lewis Chalmers",
    "gender": "male",
    "surname": "Chalmers"
  },
  {
    "firstName": "Rachel",
    "name": "Rachel Dixon",
    "gender": "female",
    "surname": "Dixon"
  },
  {
    "firstName": "Harvey",
    "name": "Harvey Easton",
    "gender": "male",
    "surname": "Easton"
  },
  {
    "firstName": "Stephanie",
    "name": "Stephanie Franklin",
    "gender": "female",
    "surname": "Franklin"
  },
  {
    "firstName": "Asher",
    "name": "Asher Glover",
    "gender": "male",
    "surname": "Glover"
  },
  {
    "firstName": "Tiffany",
    "name": "Tiffany Hutton",
    "gender": "female",
    "surname": "Hutton"
  },
  {
    "firstName": "Frederick",
    "name": "Frederick Irwin",
    "gender": "male",
    "surname": "Irwin"
  },
  {
    "firstName": "Veronica",
    "name": "Veronica Jarvis",
    "gender": "female",
    "surname": "Jarvis"
  },
  {
    "firstName": "Jack",
    "name": "Jack Kennedy",
    "gender": "male",
    "surname": "Kennedy"
  },
  {
    "firstName": "Yvonne",
    "name": "Yvonne Lang",
    "gender": "female",
    "surname": "Lang"
  },
  {
    "firstName": "Ethan",
    "name": "Ethan Nash",
    "gender": "male",
    "surname": "Nash"
  },
  {
    "firstName": "Zoe",
    "name": "Zoe Oakes",
    "gender": "female",
    "surname": "Oakes"
  },
  {
    "firstName": "Sebastian",
    "name": "Sebastian Preston",
    "gender": "male",
    "surname": "Preston"
  },
  {
    "firstName": "Abigail",
    "name": "Abigail Quill",
    "gender": "female",
    "surname": "Quill"
  },
  {
    "firstName": "Peter",
    "name": "Peter Rowe",
    "gender": "male",
    "surname": "Rowe"
  }
]);

const SURNAMES=Object.freeze(['Hart','Turner','Bennett','Cole','Donovan','Brooks','Fleming','Ward','Carter','Morris','Young','Mason','Gibson','Wells','Mercer','Collins','Wright','Doyle','McKenzie','Archer','Ellis','West','Morgan','Palmer','Taylor','Olsen','Briggs','Dawson','Griffin','Hughes','Pearson','Reed','Forbes','Wallace','Harris','Blake','Carroll','Henderson','Douglas','Murray','Lawson','Cooper','Byrne','Kelly','Hawkins','Mitchell','Watson','Reynolds','Parker','Abbott','Mills','Gordon','Spencer','Sullivan','Perry']);
const MEETINGS=['at the regional show','while volunteering at a library fundraising day','at a sporting club meeting',
 'at a community garden working bee','during a town music night','while helping flood-response volunteers',
 'at a farm-gate market','at a trades demonstration day','at a charity book sale','at a repair café event'];
export function createMarriages(villagers){
 const marriages=[];
 for(let k=0;k<MARRIED_COUPLES;k++){
   const a=villagers[k],b=villagers[ORIGINAL_WORKERS+k];
   if(!a||!b||a.home.coordinate!==b.home.coordinate)throw new Error('Marriage requires shared home '+k);
   const surname=SURNAMES[k],year=2008+k%16;
   const story=a.name+' and '+b.name+' met '+MEETINGS[k%MEETINGS.length]+
    ', married in '+year+', and share their home at '+a.home.coordinate+
    '. '+a.name+' works as '+a.job+'; '+b.name+' works as '+b.job+
    '. They have different work shifts but share bills, household tasks, a kitchen and a double bed.';
   for(const [self,other,gender] of [[a,b,ORIGINAL_PARTNER_GENDERS[k]],[b,a,EXPANSION_IDENTITIES[k].gender]]){
     self.maritalStatus='married';self.spouseId=other.id;self.spouseName=other.name;
     self.gender=gender;self.familyName=surname;self.marriageYear=year;
     self.relationshipBackstory=story;self.householdOccupants=2;
   }
   marriages.push({address:a.home.coordinate,ids:[a.id,b.id],names:[a.name,b.name],
     surname,marriedYear:year,backstory:story,doubleBed:true});
 }
 for(const v of villagers)if(v.maritalStatus!=='married'){
   v.maritalStatus='single';v.householdOccupants=1;
  if(v.id>=ORIGINAL_WORKERS)v.gender=EXPANSION_IDENTITIES[v.id-ORIGINAL_WORKERS].gender;
 }
 return marriages;
}
export function reconcileSpouseHouseholds(villagers){
 // JSON saves serialize the same household/pantry twice, so relink after restore.
 for(let k=0;k<MARRIED_COUPLES;k++){
   const a=villagers[k],b=villagers[ORIGINAL_WORKERS+k];
   if(a&&b&&a.home.coordinate===b.home.coordinate){
     b.household=a.household;b.larder=a.larder;
   }
 }
}
export function householdMembers(villagers,coordinate){
 const residents=villagers.filter(v=>v.home.coordinate===coordinate);
 return {coordinate,residents:residents.map(v=>({id:v.id,name:v.name,job:v.job,
     married:v.maritalStatus==='married',spouse:v.spouseName||null,
     backstory:v.relationshipBackstory||null})),
   sharedDoubleBed:residents.length===2&&residents[0].spouseId===residents[1].id};
}
