"""Fetch latest exchange rates and write data/rates.json.

ECB (via Frankfurter) is the primary source but only publishes ~30 currencies and
never covers RUB or VND, so open.er-api.com fills the gaps. Anything still missing
falls back to the previous value and is recorded in "stale" so the UI can say so out
loud instead of shipping a date that only half the rates agree with.

Fails non-zero unless every target currency resolves to a positive finite number,
which keeps GitHub Actions from committing a file the frontend cannot use.
"""
import json
import math
import sys
import urllib.request
from pathlib import Path

TARGETS = ["CNY", "EUR", "GBP", "JPY", "RUB", "INR", "VND", "IDR", "BRL"]
RATES_FILE = Path("data/rates.json")
USER_AGENT = "GlobalNetWorth/1.0"


def get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def load_existing() -> dict:
    if RATES_FILE.exists():
        return json.loads(RATES_FILE.read_text(encoding="utf-8"))
    return {}


def fetch_ecb() -> tuple[dict, str]:
    """European Central Bank reference rates, keyed by currency, with their date."""
    data = get_json("https://api.frankfurter.dev/v1/latest?base=USD")
    rates = {k: v for k, v in (data.get("rates") or {}).items() if k in TARGETS}
    return rates, data.get("date") or ""


def fetch_er_api() -> tuple[dict, str]:
    """Broad-coverage fallback; supplies what ECB omits (RUB, VND, ...)."""
    data = get_json("https://open.er-api.com/v6/latest/USD")
    if data.get("result") != "success":
        raise RuntimeError(f"er-api result={data.get('result')}")
    stamp = (data.get("time_last_update_utc") or "")[:16]
    rates = {k: v for k, v in (data.get("rates") or {}).items() if k in TARGETS}
    return rates, stamp


def sig6(value: float) -> float:
    """er-api returns 6+ decimals; keep the file readable and diffs small."""
    rounded = float(f"{value:.6g}")
    return int(rounded) if rounded.is_integer() else rounded


def build_rates(ecb: dict, er: dict, existing: dict, ecb_date: str) -> dict:
    rates: dict = {"USD": 1.0}
    sources: dict = {"USD": "reference"}
    stale: dict = {}
    previous = existing.get("rates", {})
    previous_stale = existing.get("stale", {})

    for currency in TARGETS:
        if currency in ecb:
            rates[currency] = sig6(ecb[currency])
            sources[currency] = "ecb"
        elif currency in er:
            rates[currency] = sig6(er[currency])
            sources[currency] = "er-api"
        elif currency in previous:
            rates[currency] = previous[currency]
            sources[currency] = "cached"
            stale[currency] = previous_stale.get(currency) or existing.get("date", "unknown")
            print(f"WARNING: {currency} unavailable from both sources, kept "
                  f"{rates[currency]} dated {stale[currency]}", file=sys.stderr)
        else:
            raise RuntimeError(f"No rate for {currency} from any source and none cached")

    output = {"base": "USD", "date": ecb_date, "rates": rates, "sources": sources}
    if stale:
        output["stale"] = stale
    return output


def validate(payload: dict) -> None:
    missing = [c for c in ["USD", *TARGETS] if c not in payload["rates"]]
    if missing:
        raise RuntimeError(f"rates.json missing currencies: {', '.join(missing)}")
    bad = [c for c, v in payload["rates"].items()
           if not isinstance(v, (int, float)) or not math.isfinite(v) or v <= 0]
    if bad:
        raise RuntimeError(f"rates.json has non-positive/unusable values: {', '.join(bad)}")
    if not payload["date"]:
        raise RuntimeError("rates.json has no date")


def main() -> None:
    try:
        existing = load_existing()
        ecb, ecb_date = fetch_ecb()
        try:
            er, _ = fetch_er_api()
        except Exception as e:
            print(f"WARNING: er-api unavailable ({e}); ECB-only", file=sys.stderr)
            er = {}
        payload = build_rates(ecb, er, existing, ecb_date)
        validate(payload)
        RATES_FILE.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        filled = [c for c, s in payload["sources"].items() if s != "ecb" and c != "USD"]
        print(f"Updated rates.json — date: {payload['date']}, "
              f"non-ECB sources: {', '.join(filled) or 'none'}")
    except Exception as e:
        print(f"Error fetching rates: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
