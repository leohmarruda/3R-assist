"""Tests for study_type lookup."""

from app.services.study_type_lookup import map_study_type_to_endpoint


def test_map_study_type_to_acute_toxicity():
    assert map_study_type_to_endpoint("acute toxicity LD50 study") == "acute_toxicity"


def test_map_study_type_to_genotoxicity_from_comet_assay():
    assert map_study_type_to_endpoint("in vivo genotoxicity battery with comet assay") == "genotoxicity"


def test_subacute_study_type_does_not_map_to_acute_toxicity():
    assert (
        map_study_type_to_endpoint("28-day subacute repeated-dose oral toxicity study")
        is None
    )
    assert map_study_type_to_endpoint("subacute toxicity study") is None


def test_known_miss_returns_null():
    assert map_study_type_to_endpoint("prenatal developmental toxicity study") is None


def test_eveit_study_type_maps_to_ocular_irritation():
    assert (
        map_study_type_to_endpoint(
            "Evaluation of corneal healing and epithelial integrity using the EVEIT"
        )
        == "ocular_irritation"
    )
    assert map_study_type_to_endpoint("ex vivo eye irritation test (EVEIT)") == "ocular_irritation"
    assert map_study_type_to_endpoint("BCOP ocular toxicity assay") == "ocular_irritation"
