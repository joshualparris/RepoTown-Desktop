import test from 'node:test';
import assert from 'node:assert/strict';
import {Input} from '../game/engine/input.js';

test('Steam controller analog axes, actions, camera and edge detection',()=>{
  const existing=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const buttons=Array.from({length:16},()=>({pressed:false}));
  const pad={connected:true,axes:[0.5,-0.9,0.4,-0.3],buttons};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{
    getGamepads:()=>[pad]
  }});
  try{
    const input=Object.create(Input.prototype);
    Object.assign(input,{keys:new Set(),stick:{x:0,y:0},pressed:new Set(),
      padHeld:new Set(),look:{dx:0,dy:0},run:false,crouch:false,auto:null});
    const movement=input.movement();
    assert(movement.x>0.1,'left stick strafes');
    assert(movement.z<-.6,'left stick moves forward');
    buttons[5].pressed=true;
    assert(input.movement().running,'shoulder button runs');
    buttons[0].pressed=true;
    buttons[2].pressed=true;
    input.movement();
    assert(input.consume('jump'),'A button jumps');
    assert(input.consume('use'),'X button interacts');
    input.movement();
    assert(!input.consume('jump'),'holding A does not trigger repeatedly');
    const look=input.takeLook();
    assert(look.dx>0&&look.dy<0,'right stick controls camera');
    buttons[0].pressed=false;
    input.movement();
    buttons[0].pressed=true;
    input.movement();
    assert(input.consume('jump'),'new press retriggers jump');
    pad.axes=[0.05,-0.03,0,0];buttons[5].pressed=false;
    const deadzone=input.movement();
    assert.equal(deadzone.x,0,'deadzone prevents stick drift');
    assert.equal(deadzone.z,0,'deadzone prevents stick drift');
    globalThis.navigator.getGamepads=()=>[];
    assert.equal(input.movement().x,0,'keyboard input remains usable without gamepad');
  }finally{
    if(existing)Object.defineProperty(globalThis,'navigator',existing);
    else delete globalThis.navigator;
  }
});
