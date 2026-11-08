'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { canUseGamePointerLock } = require('../desktop/pointer-permission.cjs');

const gameOrigin = 'http://127.0.0.1:8091';
const contents = {};
const valid = {
  contents, gameContents: contents, permission: 'pointerLock',
  requestingUrl: gameOrigin + '/index.html',
  requestingOrigin: gameOrigin, isMainFrame: true, gameOrigin,
};
test('game window can lock its own pointer', () => {
  assert.equal(canUseGamePointerLock(valid), true);
  assert.equal(canUseGamePointerLock({...valid, requestingOrigin: undefined}), true);
});
test('all non-pointer permissions stay denied even to the game', () => {
  for (const permission of ['media', 'display-capture', 'geolocation',
    'notifications', 'fullscreen', 'keyboardLock', 'openExternal', 'clipboard-read', 'unknown']) {
    assert.equal(canUseGamePointerLock({...valid, permission}), false, permission);
  }
});
test('remote pages, nested frames and unrelated windows cannot capture the mouse', () => {
  const cases = [
    { contents: {} },
    { gameContents: null },
    { isMainFrame: false },
    { isMainFrame: undefined },
    { requestingUrl: 'https://example.com/index.html' },
    { requestingUrl: 'http://127.0.0.1:8092/index.html' },
    { requestingUrl: 'http://127.0.0.1:8091.evil.example/index.html' },
    { requestingUrl: gameOrigin + '/release.html' },
    { requestingUrl: gameOrigin + '/index.html?embedded=1' },
    { requestingUrl: gameOrigin + '/index.html#other' },
    { requestingUrl: undefined },
    { requestingOrigin: 'https://example.com' },
  ];
  for (const over of cases) assert.equal(
    canUseGamePointerLock({...valid, ...over}), false, JSON.stringify(over));
});
