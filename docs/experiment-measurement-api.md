# Live-Versuch Import API

Diese Schnittstelle nimmt Spannungswerte des separaten großen Versuchsaufbaus
entgegen. Die Daten werden in Firestore in der Collection
`experimentMeasurements` gespeichert und auf der Projektseite im Live-Diagramm
angezeigt.

Die API ist nicht für Messwerte einzelner Nutzer-Brennstoffzellen gedacht.

## Endpoint

- Methode: `POST`
- Pfad: `/api/experiment-measurement`
- Produktiv-URL: `https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement`
- Content-Type: `application/json`
- CORS: erlaubt externe Aufrufe

Andere HTTP-Methoden werden mit `405 method_not_allowed` abgelehnt.

## Authentifizierung

Jeder Request braucht den Import-Token aus dem Firebase Secret
`EXPERIMENT_IMPORT_TOKEN`.

Empfohlener Header:

```text
Authorization: Bearer <EXPERIMENT_IMPORT_TOKEN>
```

Alternativer Header:

```text
X-Experiment-Import-Token: <EXPERIMENT_IMPORT_TOKEN>
```

Der Token wird nur aus den Headern gelesen. Ein Token im JSON-Body wird nicht
akzeptiert.

Das Secret wird vor dem Deploy gesetzt:

```bash
firebase functions:secrets:set EXPERIMENT_IMPORT_TOKEN
```

## Request Body

Beispiel:

```json
{
  "valueMv": 742,
  "measuredAt": "2026-06-17T12:30:00.000Z",
  "deviceId": "hauptversuch",
  "measurementId": "hauptversuch-2026-06-17T12:30:00.000Z",
  "dryRun": false
}
```

### Felder

| Feld | Pflicht | Typ | Bedingung | Bedeutung |
| --- | --- | --- | --- | --- |
| `valueMv` | Ja | Zahl | Muss eine endliche Zahl sein. Es gibt keinen fachlichen Minimal- oder Maximalwert. | Spannung in Millivolt. |
| `measuredAt` | Ja | String | Muss von JavaScript als gültiger Zeitstempel gelesen werden können. Empfohlen ist ISO 8601, zum Beispiel `2026-06-17T12:30:00.000Z`. | Messzeitpunkt. |
| `deviceId` | Nein | String | Standard ist `hauptversuch`. Nach dem Trimmen darf der Wert nicht leer sein und maximal 80 Zeichen lang sein. | Kennung des Messaufbaus oder Messgeräts. |
| `measurementId` | Nein | String | Darf nach dem Trimmen nicht leer sein, nicht `.` und nicht `..`. IDs mit `/`, mehr als 240 Zeichen oder Firestore-reservierte IDs wie `__name__` werden deterministisch in eine sichere ID umgewandelt. | Optionale stabile Dokument-ID. |
| `dryRun` | Nein | Boolean | Nur der JSON-Wert `true` aktiviert den Testmodus. Strings wie `"true"` gelten nicht als `true`. | Prüft Authentifizierung und Payload, schreibt aber nicht in Firestore. |

## Normalisierung und Speicherung

`valueMv` wird mit `Number(...)` in eine Zahl umgewandelt. Werte wie `"742"`
sind dadurch gültig, solange das Ergebnis eine endliche Zahl ist. `NaN`,
`Infinity`, leere Werte und nicht numerische Texte werden abgelehnt.

`measuredAt` wird als Firestore Timestamp gespeichert. In Antworten gibt die API
den Wert als ISO-Zeitstempel zurück.

`deviceId` wird getrimmt. Wenn das Feld fehlt, `null` ist oder ein leerer String
ist, nutzt die API `hauptversuch`. Ein String, der nur aus Leerzeichen besteht,
wird nach dem Trimmen leer und deshalb abgelehnt.

Wenn `measurementId` fehlt, erzeugt die API automatisch eine stabile ID aus:

```text
deviceId + "|" + measuredAt.toISOString()
```

Die erzeugte ID hat das Format:

```text
measurement-<32-zeichen-sha256-hash>
```

Wenn eine eigene `measurementId` gesendet wird und Firestore sie nicht direkt als
Dokument-ID nutzen sollte, erzeugt die API daraus deterministisch:

```text
custom-<32-zeichen-sha256-hash>
```

## Idempotenz

Die API ist idempotent, solange derselbe Messwert mit derselben ID erneut
gesendet wird.

Empfohlener Standardfall:

1. Das Script misst einen Wert.
2. Das Script erzeugt einmalig `measuredAt`.
3. Das Script sendet `valueMv`, `measuredAt` und optional `deviceId`.
4. Falls ein Timeout oder Netzwerkfehler passiert, wiederholt das Script exakt
   denselben Payload.

Ohne eigene `measurementId` entsteht bei gleicher `deviceId` und gleichem
`measuredAt` dieselbe Dokument-ID. Dadurch erzeugen Wiederholungen keine
doppelten Messwerte.

Wenn eine ID bereits existiert und die gespeicherten Daten identisch sind,
antwortet die API mit `200` und `status: "existing"`.

Wenn eine ID bereits existiert, aber `valueMv`, `deviceId` oder `measuredAt`
abweichen, antwortet die API mit `409 measurement_conflict`.

## Erfolgreiche Antworten

Neuer Messwert:

```http
201 Created
```

```json
{
  "id": "measurement-abc123",
  "valueMv": 742,
  "measuredAt": "2026-06-17T12:30:00.000Z",
  "deviceId": "hauptversuch",
  "status": "created"
}
```

Bereits vorhandener identischer Messwert:

```http
200 OK
```

```json
{
  "id": "measurement-abc123",
  "valueMv": 742,
  "measuredAt": "2026-06-17T12:30:00.000Z",
  "deviceId": "hauptversuch",
  "status": "existing"
}
```

Testaufruf ohne Speicherung:

```http
200 OK
```

```json
{
  "id": "measurement-abc123",
  "valueMv": 742,
  "measuredAt": "2026-06-17T12:30:00.000Z",
  "deviceId": "hauptversuch",
  "status": "dry_run"
}
```

## Fehlerantworten

Fehler haben immer diese Form:

```json
{
  "code": "unauthorized",
  "error": "Unauthorized."
}
```

| HTTP-Status | Code | Ursache |
| --- | --- | --- |
| `400` | `invalid_value` | `valueMv` fehlt oder ist keine endliche Zahl. |
| `400` | `missing_measured_at` | `measuredAt` fehlt. |
| `400` | `invalid_timestamp` | `measuredAt` kann nicht als Zeitstempel gelesen werden. |
| `400` | `invalid_device_id` | `deviceId` ist nach dem Trimmen leer oder länger als 80 Zeichen. |
| `400` | `invalid_measurement_id` | `measurementId` ist leer, `.` oder `..`. |
| `401` | `unauthorized` | Token fehlt oder ist falsch. |
| `405` | `method_not_allowed` | Es wurde nicht `POST` verwendet. |
| `409` | `measurement_conflict` | Dieselbe Dokument-ID existiert bereits mit anderen Daten. |
| `500` | `server_error` | Der Messwert konnte serverseitig nicht gespeichert werden. |

## cURL-Beispiele

Testmodus ohne Speicherung:

```bash
curl -X POST "https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EXPERIMENT_IMPORT_TOKEN" \
  -d '{
    "valueMv": 742,
    "measuredAt": "2026-06-17T12:30:00.000Z",
    "deviceId": "hauptversuch",
    "dryRun": true
  }'
```

Echter Import:

```bash
curl -X POST "https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EXPERIMENT_IMPORT_TOKEN" \
  -d '{
    "valueMv": 742,
    "measuredAt": "2026-06-17T12:30:00.000Z",
    "deviceId": "hauptversuch"
  }'
```

## Testaufruf per npm

Im Projekt gibt es ein kleines Testscript:

```bash
EXPERIMENT_IMPORT_TOKEN="<EXPERIMENT_IMPORT_TOKEN>" npm run test:api:experiment
```

Standardmäßig sendet das Script `dryRun: true` an die Produktiv-URL und schreibt
nichts in Firestore.

Echter Schreibtest:

```bash
EXPERIMENT_IMPORT_TOKEN="<EXPERIMENT_IMPORT_TOKEN>" \
EXPERIMENT_TEST_DRY_RUN=false \
npm run test:api:experiment
```

Optionale Umgebungsvariablen:

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `EXPERIMENT_API_URL` | Produktiv-URL | Ziel-URL der API. |
| `EXPERIMENT_TEST_VALUE_MV` | `742` | Testwert in Millivolt. |
| `EXPERIMENT_TEST_DEVICE_ID` | `hauptversuch` | `deviceId` für den Test. |
| `EXPERIMENT_TEST_MEASURED_AT` | aktuelle Zeit | Messzeitpunkt für den Test. |
| `EXPERIMENT_TEST_DRY_RUN` | `true` | Mit `false` wird wirklich gespeichert. |

## Python-Beispiel

Das Beispiel sendet einen Messwert an die API. Es erzeugt den Zeitstempel einmal
und wiederholt bei temporären Fehlern denselben Payload. Dadurch bleibt der
Import idempotent.

Voraussetzung:

```bash
pip install requests
```

Script:

```python
import os
import sys
import time
from datetime import datetime, timezone

import requests


API_URL = os.getenv(
    "EXPERIMENT_API_URL",
    "https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement",
)
TOKEN = os.getenv("EXPERIMENT_IMPORT_TOKEN")
DEVICE_ID = os.getenv("EXPERIMENT_DEVICE_ID", "hauptversuch")
DRY_RUN = os.getenv("EXPERIMENT_DRY_RUN", "true").lower() != "false"


def now_iso_utc():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def build_payload(value_mv):
    return {
        "valueMv": value_mv,
        "measuredAt": now_iso_utc(),
        "deviceId": DEVICE_ID,
        "dryRun": DRY_RUN,
    }


def send_measurement(payload, attempts=3):
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }

    last_error = None

    for attempt in range(1, attempts + 1):
        try:
            response = requests.post(
                API_URL,
                json=payload,
                headers=headers,
                timeout=10,
            )

            if response.status_code < 500:
                response.raise_for_status()
                return response.json()

            last_error = RuntimeError(f"Serverfehler {response.status_code}: {response.text}")
        except requests.RequestException as error:
            last_error = error

        if attempt < attempts:
            time.sleep(2)

    raise last_error


def main():
    if not TOKEN:
        raise SystemExit("Bitte EXPERIMENT_IMPORT_TOKEN setzen.")

    if len(sys.argv) < 2:
        raise SystemExit("Aufruf: python import_experiment_measurement.py <valueMv>")

    value_mv = float(sys.argv[1])
    payload = build_payload(value_mv)
    result = send_measurement(payload)

    print(result)


if __name__ == "__main__":
    main()
```

Aufruf im Testmodus:

```bash
EXPERIMENT_IMPORT_TOKEN="<EXPERIMENT_IMPORT_TOKEN>" \
python import_experiment_measurement.py 742
```

Echter Import:

```bash
EXPERIMENT_IMPORT_TOKEN="<EXPERIMENT_IMPORT_TOKEN>" \
EXPERIMENT_DRY_RUN=false \
python import_experiment_measurement.py 742
```

Für einen Arduino-Aufbau sollte das Script den gemessenen Spannungswert in
Millivolt an `build_payload(...)` übergeben. Wichtig ist: Bei einem Retry nicht
neu messen und keinen neuen Zeitstempel erzeugen, sondern denselben Payload
erneut senden.
