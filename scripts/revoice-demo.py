"""Replace narration using neural TTS; preserve the recorded video streams."""
import asyncio
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess

ROOT = Path('artifacts/demo/final')
OUT = ROOT / 'neural'
OUT.mkdir(parents=True, exist_ok=True)
TTS = os.environ.get('CREWPOT_EDGE_TTS', '/private/tmp/crewpot-voice-tools/bin/edge-tts')
FFMPEG = os.environ.get('CREWPOT_FFMPEG', '/private/tmp/crewpot-video-tools/node_modules/ffmpeg-static/ffmpeg')
VOICE = os.environ.get('CREWPOT_NARRATOR', 'en-US-AndrewMultilingualNeural')
manifest = json.loads((ROOT / 'recording-manifest.json').read_text())
lines = [
    'Meet CrewPot. Shared money, with rules your crew agrees on. Let’s walk through a real Solana Devnet example, using test tokens with no real monetary value.',
    'Let’s take a weekend gaming fund. Three friends put in ten demo USDC each. The pot needs two approvals before paying out. The recipient and deadline are fixed from the start, so everyone knows the agreement.',
    'First, one friend puts in ten. You can see their share in the vault.',
    'Another friend joins in. The pot now holds twenty, confirmed on Solana.',
    'The last ten brings us to thirty. But the money still can’t leave.',
    'One member approves. That’s one vote out of two. The money stays locked.',
    'Now the second member approves. That’s the majority. The payout is authorized, and anyone can finalize it, but only to the recipient the crew agreed on.',
    'The payout is complete. All thirty demo USDC reached the agreed recipient, and the vault is empty. Behind the scenes, our script checks the exact balance change. These activity links open the real, confirmed transactions on Solana Explorer.',
    'If plans fall through, contributors have a way out. In this separate pot, the deadline passed without enough funding or approval. The friend who put in ten claims that ten back, without needing the organizer’s permission. The member now shows refunded, and the vault is empty.',
    'CrewPot. Your crew. Your money. Your rules.',
]
assert len(lines) == len(manifest['shots'])


def run(args):
    return subprocess.run(args, capture_output=True, check=True, text=True)


def duration(filename):
    probe = subprocess.run([FFMPEG, '-hide_banner', '-i', str(filename)], capture_output=True, text=True)
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', probe.stderr)
    assert m, probe.stderr
    return int(m[1])*3600 + int(m[2])*60 + float(m[3])


async def generate(shot, text, semaphore):
    async with semaphore:
        audio = OUT / (shot['id'] + '.mp3')
        srt = OUT / (shot['id'] + '.srt')
        rate = 0
        for attempt in range(3):
            proc = await asyncio.create_subprocess_exec(TTS, '--voice', VOICE, '--rate=+%d%%' % rate,
                '--text', text, '--write-media', str(audio), '--write-subtitles', str(srt),
                stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
            if proc.returncode:
                if attempt == 2:
                    raise RuntimeError(stderr.decode())
                await asyncio.sleep(3)
                continue
            seconds = duration(audio)
            if seconds <= shot['seconds'] - 0.2:
                shot['narration'] = text
                shot['voice'] = VOICE
                shot['speechRatePercent'] = rate
                shot['speechSeconds'] = seconds
                print('VOICE READY', shot['id'], round(seconds, 2), 'seconds', flush=True)
                return
            rate = math.ceil((seconds / (shot['seconds'] - 0.35) * (1 + rate/100) - 1) * 100) + 1
            assert rate <= 25, 'Narration needs shortening rather than rushing'
        raise RuntimeError('Could not produce a complete, uncut narration for ' + shot['id'])


async def main():
    semaphore = asyncio.Semaphore(2)
    await asyncio.gather(*(generate(shot, text, semaphore) for shot, text in zip(manifest['shots'], lines)))


asyncio.run(main())
for shot in manifest['shots']:
    clip = OUT / (shot['id'] + '.mp4')
    run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(ROOT / (shot['id'] + '.mp4')),
         '-i', str(OUT / (shot['id'] + '.mp3')), '-map', '0:v:0', '-map', '1:a:0',
         '-t', str(shot['seconds']), '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7,apad',
         '-ar', '48000', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', str(clip)])
    print('REMUXED', shot['id'], flush=True)
listing = OUT / 'concat.txt'
listing.write_text('\n'.join("file '%s.mp4'" % s['id'] for s in manifest['shots']))
video = OUT / 'CrewPot-demo-natural.mp4'
run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(listing),
     '-c', 'copy', '-movflags', '+faststart', str(video)])
# Match exact service-generated subtitle timings to each preserved scene.
blocks = []
elapsed_ms = 0

def stamp(ms):
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return '%02d:%02d:%02d,%03d' % (h, m, s, ms)

for shot in manifest['shots']:
    subtitle = (OUT / (shot['id'] + '.srt')).read_text(encoding='utf-8-sig')
    def shift(match):
        h, m, s, ms = map(int, match.groups())
        return stamp(h*3600000 + m*60000 + s*1000 + ms + elapsed_ms)
    for block in re.split(r'\n\s*\n', subtitle.strip()):
        parts = block.splitlines()
        if len(parts) >= 3:
            timing = re.sub(r'(\d\d):(\d\d):(\d\d),(\d\d\d)', shift, parts[1])
            blocks.append(str(len(blocks)+1)+'\n'+timing+'\n'+'\n'.join(parts[2:]))
    elapsed_ms += shot['seconds']*1000
(OUT / 'CrewPot-demo.srt').write_text('\n\n'.join(blocks)+'\n')
manifest['disclosure'] = 'Real app captured in Chrome. Script-signed Devnet transactions. Confirmation waits cut. Synthetic neural narration: ' + VOICE + '. No browser-wallet signing is depicted.'
manifest['narrator'] = {'voice': VOICE, 'engine': 'Microsoft neural speech via edge-tts', 'synthetic': True}
manifest['videoSha256'] = hashlib.sha256(video.read_bytes()).hexdigest()
(OUT / 'recording-manifest.json').write_text(json.dumps(manifest, indent=2))
print('READY', video, flush=True)
