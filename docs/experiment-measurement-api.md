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
  "dryRun": false
}
```

### Felder

`valueMv`
Der Wert ist die gemessene Spannung in Millivolt. Er muss eine endliche Zahl
sein, zum Beispiel `742` oder `742.5`. Nicht gültig sind zum Beispiel leere
Werte, Texte, `NaN` oder `Infinity`.

`measuredAt`
Der Wert beschreibt, wann gemessen wurde. Empfohlen ist ein ISO-Zeitstempel in
UTC:

```json
"2026-06-17T12:30:00+00:00"
```

`dryRun` (optional)
Mit dem JSON-Wert `true` prüft die API Authentifizierung
und Payload, schreibt aber keinen Messwert in Firestore. Strings wie `"true"`
aktivieren den Testmodus nicht.

`deviceId` und `measurementId` werden nicht akzeptiert. Die API ist für genau
einen Versuchsaufbau gedacht und erzeugt die Dokument-ID selbst aus `measuredAt`.
Dadurch bleibt die Schnittstelle einfacher und Idempotenz funktioniert ohne
zusätzliches Feld.


Die API erzeugt automatisch eine stabile ID aus:

```text
measuredAt.toISOString()
```

Die erzeugte ID hat das Format:

```text
measurement-<32-zeichen-sha256-hash>
```

## Idempotenz

Die API ist idempotent, solange derselbe Messwert mit demselben `measuredAt`
erneut gesendet wird.

Empfohlener Standardfall:

1. Das Script misst einen Wert.
2. Das Script erzeugt einmalig `measuredAt`.
3. Das Script sendet `valueMv` und `measuredAt`.
4. Falls ein Timeout oder Netzwerkfehler passiert, wiederholt das Script exakt
   denselben Payload.

Bei gleichem `measuredAt` entsteht dieselbe Dokument-ID. Dadurch erzeugen
Wiederholungen keine doppelten Messwerte.

Wenn eine ID bereits existiert und die gespeicherten Daten identisch sind,
antwortet die API mit `200` und `status: "existing"`.

Wenn ein Messwert für dasselbe `measuredAt` bereits existiert, aber die
gespeicherten Daten abweichen, antwortet die API mit `409 measurement_conflict`.

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
  "status": "dry_run"
}
```

## Fehlerantworten

Fehler haben immer diese Form:

```json
{
  "code": "unauthorized",
  "error": "Missing or invalid import token.",
  "field": "Authorization",
  "details": {
    "acceptedHeaders": ["Authorization", "X-Experiment-Import-Token"]
  }
}
```

`field` nennt das betroffene Feld, den betroffenen Header oder bei falscher
HTTP-Methode `method`. `details` enthält maschinenlesbare Zusatzinformationen,
wenn sie für Schnittstellen-Nutzer hilfreich sind.

| HTTP-Status | Code | Feld | Ursache |
| --- | --- | --- | --- |
| `400` | `invalid_value` | `field: "valueMv"` | `valueMv` fehlt oder ist keine endliche Zahl in Millivolt. |
| `400` | `missing_measured_at` | `field: "measuredAt"` | `measuredAt` fehlt. |
| `400` | `invalid_timestamp` | `field: "measuredAt"` | `measuredAt` kann nicht als Zeitstempel gelesen werden. |
| `400` | `unsupported_field` | `field: "deviceId"` oder `field: "measurementId"` | `deviceId` oder `measurementId` wurde gesendet, wird aber nicht akzeptiert. |
| `401` | `unauthorized` | `field: "Authorization"` | Token fehlt oder ist falsch. |
| `405` | `method_not_allowed` | `field: "method"` | Es wurde nicht `POST` verwendet. |
| `409` | `measurement_conflict` | `field: "measuredAt"` | Für diesen Messzeitpunkt existiert bereits ein anderer Messwert. |
| `500` | `server_error` | kein Feld | Der Messwert konnte serverseitig nicht gespeichert werden. |

Beispiel für einen Fehler bei der Validierung:

```json
{
  "code": "invalid_value",
  "error": "valueMv must be a finite number in millivolts.",
  "field": "valueMv",
  "details": {
    "unit": "mV",
    "rule": "finite_number"
  }
}
```

Beispiel für einen ID-Konflikt:

```json
{
  "code": "measurement_conflict",
  "error": "A measurement for this measuredAt already exists with different data.",
  "field": "measuredAt",
  "details": {
    "idSource": ["measuredAt"],
    "conflictingFields": ["valueMv", "measuredAt"]
  }
}
```

## cURL-Beispiele

Testmodus ohne Speicherung:

```bash
curl -X POST "https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EXPERIMENT_IMPORT_TOKEN" \
  -d '{
    "valueMv": 742,
    "measuredAt": "2026-06-17T12:30:00.000Z",
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
    "measuredAt": "2026-06-17T12:30:00.000Z"
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
| `EXPERIMENT_TEST_MEASURED_AT` | aktuelle Zeit | Messzeitpunkt für den Test. |
| `EXPERIMENT_TEST_DRY_RUN` | `true` | Mit `false` wird wirklich gespeichert. |

## Python-Client

Ein einfacher Python-Client liegt unter
[`scripts/post_experiment_measurement.py`](../scripts/post_experiment_measurement.py).
Die Datei ist als Modul gedacht und wird von einem anderen Script importiert.
Die stabile Dokument-ID erzeugt die API automatisch aus `measuredAt`.

Voraussetzung:

```bash
pip install requests
```

Vor der Nutzung muss der Import-Token als Umgebungsvariable gesetzt werden:

```bash
export EXPERIMENT_IMPORT_TOKEN="<EXPERIMENT_IMPORT_TOKEN>"
```

Die zentrale Funktion im Script ist:

```python
def post_measurement(
    value_mv,
    measured_at,
    dry_run=True,
):
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
```

Beispiel für ein Script, das den Client nutzt:

```python
from scripts.post_experiment_measurement import current_time_utc, post_measurement


value_mv = 742
measured_at = current_time_utc()

result = post_measurement(value_mv, measured_at, dry_run=True)
print(result)
```

Für einen echten Import wird `dry_run=False` gesetzt:

```python
result = post_measurement(value_mv, measured_at, dry_run=False)
```

Für einen Arduino-Aufbau sollte das Script den gemessenen Spannungswert in
Millivolt und den Messzeitpunkt an `post_measurement(...)` übergeben.

Wenn ein Script automatische Wiederholungen einbaut, sollte es bei einem Retry
nicht neu messen und keinen neuen Zeitstempel erzeugen, sondern denselben Payload
erneut senden. Dadurch bleibt der Import idempotent.
