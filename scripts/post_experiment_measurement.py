"""Einfacher Beispiel-Client für die Live-Versuch Import API.

Voraussetzung:
    pip install requests

Der Token wird aus der Umgebungsvariable EXPERIMENT_IMPORT_TOKEN gelesen.
"""

import os
import sys
from datetime import datetime, timezone

import requests


API_URL = os.getenv(
    "EXPERIMENT_API_URL",
    "https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement",
)
TOKEN = os.getenv("EXPERIMENT_IMPORT_TOKEN")
DEVICE_ID = os.getenv("EXPERIMENT_DEVICE_ID", "hauptversuch")


def current_time_utc():
    """Gibt die aktuelle Zeit als ISO-Zeitstempel in UTC zurück."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def post_measurement(value_mv, measured_at, dry_run=True):
    """Sendet einen Messwert an die Import API.

    Args:
        value_mv: Gemessene Spannung in Millivolt, zum Beispiel 742.
        measured_at: Messzeitpunkt als ISO-Zeitstempel, zum Beispiel
            "2026-06-17T12:30:00.000Z".
        dry_run: True prüft nur den Request. False speichert den Messwert.

    Returns:
        Die JSON-Antwort der API als Python-Dict.
    """
    if not TOKEN:
        raise RuntimeError("Bitte EXPERIMENT_IMPORT_TOKEN setzen.")

    payload = {
        "valueMv": value_mv,
        "measuredAt": measured_at,
        "deviceId": DEVICE_ID,
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


def main():
    if len(sys.argv) < 2:
        raise SystemExit(
            "Aufruf: python scripts/post_experiment_measurement.py <valueMv> [measuredAt]",
        )

    value_mv = float(sys.argv[1])

    # Wenn kein Zeitstempel übergeben wird, nimmt das Script die aktuelle UTC-Zeit.
    measured_at = sys.argv[2] if len(sys.argv) >= 3 else current_time_utc()

    # Standardmäßig ist dryRun aktiv. Für echte Imports EXPERIMENT_DRY_RUN=false setzen.
    dry_run = os.getenv("EXPERIMENT_DRY_RUN", "true").lower() != "false"

    print(post_measurement(value_mv, measured_at, dry_run=dry_run))


if __name__ == "__main__":
    main()
