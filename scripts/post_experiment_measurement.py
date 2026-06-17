"""Einfacher Python-Client für die Live-Versuch Import API.

Voraussetzung:
    pip install requests

Diese Datei ist als Modul gedacht. Ein anderes Script kann zum Beispiel
post_measurement(value_mv=742, measured_at=current_time_utc()) aufrufen.
"""

import os
from datetime import datetime, timezone

import requests


DEFAULT_API_URL = "https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement"


def current_time_utc():
    """Gibt die aktuelle Zeit als ISO-Zeitstempel in UTC zurück."""
    return datetime.now(timezone.utc).isoformat()


def post_measurement(
    value_mv,
    measured_at,
    dry_run=True,
    device_id=None,
    token=None,
    api_url=None,
):
    """Sendet einen Messwert an die Import API.

    Args:
        value_mv: Gemessene Spannung in Millivolt, zum Beispiel 742.
        measured_at: Messzeitpunkt als ISO-Zeitstempel, zum Beispiel
            "2026-06-17T12:30:00+00:00".
        dry_run: True prüft nur den Request. False speichert den Messwert.
        device_id: Optionale Gerätekennung. Standard ist EXPERIMENT_DEVICE_ID
            oder "hauptversuch".
        token: Optionaler Import-Token. Standard ist EXPERIMENT_IMPORT_TOKEN.
        api_url: Optionale API-URL. Standard ist EXPERIMENT_API_URL oder die
            Produktiv-URL.

    Returns:
        Die JSON-Antwort der API als Python-Dict.
    """
    token = token or os.getenv("EXPERIMENT_IMPORT_TOKEN")

    if not token:
        raise RuntimeError("Bitte EXPERIMENT_IMPORT_TOKEN setzen.")

    payload = {
        "valueMv": value_mv,
        "measuredAt": measured_at,
        "deviceId": device_id or os.getenv("EXPERIMENT_DEVICE_ID", "hauptversuch"),
        "dryRun": dry_run,
    }

    response = requests.post(
        api_url or os.getenv("EXPERIMENT_API_URL", DEFAULT_API_URL),
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()
