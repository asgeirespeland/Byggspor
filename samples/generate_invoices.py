"""Generate 10 mock EHF invoices from NOBB item data.

Usage:
    python samples/generate_invoices.py
"""

import json
import os
import random
from datetime import date, timedelta

SCRIPT_DIR = os.path.dirname(__file__)
ITEMS_PATH = os.path.join(SCRIPT_DIR, "nobb_items.json")
OUT_DIR = os.path.join(SCRIPT_DIR, "materialInvoice")

SUPPLIERS = [
    {"name": "Optimera AS", "orgnr": "967013056", "city": "Oslo"},
    {"name": "Maxbo AS", "orgnr": "914778271", "city": "Lillestrøm"},
    {"name": "XL-BYGG AS", "orgnr": "980489731", "city": "Bergen"},
    {"name": "Byggmax Norge AS", "orgnr": "988444459", "city": "Trondheim"},
    {"name": "Montér Hus AS", "orgnr": "912345678", "city": "Stavanger"},
]

BUYER = {
    "name": "Veidekke Entreprenør AS",
    "orgnr": "976098897",
    "city": "Oslo",
}

# Map NOBB units to UBL unit codes
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

LINE_COUNTS = [18, 55, 42, 95, 25, 120, 15, 72, 105, 38]

INVOICE_TEMPLATE = """\
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
\t<cbc:UBLVersionID>2.0</cbc:UBLVersionID>
\t<cbc:CustomizationID>urn:www.cenbii.eu:transaction:biicoretrdm010:ver1.0:#urn:www.peppol.eu:bis:peppol4a:ver1.0#urn:www.difi.no:ehf:faktura:ver1</cbc:CustomizationID>
\t<cbc:ProfileID>urn:www.cenbii.eu:profile:bii05:ver1.0</cbc:ProfileID>
\t<cbc:ID>{invoice_id}</cbc:ID>
\t<cbc:IssueDate>{issue_date}</cbc:IssueDate>
\t<cbc:InvoiceTypeCode listID="UN/ECE 1001 Subset" listAgencyID="6">380</cbc:InvoiceTypeCode>
\t<cbc:DocumentCurrencyCode listID="ISO 4217 Alpha" listAgencyID="6">NOK</cbc:DocumentCurrencyCode>
\t<cac:AccountingSupplierParty>
\t\t<cac:Party>
\t\t\t<cac:PartyName>
\t\t\t\t<cbc:Name>{supplier_name}</cbc:Name>
\t\t\t</cac:PartyName>
\t\t\t<cac:PostalAddress>
\t\t\t\t<cbc:CityName>{supplier_city}</cbc:CityName>
\t\t\t\t<cac:Country>
\t\t\t\t\t<cbc:IdentificationCode listID="ISO3166-1" listAgencyID="6">NO</cbc:IdentificationCode>
\t\t\t\t</cac:Country>
\t\t\t</cac:PostalAddress>
\t\t\t<cac:PartyLegalEntity>
\t\t\t\t<cbc:RegistrationName>{supplier_name}</cbc:RegistrationName>
\t\t\t\t<cbc:CompanyID schemeID="NO:ORGNR">{supplier_orgnr}</cbc:CompanyID>
\t\t\t</cac:PartyLegalEntity>
\t\t</cac:Party>
\t</cac:AccountingSupplierParty>
\t<cac:AccountingCustomerParty>
\t\t<cac:Party>
\t\t\t<cac:PartyName>
\t\t\t\t<cbc:Name>{buyer_name}</cbc:Name>
\t\t\t</cac:PartyName>
\t\t\t<cac:PostalAddress>
\t\t\t\t<cbc:CityName>{buyer_city}</cbc:CityName>
\t\t\t\t<cac:Country>
\t\t\t\t\t<cbc:IdentificationCode listID="ISO3166-1" listAgencyID="6">NO</cbc:IdentificationCode>
\t\t\t\t</cac:Country>
\t\t\t</cac:PostalAddress>
\t\t\t<cac:PartyLegalEntity>
\t\t\t\t<cbc:RegistrationName>{buyer_name}</cbc:RegistrationName>
\t\t\t\t<cbc:CompanyID schemeAgencyID="NO:ORGNR">{buyer_orgnr}</cbc:CompanyID>
\t\t\t</cac:PartyLegalEntity>
\t\t</cac:Party>
\t</cac:AccountingCustomerParty>
\t<cac:PaymentMeans>
\t\t<cbc:PaymentMeansCode listID="UN/ECE 4461 Subset" listAgencyID="NES">31</cbc:PaymentMeansCode>
\t\t<cbc:PaymentDueDate>{due_date}</cbc:PaymentDueDate>
\t</cac:PaymentMeans>
\t<cac:TaxTotal>
\t\t<cbc:TaxAmount currencyID="NOK">{tax_total:.2f}</cbc:TaxAmount>
\t\t<cac:TaxSubtotal>
\t\t\t<cbc:TaxableAmount currencyID="NOK">{line_total:.2f}</cbc:TaxableAmount>
\t\t\t<cbc:TaxAmount currencyID="NOK">{tax_total:.2f}</cbc:TaxAmount>
\t\t\t<cac:TaxCategory>
\t\t\t\t<cbc:ID schemeID="UN/ECE 5305" schemeAgencyID="6">S</cbc:ID>
\t\t\t\t<cbc:Percent>25</cbc:Percent>
\t\t\t\t<cac:TaxScheme>
\t\t\t\t\t<cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">VAT</cbc:ID>
\t\t\t\t</cac:TaxScheme>
\t\t\t</cac:TaxCategory>
\t\t</cac:TaxSubtotal>
\t</cac:TaxTotal>
\t<cac:LegalMonetaryTotal>
\t\t<cbc:LineExtensionAmount currencyID="NOK">{line_total:.2f}</cbc:LineExtensionAmount>
\t\t<cbc:TaxExclusiveAmount currencyID="NOK">{line_total:.2f}</cbc:TaxExclusiveAmount>
\t\t<cbc:TaxInclusiveAmount currencyID="NOK">{payable:.2f}</cbc:TaxInclusiveAmount>
\t\t<cbc:PayableAmount currencyID="NOK">{payable:.2f}</cbc:PayableAmount>
\t</cac:LegalMonetaryTotal>
{lines}</Invoice>
"""

LINE_TEMPLATE = """\
\t<cac:InvoiceLine>
\t\t<cbc:ID>{line_id}</cbc:ID>
\t\t<cbc:InvoicedQuantity unitCode="{unit_code}">{qty}</cbc:InvoicedQuantity>
\t\t<cbc:LineExtensionAmount currencyID="NOK">{line_ext:.2f}</cbc:LineExtensionAmount>
\t\t<cac:TaxTotal>
\t\t\t<cbc:TaxAmount currencyID="NOK">{line_tax:.2f}</cbc:TaxAmount>
\t\t</cac:TaxTotal>
\t\t<cac:Item>
\t\t\t<cbc:Name>{name}</cbc:Name>
\t\t\t<cac:StandardItemIdentification>
\t\t\t\t<cbc:ID schemeID="0160" schemeAgencyID="9">{gtin}</cbc:ID>
\t\t\t</cac:StandardItemIdentification>
\t\t\t<cac:ClassifiedTaxCategory xmlns="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
\t\t\t\t<cbc:ID schemeID="UN/ECE 5305" schemeAgencyID="6">S</cbc:ID>
\t\t\t\t<cbc:Percent>25</cbc:Percent>
\t\t\t\t<TaxScheme>
\t\t\t\t\t<cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">VAT</cbc:ID>
\t\t\t\t</TaxScheme>
\t\t\t</cac:ClassifiedTaxCategory>
\t\t\t<cac:AdditionalItemProperty>
\t\t\t\t<cbc:Name>NOBB</cbc:Name>
\t\t\t\t<cbc:Value>{nobb}</cbc:Value>
\t\t\t</cac:AdditionalItemProperty>
\t\t</cac:Item>
\t\t<cac:Price>
\t\t\t<cbc:PriceAmount currencyID="NOK">{price:.2f}</cbc:PriceAmount>
\t\t\t<cbc:BaseQuantity unitCode="C62">1</cbc:BaseQuantity>
\t\t</cac:Price>
\t</cac:InvoiceLine>
"""


def main():
    random.seed(42)

    with open(ITEMS_PATH, encoding="utf-8") as f:
        nobb_items = json.load(f)

    # Only use items that have a GTIN
    with_gtin = [i for i in nobb_items if i.get("gtin")]
    random.shuffle(with_gtin)

    os.makedirs(OUT_DIR, exist_ok=True)
    cursor = 0
    base_date = date(2025, 1, 15)

    for inv_idx in range(10):
        num_lines = LINE_COUNTS[inv_idx]
        supplier = SUPPLIERS[inv_idx % len(SUPPLIERS)]
        issue = base_date + timedelta(days=inv_idx * 12)
        due = issue + timedelta(days=30)
        invoice_id = f"2025{issue.month:02d}{issue.day:02d}{10001 + inv_idx}"

        lines_xml = []
        total = 0.0

        for line_idx in range(num_lines):
            item = with_gtin[cursor % len(with_gtin)]
            cursor += 1

            unit_code = UNIT_MAP.get(item.get("unit") or "STK", "EA")
            qty = round(random.uniform(1, 50), 1) if unit_code in ("LMT", "MTK", "MTR", "MTQ") else random.randint(1, 30)
            price = round(random.uniform(15, 800), 2)
            line_ext = round(qty * price, 2)
            line_tax = round(line_ext * 0.25, 2)
            total += line_ext

            lines_xml.append(LINE_TEMPLATE.format(
                line_id=line_idx + 1,
                unit_code=unit_code,
                qty=qty,
                line_ext=line_ext,
                line_tax=line_tax,
                name=item["name"],
                gtin=item["gtin"],
                nobb=item["nobbNumber"],
                price=price,
            ))

        tax_total = round(total * 0.25, 2)
        payable = round(total + tax_total, 2)

        xml = INVOICE_TEMPLATE.format(
            invoice_id=invoice_id,
            issue_date=issue.isoformat(),
            supplier_name=supplier["name"],
            supplier_city=supplier["city"],
            supplier_orgnr=supplier["orgnr"],
            buyer_name=BUYER["name"],
            buyer_city=BUYER["city"],
            buyer_orgnr=BUYER["orgnr"],
            due_date=due.isoformat(),
            tax_total=tax_total,
            line_total=total,
            payable=payable,
            lines="".join(lines_xml),
        )

        filename = f"invoice_{inv_idx + 1:02d}_{supplier['name'].split()[0].lower()}.xml"
        path = os.path.join(OUT_DIR, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(xml)
        print(f"  {filename}: {num_lines} lines, {total:.2f} NOK")

    print(f"\nGenerated 10 invoices in {OUT_DIR}")


if __name__ == "__main__":
    main()
