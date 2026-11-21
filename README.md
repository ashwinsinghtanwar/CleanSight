# CleanSight — Civic Intelligence (Garbage + Waterlogging)

React/Vite + FastAPI + SQLite + two YOLO models. Sidebar UI: Overview · Report an Issue · Detection Results · Live Map · Municipal Dashboard · Analytics · Report History · Settings.

## Run (Windows, cmd)
Needs **Python 3.9–3.13** (tick "Add to PATH") and **Node.js LTS**.

```bat
scripts\setup.bat      :: once  (venv, packages, .env, model check)
scripts\run.bat        :: every time (starts API + website, opens the browser)
```
Website http://localhost:5173 · API docs http://127.0.0.1:8000/docs · Health http://127.0.0.1:8000/api/health

## Accounts
* **Citizen** – reports issues, sees the live map and their own history.
* **Municipal staff** – additionally gets the **Municipal Dashboard** and **Analytics**, can verify / assign / resolve / delete reports.
* The **first account** you create on a fresh install is automatically staff. Other staff accounts are created by choosing *Municipal staff* on the Create-account screen and entering the access code (default `CLEANSIGHT-STAFF`, change `MUNICIPAL_ACCESS_CODE` in `backend\.env`).
* Promote an existing account: `scripts\make_admin.bat email@example.com`.

## Workflow
Citizen picks **Waterlogging** or **Land Garbage**, uploads a photo, sets the location (GPS button or tap the map) → AI detects → report `CS-YYYYMMDD-XXXXXXXX` is saved as **Reported**.
Staff move it: Reported → Verified → Assigned → In Progress → **Resolved**.
**Resolved issues disappear from the live map** (tick *Show resolved* to see them in grey). Map pins refresh every 20 s. Staff can also press *Mark resolved* directly in a map pop-up.
Report History / Dashboard have **Export CSV**.

Map pins: **shape = complaint type, colour = severity**
* shape: **water-drop = waterlogging**, **rounded square with a bin = land garbage**
* colour: **green = Low**, **amber = Medium**, **red = High**, slate = no detection, light grey = resolved
The Live Map has Type and Severity filters with counts.

## AI models (`backend/ai_models/`)
| Type | File | Notes |
|---|---|---|
| Land garbage | `garbage.pt` | **YOLO11m**, one class "garbage" (municipal waste imagery, val mAP50 0.77), 640 px |
| Waterlogging | `waterlogging.pt` | YOLO26n (only its *waterlogging* class is used), **512 px + test-time augmentation** |

**Both models only report detections with ≥ 40 % confidence** (the floor can be raised in `backend\.env`, never lowered).

Severity = share of the photo covered by detection boxes. Garbage: ≤20 % Low, ≤50 % Medium, >50 % High (this model boxes whole heaps). Waterlogging: ≤10 % Low, ≤30 % Medium, >30 % High. No detection → "No detection" (staff verify manually).

What was measured (see caveats):
* Waterlogging, 500 held-out images, conf ≥ 0.40: flagged 192/240 flooded scenes (80 %), 0 false alarms in 260 clean ones; 45/60 on a separate stagnant-water set. (At 0.30 recall would be 91 %.)
* Garbage: on 38 real litter photos it found garbage in 35 at conf ≥ 0.40 (your previous 8-class model: 13). It **can give false alarms on non-garbage scenes** — about 5 of 28 clean road photos at 0.40, 2 of 28 at 0.60. If you see too many, set `GARBAGE_CONF=0.50` in `backend\.env`; staff can also reject by checking reports (Verified step).
* The waterlogging test images come from the same dataset family the model was trained on; the garbage sample photos were not a labelled benchmark. Expect real-world results to differ.

## Config (`backend\.env`, created by setup)
`SECRET_KEY` (auto-generated), `GARBAGE_CONF`, `WATERLOGGING_CONF` (minimum 0.40), `MUNICIPAL_ACCESS_CODE`.

## Troubleshooting
* Overview shows *Loading model…* for a few seconds after start – normal.
* *Model unavailable* → run `scripts\setup.bat` again; it prints which model failed.
* Map tiles and address look-up need internet. Without it you can still tap the map and type the address.
* Port busy → close old "CleanSight API/Web" windows.
