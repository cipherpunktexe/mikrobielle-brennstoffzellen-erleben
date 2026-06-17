"""Dry-run test for the Python experiment import client.

Run from the repository root:
    python3 scripts/test_post_experiment_measurement.py
"""

import json
import os

from post_experiment_measurement import current_time_utc, post_measurement


def main():
    value_mv = float(os.getenv("EXPERIMENT_TEST_VALUE_MV", "742"))
    measured_at = os.getenv("EXPERIMENT_TEST_MEASURED_AT", current_time_utc())

    result = post_measurement(
        value_mv=value_mv,
        measured_at=measured_at,
        dry_run=True,
    )

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
