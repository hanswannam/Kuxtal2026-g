"""
Iteration 19 tests:
- Extended Member fields (POST/PUT /api/members) with 18 new fields
- Regalías CRUD + member-scoped read
- Clubs Vacacionales CRUD
- Observations endpoints removed (should be 404)
- PUT /api/commerce/{id} persistence
- DELETE with BORRAR YA protection
"""

import os
import time
import pytest
import requests
from urllib.parse import quote

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://vacation-club-portal.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@kuxtaltravels.com")
ADMIN_PASS = os.environ.get("ADMIN_PASSWORD", "KuxtalAdmin2024!")
DELETE_CODE = "BORRAR YA"


# ── Fixtures ─────────────────────────────────────────────
@pytest.fixture(scope="module")
def admin_client():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("token") or r.json().get("access_token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def member_client():
    """KT-001 member login"""
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/member-login",
               json={"contract_number": "KT-001", "dpi": "1234567890101"})
    assert r.status_code == 200, f"Member login failed: {r.status_code} {r.text}"
    tok = r.json().get("token") or r.json().get("access_token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s, r.json()


# ── Extended Member Fields ───────────────────────────────
class TestExtendedMemberFields:

    def test_create_member_with_extended_fields(self, admin_client):
        unique = f"TEST-IT19-{int(time.time())}"
        payload = {
            "contract_number": unique,
            "dpi": "9999999990101",
            "name": "TEST_Extended Member",
            "email": "test_ext@example.com",
            "phone": "12345678",
            "service_years": 5,
            "membership_start": "2025-01-01",
            "membership_end": "2030-01-01",
            "family_members_allowed": 3,
            "investment_amount": 15000.0,
            "investment_plan": "Gold",
            "status": "active",
            "contract_date": "2025-01-15",
            "age": 42,
            "marital_status": "Casado",
            "nationality": "Guatemalteca",
            "profession": "Ingeniero",
            "address": "Zona 10, Guatemala",
            "coowner_name": "Jane Doe",
            "coowner_nationality": "Guatemalteca",
            "coowner_profession": "Doctora",
            "coowner_phone": "87654321",
            "coowner_email": "jane@example.com",
            "vigencia": "5 años",
            "cuotas": "60 mensuales",
            "bank": "Banco Industrial",
            "termination_date": "2030-01-15",
            "tc": "USD",
            "nit": "123456789",
            "billing_name": "TEST Billing Co",
            "observations": "Prueba observaciones iteración 19",
        }
        r = admin_client.post(f"{BASE_URL}/api/members", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        member_id = data["_id"]

        # Verify all extended fields persisted via GET
        g = admin_client.get(f"{BASE_URL}/api/members")
        assert g.status_code == 200
        created = next((m for m in g.json() if m["_id"] == member_id), None)
        assert created is not None
        for k in [
            "contract_date", "age", "marital_status", "nationality", "profession",
            "address", "coowner_name", "coowner_nationality", "coowner_profession",
            "coowner_phone", "coowner_email", "vigencia", "cuotas", "bank",
            "termination_date", "tc", "nit", "billing_name", "observations"
        ]:
            assert created.get(k) == payload[k], f"Field {k} not persisted"
        pytest.created_member_id = member_id

    def test_update_member_extended_fields(self, admin_client):
        mid = pytest.created_member_id
        payload = {
            "contract_number": f"TEST-IT19-UPD-{int(time.time())}",
            "dpi": "9999999990101",
            "name": "TEST_Extended Updated",
            "service_years": 7,
            "family_members_allowed": 4,
            "observations": "Actualizado",
            "address": "Zona 14, Guatemala",
            "age": 43,
            "nit": "987654321",
            "billing_name": "Updated Billing",
        }
        r = admin_client.put(f"{BASE_URL}/api/members/{mid}", json=payload)
        assert r.status_code == 200, r.text
        updated = r.json()
        assert updated["observations"] == "Actualizado"
        assert updated["address"] == "Zona 14, Guatemala"
        assert updated["age"] == 43
        assert updated["nit"] == "987654321"

    def test_delete_member_requires_code(self, admin_client):
        mid = pytest.created_member_id
        # Missing code
        r = admin_client.delete(f"{BASE_URL}/api/members/{mid}")
        assert r.status_code in (400, 403, 422), f"Expected rejection, got {r.status_code}"
        # Wrong code
        r = admin_client.delete(f"{BASE_URL}/api/members/{mid}?delete_code=WRONG")
        assert r.status_code in (400, 403)
        # Correct code
        r = admin_client.delete(f"{BASE_URL}/api/members/{mid}?delete_code={quote(DELETE_CODE)}")
        assert r.status_code == 200


# ── Regalías CRUD ────────────────────────────────────────
class TestRegalias:

    def test_create_regalia_as_admin(self, admin_client, member_client):
        _, member_info = member_client
        # Find KT-001 member id
        g = admin_client.get(f"{BASE_URL}/api/members")
        kt001 = next((m for m in g.json() if m["contract_number"] == "KT-001"), None)
        assert kt001 is not None
        payload = {
            "name": "TEST Regalia Spa",
            "image_url": "https://example.com/spa.jpg",
            "member_id": kt001["_id"],
            "member_name": kt001["name"],
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
        }
        r = admin_client.post(f"{BASE_URL}/api/regalias", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST Regalia Spa"
        assert data["used"] is False
        assert data["status"] == "active"
        pytest.regalia_id = data["_id"]
        pytest.regalia_member_id = kt001["_id"]

    def test_admin_list_regalias(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/regalias")
        assert r.status_code == 200
        ids = [x["_id"] for x in r.json()]
        assert pytest.regalia_id in ids

    def test_member_list_regalias_filtered(self, member_client):
        s, info = member_client
        r = s.get(f"{BASE_URL}/api/regalias")
        assert r.status_code == 200, r.text
        data = r.json()
        # Member should only see their own regalias
        for reg in data:
            assert reg["member_id"] == pytest.regalia_member_id, \
                f"Member saw regalia for another member: {reg}"

    def test_toggle_used(self, admin_client):
        r = admin_client.put(f"{BASE_URL}/api/regalias/{pytest.regalia_id}/toggle-used")
        assert r.status_code == 200
        assert r.json()["used"] is True
        # Toggle back
        r = admin_client.put(f"{BASE_URL}/api/regalias/{pytest.regalia_id}/toggle-used")
        assert r.json()["used"] is False

    def test_delete_regalia_with_code(self, admin_client):
        # Wrong code
        r = admin_client.delete(f"{BASE_URL}/api/regalias/{pytest.regalia_id}?delete_code=WRONG")
        assert r.status_code in (400, 403)
        # Correct
        r = admin_client.delete(f"{BASE_URL}/api/regalias/{pytest.regalia_id}?delete_code={quote(DELETE_CODE)}")
        assert r.status_code == 200
        # Verify soft delete — should not appear in list
        lst = admin_client.get(f"{BASE_URL}/api/regalias").json()
        ids = [x["_id"] for x in lst]
        assert pytest.regalia_id not in ids


# ── Clubs CRUD ───────────────────────────────────────────
class TestClubs:

    def test_create_club(self, admin_client):
        payload = {
            "name": "TEST Club Las Vegas",
            "logo_url": "https://example.com/lv.png",
            "description": "Club premium en Las Vegas",
            "address": "Las Vegas, NV",
            "benefits": ["Spa gratis", "Piscina privada"],
        }
        r = admin_client.post(f"{BASE_URL}/api/clubs", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST Club Las Vegas"
        assert data["benefits"] == ["Spa gratis", "Piscina privada"]
        pytest.club_id = data["_id"]

    def test_list_clubs_public(self):
        r = requests.get(f"{BASE_URL}/api/clubs")
        assert r.status_code == 200
        ids = [c["_id"] for c in r.json()]
        assert pytest.club_id in ids

    def test_update_club(self, admin_client):
        payload = {
            "name": "TEST Club Las Vegas UPDATED",
            "description": "Descripción actualizada",
            "address": "Strip, Las Vegas",
            "benefits": ["Spa gratis", "Piscina privada", "Desayuno"],
        }
        r = admin_client.put(f"{BASE_URL}/api/clubs/{pytest.club_id}", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST Club Las Vegas UPDATED"
        assert "Desayuno" in data["benefits"]

    def test_delete_club_with_code(self, admin_client):
        r = admin_client.delete(f"{BASE_URL}/api/clubs/{pytest.club_id}?delete_code=WRONG")
        assert r.status_code in (400, 403)
        r = admin_client.delete(f"{BASE_URL}/api/clubs/{pytest.club_id}?delete_code={quote(DELETE_CODE)}")
        assert r.status_code == 200


# ── Observations Endpoints Removed ───────────────────────
class TestObservationsRemoved:

    def test_post_observation_404(self, admin_client):
        # Find KT-001
        g = admin_client.get(f"{BASE_URL}/api/members").json()
        mid = next(m["_id"] for m in g if m["contract_number"] == "KT-001")
        r = admin_client.post(f"{BASE_URL}/api/members/{mid}/observations",
                              json={"text": "test"})
        assert r.status_code == 404, f"Expected 404 for removed endpoint, got {r.status_code}"

    def test_get_observations_404(self, admin_client):
        g = admin_client.get(f"{BASE_URL}/api/members").json()
        mid = next(m["_id"] for m in g if m["contract_number"] == "KT-001")
        r = admin_client.get(f"{BASE_URL}/api/members/{mid}/observations")
        assert r.status_code == 404


# ── Commerce PUT Persistence ─────────────────────────────
class TestCommerceUpdate:

    def test_update_commerce_persists(self, admin_client):
        lst = admin_client.get(f"{BASE_URL}/api/commerce").json()
        assert len(lst) > 0
        target = lst[0]
        cid = target["_id"]
        original_name = target["name"]
        new_name = f"{original_name} (IT19 EDIT {int(time.time())})"

        payload = {
            "name": new_name,
            "category": target.get("category", "restaurantes"),
            "description": target.get("description", ""),
            "address": target.get("address", ""),
            "phone": target.get("phone", ""),
            "email": target.get("email", ""),
            "logo_url": target.get("logo_url", ""),
            "website": target.get("website", ""),
            "opening_hours": target.get("opening_hours", ""),
            "discount_percentage": target.get("discount_percentage", 0),
            "validation_code": target.get("validation_code", ""),
            "status": target.get("status", "active"),
        }
        r = admin_client.put(f"{BASE_URL}/api/commerce/{cid}", json=payload)
        assert r.status_code == 200, r.text
        assert r.json()["name"] == new_name

        # Re-fetch
        g = admin_client.get(f"{BASE_URL}/api/commerce/{cid}")
        assert g.status_code == 200
        assert g.json()["name"] == new_name

        # Restore original name
        payload["name"] = original_name
        admin_client.put(f"{BASE_URL}/api/commerce/{cid}", json=payload)
