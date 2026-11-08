// ODbL: attribution for real Narromine roads/footprints in the playable town.
// A visible, always-present credit is intentionally separate from a hidden
// developer menu. Use of map data does not imply endorsement by OpenStreetMap.
(()=>{
  function addCredit(){
    if(document.getElementById('rt-map-credit'))return;
    const root=document.createElement('aside');
    root.id='rt-map-credit';
    root.setAttribute('aria-label','Map data acknowledgement');
    const link=document.createElement('a');
    link.textContent='© OpenStreetMap contributors';
    link.href='https://www.openstreetmap.org/copyright';
    link.target='_blank';
    link.rel='noopener noreferrer';
    const label=document.createElement('span');
    label.textContent=' · ODbL';
    root.append(link,label);
    document.body.append(root);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addCredit,{once:true});
  else addCredit();
})();
