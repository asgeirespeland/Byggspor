"""Client for the Statens vegvesen vehicle data API.

Looks up vehicle technical data (make, model, fuel type, CO2 emissions) by
registration number using the Enkeltoppslag endpoint.

Requires an API key set via the SVV_API_KEY environment variable.
"""

import logging
import os
from decimal import Decimal

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

BASE_URL = "https://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering"
LOOKUP_ENDPOINT = "/enkeltoppslag/kjoretoydata"


def _get_session() -> requests.Session:
    api_key = os.environ.get("SVV_API_KEY")
    if not api_key:
        raise RuntimeError("SVV_API_KEY must be set in environment")

    session = requests.Session()
    session.headers["SVV-Authorization"] = f"Apikey {api_key}"

    retry = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    session.mount("https://", HTTPAdapter(max_retries=retry))

    return session


def lookup_registration(registration_number: str) -> dict | None:
    """Look up vehicle data by registration number.

    Returns a dict with vehicle_type, make, model, fuel_type, co2_per_km
    (in kg/km as Decimal), or None if no data found.
    """
    session = _get_session()

    resp = session.get(
        f"{BASE_URL}{LOOKUP_ENDPOINT}",
        params={"kjennemerke": registration_number},
    )

    if resp.status_code == 404:
        logger.info("No SVV data for %s", registration_number)
        return None

    resp.raise_for_status()
    data = resp.json()

    vehicles = data.get("kjoretoydataListe", [])
    if not vehicles:
        return None

    return _extract_vehicle_data(vehicles[0])


def _extract_vehicle_data(kjoretoy: dict) -> dict | None:
    """Extract relevant fields from the SVV API response."""
    godkjenning = kjoretoy.get("godkjenning", {})
    teknisk = godkjenning.get("tekniskGodkjenning", {})
    klassifisering = teknisk.get("kjoretoyklassifisering", {})
    tekniske_data = teknisk.get("tekniskeData", {})
    generelt = tekniske_data.get("generelt", {})
    motor_og_drivverk = tekniske_data.get("motorOgDrivverk", {})
    miljodata = tekniske_data.get("miljodata", {})

    # Vehicle type
    vehicle_type = _kodeverk_navn(klassifisering.get("tekniskKode"))

    # Make
    merker = generelt.get("merke", [])
    make = merker[0].get("merke") if merker else None

    # Model
    betegnelser = generelt.get("handelsbetegnelse", [])
    model = betegnelser[0] if betegnelser else None

    # Fuel type
    fuel_type = None
    motorer = motor_og_drivverk.get("motor", [])
    if motorer:
        drivstoff_list = motorer[0].get("drivstoff", [])
        if drivstoff_list:
            fuel_type = _kodeverk_navn(drivstoff_list[0].get("drivstoffKode"))

    # CO2 per km — prefer WLTP, fall back to NEDC
    co2_per_km = _extract_co2(miljodata)

    if not make and not model:
        return None

    return {
        "vehicle_type": vehicle_type,
        "make": make,
        "model": model,
        "fuel_type": fuel_type,
        "co2_per_km": co2_per_km,
    }


def _extract_co2(miljodata: dict) -> Decimal | None:
    """Extract CO2 g/km and convert to kg/km."""
    grupper = miljodata.get("miljoOgdrivstoffGruppe", [])
    if not grupper:
        return None

    for gruppe in grupper:
        for utslipp in gruppe.get("forbrukOgUtslipp", []):
            # Try WLTP first (newer vehicles)
            wltp = utslipp.get("wltpKjoretoyspesifikk", {})
            if wltp:
                co2 = wltp.get("co2Kombinert")
                if co2 is not None:
                    return Decimal(str(co2)) / 1000

            # Fall back to NEDC
            co2 = utslipp.get("co2BlandetKjoring")
            if co2 is not None:
                return Decimal(str(co2)) / 1000

    return None


def _kodeverk_navn(kodetype: dict | None) -> str | None:
    """Extract the human-readable name from a KodeverkType object."""
    if kodetype is None:
        return None
    return kodetype.get("kodeNavn") or kodetype.get("kodeBeskrivelse")
