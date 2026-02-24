import os

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = "https://export.byggtjeneste.no"

SEARCH_ENDPOINT = "/api/v2/items/search"
ITEMS_ENDPOINT = "/api/v2/items"


def _get_session():
    username = os.environ.get("NOBB_API_USERNAME")
    password = os.environ.get("NOBB_API_PASSWORD")
    if not username or not password:
        raise RuntimeError(
            "NOBB_API_USERNAME and NOBB_API_PASSWORD must be set in environment"
        )

    session = requests.Session()
    session.auth = (username, password)

    retry = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"],
    )
    session.mount("https://", HTTPAdapter(max_retries=retry))

    return session


def search_by_gtin(gtin: str) -> list[dict]:
    session = _get_session()
    resp = session.post(
        f"{BASE_URL}{SEARCH_ENDPOINT}",
        json={"gtinNos": [gtin]},
    )
    resp.raise_for_status()
    return resp.json()


def search_by_nobb(nobb_number: int) -> list[dict]:
    session = _get_session()
    resp = session.post(
        f"{BASE_URL}{SEARCH_ENDPOINT}",
        json={"nobbNos": [nobb_number]},
    )
    resp.raise_for_status()
    return resp.json()


def get_item_details(nobb_number: int) -> dict | None:
    session = _get_session()
    resp = session.get(
        f"{BASE_URL}{ITEMS_ENDPOINT}",
        params={"nobbnos": nobb_number},
    )
    resp.raise_for_status()
    results = resp.json()
    return results[0] if results else None


def extract_epd(item: dict) -> dict | None:
    epd_props = item.get("properties", {}).get("epd", [])
    if not epd_props:
        return None

    epd_map = {p["propertyName"]: p.get("value", "") for p in epd_props}

    gwp_stages = {}
    stage_prefixes = [
        ("a1_a3", "Tot A1 To A3"),
        ("a4", "A4"),
        ("a5", "A5"),
        ("c1", "C1"),
        ("c2", "C2"),
        ("c3", "C3"),
        ("c4", "C4"),
        ("d", "D"),
    ]
    for key, prefix in stage_prefixes:
        total = epd_map.get(f"{prefix} GWP Total - global warming potential")
        fossil = epd_map.get(f"{prefix} Fossil - global warming potential")
        biogenic = epd_map.get(f"{prefix} Biogenic - global warming potential")
        if total is not None:
            gwp_stages[key] = {
                "total": _to_float(total),
                "fossil": _to_float(fossil),
                "biogenic": _to_float(biogenic),
            }

    return {
        "epd_number": epd_map.get("EPD registration number"),
        "declared_unit": epd_map.get("Declared unit"),
        "conversion_factor_kg": _to_float(
            epd_map.get(
                "Conversion factor to mass (kg) per declared or functional unit"
            )
        ),
        "price_unit_factor": _to_float(
            epd_map.get("Calcuation factor to NOBB price unit")
        ),
        "reference_service_life": epd_map.get(
            "Reference service life according to ISO 15686-8"
        ),
        "gwp_stages": gwp_stages,
    }


def _to_float(value) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def lookup(gtin: str | None = None, nobb_number: int | None = None) -> dict | None:
    if not gtin and not nobb_number:
        raise ValueError("Provide either gtin or nobb_number")

    if gtin:
        results = search_by_gtin(gtin)
    else:
        results = search_by_nobb(nobb_number)

    if not results:
        return None

    nobb_no = results[0]["nobbNo"]
    item = get_item_details(nobb_no)
    if not item:
        return None

    epd = extract_epd(item)

    return {
        "nobb_number": item["nobbNumber"],
        "name": item.get("primaryText"),
        "secondary_text": item.get("secondaryText"),
        "description": item.get("description"),
        "product_group": item.get("productGroupName"),
        "product_group_number": item.get("productGroupNumber"),
        "environment_labels": item.get("environmentLabels", []),
        "has_epd": epd is not None,
        "epd": epd,
    }
