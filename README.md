# Mend

Phone-controlled stroke rehab activities. Open Mend on a computer, scan the QR code with your phone,
and play six short activities by tilting the phone. Each session records repetitions, range of motion
and movement smoothness, and saves it to a log you can share with a therapist.

**Live site:** _not deployed yet_

Built as a prototype for the Sling Health neuroscience team at UT Austin. Not a medical device.

## Use it

1. Open the live site on a computer (Chrome, Edge, Safari or Firefox).
2. Scan the QR code with the phone camera. On the phone, tap **Start motion**; on iPhone, tap **Allow** for motion access.
3. On the computer, set the affected side, range target (15°, 30° or 45°) and repetitions, then pick an activity.
4. Press **Start with phone** and hold still for the 3-second calibration. Targets are measured from that resting position.

No phone? Tick **Use the mouse instead of a phone**: the pointer position stands in for the tilt of the hand.

## Activities

| Activity | Phone position | Movement it trains | Based on |
| --- | --- | --- | --- |
| Lantern Lift | Strapped to the forearm, screen up (or flat in the palm) | Shoulder flexion with a 1.2 s hold | FitMi and Flint arm raises; Penumbra REAL shoulder range of motion |
| Pour the Tea | In the hand like a teapot handle, elbow on the table | Forearm rotation; spills if poured too fast | mRehab Slow Pour and Quick Twist; RAPAEL pouring and supination–pronation |
| Combination Lock | In the hand like a key | Forearm rotation plus remembering a 2–4 digit code | mRehab Unlock with Key and Turn Doorknob; Constant Therapy visual memory |
| Tilt Maze | Flat in the palm like a tray | Wrist flexion/extension and side-to-side deviation | RAPAEL wrist games |
| Sort It | In the hand, elbow on the table | Forearm rotation plus reading and word categories | Constant Therapy categorization and reading; FitMi object rotation |
| Memory Moves | Flat in the palm | Tilts in four directions plus sequence memory | Simon-style serious games; Constant Therapy sequencing |

The **Evidence** tab in the app, and [`docs/exercise-catalog.md`](docs/exercise-catalog.md), list the exercises
from each published system and the studies behind them.

## What gets measured

- **Repetitions and time** for every activity.
- **Pitch and roll range**: the smallest and largest angle reached, relative to the calibrated rest position.
- **Speed peaks per repetition**: angular speed is resampled to 20 Hz and smoothed, and prominent peaks are counted.
  A smooth out-and-back movement has about two; jerky, corrected movements have more. This is a simplified
  version of the idea behind mRehab's normalized jerk score.
- **Activity results**: best lift, spills, codes opened, wall bumps, sorting accuracy and decision time, longest pattern.

Sessions are saved in the computer browser's local storage only. **Copy summary for my therapist** on the
Session log tab copies a plain-text summary. Mouse-mode sessions are labelled so they're never mistaken for patient data.

## How it works

The whole app is static files, which is why it can run on GitHub Pages.

- `index.html` is the computer app. On load it registers a 6-digit code (`mend-rehab-<code>`) with the free
  [PeerJS](https://peerjs.com) broker and shows it as a QR code.
- `phone.html` is the controller. It reads the phone's orientation (`deviceorientation`, which phones only
  allow on https pages) and connects to the computer by that code.
- The two talk peer-to-peer over a WebRTC data channel. When a network blocks direct connections, PeerJS falls back
  to its public TURN relay, so phone and computer can be on different networks.

Messages are small JSON objects:

- phone → computer: `{type:"m", b, g, a, mag}` (orientation in degrees, about 25 per second), `{type:"recenter"}`
- computer → phone: `{type:"status", task, title, text, tone}`, `{type:"haptic", pattern}`, `{type:"calibrated"}`, `{type:"replaced"}`

### Privacy note

Only orientation angles travel between the devices; nothing identifies the person. The PeerJS broker sees the
pairing code, and the public TURN relay may carry the angle stream on restrictive networks. A real clinical
version should run its own broker and TURN server and store sessions in a HIPAA-eligible backend.

## Develop

Any static server works for the computer page:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

The phone page needs https to read motion sensors, so test phone control on the deployed site, or put a tunnel
in front of the local server (for example `cloudflared tunnel --url http://localhost:8000`).

To add an activity, add an entry to `ACTIVITIES` in `index.html` and a factory function returning an object
with `update(dt, angles)`, `draw(ctx, W, H, angles, t)`, `status()`, `stats()`, plus `_reps`, `done` and an
`events` array (`"success"`, `"error"`, `"big"`), which the engine turns into sounds and phone vibrations.
`angles` is `{pitch, roll}` in degrees from the calibrated rest position.

## Test

```bash
python3 -m pip install playwright && python3 -m playwright install chromium
python3 tests/smoke_test.py                          # serves this folder locally
python3 tests/smoke_test.py --site https://<user>.github.io/<repo>/
```

The test pairs a simulated phone, plays a phone-controlled session, then plays all six activities to completion.

## Known limits

- iPhones don't vibrate from web pages, so haptic feedback works on Android only.
- Large rotations past about 80° from flat can wrap; activities keep targets within 45°.
- Nothing here is clinically validated. Talk to the care team before using it with a patient.

## Credits

- [PeerJS](https://github.com/peers/peerjs) 1.5.4, MIT license (`vendor/peerjs.LICENSE`)
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4 by Kazuhiko Arase, MIT license (header of `vendor/qrcode.js`)
- Fonts: Bricolage Grotesque, Atkinson Hyperlegible and IBM Plex Mono via Google Fonts

Mend's own code is MIT licensed; see `LICENSE`.
