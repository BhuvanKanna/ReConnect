# CLAUDE.md: publish Mend to GitHub Pages

This folder is a finished static web app (Mend, a phone-controlled stroke rehab prototype).
Your job is to put it in a GitHub repository and turn on GitHub Pages so it runs at
`https://<owner>.github.io/<repo>/`. No build step is needed: the files are served as they are.

Do not rewrite or "improve" the app code. Only change files if a check below fails, and say what you changed.

## What's here

| Path | Purpose |
| --- | --- |
| `index.html` | The computer app: activity library, QR pairing panel, six motion games, session log, evidence library |
| `phone.html` | The phone controller page the QR code opens |
| `vendor/peerjs.min.js` | PeerJS 1.5.4 (MIT), pairs phone and computer peer-to-peer over WebRTC |
| `vendor/qrcode.js` | qrcode-generator 1.4.4 by Kazuhiko Arase (MIT), draws the QR code |
| `vendor/peerjs.LICENSE` | PeerJS license text |
| `.nojekyll` | Tells GitHub Pages to serve files as-is (keep it) |
| `tests/smoke_test.py` | Headless end-to-end test (Playwright) |
| `docs/exercise-catalog.md` | Exercises from published rehab systems, with sources |
| `README.md`, `LICENSE`, `.gitignore` | Repo docs |

## Steps

### 1. Ask the user before touching GitHub

Ask, in one message:
- their GitHub username, and
- the repo name to use (suggest `mend-rehab`), and whether it already exists.

Free GitHub Pages requires a **public** repo. Tell the user the repo will be public and get a yes.
If they name an existing repo that already has files, stop and ask whether to use a different name or
put this in a subfolder. Never overwrite or force-push someone's existing history.

### 2. Check the tools

```bash
git --version
gh --version && gh auth status
```

If `gh` is missing, tell the user to install it (macOS: `brew install gh`; Windows: `winget install GitHub.cli`).
If it's not logged in, ask the user to run `gh auth login` themselves (it opens a browser), then continue.
If `gh` can't be used at all, fall back to having the user create the empty public repo on github.com,
then add it as `origin` and push with plain git.

### 3. Commit

From this folder:

```bash
git init -b main
git add -A
git commit -m "Mend: phone-controlled stroke rehab prototype"
```

If git has no identity configured, ask the user for the name and email to use rather than inventing one.

### 4. Create the repo and push

New repo:

```bash
gh repo create <owner>/<repo> --public --source=. --remote=origin --push --description "Phone-controlled stroke rehab activities: pair a phone by QR code and play with motion controls"
```

Existing empty repo:

```bash
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

### 5. Turn on GitHub Pages (main branch, root folder)

```bash
gh api -X POST repos/<owner>/<repo>/pages -f "source[branch]=main" -f "source[path]=/"
```

If that returns 409 (Pages already on), update it instead:

```bash
gh api -X PUT repos/<owner>/<repo>/pages -f "source[branch]=main" -f "source[path]=/"
```

### 6. Wait for the first deploy

Poll every 15 seconds, for up to about 5 minutes:

```bash
gh api repos/<owner>/<repo>/pages/builds/latest --jq .status
```

Continue when it says `built`. If it says `errored`, show the user the error from
`gh api repos/<owner>/<repo>/pages/builds/latest` and stop.

The site URL is `https://<owner-lowercase>.github.io/<repo>/`.
You can confirm it with `gh api repos/<owner>/<repo>/pages --jq .html_url`.

### 7. Verify it's live

Each of these should return HTTP 200 (the first request can take a minute after the build finishes):

```bash
curl -sI https://<owner>.github.io/<repo>/ | head -1
curl -sI https://<owner>.github.io/<repo>/phone.html | head -1
curl -sI https://<owner>.github.io/<repo>/vendor/peerjs.min.js | head -1
```

Optional but recommended: run the end-to-end test against the live site. It pairs a simulated phone
through the public PeerJS service and plays all six activities (about 5 minutes):

```bash
python3 -m pip install playwright && python3 -m playwright install chromium
python3 tests/smoke_test.py --site https://<owner>.github.io/<repo>/
```

It prints PASS/FAIL per check and exits 0 when everything passes. If pairing fails here but the
pages load, the network may block WebRTC or `0.peerjs.com`; report that to the user rather than
changing the code.

### 8. Put the live link in the README

In `README.md`, replace the line `**Live site:** _not deployed yet_` with
`**Live site:** https://<owner>.github.io/<repo>/`, then:

```bash
git commit -am "Add live site link" && git push
```

### 9. Tell the user

Give them the URL and these steps:

1. Open the URL on the computer.
2. Scan the QR code with the phone camera. The page opens; tap **Start motion** (iPhone asks to allow motion; tap **Allow**).
3. Pick an activity on the computer and press **Start with phone**.

The phone and computer don't need to be on the same Wi-Fi; both just need internet.

## Rules

- Don't change app files unless a check fails; never force-push; never commit tokens or credentials.
- Keep `.nojekyll` and the `vendor/` files: the app loads them by relative path.
- If anything needs a decision (repo name clash, private repo, failed build), ask the user instead of guessing.
