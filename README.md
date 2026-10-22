# ReConnect

Home stroke rehab with a provider plan. A therapist assigns a 30-day plan of exercises; the patient opens
ReConnect on a computer, sees **today's goals** at the top, does them (using their phone as a motion controller
or tap pad), and can practise anything else in the library as bonus work. The provider sees what was assigned,
what was done, and what was extra.

**Live site:** https://bhuvankanna.github.io/ReConnect/

Built as a prototype for the Sling Health neuroscience team at UT Austin. Not a medical device.

## Demo mode

This version is one website that contains both sides, so you can try the whole loop on one computer. Switch
with **Demo: Patient | Provider** at the top. Everything is saved in this browser only.

- **Provider:** pick a patient (or add one), set a start date, and build the 30-day plan: choose a day, add
  exercises with their level and reps or time, mark rest days, and **Copy week 1 to all weeks**. Standing
  exercises (Sit to Stand, Balance Hold) stay locked until you turn them on for that patient. The **Progress** tab
  shows days done, extra sessions, a 30-day adherence strip and every session tagged Assigned, Extra or Before plan,
  with **Export CSV** and **Print report**.
- **Patient:** the Today bar shows today's assigned exercises and starts the next one with the provider's settings.
  When they're all done it says so, and anything played after that counts as bonus practice.
- The demo starts with three patients (Ruth is 11 days into a plan, James is behind, Mei has no plan yet).
  **Reset demo data** in the provider sidebar puts them back.

Real provider and patient accounts, a server and remote reports are the next step; the data model (patients,
plans, sessions tagged with `patientId` and `assigned`) is built so that move doesn't mean starting over.

## Use it with a phone

1. Open the site on a computer (Chrome, Edge, Safari or Firefox).
2. Tap the phone button at the top right and scan the QR code. On the phone, tap **Start motion**; on iPhone, tap **Allow**.
3. Pick an exercise and press **Start with phone**. Motion exercises calibrate for 3 seconds first; finger and
   guided exercises turn the phone into a tap pad (a keypad, four finger lanes, or a big Done button).

No phone? Tick **Use the mouse instead of a phone** in the same panel: the pointer stands in for the tilt of the
hand, holding the mouse button stands in for a push, and touch exercises work with the mouse or a touchscreen.

## The 63 exercises

| Section | Exercises |
| --- | --- |
| Arm & shoulder (8) | Lantern Lift, Side Raise, Reach Targets, Cup to Mouth, Push Away, Table Slide, Bowl Lift, Trace It |
| Wrist & forearm (6) | Pour the Tea, Combination Lock, Tilt Maze, Wrist Bend, Wrist Wiper, Steady Cup |
| Hand & fingers (12) | Finger Tap, Finger Rhythm, Dial a Number, Pinch & Place; guided Grip & Release, Putty Squeeze, Finger Curls, Thumb Touches, Clothespins, Coins, Buttons, Knife & Fork |
| Trunk & legs (7) | Lean & Shift, Trunk Twist, Sit to Stand, Balance Hold, Seated March, Heel Raises, Ankle Pumps |
| Therapy sessions (2) | Mirror Therapy, Mental Practice |
| Visual scanning (3) | Cancel It, Look Left Search, Find the Middle |
| Attention (5) | Quick Catch, Go / No-Go, Night Watch, Two at Once, Trail Connect |
| Memory (7) | Memory Moves, Card Pairs, N-Back, Number Span, Word Recall, Shopping List, Names & Faces |
| Reasoning (8) | Sort It, Tower Puzzle, Errand Planner, What Comes Next, Turn the Shape, Make Change, Tell the Time, Rule Switch |
| Language (5) | Name It, Word to Picture, Word Web, Finish the Sentence, Spell It |

Every exercise has three levels and an assignable amount (reps, rounds or time). **About these exercises** in the
app, and [`docs/exercise-catalog.md`](docs/exercise-catalog.md), list the programs and studies each one comes from.

## What gets measured

- **Every session:** reps or rounds, time, the settings it was played at, and whether it filled an assigned item.
- **Motion:** pitch and roll range from the calibrated rest position, and speed peaks per repetition (a simplified
  version of mRehab's smoothness score). Exercise-specific results such as best lift, sway, taps per second.
- **Brain exercises:** accuracy, reaction or decision time, and task-specific results (missed on the left vs right
  for scanning, longest span, rule changes found, hints used).

## How it works

The whole app is static files, which is why it can run on GitHub Pages.

- `index.html` is the shell; `css/app.css` the theme; `js/` the app, loaded as plain scripts sharing a `window.RC`
  namespace. `js/plan.js` (plan rules) and `js/data.js` (storage and demo seed) are pure and unit-tested in Node.
  Each library section is one file in `js/games/`; shared building blocks (rep counter, tilt cursor, answer cards,
  keypad, guided session) are in `js/kit.js`.
- The computer registers a 6-digit code (`mend-rehab-<code>`) with the free [PeerJS](https://peerjs.com) broker and
  shows it as a QR code. `phone.html` connects by that code and the two talk over a WebRTC data channel.
- If a relay is configured (`js/config.js`, see [`relay/README.md`](relay/README.md)), the computer also registers
  the code with it, and the phone tries it first. The relay is a small Cloudflare Worker that passes the same
  messages over WebSockets, so pairing works across any two networks (mobile data, school or clinic Wi-Fi). If
  the relay can't be reached, the phone falls back to the direct PeerJS link.

Messages are small JSON objects:

- phone → computer: `{type:"m", b, g, a, mag, lin}` (tilt, heading, acceleration), `{type:"tap", key}`, `{type:"hb"}` every 2 s, `{type:"bye"}`, `{type:"recenter"}`
- computer → phone: `{type:"status", …}`, `{type:"pad", layout, labels}`, `{type:"haptic", pattern}`, `{type:"calibrated"}`, `{type:"replaced"}`

The computer treats 6 seconds without a message as a disconnect. A pad exercise then keeps going with on-screen keys.

### Privacy note

Only angles and taps travel between the devices; nothing identifies the person. The PeerJS broker sees the
pairing code; so does the relay, if you use one (it only forwards messages and stores nothing). A real clinical version should run its own broker and TURN server and store data in a
HIPAA-eligible backend.

## Develop and test

```bash
python3 -m http.server 8000            # then open http://localhost:8000
node --test "tests/*.test.js"          # plan, storage and rep-counter unit tests
python3 -m pip install playwright && python3 -m playwright install chromium
python3 tests/smoke_test.py            # end to end: pairing, phone pad, all games, Today flow, provider, every exercise
python3 tests/smoke_test.py --families memory,language   # just some exercise groups
python3 tests/smoke_test.py --site https://<user>.github.io/<repo>/
(cd relay && npm install && npx wrangler dev)                          # local relay on :8787
python3 tests/smoke_test.py --relay http://127.0.0.1:8787 --relay-only  # pair only through the relay
```

The phone page needs https to read motion sensors, so test phone control on the deployed site or through a tunnel.

## Known limits

- **Pairing across networks:** without the relay, the direct link usually only works when the phone and computer
  share a network. Deploy the relay ([`relay/README.md`](relay/README.md)) and set its address in `js/config.js`.
- iPhones don't vibrate from web pages, so haptic feedback works on Android only.
- Pictures in the language exercises use the device's emoji font, so they look different on different systems.
- Nothing here is clinically validated. Talk to the care team before using it with a patient.

## Credits

- [PeerJS](https://github.com/peers/peerjs) 1.5.4, MIT license (`vendor/peerjs.LICENSE`)
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4 by Kazuhiko Arase, MIT license (header of `vendor/qrcode.js`)
- Font: Atkinson Hyperlegible (Braille Institute) via Google Fonts

ReConnect's own code is MIT licensed; see `LICENSE`.
