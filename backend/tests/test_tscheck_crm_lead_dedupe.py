"""Test 7+9 — CRM dedupe: same person (same whatsapp) submitting the lead form on two
different properties yields ONE lead with 2 interests, visible to the admin via
/admin/leads. Uses a unique whatsapp/email per run so it never collides with seeded
leads (Maria Teste / Joao Visitante Teste) and is safe to re-run.

NOTE: POST /api/leads is rate-limited to 10/hour per IP, so this file makes exactly
2 lead-creation calls.
"""

import time

import httpx

ADMIN_EMAIL = "teste.admin@example.com"
ADMIN_PASSWORD = "TesteAdmin#2025"


def _admin_client(base_url: str) -> httpx.Client:
    c = httpx.Client(base_url=base_url, timeout=30.0)
    r = c.post("/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return c


def test_same_person_two_properties_dedupes_into_one_lead_with_two_interests(client, backend_url):
    unique = str(int(time.time()))
    whatsapp = f"1599{unique[-7:]}"
    email = f"tscheck-dedupe-{unique}@example.com"
    name = "TSCheck Dedupe Lead"

    props = client.get("/properties").json()
    assert len(props) >= 2, "need at least 2 properties for dedupe test"
    prop_a, prop_b = props[0]["id"], props[1]["id"]

    payload_base = {
        "name": name,
        "whatsapp": whatsapp,
        "email": email,
        "intent": "comprar_morar",
        "accept_privacy": True,
    }

    r1 = client.post("/leads", json={**payload_base, "property_id": prop_a})
    assert r1.status_code == 201, r1.text

    r2 = client.post("/leads", json={**payload_base, "property_id": prop_b})
    assert r2.status_code == 201, r2.text

    # Same lead id should be reused (dedupe by whatsapp/email).
    assert r1.json()["id"] == r2.json()["id"], (r1.json(), r2.json())

    admin = _admin_client(f"{backend_url}/api")
    try:
        leads = admin.get("/admin/leads").json()
        items = leads.get("items", leads) if isinstance(leads, dict) else leads
        match = [l for l in items if l.get("id") == r1.json()["id"]]
        assert match, f"created lead {r1.json()['id']} not found in /admin/leads"
        lead = match[0]
        assert len(lead.get("interests", [])) == 2, lead.get("interests")
    finally:
        admin.close()
