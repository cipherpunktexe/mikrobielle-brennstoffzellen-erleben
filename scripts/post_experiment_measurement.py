"""Einfacher Python-Client für die Live-Versuch Import API.

Voraussetzung:
    pip install requests

Vor der Nutzung muss der Import-Token als Umgebungsvariable gesetzt werden:
    export EXPERIMENT_IMPORT_TOKEN="dein-token"

Diese Datei ist als Modul gedacht. Ein anderes Script kann zum Beispiel
post_measurement(value_mv=742, measured_at=current_time_utc()) aufrufen.
"""

import os
from datetime import datetime, timezone

import requests


API_URL = os.getenv(
    "EXPERIMENT_API_URL",
    "https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement",
)
TOKEN = os.getenv("EXPERIMENT_IMPORT_TOKEN")


def current_time_utc():
    """Gibt die aktuelle Zeit als ISO-Zeitstempel in UTC zurück."""
    return datetime.now(timezone.utc).isoformat()


def post_measurement(
    value_mv,
    measured_at,
    dry_run=True,
):
    """Sendet einen Messwert an die Import API.

    Args:
        value_mv: Gemessene Spannung in Millivolt, zum Beispiel 742.
        measured_at: Messzeitpunkt als ISO-Zeitstempel, zum Beispiel
            "2026-06-17T12:30:00+00:00".
        dry_run: True prüft nur den Request. False speichert den Messwert.

    Returns:
        Die JSON-Antwort der API als Python-Dict.
    """
    if not TOKEN:
        raise RuntimeError("Bitte EXPERIMENT_IMPORT_TOKEN setzen.")

    payload = {
        "valueMv": value_mv,
        "measuredAt": measured_at,
        "dryRun": dry_run,
    }

    response = requests.post(
        API_URL,
        json=payload,
        headers={"Authorization": f"Bearer {TOKEN}"},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()
