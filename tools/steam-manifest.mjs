// Generates a SteamPipe PREVIEW manifest only: no Steam credentials, upload or release.
// Real Steamworks App and Depot IDs are required before the file can be generated.
import fs from 'node:fs';
import path from 'node:path';
const app=process.env.STEAM_APP_ID||'';
const depot=process.env.STEAM_DEPOT_ID||'';
if(!/^[1-9]\d{0,12}$/.test(app)||!/^[1-9]\d{0,12}$/.test(depot))
  throw Error('A real STEAM_APP_ID and STEAM_DEPOT_ID are required. No upload attempted.');
const root=path.resolve('release','win-unpacked');
if(!fs.existsSync(path.join(root,'Repository Town.exe')))
  throw Error('Build and verify the unpacked Windows game before preparing SteamPipe.');
const dir=path.resolve('release','steampipe');fs.mkdirSync(dir,{recursive:true});
const lines=[
  '"AppBuild"',
  '{',
  '  "AppID" "'+app+'"',
  '  "Desc" "Repository Town Windows preview - NOT public"',
  '  "ContentRoot" "..\\win-unpacked\\"',
  '  "BuildOutput" "..\\steam-build-logs\\"',
  '  "Preview" "1"',
  '  "Depots"',
  '  {',
  '    "'+depot+'"',
  '    {',
  '      "FileMapping"',
  '      {',
  '        "LocalPath" "*"',
  '        "DepotPath" "."',
  '        "recursive" "1"',
  '      }',
  '    }',
  '  }',
  '}'
];
fs.writeFileSync(path.join(dir,'app_build.vdf'),lines.join('\n')+'\n');
console.log('SteamPipe preview manifest created. No Steam login, upload or release.');
