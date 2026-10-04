import unittest
import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/identifier-reconciliation"))

from identifier_reconciliation import (
    Candidate,
    classify_artwork_entity,
    classify_person_entity,
    classify_wikidata_entity,
    classify_work_candidate,
)


class FixtureHttp:
    last_result_source = "cache"

    def __init__(self):
        self.entities = {
            "Q19167227": {
                "labels": {"de": {"value": "Eitel nichts!"}},
                "descriptions": {"de": {"value": "Gedicht von Nikolaus Lenau"}},
                "claims": {
                    "P31": [{"mainsnak": {"datavalue": {"value": {"numeric-id": 7725634}}}}],
                    "P7937": [{"mainsnak": {"datavalue": {"value": {"numeric-id": 5185279}}}}],
                },
            },
            "Q7725634": {
                "labels": {"en": {"value": "literary work"}},
                "descriptions": {"en": {"value": "written work"}},
            },
            "Q5185279": {
                "labels": {"en": {"value": "poem"}},
                "descriptions": {"en": {"value": "form of literature"}},
            },
            "Q999000001": {
                "labels": {"en": {"value": "test person"}},
                "claims": {
                    "P31": [{"mainsnak": {"datavalue": {"value": {"numeric-id": 5}}}}],
                },
            },
            "Q5": {"labels": {"en": {"value": "human"}}},
            "Q999000003": {
                "labels": {"en": {"value": "Test painting"}},
                "claims": {
                    "P31": [{"mainsnak": {"datavalue": {"value": {"numeric-id": 999000002}}}}],
                },
            },
            "Q999000002": {"labels": {"en": {"value": "painting"}}},
        }

    def get_json(self, _url, params):
        qid = params.get("qid")
        if qid:
            return {"entities": {qid: self.entities[qid]}}
        # EntityData URLs are passed separately, so this fixture is only used
        # through the helper below.
        raise AssertionError("unexpected fixture request")


def fixture_fetch(http, qid):
    return http.entities[qid]


class Q19167227RegressionTest(unittest.TestCase):
    def test_individual_poem_is_never_a_work_match(self):
        http = FixtureHttp()

        # Keep the fixture independent of the network/cache implementation.
        import identifier_reconciliation as module

        original = module.fetch_wikidata_entity
        module.fetch_wikidata_entity = fixture_fetch
        try:
            classification = classify_wikidata_entity(
                http, http.entities["Q19167227"]
            )
        finally:
            module.fetch_wikidata_entity = original

        self.assertEqual(classification.kind, "INDIVIDUAL_CONTENT")
        self.assertIn("individual poem", classification.reason)
        candidate = Candidate(
            "Q19167227",
            100,
            "exact-title+author-qid+year",
            "Eitel nichts!",
            classification.kind,
            classification.reason,
            classification.types,
            classification.forms,
        )
        self.assertEqual(classify_work_candidate(candidate, 90, 65), "NO_MATCH")

    def test_person_and_artwork_scopes_use_dynamic_type_labels(self):
        http = FixtureHttp()
        import identifier_reconciliation as module

        original = module.fetch_wikidata_entity
        module.fetch_wikidata_entity = fixture_fetch
        try:
            person = classify_person_entity(http, http.entities["Q999000001"])
            artwork = classify_artwork_entity(http, http.entities["Q999000003"])
        finally:
            module.fetch_wikidata_entity = original

        self.assertEqual(person.kind, "PERSON_LEVEL")
        self.assertEqual(artwork.kind, "ARTWORK_LEVEL")


if __name__ == "__main__":
    unittest.main()
