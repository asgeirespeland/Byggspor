from unittest.mock import MagicMock, patch

import pytest
import requests

from app.services.nobb_client import (
    _to_float,
    extract_epd,
    get_item_details,
    lookup,
    search_by_gtin,
    search_by_nobb,
)
from tests.conftest import MOCK_NOBB_ITEM_SIMPLE_EPD

# --- Helper ---


def mock_response(json_data, status_code=200):
    resp = magicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data
    if status_code >= 400:
        resp.raise_for_status.side_effect = requests.HTTPError(response=resp)
    else:
        resp.raise_for_status.return_value = None
    return resp


class TestToFloat:
    def test_converts_numeric_string(self):
        assert _to_float("10.5") == 10.5

    def test_converts_integer(self):
        assert _to_float(5) == 5.0

    def test_returns_none_for_none(self):
        assert _to_float(None) is None

    def test_returns_none_for_non_numeric(self):
        assert _to_float("not a number") is None

    def test_returns_none_for_empty_string(self):
        assert _to_float("") is None


class TestGetSession:
    def test_raises_when_credentials_missing(self, monkeypatch):
        monkeypatch.delenv("NOBB_API_USERNAME", raising=False)
        monkeypatch.delenv("NOBB_API_PASSWORD", raising=False)

        with pytest.raises(
            RuntimeError, match="NOBB_API_USERNAME and NOBB_API_PASSWORD"
        ):
            _get_session()


class TestSearchByGtin:
    def test_posts_to_search_endpoint_with_gtin(self, mock_nobb_search_response):
        with patch("app.services.nobb_client._get_session") as mock_sess_factory:
            session = MagicMock()
            session.post.return_value = mock_response(mock_nobb_search_response)
            mock_sess_factory.return_value = session

            result = search_by_gtin("07090001234567")

            assert result == mock_nobb_search_response
            # Verify the correct payload was sent
            _, kwargs = session.post.call_args
            assert kwargs["json"] == {"gtinNos": ["07090001234567"]}

    def test_raises_on_http_error(self):
        with patch("app.services.nobb_client._get_session") as mock_sess_factory:
            session = MagicMock()
            session.post.return_value = mock_response({}, status_code=401)
            mock_sess_factory.return_value = session

            with pytest.raises(requests.HTTPError):
                search_by_gtin("bad-gtin")


class TestSearchByNobb:
    def test_posts_to_search_endpoint_with_nobb_number(self, mock_nobb_search_response):
        with patch("app.services.nobb_client._get_session") as mock_sess_factory:
            session = MagicMock()
            session.post.return_value = mock_response(mock_nobb_search_response)
            mock_sess_factory.return_value = session

            result = search_by_nobb(12345678)

            assert result == mock_nobb_search_response
            _, kwargs = session.post.call_args
            assert kwargs["json"] == {"nobbNos": [12345678]}


class TestGetItemDetails:
    def test_returns_first_item_from_results(self, mock_nobb_item):
        with patch("app.services.nobb_client._get_session") as mock_sess_factory:
            session = MagicMock()
            session.get.return_value = mock_response([mock_nobb_item])
            mock_sess_factory.return_value = session

            result = get_item_details(12345678)

            assert result == mock_nobb_item

    def test_returns_none_when_results_empty(self):
        with patch("app.services.nobb_client._get_session") as mock_sess_factory:
            session = MagicMock()
            session.get.return_value = mock_response([])
            mock_sess_factory.return_value = session

            result = get_item_details(99999999)

            assert result is None

    def test_passes_nobb_number_as_query_param(self, mock_nobb_item):
        with patch("app.services.nobb_client._get_session") as mock_sess_factory:
            session = MagicMock()
            session.get.return_value = mock_response([mock_nobb_item])
            mock_sess_factory.return_value = session

            get_item_details(12345678)

            _, kwargs = session.get.call_args
            assert kwargs["params"] == {"nobbnos": 12345678}


class TestExtractEpd:
    def test_returns_none_when_no_epd_properties(self):
        item = {"nobbNumber": 1, "properties": {}}
        assert extract_epd(item) is None

    def test_returns_none_when_epd_list_is_empty(self):
        item = {"nobbNumber": 1, "properties": {"epd": []}}
        assert extract_epd(item) is None

    def test_extracts_detailed_gwp_format(self, mock_nobb_item):
        epd = extract_epd(mock_nobb_item)

        assert epd is not None
        assert epd["epd_number"] == "EPD-NOR-12345"
        assert epd["declared_unit"] == "1 stk"
        assert epd["conversion_factor_kg"] == 15.0
        assert epd["price_unit_factor"] == 1.0

    def test_detailed_format_a1_a3_stages(self, mock_nobb_item):
        epd = extract_epd(mock_nobb_item)
        a1_a3 = epd["gwp_stages"]["a1_a3"]

        assert a1_a3["total"] == 10.5
        assert a1_a3["fossil"] == 10.0
        assert a1_a3["biogenic"] == 0.5

    def test_detailed_format_a4_stage(self, mock_nobb_item):
        epd = extract_epd(mock_nobb_item)
        assert epd["gwp_stages"]["a4"]["total"] == 0.2

    def test_extracts_simple_gwp_format(self):
        epd = extract_epd(MOCK_NOBB_ITEM_SIMPLE_EPD)

        assert epd is not None
        assert epd["gwp_stages"]["a1_a3"]["total"] == 5.2
        assert epd["gwp_stages"]["a4"]["total"] == 0.1

    def test_simple_format_has_none_for_fossil_biogenic(self):
        """Simple format doesn't have fossil/biogenic breakdown."""
        epd = extract_epd(MOCK_NOBB_ITEM_SIMPLE_EPD)
        a1_a3 = epd["gwp_stages"]["a1_a3"]
        assert a1_a3["fossil"] is None
        assert a1_a3["biogenic"] is None

    def test_stages_not_present_are_absent_from_result(self, mock_nobb_item):
        """Only stages present in the EPD data should appear in gwp_stages."""
        epd = extract_epd(mock_nobb_item)
        # mock_nobb_item only has a1_a3 and a4
        assert "a5" not in epd["gwp_stages"]
        assert "c1" not in epd["gwp_stages"]


class TestLookup:
    def test_raises_when_neither_identifier_provided(self):
        with pytest.raises(ValueError, match="Provide either gtin or nobb_number"):
            lookup()

    def test_lookup_by_gtin_returns_enriched_dict(
        self, mock_nobb_search_response, mock_nobb_item
    ):
        with (
            patch(
                "app.services.nobb_client.search_by_gtin",
                return_value=mock_nobb_search_response,
            ),
            patch(
                "app.services.nobb_client.get_item_details", return_value=mock_nobb_item
            ),
        ):
            result = lookup(gtin="07090001234567")

        assert result is not None
        assert result["nobb_number"] == 12345678
        assert result["name"] == "Betongblokk 20x20x40"
        assert result["has_epd"] is True
        assert result["epd"] is not None

    def test_lookup_by_nobb_number(self, mock_nobb_search_response, mock_nobb_item):
        with (
            patch(
                "app.services.nobb_client.search_by_nobb",
                return_value=mock_nobb_search_response,
            ),
            patch(
                "app.services.nobb_client.get_item_details", return_value=mock_nobb_item
            ),
        ):
            result = lookup(nobb_number=12345678)

        assert result["nobb_number"] == 12345678

    def test_returns_none_when_search_finds_nothing(self):
        with patch("app.services.nobb_client.search_by_gtin", return_value=[]):
            result = lookup(gtin="00000000000000")

        assert result is None

    def test_returns_none_when_item_details_not_found(self, mock_nobb_search_response):
        with (
            patch(
                "app.services.nobb_client.search_by_gtin",
                return_value=mock_nobb_search_response,
            ),
            patch("app.services.nobb_client.get_item_details", return_value=None),
        ):
            result = lookup(gtin="07090001234567")

        assert result is None

    def test_has_epd_false_when_no_epd_data(self, mock_nobb_search_response):
        item_no_epd = {
            "nobbNumber": 12345678,
            "primaryText": "No EPD Product",
            "properties": {},
        }
        with (
            patch(
                "app.services.nobb_client.search_by_gtin",
                return_value=mock_nobb_search_response,
            ),
            patch(
                "app.services.nobb_client.get_item_details", return_value=item_no_epd
            ),
        ):
            result = lookup(gtin="07090001234567")

        assert result["has_epd"] is False
        assert result["epd"] is None

    def test_gtin_preferred_over_nobb_when_both_provided(
        self, mock_nobb_search_response, mock_nobb_item
    ):
        """When both are passed, GTIN should be used (gtin branch runs first)."""
        with (
            patch(
                "app.services.nobb_client.search_by_gtin",
                return_value=mock_nobb_search_response,
            ) as mock_gtin,
            patch("app.services.nobb_client.search_by_nobb") as mock_nobb,
            patch(
                "app.services.nobb_client.get_item_details", return_value=mock_nobb_item
            ),
        ):
            lookup(gtin="07090001234567", nobb_number=12345678)

        mock_gtin.assert_called_once()
        mock_nobb.assert_not_called()
