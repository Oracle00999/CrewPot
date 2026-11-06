/** Automated recording of the real app. Requires isolated playwright + ffmpeg-static tools.
 * CREWPOT_VIDEO_TOOLS=/path/to/node_modules node scripts/record-demo.mjs
 * Transactions are signed by scripts, explicitly disclosed in the video.
 */
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import assert from 'node:assert/strict';
const run = promisify(execFile);
const require = createRequire(import.meta.url);
const tools = process.env.CREWPOT_VIDEO_TOOLS || '/private/tmp/crewpot-video-tools/node_modules';
const { chromium } = require(path.join(tools, 'playwright'));
const ffmpeg = require(path.join(tools, 'ffmpeg-static'));
const neuralTts = process.env.CREWPOT_EDGE_TTS || '/private/tmp/crewpot-voice-tools/bin/edge-tts';
const narrator = process.env.CREWPOT_NARRATOR || 'en-US-AndrewMultilingualNeural';
const out = path.resolve(process.env.CREWPOT_DEMO_OUTPUT || 'artifacts/demo');
mkdirSync(out, { recursive: true });
const evidence = () => JSON.parse(readFileSync('docs/demo-scenes.json', 'utf8'));
const initial = evidence();
const base = process.env.CREWPOT_DEMO_URL || 'http://127.0.0.1:3002';
const payout = `${base}/pots/${initial.payout.address}`;
const refund = `${base}/pots/${initial.refund.address}`;
const shots = [
  { id:'01-intro', url:base, seconds:12, title:'CrewPot · Solana Hackathon', subtitle:'Shared money. Rules your crew agrees on.', voice:"Meet CrewPot. Shared money, with rules your crew agrees on. Let\u2019s walk through a real Solana Devnet example, using test tokens with no real monetary value." },
  { id:'02-agreement', url:payout, seconds:18, title:'A prepared pot. A fixed agreement.', subtitle:'3 members · 10 dUSDC each · 2 approvals · fixed recipient', voice:"Let\u2019s take a weekend gaming fund. Three friends put in ten demo USDC each. The pot needs two approvals before paying out. The recipient and deadline are fixed from the start, so everyone knows the agreement." },
  { id:'03-member-one', url:payout, seconds:7, command:['fund','1'], title:'Member 1 contributes', subtitle:'10 dUSDC confirmed in the vault', voice:"First, one friend puts in ten. You can see their share in the vault." },
  { id:'04-member-two', url:payout, seconds:7, command:['fund','2'], title:'Member 2 contributes', subtitle:'20 dUSDC collected · one share to go', voice:"Another friend joins in. The pot now holds twenty, confirmed on Solana." },
  { id:'05-member-three', url:payout, seconds:7, command:['fund','3'], title:'Fully funded. Still awaiting approval.', subtitle:'30 / 30 dUSDC · funding alone does not authorize payout', voice:"The last ten brings us to thirty. But the money still can\u2019t leave." },
  { id:'06-first-vote', url:payout, seconds:8, command:['approve','1'], scroll:245, title:'One approval. Payout stays locked.', subtitle:'Only contributing members can vote', voice:"One member approves. That\u2019s one vote out of two. The money stays locked." },
  { id:'07-majority', url:payout, seconds:12, command:['approve','2'], scroll:245, title:'The majority authorizes the payout', subtitle:'2 / 2 required approvals · fixed recipient', voice:"Now the second member approves. That\u2019s the majority. The payout is authorized, and anyone can finalize it, but only to the recipient the crew agreed on." },
  { id:'08-payout', url:payout, seconds:20, command:['release'], title:'30 dUSDC released to the agreed recipient', subtitle:'Exact recipient balance increase verified by the recording script', voice:"The payout is complete. All thirty demo USDC reached the agreed recipient, and the vault is empty. Behind the scenes, our script checks the exact balance change. These activity links open the real, confirmed transactions on Solana Explorer.", pan:true },
  { id:'09-refund', url:refund, seconds:23, command:['refund'], title:'Plans changed. Your share is yours.', subtitle:'Separate expired pot · member 2 receives exactly 10 dUSDC back', voice:"If plans fall through, contributors have a way out. In this separate pot, the deadline passed without enough funding or approval. The friend who put in ten claims that ten back, without needing the organizer\u2019s permission. The member now shows refunded, and the vault is empty.", scroll:220 },
  { id:'10-close', url:base, seconds:6, title:'Your crew. Your money. Your rules.', subtitle:'CrewPot · Solana Devnet · demo tokens have no real value', voice:"CrewPot. Your crew. Your money. Your rules." },
];
const browser = await chromium.launch({ channel:'chrome', headless:true });
const metadata = [];
try {
  for (const shot of shots) {
    const encoded = path.join(out, `${shot.id}.mp4`);
    const metaPath = path.join(out, `${shot.id}.json`);
    if (existsSync(encoded) && existsSync(metaPath)) { metadata.push(JSON.parse(readFileSync(metaPath))); continue; }
    console.log(`START ${shot.id}`);
    if (shot.command) {
      const { stdout } = await run('npm', ['run', 'demo:scene', '--', ...shot.command], { cwd:process.cwd(), timeout:180000, maxBuffer:2e6 });
      console.log(stdout);
    }
    if (shot.command) {
      const scene = evidence().scenes.find(s => s.name === (shot.command[0] === 'refund' ? 'refund' : 'payout'));
      if (shot.command[0] === 'fund') assert.equal(scene.funded, Number(shot.command[1]), 'Scene was already advanced; prepare a fresh take');
      if (shot.command[0] === 'approve') assert.equal(scene.approvals, Number(shot.command[1]), 'Scene was already advanced; prepare a fresh take');
      if (shot.command[0] === 'release') assert.equal(scene.released, true);
      if (shot.command[0] === 'refund') assert.equal(scene.refunded[1], true);
    }
    const voice = path.join(out, `${shot.id}.mp3`);
    await run(neuralTts, ['--voice',narrator,`--rate=${process.env.CREWPOT_SPEECH_RATE || '+5%'}`,'--text',shot.voice,'--write-media',voice],{timeout:120000});
    const voiceProbe = await run(ffmpeg,['-hide_banner','-i',voice,'-f','null','-']);
    const match = voiceProbe.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
    assert.ok(match, 'Could not measure neural narration');
    assert.ok(Number(match[1])*3600+Number(match[2])*60+Number(match[3]) < shot.seconds, 'Narration exceeds scene; shorten text or adjust CREWPOT_SPEECH_RATE');
    const context = await browser.newContext({ viewport:{width:1600,height:900}, deviceScaleFactor:1, locale:'en-GB', timezoneId:'Africa/Lagos', recordVideo:{dir:path.join(out,'raw'),size:{width:1600,height:900}} });
    const page = await context.newPage();
    const video = page.video();
    // Forward unchanged real RPC responses through Node's HTTP connection pool.
    // This avoids stalled browser connections; it does not mock account data.
    await page.route(/^https:\/\/api\.devnet\.solana\.com\/?$/, async route => {
      const req = route.request();
      try {
        for (let retry = 0; retry < 5; retry++) {
          const response = await fetch(req.url(), { method:req.method(), body:req.postData(), headers:{'content-type':'application/json'}, signal:AbortSignal.timeout(20000) });
          if ([429, 503].includes(response.status) && retry < 4) {
            await new Promise(resolve=>setTimeout(resolve,3000*(retry+1)));
            continue;
          }
          await route.fulfill({status:response.status,contentType:'application/json',body:await response.text()});
          return;
        }
      } catch (error) {
        console.log('RPC forwarding failed',error.message);
        await route.abort('failed');
      }
    });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto(shot.url, { waitUntil:'domcontentloaded', timeout:60000 });
        if (shot.url !== base) {
          await page.getByRole('heading', { name:/Demo$/ }).waitFor({timeout:30000});
          await page.getByText('Reading your crew’s agreement from Solana…').waitFor({state:'hidden',timeout:60000});
          await page.getByRole('heading',{name:'Onchain activity'}).waitFor();
          if ((await page.locator('.notice.error[role="alert"]').count()) > 0) throw new Error(await page.locator('.notice.error[role="alert"]').innerText());
        } else await page.locator('h1').waitFor();
        break;
      } catch (error) {
        console.log('Browser read retry', attempt + 1, (await page.locator('main').innerText()).slice(0,400));
        await page.screenshot({path:path.join(out,`${shot.id}-read-retry.png`)});
        if (attempt === 2) throw error;
        await page.waitForTimeout(12000);
      }
    }
    await page.addStyleTag({content:'nextjs-portal { display:none !important; } html { scroll-behavior:smooth; } body {padding-bottom:120px !important;}'});
    if (shot.scroll) await page.evaluate(y=>window.scrollTo(0,y),shot.scroll);
    const tx = shot.command ? evidence().signatures.at(-1)?.signature : undefined;
    await page.evaluate(({title,subtitle,tx})=>{
      const bar=document.createElement('div');
      bar.id='recording-caption';
      Object.assign(bar.style,{position:'fixed',bottom:'0',left:'0',right:'0',zIndex:'2147483647',padding:'18px 64px',background:'#102e26',color:'#f7faef',fontFamily:'Arial,sans-serif',boxShadow:'0 -4px 30px #102e2620',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'28px'});
      const left=document.createElement('div');
      const heading=document.createElement('div');heading.textContent=title;Object.assign(heading.style,{fontSize:'23px',fontWeight:'700',marginBottom:'6px'});
      const sub=document.createElement('div');sub.textContent=subtitle;Object.assign(sub.style,{fontSize:'15px',color:'#d4e4c9'});left.append(heading,sub);
      const disclosure=document.createElement('div');Object.assign(disclosure.style,{fontSize:'12px',lineHeight:'1.65',textAlign:'right',color:'#cfdfd5',minWidth:'340px'});
      disclosure.textContent='SCRIPT-SIGNED DEVNET TRANSACTIONS';
      for(const text of ['Live app reads · confirmation waits cut',...(tx?[`Confirmed tx: ${tx.slice(0,12)}…${tx.slice(-8)}`]:[])]){const line=document.createElement('div');line.textContent=text;disclosure.append(line);}
      bar.append(left,disclosure);document.body.append(bar);
    },{title:shot.title,subtitle:shot.subtitle,tx});
    await page.waitForTimeout(700);
    await page.screenshot({path:path.join(out,`${shot.id}.png`)});
    if (shot.pan) {
      await page.waitForTimeout(8500);
      await page.evaluate(()=>window.scrollTo(0,610));
      await page.waitForTimeout(shot.seconds*1000-7500);
    } else await page.waitForTimeout((shot.seconds+1)*1000);
    await page.locator('#recording-caption').waitFor({state:'visible',timeout:1000});
    await context.close();
    const raw=await video.path();
    const probe = await run(ffmpeg,['-hide_banner','-i',raw,'-f','null','-'],{timeout:120000,maxBuffer:2e6});
    const times = [...probe.stderr.matchAll(/time=(\d+):(\d+):([\d.]+)/g)];
    assert.ok(times.length, 'Raw recording has no decodable video');
    const last = times.at(-1);
    const rawSeconds = Number(last[1])*3600+Number(last[2])*60+Number(last[3]);
    const trimStart = Math.max(0,rawSeconds-shot.seconds-0.2);
    await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',raw,'-i',voice,'-t',String(shot.seconds),'-vf',`trim=start=${trimStart},setpts=PTS-STARTPTS,scale=1920:1080,fps=30,format=yuv420p`,'-af','loudnorm=I=-16:TP=-1.5:LRA=7,apad','-ar','48000','-c:v','libx264','-preset','fast','-crf','20','-c:a','aac','-b:a','160k','-movflags','+faststart',encoded],{timeout:180000,maxBuffer:2e6});
    const meta={id:shot.id,seconds:shot.seconds,title:shot.title,narration:shot.voice,signature:tx,rawVideo:raw,trimStartSeconds:trimStart,screenshot:`${shot.id}.png`,video:`${shot.id}.mp4`};
    writeFileSync(metaPath,JSON.stringify(meta,null,2));metadata.push(meta);
    console.log(`DONE ${shot.id}`);
  }
} finally { await browser.close(); }
const list=path.join(out,'concat.txt');
writeFileSync(list,shots.map(s=>`file '${s.id}.mp4'`).join('\n'));
await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',path.join(out,'CrewPot-demo.mp4')],{timeout:120000});
writeFileSync(path.join(out,'recording-manifest.json'),JSON.stringify({recordedAt:new Date().toISOString(),durationSeconds:shots.reduce((n,s)=>n+s.seconds,0),disclosure:'Real app captured in Chrome. Transactions signed by local demo scripts on Devnet. Confirmation waits cut. Synthetic neural narration. No browser wallet signing is depicted.',shots:metadata},null,2));
let elapsed = 0;
const stamp = seconds => new Date(seconds * 1000).toISOString().slice(11,23).replace('.', ',');
const subtitles = shots.map((shot, i) => {
  const start = elapsed; elapsed += shot.seconds;
  return `${i+1}\n${stamp(start)} --> ${stamp(elapsed)}\n${shot.voice}\n`;
}).join('\n');
writeFileSync(path.join(out,'CrewPot-demo.srt'),subtitles);
console.log('READY',path.join(out,'CrewPot-demo.mp4'));
