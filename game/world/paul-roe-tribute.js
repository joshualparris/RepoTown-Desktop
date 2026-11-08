// Author-approved public memorial references only. Paul Roe's private archive,
// correspondence and research remain untouched and are never surfaced in this game.
// Repository Town houses are symbolic galleries, not reconstructions of Paul's home.
const MEMORIAL = 'https://TownResident.github.io/Paul-Roe/';
const HISTORIAN = 'https://www.theoutbackhistorian.com.au/';
const ORAL_HISTORIES = 'https://archival.sl.nsw.gov.au/Details/archive/110318820';
const TELL_ME_ANOTHER = 'https://www.theoutbackhistorian.com.au/store/p2/Tell_Me_Another.html';
const BOURKE_AND_BEYOND = 'https://www.theoutbackhistorian.com.au/';
const SERVICE = 'https://github.com/TownResident/Paul-Roe/blob/main/Paul%20Roe%20Order%20of%20Service.pdf';
const link = (title,text,url) => ({do:'link',title,text,url,button:'View the public source ↗'});
const info = (title,text) => ({do:'info',title,text});
const exhibit = (prop,label,act) => [prop,label,act];
const room = (name,w,d,props) => ({name,w,d,props});
const memorialRooms = [
  room('Remembering Paul Roe',11,10,[
    exhibit('pews','Place to sit and remember'),
    exhibit('flowerBed','Flowers of remembrance'),
    exhibit('lectern','Paul Roe · Order of Service',link('Paul Roe · Order of Service',
      'Paul Roe is remembered for his faith, stories and the people he encouraged. The public Order of Service is available to read.',SERVICE)),
    exhibit('candles','Candle of remembrance',info('A quiet moment',
      'A place for reflection, gratitude and remembering Paul Roe.')),
  ]),
  room('Bourke and Outback stories',11,9,[
    exhibit('mapTable','Bourke and the Darling River',link('Bourke and Beyond',
      'Paul listened to and shared the stories of outback Australians. His history brought people, places and lived experiences together.',BOURKE_AND_BEYOND)),
    exhibit('bookshelf','The Outback Historian',link('The Outback Historian',
      'Explore Paul Roe’s published outback stories, local history, and accounts of faith and community.',HISTORIAN)),
    exhibit('easel','Stories from country',link('Paul’s public photographs and stories',
      'See the photographs and memories chosen for the public memorial. This gallery does not expose private family photographs.',MEMORIAL)),
    exhibit('bench','A place to listen'),
  ]),
  room('Voices and oral history',11,9,[
    exhibit('radio','2WEB oral histories',link('Recorded voices from Bourke',
      'Paul recorded oral histories of people living around Bourke. Explore the preserved collection through the State Library of NSW.',ORAL_HISTORIES)),
    exhibit('bookshelf','Recorded stories and interviews',link('Paul’s voice and recordings',
      'Hear or watch public recordings of Paul telling the stories he gathered. The memorial links to his public work.',MEMORIAL)),
    exhibit('lectern','A story worth listening to',info('Listen before telling',
      'Paul spent decades listening to people and helping their stories be heard. The people in the stories matter as much as the history.')),
  ]),
  room('Cornerstone and faith',11,9,[
    exhibit('pews','Gathering and community'),
    exhibit('lectern','Cornerstone Christian Community',link('Cornerstone and Paul’s legacy',
      'Paul helped establish Cornerstone near Bourke. His Christian faith shaped his teaching, community life and the stories he told.',MEMORIAL)),
    exhibit('bookshelf','Stories of faith',link('Faith through Australian history',
      'Paul explored the contributions of people of faith throughout Australian history and shared their stories with new generations.',HISTORIAN)),
    exhibit('candles','Quiet reflection',info('Faith and remembrance',
      'A peaceful space to remember Paul’s faith, generosity and commitment to the people whose stories he carried.')),
  ]),
  room('Books and the storyteller',11,9,[
    exhibit('bookshelf','Tell Me Another',link('Tell Me Another',
      'Paul Roe’s book calls readers to notice and pass on Australia’s stories of faith. Discover the published book and its description.',TELL_ME_ANOTHER)),
    exhibit('lectern','Bourke and Beyond',link('Bourke and Beyond',
      'Paul gathered stories of people and places from Bourke and across the Western Plains.',BOURKE_AND_BEYOND)),
    exhibit('desk','The writer and teacher',info('A life spent gathering stories',
      'Paul was a historian, teacher and storyteller. This desk is a symbolic tribute, not a reconstruction of his actual belongings.')),
    exhibit('easel','Read and watch Paul’s work',link('Stories in Paul’s own voice',
      'Follow the public memorial for approved photographs, books, interviews, documentaries and recordings.',MEMORIAL)),
  ]),
  room('Shared memories',10,9,[
    exhibit('bench','Sit and remember'),
    exhibit('noticeBoard','Family-approved memorial and memories',link('Remembering Paul Roe',
      'Read the public memorial and memories shared with permission. Personal correspondence and the private archive are not displayed.',MEMORIAL)),
    exhibit('lectern','Continue telling stories',info('Paul Roe’s legacy',
      'Remembering Paul includes continuing to listen, learn and tell stories with care for the people who lived them.')),
    exhibit('flowerBed','Flowers and gratitude'),
  ]),
];
const quietRooms = [
  room('Quiet remembrance',10,9,[
    exhibit('bench','A seat for reflection'),
    exhibit('flowerBed','Flowers for Paul'),
    exhibit('lectern','Public memorial',link('Remembering Paul Roe',
      'A quiet tribute to Paul’s life and work. His private research and correspondence are not displayed here.',MEMORIAL)),
    exhibit('candles','Candle of remembrance',info('In remembrance',
      'This room honours Paul Roe through reflection, not games or fictional encounters.')),
  ]),
  room('Stories Paul shared',10,9,[
    exhibit('bookshelf','The Outback Historian',link('Stories of the Outback',
      'Paul shared Australian stories from Bourke and beyond, with a deep interest in faith and the people behind the history.',HISTORIAN)),
    exhibit('mapTable','Bourke and the Western Plains',link('Public stories and recordings',
      'Discover Paul’s public writing, interviews and the places that shaped his work.',MEMORIAL)),
    exhibit('lectern','Tell Me Another',link('Paul’s published writing',
      'Paul encouraged others to listen to people and continue telling their stories.',TELL_ME_ANOTHER)),
  ]),
];

export const PAUL_ROE_COORDINATES = Object.freeze(['C2','K3']);
export const isPaulRoeMemorial = house => Boolean(house && PAUL_ROE_COORDINATES.includes(house.coordinate)
  && /^Paul-Roe(?:-Private-Archive)?$/.test(house.name));

export function honourPaulRoe(house) {
  if(!isPaulRoeMemorial(house))return house;
  const primary=house.coordinate==='K3';
  const rooms=(primary?memorialRooms:quietRooms).map(r=>({
    ...r,props:r.props.map(p=>[p[0],p[1],p[2]?{...p[2]}:undefined]),
  }));
  return {
    ...house,memorial:true, // Preserve exterior kind (Memorial Chapel / Private project).
    summary:primary
      ? 'Remembering Paul Roe: Outback historian, storyteller, teacher, Cornerstone co-founder and a man of Christian faith. Explore his published stories, recordings, books and approved memories.'
      : 'A quiet reflection on Paul Roe’s life and the stories he shared. Private correspondence and research remain private.',
    links:primary
      ? [{label:'Remembering Paul Roe',url:MEMORIAL},{label:'The Outback Historian',url:HISTORIAN},
         {label:'Paul’s public oral histories',url:ORAL_HISTORIES}]
      : [{label:'Public remembrance of Paul Roe',url:MEMORIAL}],
    int:{...house.int,layout:primary?'hub':'row',rooms},
  };
}
