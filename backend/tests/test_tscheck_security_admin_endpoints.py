"""Test 6 — security: admin endpoints reject unauthenticated requests; setup is single-use."""

import httpx


def test_admin_leads_requires_auth(client):
    r = client.get("/admin/leads")
    assert r.status_code == 401, r.text


def test_admin_leads_export_requires_auth(client):
    r = client.get("/admin/leads/export")
    assert r.status_code == 401, r.text


def test_admin_dashboard_requires_auth(client):
    r = client.get("/admin/dashboard")
    assert r.status_code == 401, r.text


def test_admin_property_patch_requires_auth(client):
    # Use a random-looking id; endpoint must reject before even checking existence.
    r = client.patch("/admin/properties/does-not-exist-id", json={"price": 1})
    assert r.status_code == 401, r.text


def test_admin_property_delete_requires_auth(client):
    r = client.delete("/admin/properties/does-not-exist-id")
    assert r.status_code == 401, r.text


def test_setup_conflicts_when_admin_exists(client):
    r = client.post(
        "/auth/setup",
        json={"email": "tscheck-setup@example.com", "password": "Abcdef123!", "name": "TSCheck Setup"},
    )
    assert r.status_code == 409, r.text
