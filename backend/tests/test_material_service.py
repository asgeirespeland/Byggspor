"""Unit tests for compute_gwp_from_stages.

Pure function — no DB or Flask context needed.
"""

import pytest

from app.services.material_service import compute_gwp_from_stages

# Shared fixture: a typical EPD with fossil/biogenic breakdown across stages
EPD_FULL = {
    "a1_a3": {"total": 1.5, "fossil": 1.2, "biogenic": -0.3},
    "a4": {"total": 0.4, "fossil": 0.4, "biogenic": 0.0},
    "c3": {"total": 0.1, "fossil": 0.1, "biogenic": 0.0},
}


class TestComputeGwpFromStages:
    def test_none_input_returns_none(self):
        assert compute_gwp_from_stages(None) is None

    def test_empty_dict_returns_none(self):
        assert compute_gwp_from_stages({}) is None

    def test_non_dict_input_returns_none(self):
        assert compute_gwp_from_stages("not a dict") is None  # type: ignore[arg-type]

    def test_basic_a1_a3_fossil_only(self):
        # Default: include_biogenic=False → use fossil value
        result = compute_gwp_from_stages(EPD_FULL, ["a1_a3"], include_biogenic=False)
        assert result == pytest.approx(1.2)

    def test_basic_a1_a3_with_biogenic(self):
        # include_biogenic=True → use total (fossil + biogenic)
        result = compute_gwp_from_stages(EPD_FULL, ["a1_a3"], include_biogenic=True)
        assert result == pytest.approx(1.5)

    def test_include_a4_adds_a4_stage(self):
        result = compute_gwp_from_stages(
            EPD_FULL, ["a1_a3"], include_a4=True, include_biogenic=False
        )
        assert result == pytest.approx(1.2 + 0.4)

    def test_exclude_a4_removes_it_even_if_in_stages(self):
        result = compute_gwp_from_stages(
            EPD_FULL, ["a1_a3", "a4"], include_a4=False, include_biogenic=False
        )
        assert result == pytest.approx(1.2)

    def test_missing_stage_key_is_skipped(self):
        result = compute_gwp_from_stages(
            EPD_FULL, ["a1_a3", "z9"], include_biogenic=False
        )
        assert result == pytest.approx(1.2)

    def test_stage_without_fossil_falls_back_to_total(self):
        epd = {"a1_a3": {"total": 2.0}}  # no fossil key
        result = compute_gwp_from_stages(epd, ["a1_a3"], include_biogenic=False)
        assert result == pytest.approx(2.0)

    def test_stage_with_neither_fossil_nor_total_is_skipped(self):
        epd = {"a1_a3": {"biogenic": -0.3}}
        result = compute_gwp_from_stages(epd, ["a1_a3"], include_biogenic=False)
        assert result is None

    def test_non_dict_stage_value_is_skipped(self):
        epd = {"a1_a3": 1.5}  # should be a dict, not a float
        result = compute_gwp_from_stages(epd, ["a1_a3"])
        assert result is None

    def test_multiple_stages_summed(self):
        result = compute_gwp_from_stages(
            EPD_FULL, ["a1_a3", "c3"], include_biogenic=False
        )
        assert result == pytest.approx(1.2 + 0.1)

    def test_uppercase_stage_key_lookup(self):
        # Generator stores some keys uppercase — function should handle both
        epd = {"A1_A3": {"total": 1.8, "fossil": 1.8}}
        result = compute_gwp_from_stages(epd, ["a1_a3"], include_biogenic=False)
        assert result == pytest.approx(1.8)

    def test_none_gwp_stages_uses_defaults(self):
        # Passing gwp_stages=None should fall back to MATERIAL_GWP_STAGES (["a1_a3"])
        result = compute_gwp_from_stages(EPD_FULL, None, include_biogenic=False)
        assert result == pytest.approx(1.2)
