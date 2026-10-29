"""Test 2+3 — lead capture gates content server-side too: without the lead cookie,
GET /api/properties/{slug} must report unlocked=false and hide description/pdf_url.
"""


def test_property_detail_locked_without_cookie(client):
    r = client.get("/properties/apartamento-sorocaba-v-2d6700")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["unlocked"] is False
    assert body.get("description") is None
    assert body.get("pdf_url") is None
    # Teaser fields are still present.
    assert body["title"]
    assert body["price"] is not None


def test_property_detail_404_for_unknown_slug(client):
    r = client.get("/properties/tscheck-does-not-exist-slug")
    assert r.status_code == 404, r.text
