"""
Iteration 21 tests:
- Permissions matrix on admin users
- Package visibility (public/internal)
- Quotations filters (date range + creator) and created_by tracking
- Auth regressions (legacy admin login, member login)
- Public endpoints regression
"""
import os
import uuid
import requests
import pytest
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_EMAIL = "admin@kuxtaltravels.com"
ADMIN_PASSWORD = "KuxtalAdmin2024!"
MEMBER_CONTRACT = "KT-001"
MEMBER_DPI = "1234567890101"
DELETE_SECRET = "BORRAR YA"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ──────────── Auth regression ────────────
class TestAuthRegression:
    def test_admin_login_legacy(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "super_admin"
        assert "token" in data

    def test_member_login_legacy(self):
        r = requests.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": MEMBER_CONTRACT, "dpi": MEMBER_DPI})
        assert r.status_code == 200
        assert r.json()["role"] == "member"


# ──────────── Permissions matrix ────────────
class TestPermissionsMatrix:
    def test_list_admin_users_has_permissions_field(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        assert r.status_code == 200, r.text
        users = r.json()
        assert isinstance(users, list)
        assert len(users) > 0
        # At least the super_admin must exist. permissions may not be set on legacy admin
        for u in users:
            # field must exist or be absent (not crash). Verify no password_hash leaked
            assert "password_hash" not in u
        # Find super admin
        sa = next((u for u in users if u.get("email") == ADMIN_EMAIL), None)
        assert sa is not None, "Super admin should be in list"
        assert sa.get("role") == "super_admin"

    def test_feature_keys_endpoint(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/feature-keys", headers=admin_headers)
        assert r.status_code == 200
        keys = r.json()
        assert isinstance(keys, list)
        assert "quotations" in keys
        assert "packages" in keys
        assert "dashboard" in keys

    def test_create_admin_and_update_permissions(self, admin_headers):
        uid = uuid.uuid4().hex[:8]
        email = f"test_admin_{uid}@kuxtal.com"
        # Create admin user
        r = requests.post(f"{BASE_URL}/api/admin/users",
                          headers=admin_headers,
                          json={
                              "email": email,
                              "password": "TestPass123!",
                              "name": f"TEST Admin {uid}",
                              "role": "admin",
                              "permissions": {"dashboard": True, "quotations": True}
                          })
        assert r.status_code == 200, r.text
        created = r.json()
        user_id = created["id"]
        assert created["permissions"].get("quotations") is True
        assert created["role"] == "admin"

        # Update permissions using the existing endpoint
        r2 = requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}/permissions",
            headers=admin_headers,
            json={"permissions": {"dashboard": True, "quotations": True, "packages": True, "clients": True}}
        )
        assert r2.status_code == 200, r2.text
        saved = r2.json().get("permissions", {})
        assert saved.get("packages") is True
        assert saved.get("quotations") is True

        # Verify persisted via list endpoint
        r3 = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        assert r3.status_code == 200
        found = next((u for u in r3.json() if u.get("email") == email), None)
        assert found is not None
        perms = found.get("permissions", {})
        assert perms.get("packages") is True
        assert perms.get("quotations") is True

        # Cleanup: delete the created admin
        from urllib.parse import quote
        del_r = requests.delete(
            f"{BASE_URL}/api/admin/users/{user_id}?delete_code={quote(DELETE_SECRET)}",
            headers=admin_headers
        )
        assert del_r.status_code in (200, 204)

    def test_super_admin_bypasses_permissions(self, admin_headers):
        # Super admin should hit any admin endpoint even if permissions are empty
        # /api/members requires admin auth – super_admin should pass
        r = requests.get(f"{BASE_URL}/api/members", headers=admin_headers)
        assert r.status_code == 200
        r2 = requests.get(f"{BASE_URL}/api/quotations", headers=admin_headers)
        assert r2.status_code == 200
        r3 = requests.get(f"{BASE_URL}/api/packages", headers=admin_headers)
        assert r3.status_code == 200


# ──────────── Package visibility ────────────
class TestPackageVisibility:
    created_ids = []

    def test_create_internal_and_public_packages(self, admin_headers):
        uid = uuid.uuid4().hex[:6]
        # Create INTERNAL package
        r1 = requests.post(f"{BASE_URL}/api/packages", headers=admin_headers, json={
            "title": f"TEST_INTERNAL_{uid}",
            "description": "Internal only",
            "country": "Guatemala",
            "price": 1000, "duration_days": 2,
            "category": "paquete",
            "visibility": "internal",
            "status": "active"
        })
        assert r1.status_code == 200, r1.text
        internal_id = r1.json()["_id"]
        TestPackageVisibility.created_ids.append(internal_id)
        assert r1.json().get("visibility") == "internal"

        # Create PUBLIC package
        r2 = requests.post(f"{BASE_URL}/api/packages", headers=admin_headers, json={
            "title": f"TEST_PUBLIC_{uid}",
            "description": "Public package",
            "country": "Guatemala",
            "price": 1500, "duration_days": 3,
            "category": "paquete",
            "visibility": "public",
            "status": "active"
        })
        assert r2.status_code == 200, r2.text
        public_id = r2.json()["_id"]
        TestPackageVisibility.created_ids.append(public_id)
        assert r2.json().get("visibility") == "public"

    def test_public_listing_hides_internal_packages(self):
        r = requests.get(f"{BASE_URL}/api/packages")
        assert r.status_code == 200
        pkgs = r.json()
        internal_seen = [p for p in pkgs if p.get("visibility") == "internal"]
        assert internal_seen == [], f"Internal package leaked into public list: {internal_seen}"
        # At least one of our public TEST packages must be there
        titles = [p.get("title", "") for p in pkgs]
        has_public_test = any(t.startswith("TEST_PUBLIC_") for t in titles)
        assert has_public_test, "Public test package missing from public listing"

    def test_public_search_hides_internal(self):
        r = requests.get(f"{BASE_URL}/api/packages?search=TEST_INTERNAL")
        assert r.status_code == 200
        found = r.json()
        # Nothing with visibility internal should be returned
        for p in found:
            assert p.get("visibility") != "internal", "Internal package leaked via search"

    def test_admin_can_fetch_internal_with_flag(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/packages?include_internal=true", headers=admin_headers)
        assert r.status_code == 200
        pkgs = r.json()
        internal_titles = [p.get("title", "") for p in pkgs if p.get("visibility") == "internal"]
        assert any(t.startswith("TEST_INTERNAL_") for t in internal_titles), \
            "Admin with include_internal=true should see internal packages"

    def test_cleanup_test_packages(self, admin_headers):
        from urllib.parse import quote
        for pid in TestPackageVisibility.created_ids:
            requests.delete(
                f"{BASE_URL}/api/packages/{pid}?delete_code={quote(DELETE_SECRET)}",
                headers=admin_headers
            )


# ──────────── Quotations: filters + creator tracking ────────────
class TestQuotationsFilters:
    def test_public_quotation_has_created_by_system(self):
        uid = uuid.uuid4().hex[:6]
        r = requests.post(f"{BASE_URL}/api/quotations", json={
            "name": f"TEST_PublicQuote_{uid}",
            "email": f"test_{uid}@example.com",
            "phone": "+502 5555-0000",
            "contract_number": "",
            "message": "Test",
            "guests": 1
        })
        assert r.status_code == 200, r.text
        d = r.json()
        # System created quotations should have a created_by_name indicating source
        assert "created_by_name" in d
        assert d.get("created_by_id") in (None, "")

    def test_admin_created_quotation_has_creator(self, admin_headers):
        uid = uuid.uuid4().hex[:6]
        r = requests.post(f"{BASE_URL}/api/quotations/admin", headers=admin_headers, json={
            "name": f"TEST_AdminQuote_{uid}",
            "email": f"adminquote_{uid}@example.com",
            "phone": "+502 5555-1111",
            "message": "from admin",
            "guests": 2
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("created_by_name"), "Admin-created quotation should record created_by_name"
        assert d.get("created_by_id"), "Admin-created quotation should record created_by_id"

    def test_list_quotations_returns_creator_fields(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/quotations", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0
        sample = data[0]
        assert "created_at" in sample
        # creator fields should exist on at least some records
        has_creator_name = any("created_by_name" in q for q in data)
        assert has_creator_name, "Expected created_by_name field on quotations"

    def test_filter_by_creator_system(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/quotations?created_by=system", headers=admin_headers)
        assert r.status_code == 200
        for q in r.json():
            assert q.get("created_by_id") in (None, "")

    def test_filter_by_date_range(self, admin_headers):
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
        r = requests.get(
            f"{BASE_URL}/api/quotations?date_from={today}&date_to={tomorrow}",
            headers=admin_headers
        )
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # All returned quotations should have created_at on or after today
        for q in data:
            ca = q.get("created_at", "")
            assert ca >= today, f"date filter failed: {ca} not >= {today}"

    def test_filter_by_past_date_returns_empty_or_old(self, admin_headers):
        old = "2020-01-01"
        old_end = "2020-01-02"
        r = requests.get(
            f"{BASE_URL}/api/quotations?date_from={old}&date_to={old_end}",
            headers=admin_headers
        )
        assert r.status_code == 200
        # Nothing from 2020 should exist in this preview env
        assert r.json() == []


# ──────────── Public endpoint regressions ────────────
class TestPublicRegressions:
    def test_commerce_categories(self):
        r = requests.get(f"{BASE_URL}/api/commerce/categories")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_public_packages(self):
        r = requests.get(f"{BASE_URL}/api/packages")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_clubs_list(self):
        r = requests.get(f"{BASE_URL}/api/clubs")
        # May be 200 with empty list or 200; just ensure not 5xx
        assert r.status_code in (200, 404)
