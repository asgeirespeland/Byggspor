"""Unit tests for confidence score utilities.

All functions are pure — no DB or Flask context needed.
"""

import pytest

from app.utils.confidence import (
    ENERGY_CONFIDENCE,
    aggregate_confidence,
    material_confidence,
    transport_confidence,
    waste_confidence,
)


class TestMaterialConfidence:
    def test_manual_override_returns_90(self):
        score = material_confidence(
            has_gwp=False, flagged=False, is_manual_override=True
        )
        assert score == 90

    def test_manual_override_wins_over_epd(self):
        # Override should dominate even when EPD data is present
        score = material_confidence(
            has_gwp=True, has_epd=True, flagged=False, is_manual_override=True
        )
        assert score == 90

    def test_gwp_with_epd_returns_100(self):
        score = material_confidence(
            has_gwp=True, has_epd=True, flagged=False, is_manual_override=False
        )
        assert score == 100

    def test_gwp_without_epd_returns_80(self):
        score = material_confidence(
            has_gwp=True, has_epd=False, flagged=False, is_manual_override=False
        )
        assert score == 80

    def test_no_gwp_flagged_returns_20(self):
        score = material_confidence(
            has_gwp=False, flagged=True, is_manual_override=False
        )
        assert score == 20

    def test_no_gwp_not_flagged_returns_50(self):
        score = material_confidence(
            has_gwp=False, flagged=False, is_manual_override=False
        )
        assert score == 50

    def test_has_epd_without_gwp_does_not_boost_score(self):
        # EPD alone (no GWP value) should not raise above 50/20
        score = material_confidence(
            has_gwp=False, has_epd=True, flagged=False, is_manual_override=False
        )
        assert score == 50


class TestTransportConfidence:
    def test_distance_and_co2_per_km_returns_80(self):
        assert transport_confidence(has_co2_per_km=True, has_distance=True) == 80

    def test_distance_only_returns_20(self):
        assert transport_confidence(has_co2_per_km=False, has_distance=True) == 20

    def test_no_distance_returns_50(self):
        assert transport_confidence(has_co2_per_km=False, has_distance=False) == 50

    def test_no_distance_with_co2_per_km_returns_50(self):
        # co2_per_km alone is useless without a distance
        assert transport_confidence(has_co2_per_km=True, has_distance=False) == 50


class TestWasteConfidence:
    def test_with_emission_factor_returns_80(self):
        assert waste_confidence(has_emission_factor=True) == 80

    def test_without_emission_factor_returns_50(self):
        assert waste_confidence(has_emission_factor=False) == 50


class TestEnergyConfidence:
    def test_energy_confidence_is_100(self):
        assert ENERGY_CONFIDENCE == 100


class TestAggregateConfidence:
    def test_empty_list_returns_none(self):
        assert aggregate_confidence([]) is None

    def test_all_none_scores_returns_none(self):
        assert aggregate_confidence([(100.0, None), (50.0, None)]) is None

    def test_simple_average(self):
        result = aggregate_confidence([(10.0, 80), (10.0, 100)], weighting="average")
        assert result == pytest.approx(90.0)

    def test_average_ignores_none_scores(self):
        result = aggregate_confidence(
            [(10.0, 80), (10.0, None), (10.0, 100)], weighting="average"
        )
        assert result == pytest.approx(90.0)

    def test_co2_weighted_favors_larger_emitter(self):
        # 900 kg at score 20, 100 kg at score 100 → weighted toward 20
        result = aggregate_confidence(
            [(900.0, 20), (100.0, 100)], weighting="co2_weighted"
        )
        assert result == pytest.approx(28.0)

    def test_co2_weighted_equal_weights_equals_average(self):
        result = aggregate_confidence(
            [(50.0, 60), (50.0, 80)], weighting="co2_weighted"
        )
        assert result == pytest.approx(70.0)

    def test_co2_weighted_zero_co2_falls_back_to_average(self):
        # All weights are zero → falls back to simple average
        result = aggregate_confidence([(0.0, 20), (0.0, 100)], weighting="co2_weighted")
        assert result == pytest.approx(60.0)
