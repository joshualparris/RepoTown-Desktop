// Replace attractions whose upstream files were deliberately excluded
// from the privacy-safe Steam edition. Everything becomes locally playable.
// This is data-only and never imports private project content or recordings.
export const REMOVED_REMOTE_ACTIONS=new Set([
  'source','readme','files','live','commits','docs','fortune','game','link'
]);
const TITLES={
  source:'Town blueprints',readme:'Town guide',files:'Local records',
  live:'Visitor information',commits:'Town chronicle',docs:'Local handbook',
  link:'Exhibit notes'
};
const TEXT={
  source:'A framed collection of old town plans and builders’ sketches.',
  readme:'Read about the neighbourhood and the people who live here.',
  files:'The town archivist has sorted a collection of local records.',
  live:'Explore the streets, neighbours and working places nearby.',
  commits:'The town chronicle records another ordinary day of local life.',
  docs:'Local information about this building and its surroundings.',
  link:'An exhibit about life, work and discovery in the town.'
};
export function sanitiseOfflineContent(world){
  if(!world||!Array.isArray(world.houses))throw Error('Expected complete house inventory.');
  let converted=0,removedLinks=0;
  for(const house of world.houses){
    if(!Array.isArray(house.links))house.links=[];
    removedLinks+=house.links.length;
    house.links=[];
    for(const room of house.int?.rooms||[]){
      for(const prop of room.props||[]){
        if(!Array.isArray(prop)||!prop[2]||typeof prop[2]!=='object')continue;
        const action=prop[2];
        if(REMOVED_REMOTE_ACTIONS.has(action.do)){
          const kind=action.do;
          if(kind==='fortune'){
            prop[1]='Fortune dice';
            prop[2]={do:'dice',title:'Fortune dice',sides:20,set:true,
              text:'Roll a twenty-sided die to see what the next day might bring.'};
          }else if(kind==='game'){
            prop[1]='Arcade score challenge';
            prop[2]={do:'arcade',title:'Arcade score challenge',
              text:'Play the local score challenge and try to beat your best.'};
          }else{
            prop[1]=TITLES[kind];
            prop[2]={do:'info',title:TITLES[kind],text:TEXT[kind]};
          }
          converted++;
          continue;
        }
        // Retain playable local interactions but never a stray external link
        // from a copied project, including secondary actions and URL arrays.
        if('url' in action){delete action.url;removedLinks++;}
        if('urls' in action){removedLinks+=(action.urls||[]).length;delete action.urls;}
        if('repo' in action)delete action.repo;
      }
    }
  }
  return {world,converted,removedLinks};
}
