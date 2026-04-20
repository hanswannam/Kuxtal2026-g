"""Iteration 20 tests: 
- GET /api/regalias?all=true (global catalog for admin)
- PUT /api/members/{id}/regalias (bulk assign/unassign)
- GET /api/regalias?member_id=X (admin filter by member)
- Trip detail: GET /api/packages?featured=true and GET /api/packages/{id}
- Regression: Commerce PUT
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ADMIN_EMAIL = "admin@kuxtaltravels.com"
ADMIN_PASS = "KuxtalAdmin2024!"
DELETE_CODE = "BORRAR YA"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def created_members(admin_session):
    s = admin_session
    ids = []
    for i, code in enumerate(["TEST_I20_A", "TEST_I20_B"]):
        r = s.post(
            f"{BASE_URL}/api/members",
            json={
                "member_code": code,
                "name": f"Test Socio {i}",
                "dpi": f"900000000000{i}",
                "email": f"test_i20_{i}@example.com",
                "password": "1234567890101",
                "contract_number": f"CNT-I20-{i}",
            },
        )
        assert r.status_code in (200, 201), f"member create failed: {r.text}"
        ids.append(r.json().get("_id") or r.json().get("id"))
    yield ids
    # cleanup
    for mid in ids:
        s.delete(f"{BASE_URL}/api/members/{mid}", params={"delete_code": DELETE_CODE})


@pytest.fixture(scope="module")
def created_regalias(admin_session):
    s = admin_session
    ids = []
    for i in range(3):
        r = s.post(
            f"{BASE_URL}/api/regalias",
            json={"name": f"TEST_I20_Regalia_{i}", "image_url": "", "start_date": "2026-01-01", "end_date": "2026-12-31"},
        )
        assert r.status_code in (200, 201), r.text
        ids.append(r.json().get("_id"))
    yield ids
    for rid in ids:
        s.delete(f"{BASE_URL}/api/regalias/{rid}", params={"delete_code": DELETE_CODE})


class TestRegaliasCatalog:
    def test_list_all_admin(self, admin_session, created_regalias):
        r = admin_session.get(f"{BASE_URL}/api/regalias", params={"all": "true"})
        assert r.status_code == 200
        names = [x["name"] for x in r.json()]
        for rid_name in ["TEST_I20_Regalia_0", "TEST_I20_Regalia_1", "TEST_I20_Regalia_2"]:
            assert rid_name in names

    def test_list_member_filter_empty_initially(self, admin_session, created_members, created_regalias):
        mid = created_members[0]
        r = admin_session.get(f"{BASE_URL}/api/regalias", params={"member_id": mid})
        assert r.status_code == 200
        # Should NOT contain any created regalias (they were created without member)
        for item in r.json():
            assert item.get("member_id") != "", "unassigned regalia leaked into member filter"


class TestAssignRegalias:
    def test_assign_to_member(self, admin_session, created_members, created_regalias):
        mid_a = created_members[0]
        # Assign first 2 regalias to member A
        r = admin_session.put(
            f"{BASE_URL}/api/members/{mid_a}/regalias",
            json={"regalia_ids": created_regalias[:2]},
        )
        assert r.status_code == 200
        assert r.json().get("count") == 2
        # Verify via GET with member_id filter
        r2 = admin_session.get(f"{BASE_URL}/api/regalias", params={"member_id": mid_a})
        assert r2.status_code == 200
        names = sorted([x["name"] for x in r2.json()])
        assert names == ["TEST_I20_Regalia_0", "TEST_I20_Regalia_1"]
        for x in r2.json():
            assert x["member_id"] == mid_a

    def test_unassign_one(self, admin_session, created_members, created_regalias):
        mid_a = created_members[0]
        # Now keep only regalia 0 assigned; regalia 1 must be detached
        r = admin_session.put(
            f"{BASE_URL}/api/members/{mid_a}/regalias",
            json={"regalia_ids": [created_regalias[0]]},
        )
        assert r.status_code == 200
        r2 = admin_session.get(f"{BASE_URL}/api/regalias", params={"member_id": mid_a})
        names = [x["name"] for x in r2.json()]
        assert names == ["TEST_I20_Regalia_0"]
        # Regalia 1 should now be unassigned (member_id="")
        r3 = admin_session.get(f"{BASE_URL}/api/regalias", params={"all": "true"})
        reg1 = next(x for x in r3.json() if x["name"] == "TEST_I20_Regalia_1")
        assert reg1.get("member_id", "") == ""

    def test_does_not_hijack_other_members_regalias(self, admin_session, created_members, created_regalias):
        mid_a, mid_b = created_members
        # Assign regalia 2 to member B
        r = admin_session.put(
            f"{BASE_URL}/api/members/{mid_b}/regalias",
            json={"regalia_ids": [created_regalias[2]]},
        )
        assert r.status_code == 200
        # Member A saves with only regalia 0 — should not affect regalia 2 (member B)
        admin_session.put(
            f"{BASE_URL}/api/members/{mid_a}/regalias",
            json={"regalia_ids": [created_regalias[0]]},
        )
        r2 = admin_session.get(f"{BASE_URL}/api/regalias", params={"member_id": mid_b})
        names = [x["name"] for x in r2.json()]
        assert "TEST_I20_Regalia_2" in names, "regalia assigned to member B was hijacked"

    def test_member_not_found_returns_404(self, admin_session):
        fake = "507f1f77bcf86cd799439011"
        r = admin_session.put(
            f"{BASE_URL}/api/members/{fake}/regalias",
            json={"regalia_ids": []},
        )
        assert r.status_code == 404


class TestTripDetail:
    def test_featured_packages_load(self):
        r = requests.get(f"{BASE_URL}/api/packages", params={"featured": "true"})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    def test_package_detail_by_id(self):
        # Try the known-good Cancún package
        known_id = "69dd8c80abf5138d2b22da3d"
        r = requests.get(f"{BASE_URL}/api/packages/{known_id}")
        # Accept 200 or 404 (package may or may not exist in this env)
        assert r.status_code in (200, 404)
        if r.status_code == 200:
            data = r.json()
            # Verify shape the TripDetailPage expects
            assert isinstance(data, dict)
            # Fields may include itinerary/includes/gallery as arrays or missing
            for key in ("itinerary", "includes", "gallery"):
                if key in data and data[key] is not None:
                    assert isinstance(data[key], list), f"{key} should be list or None"

    def test_all_featured_packages_render_shape(self):
        r = requests.get(f"{BASE_URL}/api/packages", params={"featured": "true"})
        assert r.status_code == 200
        for pkg in r.json()[:5]:
            pid = pkg.get("_id") or pkg.get("id")
            if not pid:
                continue
            d = requests.get(f"{BASE_URL}/api/packages/{pid}")
            assert d.status_code == 200, f"Package {pid} returned {d.status_code}"
            body = d.json()
            # Defensive checks for fields used by TripDetailPage
            for key in ("itinerary", "includes", "gallery"):
                if key in body and body[key] is not None:
                    assert isinstance(body[key], list), f"{pid} {key} not a list"


class TestCommerceRegression:
    def test_commerce_put_persists(self, admin_session):
        s = admin_session
        # Create a commerce
        r = s.post(
            f"{BASE_URL}/api/commerce",
            json={"name": "TEST_I20_Commerce", "description": "desc", "category": "other", "address": "addr"},
        )
        assert r.status_code in (200, 201), r.text
        cid = r.json().get("_id")
        try:
            # Update name
            u = s.put(f"{BASE_URL}/api/commerce/{cid}", json={"name": "TEST_I20_Commerce_Updated"})
            assert u.status_code == 200
            # Re-fetch and verify
            g = s.get(f"{BASE_URL}/api/commerce/{cid}")
            assert g.status_code == 200
            assert g.json().get("name") == "TEST_I20_Commerce_Updated"
        finally:
            s.delete(f"{BASE_URL}/api/commerce/{cid}", params={"delete_code": DELETE_CODE})
