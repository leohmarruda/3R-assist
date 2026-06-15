#!/usr/bin/env python3
"""Manual smoke test for the analysis endpoint (ADR-001 Minimal tier)."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"

PAYLOAD = {
    "protocol_text": (
        "Utilizamos camundongos Wistar para avaliar toxicidade aguda por via oral "
        "com endpoint de mortalidade em estudo regulatório OECD."
    ),
    "lang": "pt",
}


def main() -> int:
    request = urllib.request.Request(
        f"{BASE_URL}/analyze",
        data=json.dumps(PAYLOAD).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        print(f"FAIL: HTTP {exc.code}", file=sys.stderr)
        print(exc.read().decode("utf-8"), file=sys.stderr)
        return 1
    except urllib.error.URLError as exc:
        print(f"FAIL: {exc.reason}", file=sys.stderr)
        print("Is the API running? uvicorn app.main:app --reload", file=sys.stderr)
        return 1

    assert "params" in body, "missing params"
    assert "experiments" in body, "missing experiments"
    print("OK:", json.dumps(body, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
