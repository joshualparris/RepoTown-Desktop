import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {REMOVED_REMOTE_ACTIONS,sanitiseOfflineContent} from '../tools/sanitise-interactions.mjs';
test('replaces missing archives and external games with functional local exhibits',()=>{
  const src={houses:[{links:['https://github.com/unlicensed/repo'],
    int:{rooms:[{props:[
      ['terminal','Source code',{do:'source',repo:'Other/repo'}],
      ['arcadeCabinet','Hosted game',{do:'game',game:'unreviewed'}],
      ['crystal','Fortune',{do:'fortune',repo:'Other/repo'}],
      ['notice','External',{do:'link',url:'https://example.invalid'}],
      ['lamp','Lamp',{do:'toggle',url:'https://example.invalid',on:'Light on'}]
    ]}]}}]};
  const {world,converted,removedLinks}=sanitiseOfflineContent(src);
  assert.equal(converted,4);
  assert.equal(world.houses[0].links.length,0);
  const actions=world.houses[0].int.rooms[0].props.map(p=>p[2]);
  assert.deepEqual(actions.map(a=>a.do),['info','arcade','dice','info','toggle']);
  assert(actions.every(a=>!a.url&&!a.repo&&!a.game));
  assert(removedLinks>=2);
});
test('all packaged house interactions are fully local',()=>{
  const world=JSON.parse(fs.readFileSync('game/houses.json','utf8'));
  let inspected=0;
  for(const house of world.houses){
    assert.equal(house.links.length,0,'no external linked repo files');
    for(const room of house.int.rooms)for(const prop of room.props||[]){
      const action=prop?.[2];
      if(!action?.do)continue;
      inspected++;
      assert(!REMOVED_REMOTE_ACTIONS.has(action.do),'no missing remote action: '+action.do);
      assert(!action.url&&!action.urls&&!action.repo,
        'no external action URL/repository reference: '+house.coordinate);
    }
  }
  assert(inspected>1000,'expected an interactable town after cleaning');
});
