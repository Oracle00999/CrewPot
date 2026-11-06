# Automated demo recording

The native browser-control connection was unavailable. The workaround uses a separate headless Chrome session controlled by Playwright, captures the actual local app, and edits the footage into a narrated MP4 under two minutes. It does not access the user's personal browser profile.

Transactions are signed by the existing local Devnet demo wallets through `scripts/prepare-demo.ts`. The video visibly discloses scripted signing and shortened confirmation waits. It does not depict browser-wallet signing. For reliable capture, the recorder forwards unchanged responses from the real Devnet RPC through its HTTP connection pool. The app reads actual RPC responses; no balances, account data, signatures, or wallet confirmations are mocked.

## Files

The generated final delivery directory is `artifacts/demo/final/` (ignored by Git):

- `CrewPot-demo.mp4`: 1920×1080, H.264/AAC, video under two minutes.
- `CrewPot-demo.srt`: optional narration subtitles.
- `recording-manifest.json`: shot list, narration, and actual transaction signatures.
- Ten numbered PNG screenshots, MP4 clips, and synthetic narration source files.
- `raw/`: unedited browser recordings, including navigation and waiting time.

`docs/demo-scenes.json` records the latest confirmed chain state, and the wallet recording manifest outside the repository retains the same transaction history. Recording consumes the staged payout and refund; prepare new scenes before making a new take that demonstrates these transitions again.

## Reproduce

Install recording tools outside the project:

```sh
npm install --prefix /private/tmp/crewpot-video-tools playwright ffmpeg-static
node /private/tmp/crewpot-video-tools/node_modules/playwright/cli.js install ffmpeg
python3 -m venv /private/tmp/crewpot-voice-tools
/private/tmp/crewpot-voice-tools/bin/pip install edge-tts==7.3.1
npm run build
npm run start -- --port 3003
```

In a separate terminal, after staging fresh demo scenes:

```sh
npm run demo:prepare
CREWPOT_DEMO_URL=http://127.0.0.1:3003 CREWPOT_DEMO_OUTPUT=artifacts/demo/final node scripts/record-demo.mjs
```

Use the stable production server during recording: development hot reloads can interrupt footage. Google Chrome must be installed. Narration uses the Andrew multilingual neural voice through `edge-tts`. The older macOS Samantha voice was rejected and is no longer the recorder default. This is synthetic narration, not a recording or imitation of the project owner. `CREWPOT_VIDEO_TOOLS` can override the isolated node_modules path, and `CREWPOT_DEMO_URL` can override the local app address. `CREWPOT_DEMO_OUTPUT` selects a separate take directory.

The recorder resumes completed numbered clips when rerun. To create an entirely new take, preserve the existing output directory under a different name and archive the external public `recording.json` before staging fresh pots. Never delete or publish wallet private key files. A single member contribution or approval can also be driven with `npm run demo:scene -- fund 1` or `npm run demo:scene -- approve 1`.

Public app hosting and video upload remain pending. Source is available at [Oracle00999/CrewPot](https://github.com/Oracle00999/CrewPot). A local MP4 does not itself complete a public submission.

## Replace narration without recording again

Run `/private/tmp/crewpot-voice-tools/bin/python scripts/revoice-demo.py`. This rewrites the lines for conversational delivery, generates neural audio with service-timed subtitles, checks every line fits its scene, normalizes loudness, and copies the existing video streams without re-encoding. Generated replacement files are in `artifacts/demo/final/neural/`.

`CREWPOT_NARRATOR` selects the voice and `CREWPOT_EDGE_TTS` selects the CLI path. The narration text is sent to the online speech service; wallet material is never used by this step. The new audio is checked before replacing the canonical delivery file.

The submission export ends at 119 seconds (the MP4 container reports approximately 119.09 seconds). Only silent closing hold time was removed; the last spoken subtitle ends at 117.7 seconds. Both recording and revoicing commands now cap the final export below the two-minute limit.
