"""Generate 10 fraction-level and 10 product-level waste reports.

Usage:
    python3 samples/generate_waste_reports.py
"""

import json
import os
import random
from datetime import date, timedelta

SCRIPT_DIR = os.path.dirname(__file__)
OUT_DIR = os.path.join(SCRIPT_DIR, "wasteReport")

RECEIVERS = [
    "Norsk Gjenvinning AS",
    "Franzefoss Gjenvinning AS",
    "Ragn-Sells AS",
    "Stena Recycling AS",
    "Retura Norge AS",
]

# Construction-relevant NS 9431 fractions with typical weight ranges (kg)
CONSTRUCTION_FRACTIONS = [
    ("1141", "Rent trevirke", "TON", 0.5, 8.0),
    ("1142", "Behandlet trevirke", "TON", 0.3, 5.0),
    ("1149", "Blandet bearbeidet trevirke", "TON", 0.2, 3.0),
    ("1299", "Blandet papir, papp og kartong", "KG", 50, 500),
    ("1331", "Vindusglass, ikke laminert", "KG", 30, 300),
    ("1341", "Laminert glass", "KG", 20, 200),
    ("1411", "Metallemballasje", "KG", 10, 150),
    ("1447", "Rent magnetisk metall", "KG", 100, 2000),
    ("1451", "Rent umagnetisk metall", "KG", 50, 800),
    ("1452", "Blandede metaller", "KG", 100, 1500),
    ("1601", "Rene masser", "TON", 5, 50),
    ("1611", "Betong uten armeringsjern", "TON", 2, 30),
    ("1612", "Betong med armeringsjern", "TON", 1, 20),
    ("1613", "Tegl og takstein", "TON", 0.5, 8),
    ("1615", "Gips", "KG", 200, 3000),
    ("1617", "Mineralull", "KG", 50, 800),
    ("1618", "Keramikk og porselen", "KG", 20, 300),
    ("1619", "Asfalt", "TON", 1, 15),
    ("1621", "Takpapp/tjærepapp", "KG", 50, 500),
    ("1711", "Folieplast, emballasje", "KG", 10, 200),
    ("1721", "Hardplast, emballasje", "KG", 10, 150),
    ("1723", "PVC", "KG", 5, 100),
    ("1731", "Ekspandert og ekstrudert plast, emballasje", "KG", 5, 80),
    ("1799", "Blandet plast", "KG", 20, 300),
    ("9912", "Blandet næringsavfall", "TON", 0.5, 5),
    ("9913", "Utsortert brennbart avfall", "KG", 100, 1500),
    ("7051", "Maling, lim og lakk", "KG", 5, 80),
    ("7055", "Spraybokser", "KG", 2, 30),
]

FRACTION_LINE_COUNTS = [15, 45, 10, 80, 25, 60, 12, 35, 95, 20]
PRODUCT_LINE_COUNTS = [12, 55, 10, 100, 18, 70, 15, 40, 85, 25]

FRACTION_TEMPLATE = """\
<?xml version="1.0" encoding="UTF-8"?>
<WasteReport xmlns="urn:byggspor:waste:report:1.0"
             xmlns:cbc="urn:byggspor:waste:CommonBasic:1.0"
             xmlns:cac="urn:byggspor:waste:CommonAggregate:1.0">
  <cbc:ID>{report_id}</cbc:ID>
  <cbc:IssueDate>{issue_date}</cbc:IssueDate>

  <cac:WasteReceiverParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>{receiver}</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:WasteReceiverParty>
{lines}</WasteReport>
"""

FRACTION_LINE_TEMPLATE = """
  <cac:WasteLine>
    <cbc:ID>{line_id}</cbc:ID>
    <cbc:Quantity unitCode="{unit}">{qty}</cbc:Quantity>
    <cac:Item>
      <cbc:Name>{name}</cbc:Name>
      <cac:WasteFraction>
        <cbc:ID schemeID="NS9431">{code}</cbc:ID>
      </cac:WasteFraction>
    </cac:Item>
  </cac:WasteLine>
"""

PRODUCT_LINE_TEMPLATE = """
  <cac:WasteLine>
    <cbc:ID>{line_id}</cbc:ID>
    <cbc:Quantity unitCode="{unit}">{qty}</cbc:Quantity>
    <cac:Item>
      <cbc:Name>{name}</cbc:Name>
      <cac:StandardItemIdentification>
        <cbc:ID schemeID="0160">{gtin}</cbc:ID>
      </cac:StandardItemIdentification>
      <cac:AdditionalItemProperty>
        <cbc:Name>NOBB</cbc:Name>
        <cbc:Value>{nobb}</cbc:Value>
      </cac:AdditionalItemProperty>
    </cac:Item>
  </cac:WasteLine>
"""

# Same unit mapping as generate_invoices.py
UNIT_MAP = {
    "STK": "EA",
    "BK": "XBX",
    "PAK": "XPK",
    "M2": "MTK",
    "ESK": "XBX",
    "RUL": "XRO",
    "LM": "LMT",
    "M": "MTR",
    "M3": "MTQ",
    "PP": "XPK",
    "POS": "XBG",
    "SET": "XST",
    "PAR": "XPA",
    "FL": "XBO",
    "BOX": "XBX",
    "SEK": "XBG",
    "SPA": "XBX",
}


def main():
    random.seed(99)
    os.makedirs(OUT_DIR, exist_ok=True)

    base_date = date(2025, 2, 1)

    # --- Fraction-level reports ---
    fraction_dir = os.path.join(OUT_DIR, "fraction")
    os.makedirs(fraction_dir, exist_ok=True)
    for i in range(10):
        num_lines = FRACTION_LINE_COUNTS[i]
        receiver = RECEIVERS[i % len(RECEIVERS)]
        issue = base_date + timedelta(days=i * 14)
        report_id = f"WR-F-2025-{i + 1:03d}"

        fractions = random.sample(CONSTRUCTION_FRACTIONS, min(num_lines, len(CONSTRUCTION_FRACTIONS)))
        lines = ""
        for idx, (code, name, unit, lo, hi) in enumerate(fractions):
            if unit == "TON":
                qty = round(random.uniform(lo, hi), 1)
            else:
                qty = round(random.uniform(lo, hi), 0)
            lines += FRACTION_LINE_TEMPLATE.format(
                line_id=idx + 1, unit=unit, qty=qty, name=name, code=code,
            )

        xml = FRACTION_TEMPLATE.format(
            report_id=report_id, issue_date=issue.isoformat(),
            receiver=receiver, lines=lines,
        )
        filename = f"fraction_{i + 1:02d}_{receiver.split()[0].lower()}.xml"
        with open(os.path.join(fraction_dir, filename), "w", encoding="utf-8") as f:
            f.write(xml)
        print(f"  {filename}: {len(fractions)} fractions")

    # --- Product-level reports ---
    with open(os.path.join(SCRIPT_DIR, "nobb_items.json"), encoding="utf-8") as f:
        nobb_items = json.load(f)
    with_gtin = [it for it in nobb_items if it.get("gtin")]
    random.shuffle(with_gtin)

    product_dir = os.path.join(OUT_DIR, "product")
    os.makedirs(product_dir, exist_ok=True)
    cursor = 0
    for i in range(10):
        num_lines = PRODUCT_LINE_COUNTS[i]
        receiver = RECEIVERS[i % len(RECEIVERS)]
        issue = base_date + timedelta(days=i * 14 + 7)
        report_id = f"WR-P-2025-{i + 1:03d}"

        lines = ""
        for idx in range(num_lines):
            item = with_gtin[cursor % len(with_gtin)]
            cursor += 1
            unit_code = UNIT_MAP.get(item.get("unit") or "STK", "EA")
            if unit_code in ("LMT", "MTK", "MTR", "MTQ"):
                qty = round(random.uniform(1, 50), 1)
            else:
                qty = random.randint(1, 30)
            lines += PRODUCT_LINE_TEMPLATE.format(
                line_id=idx + 1, unit=unit_code, qty=qty, name=item["name"],
                gtin=item["gtin"], nobb=item["nobbNumber"],
            )

        xml = FRACTION_TEMPLATE.format(
            report_id=report_id, issue_date=issue.isoformat(),
            receiver=receiver, lines=lines,
        )
        filename = f"product_{i + 1:02d}_{receiver.split()[0].lower()}.xml"
        with open(os.path.join(product_dir, filename), "w", encoding="utf-8") as f:
            f.write(xml)
        print(f"  {filename}: {num_lines} products")

    print(f"\nGenerated 20 waste reports in {OUT_DIR}")


if __name__ == "__main__":
    main()
