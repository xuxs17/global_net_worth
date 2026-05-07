"""Fetch latest exchange rates from Frankfurter API and write rates.json.

Missing currencies fall back to existing values in the file.
"""
import json
import sys
import urllib.request
from pathlib import Path

TARGETS = ["CNY", "EUR", "GBP", "JPY", "RUB", "INR", "VND", "IDR", "BRL"]
RATES_FILE = Path("data/rates.json")


def load_existing() -> dict:
    if RATES_FILE.exists():
        return json.loads(RATES_FILE.read_text(encoding="utf-8"))
    return {}


def fetch_rates() -> dict:
    currencies = ",".join(TARGETS)
    url = f"https://api.frankfurter.app/latest?from=USD&to={currencies}"
    req = urllib.request.Request(url, headers={"User-Agent": "GlobalNetWorth/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def build_rates(fresh: dict, existing: dict) -> dict:
    rates: dict = {"USD": 1.0}
    missing: list[str] = []
    old_rates = existing.get("rates", {})

    for currency in TARGETS:
        if currency in fresh.get("rates", {}):
            rates[currency] = fresh["rates"][currency]
        elif currency in old_rates:
            rates[currency] = old_rates[currency]
            missing.append(currency)
        else:
            print(f"WARNING: {currency} not in API response and no existing rate", file=sys.stderr)

    if missing:
        print(f"Kept existing rates for: {', '.join(missing)}")

    return {
        "base": "USD",
        "date": fresh.get("date", existing.get("date", "")),
        "rates": rates,
    }


def main() -> None:
    try:
        existing = load_existing()
        fresh = fetch_rates()
        rates_data = build_rates(fresh, existing)
        RATES_FILE.write_text(
            json.dumps(rates_data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"Updated rates.json — date: {rates_data['date']}")
    except Exception as e:
        print(f"Error fetching rates: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
