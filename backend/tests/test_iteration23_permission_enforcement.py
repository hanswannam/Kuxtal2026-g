"""
Iteration 23 - Module-level permission enforcement regression.

Verifies that `require_role('super_admin','admin', permission='X')`:
- super_admin bypasses the permission check (no 403 on allowed-by-role calls)
- admin (testadmin) with only dashboard+members=true gets 403 on POST/PUT/DELETE
  of modules NOT in their permissions dict
- admin is NOT blocked on endpoints where they DO have the permission (members)
- Public GET endpoints unaffected
- Login still returns permissions key
- toggle-active safety: admin cannot toggle super_admin; nobody can self-deactivate
"""
import os
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://travel-crm-portal-2.preview.emergentagent.com",
).rstrip("/")

SUPER_ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "admin@kuxtaltravels.com")
SUPER_ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "")
LIMITED_ADMIN_EMAIL = os.environ.get("TEST_LIMITED_ADMIN_EMAIL", "testadmin@kuxtaltravels.com")
LIMITED_ADMIN_PASSWORD = os.environ.get("TEST_LIMITED_ADMIN_PASSWORD", "")
DELETE_CODE = os.environ.get("DELETE_SECRET", "BORRAR YA")

if not SUPER_ADMIN_PASSWORD or not LIMITED_ADMIN_PASSWORD:
    pytest.skip(
        "TEST_ADMIN_PASSWORD and TEST_LIMITED_ADMIN_PASSWORD must be set in env to run these tests",
        allow_module_level=True,
    )

NONEXISTENT_ID = "000000000000000000000000"  # valid-shape ObjectId that doesn't exist


# ── Session helpers ──

def _login(email: str, password: str) -> dict:
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
        timeout=20,
    )
    assert r.status_code == 200, f"login failed ({email}): {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="module")
def super_token() -> str:
    return _login(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)["token"]


@pytest.fixture(scope="module")
def limited_token() -> str:
    return _login(LIMITED_ADMIN_EMAIL, LIMITED_ADMIN_PASSWORD)["token"]


def _h(tok: str) -> dict:
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# ── 1. Login regression: permissions key present ──

class TestLoginPermissions:
    def test_super_admin_login_has_permissions_key(self):
        data = _login(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
        assert "token" in data
        assert "permissions" in data, "Login response missing 'permissions' key"
        # super_admin may have None/null perms (bypass)
        # no assertion on value shape beyond key presence

    def test_limited_admin_login_has_correct_permissions(self):
        data = _login(LIMITED_ADMIN_EMAIL, LIMITED_ADMIN_PASSWORD)
        assert "permissions" in data
        perms = data["permissions"] or {}
        assert perms.get("dashboard"), f"dashboard should be True, got {perms}"
        assert perms.get("members"), f"members should be True, got {perms}"
        for k in ("packages", "quotations", "clients", "commerce", "categories",
                  "clubs", "regalias", "referrals", "settings", "announcements",
                  "requests", "push"):
            assert not (perms.get(k)), f"perm '{k}' should be False for testadmin, got {perms.get(k)}"


# ── 2. 403 for limited admin on disallowed module endpoints ──

# Endpoints to test with NO Pydantic body (empty JSON body is fine — permission check fires first)
NO_BODY_403_CASES = [
    ("POST", "/api/commerce/categories", "categories"),
    ("POST", "/api/clubs", "clubs"),
    ("POST", "/api/regalias", "regalias"),
    ("POST", "/api/quotations/admin", "quotations"),
    ("POST", f"/api/admin/commerce/{NONEXISTENT_ID}/approve", "commerce"),
    ("POST", f"/api/admin/commerce/{NONEXISTENT_ID}/reject", "commerce"),
    ("PUT", f"/api/referrals/{NONEXISTENT_ID}/status", "referrals"),
    ("PUT", f"/api/packages/{NONEXISTENT_ID}/toggle-status", "packages"),
    ("DELETE", f"/api/packages/{NONEXISTENT_ID}?delete_code={DELETE_CODE}", "packages"),
    ("POST", "/api/admin/packages/recalculate-prices", "packages"),
    ("DELETE", f"/api/clubs/{NONEXISTENT_ID}", "clubs"),
    ("PUT", f"/api/clubs/{NONEXISTENT_ID}", "clubs"),
    ("DELETE", f"/api/regalias/{NONEXISTENT_ID}", "regalias"),
    ("PUT", f"/api/regalias/{NONEXISTENT_ID}/toggle-used", "regalias"),
    ("DELETE", "/api/commerce/categories/Restaurantes", "categories"),
]


@pytest.mark.parametrize("method,path,perm", NO_BODY_403_CASES)
def test_limited_admin_gets_403_on_disallowed_modules(limited_token, method, path, perm):
    r = requests.request(
        method,
        f"{BASE_URL}{path}",
        headers=_h(limited_token),
        json={},
        timeout=15,
    )
    assert r.status_code == 403, (
        f"{method} {path} expected 403, got {r.status_code} body={r.text[:200]}"
    )
    detail = (r.json().get("detail") or "")
    assert perm in detail.lower() or "permiso" in detail.lower(), (
        f"{method} {path} detail should mention permission '{perm}', got: {detail}"
    )


# Endpoints WITH Pydantic body — send VALID minimal payload so permission check is reached
BODY_403_CASES = [
    ("POST", "/api/packages", "packages", {
        "title": "TEST_pkg", "description": "t", "country": "GT",
        "price": 100, "duration_days": 1,
    }),
    ("PUT", f"/api/packages/{NONEXISTENT_ID}", "packages", {
        "title": "TEST_pkg", "description": "t", "country": "GT",
        "price": 100, "duration_days": 1,
    }),
    ("PUT", "/api/config/whatsapp", "settings", {"phone": "+50255555555"}),
    ("PUT", "/api/config/pricing-settings", "settings", {
        "public_markup_percent": 30.0, "member_markup_percent": 15.0
    }),
]


@pytest.mark.parametrize("method,path,perm,body", BODY_403_CASES)
def test_limited_admin_gets_403_on_disallowed_body_endpoints(limited_token, method, path, perm, body):
    r = requests.request(
        method,
        f"{BASE_URL}{path}",
        headers=_h(limited_token),
        json=body,
        timeout=15,
    )
    assert r.status_code == 403, (
        f"{method} {path} expected 403, got {r.status_code} body={r.text[:200]}"
    )
    detail = (r.json().get("detail") or "")
    assert perm in detail.lower() or "permiso" in detail.lower()


# ── 3. super_admin bypass: should NOT get 403 on permission ──

@pytest.mark.parametrize("method,path,_", NO_BODY_403_CASES)
def test_super_admin_never_gets_permission_403(super_token, method, path, _):
    r = requests.request(
        method,
        f"{BASE_URL}{path}",
        headers=_h(super_token),
        json={},
        timeout=15,
    )
    # Expect NOT 403 on permission. Could be 404 (not found), 400 (bad body), 422, or 200.
    # A 403 here would indicate super_admin was wrongly blocked.
    if r.status_code == 403:
        detail = (r.json().get("detail") or "").lower()
        assert "permiso" not in detail and "no tienes permiso" not in detail, (
            f"super_admin got permission-403 on {method} {path}: {detail}"
        )


@pytest.mark.parametrize("method,path,_,body", BODY_403_CASES)
def test_super_admin_never_gets_permission_403_body(super_token, method, path, _, body):
    r = requests.request(
        method,
        f"{BASE_URL}{path}",
        headers=_h(super_token),
        json=body,
        timeout=15,
    )
    if r.status_code == 403:
        detail = (r.json().get("detail") or "").lower()
        assert "permiso" not in detail and "no tienes permiso" not in detail, (
            f"super_admin got permission-403 on {method} {path}: {detail}"
        )


# ── 4. Limited admin ALLOWED for permitted module (members) ──

class TestLimitedAdminAllowed:
    def test_members_list_allowed(self, limited_token):
        r = requests.get(f"{BASE_URL}/api/members", headers=_h(limited_token), timeout=15)
        assert r.status_code == 200, f"expected 200, got {r.status_code} {r.text[:200]}"

    def test_dashboard_like_allowed_auth_me(self, limited_token):
        # /auth/me requires any authenticated user — sanity check
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=_h(limited_token), timeout=15)
        assert r.status_code == 200


# ── 5. Public GET endpoints unaffected (no auth) ──

class TestPublicGetsUnaffected:
    def test_get_packages_public(self):
        r = requests.get(f"{BASE_URL}/api/packages", timeout=15)
        assert r.status_code == 200

    def test_get_commerce_public(self):
        r = requests.get(f"{BASE_URL}/api/commerce", timeout=15)
        assert r.status_code == 200

    def test_get_commerce_categories_public(self):
        r = requests.get(f"{BASE_URL}/api/commerce/categories", timeout=15)
        assert r.status_code == 200

    def test_get_config_pricing_settings_public(self):
        r = requests.get(f"{BASE_URL}/api/config/pricing-settings", timeout=15)
        assert r.status_code == 200

    def test_get_clubs_public(self):
        r = requests.get(f"{BASE_URL}/api/clubs", timeout=15)
        # may be public or protected — accept 200 or 401/403
        assert r.status_code in (200, 401, 403)


# ── 6. Public POST /quotations (no auth) still works ──

class TestPublicQuotationPost:
    def test_public_quotation_post_no_auth(self):
        payload = {
            "package_id": "",
            "name": "TEST_iter23_public",
            "email": "test_iter23@example.com",
            "phone": "+50255555555",
            "message": "regression test",
            "guests": 1,
        }
        r = requests.post(f"{BASE_URL}/api/quotations", json=payload, timeout=15)
        assert r.status_code in (200, 201), f"{r.status_code} {r.text[:200]}"


# ── 7. toggle-active protections ──

class TestToggleActiveProtection:
    def _find_user_id(self, token, email):
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=_h(token), timeout=15)
        assert r.status_code == 200
        users = r.json() if isinstance(r.json(), list) else r.json().get("users", [])
        for u in users:
            if (u.get("email") or "").lower() == email.lower():
                return u.get("_id") or u.get("id")
        return None

    def test_limited_admin_cannot_toggle_super_admin(self, super_token, limited_token):
        super_id = self._find_user_id(super_token, SUPER_ADMIN_EMAIL)
        assert super_id, "super_admin id not found"
        r = requests.put(
            f"{BASE_URL}/api/admin/users/{super_id}/toggle-active",
            headers=_h(limited_token),
            timeout=15,
        )
        assert r.status_code == 403, (
            f"limited admin should NOT be able to toggle super_admin, got {r.status_code} {r.text[:200]}"
        )

    def test_super_admin_cannot_self_deactivate(self, super_token):
        super_id = None
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=_h(super_token), timeout=15)
        if r.status_code == 200:
            super_id = r.json().get("_id") or r.json().get("id")
        if not super_id:
            pytest.skip("could not resolve super_admin _id")
        r = requests.put(
            f"{BASE_URL}/api/admin/users/{super_id}/toggle-active",
            headers=_h(super_token),
            timeout=15,
        )
        assert r.status_code == 400, (
            f"super_admin should be blocked from self-deactivate, got {r.status_code} {r.text[:200]}"
        )
        detail = (r.json().get("detail") or "").lower()
        assert "ti mismo" in detail or "yourself" in detail or "no puedes" in detail
