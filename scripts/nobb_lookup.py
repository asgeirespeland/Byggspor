"""
Interactive NOBB API lookup script for demoing.

Usage:
    python scripts/nobb_lookup.py

Requires NOBB_API_USERNAME and NOBB_API_PASSWORD in .env or environment.
"""

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from dotenv import load_dotenv

load_dotenv()

from app.services.nobb_client import lookup  # noqa: E402


def main():
    if not os.environ.get("NOBB_API_USERNAME"):
        print("Error: Set NOBB_API_USERNAME and NOBB_API_PASSWORD in .env")
        sys.exit(1)

    print("=== NOBB API Lookup ===\n")
    print("  1) Search by GTIN")
    print("  2) Search by NOBB number")
    choice = input("\nChoice (1/2): ").strip()

    if choice == "1":
        value = input("GTIN: ").strip()
        result = lookup(gtin=value)
    elif choice == "2":
        value = input("NOBB number: ").strip()
        result = lookup(nobb_number=int(value))
    else:
        print("Invalid choice")
        sys.exit(1)

    if not result:
        print("\nNo item found.")
        sys.exit(0)

    print(f"\nFound: {result['name']} ({result['secondary_text']})")
    print(f"NOBB: {result['nobb_number']}")
    print(f"Product group: {result['product_group']}")

    print("\nWhat do you want to see?")
    print("  1) Basic info")
    print("  2) EPD / GWP summary")
    print("  3) Full JSON response")
    info = input("\nChoice (1/2/3): ").strip()

    if info == "1":
        print(f"\n  Name:         {result['name']}")
        print(f"  Secondary:    {result['secondary_text']}")
        print(f"  Description:  {(result.get('description') or '')[:120]}")
        print(f"  Group:        {result['product_group']} ({result['product_group_number']})")
        print(f"  Env labels:   {result['environment_labels']}")
        print(f"  Has EPD:      {result['has_epd']}")

    elif info == "2":
        epd = result.get("epd")
        if not epd:
            print("\n  No EPD data for this item.")
        else:
            print(f"\n  EPD number:     {epd['epd_number']}")
            print(f"  Declared unit:  {epd['declared_unit']}")
            print(f"  Price unit factor: {epd['price_unit_factor']}")
            print(f"\n  {'Stage':<10} {'Total':>10} {'Fossil':>10} {'Biogenic':>10}  kg CO2 eq.")
            print(f"  {'-' * 52}")
            for stage, vals in epd["gwp_stages"].items():
                t = vals["total"] if vals["total"] is not None else "-"
                f = vals["fossil"] if vals["fossil"] is not None else "-"
                b = vals["biogenic"] if vals["biogenic"] is not None else "-"
                print(f"  {stage:<10} {str(t):>10} {str(f):>10} {str(b):>10}")

    elif info == "3":
        print(json.dumps(result, indent=2, ensure_ascii=False))

    else:
        print("Invalid choice, dumping full JSON:")
        print(json.dumps(result, indent=2, ensure_ascii=False))

    print()


if __name__ == "__main__":
    main()
