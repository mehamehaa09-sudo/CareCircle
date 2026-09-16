# CareCircle Backend API

## Install

From the repository root, install the Python dependencies:

```bash
pip install -r backend/requirements.txt
```

## Run

Start the local API from the repository root:

```bash
python backend/api.py
```

The server runs on `http://localhost:5000` with debug mode enabled.

## Endpoints

### `POST /api/checkin`

Accepts a JSON body containing:

```json
{
  "user_id": "elder_lakshmi",
  "bp_systolic": 145,
  "bp_diastolic": 90,
  "mood": "tired",
  "meds_taken": false
}
```

The check-in is saved and passed through the alert pipeline. The response is:

```json
{
  "alert_triggered": true,
  "report": "..."
}
```

When no alert is triggered, `alert_triggered` is `false` and `report` is `null`.

### `GET /api/alerts/<user_id>`

Returns an array of all saved alerts for the requested user, newest first.