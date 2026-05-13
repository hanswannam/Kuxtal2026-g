"""
Iteration 22 backend test suite
Tests:
- Admin users CRUD (create, update, reset-password, toggle-active, delete)
- Permissions update
- Audit log endpoint + content
- POST /api/auth/login now includes permissions in response
- GET /api/auth/me regression
- RBAC: super_admin vs limited admin (testadmin)
- Smoke regression on list endpoints
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://travel-crm-portal-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

SUPER_ADMIN = {"email": "admin@kuxtaltravels.com", "password": "KuxtalAdmin2024!"}
LIMITED_ADMIN = {"email": "testadmin@kuxtaltravels.com", "password": "TestAdmin123!"}
DELETE_CODE = "BORRAR YA"

# Shared state across tests
state = {
    "super_token": None,
    "super_id": None,
    "super_perms_in_login": None,
    "limited_token": None,
    "limited_id": None,
    "limited_perms": None,
    "created_user_id": None,
    "created_user_email": f"TEST_audit_user_{int(time.time())}@example.com",
}


# ── Fixtures ──
@pytest.fixture(scope="module", autouse=True)
def setup_and_teardown():
    # Login super admin
    r = requests.post(f"{API}/auth/login", json=SUPER_ADMIN, timeout=15)
    assert r.status_code == 200, f"super admin login failed: {r.status_code} {r.text}"
    d = r.json()
    state["super_token"] = d["token"]
    state["super_id"] = d["id"]
    state["super_perms_in_login"] = d.get("permissions")

    # Login limited admin
    r = requests.post(f"{API}/auth/login", json=LIMITED_ADMIN, timeout=15)
    assert r.status_code == 200, f"limited admin login failed: {r.status_code} {r.text}"
    d = r.json()
    state["limited_token"] = d["token"]
    state["limited_id"] = d["id"]
    state["limited_perms"] = d.get("permissions")

    yield

    # Teardown: delete created user if still present
    uid = state.get("created_user_id")
    if uid:
        try:
            requests.delete(
                f"{API}/admin/users/{uid}?delete_code={DELETE_CODE.replace(' ', '%20')}",
                headers={"Authorization": f"Bearer {state['super_token']}"},
                timeout=10,
            )
        except Exception:
            pass


def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ── Auth Login Response Shape ──

class TestLoginResponse:
    def test_login_returns_permissions_field(self):
        # Super admin login returns permissions field (may be None or dict)
        assert "super_perms_in_login" in state
        # super_admin may not have permissions dict populated; field key must exist in response
        r = requests.post(f"{API}/auth/login", json=SUPER_ADMIN, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "permissions" in data, "login response must include 'permissions' key"
        assert data["role"] == "super_admin"
        assert "token" in data and isinstance(data["token"], str)

    def test_limited_admin_login_permissions_object(self):
        r = requests.post(f"{API}/auth/login", json=LIMITED_ADMIN, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "admin"
        perms = data.get("permissions")
        assert isinstance(perms, dict), f"limited admin permissions must be dict, got {type(perms)}"
        assert perms.get("dashboard")
        assert perms.get("members")
        # Should NOT have other perms enabled
        assert perms.get("users") is not True
        assert perms.get("packages") is not True

    def test_auth_me_regression(self):
        r = requests.get(f"{API}/auth/me", headers=auth(state["super_token"]), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("email") == SUPER_ADMIN["email"]
        assert data.get("role") == "super_admin"


# ── Admin Users CRUD ──

class TestAdminUsersCRUD:
    def test_create_user_super_admin(self):
        payload = {
            "email": state["created_user_email"],
            "password": "InitPass123",
            "name": "TEST Audit User",
            "role": "admin",
        }
        r = requests.post(f"{API}/admin/users", headers=auth(state["super_token"]), json=payload, timeout=15)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        data = r.json()
        assert "id" in data
        assert data["email"] == payload["email"].lower()
        assert data["role"] == "admin"
        # default perms for admin role: dashboard, quotations, clients (per code)
        assert data.get("permissions", {}).get("dashboard") is True
        state["created_user_id"] = data["id"]

    def test_create_user_duplicate_email_rejected(self):
        payload = {
            "email": state["created_user_email"],
            "password": "AnotherPass123",
            "name": "dup",
            "role": "admin",
        }
        r = requests.post(f"{API}/admin/users", headers=auth(state["super_token"]), json=payload, timeout=15)
        assert r.status_code == 400, f"expected 400 duplicate email, got {r.status_code} {r.text}"
        assert "Email" in r.text or "email" in r.text

    def test_create_user_forbidden_for_limited_admin(self):
        payload = {
            "email": f"TEST_never_{int(time.time())}@example.com",
            "password": "Pass12345",
            "name": "x",
            "role": "admin",
        }
        r = requests.post(f"{API}/admin/users", headers=auth(state["limited_token"]), json=payload, timeout=15)
        assert r.status_code == 403, f"limited admin should get 403, got {r.status_code}"

    def test_update_user_name_and_email(self):
        uid = state["created_user_id"]
        assert uid
        new_email = f"TEST_audit_upd_{int(time.time())}@example.com"
        payload = {"name": "TEST Updated Name", "email": new_email}
        r = requests.put(f"{API}/admin/users/{uid}", headers=auth(state["super_token"]), json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("name") == "TEST Updated Name"
        assert data.get("email") == new_email.lower()
        state["created_user_email"] = new_email.lower()
        # verify via GET list
        r2 = requests.get(f"{API}/admin/users", headers=auth(state["super_token"]), timeout=15)
        assert r2.status_code == 200
        emails = [u.get("email") for u in r2.json()]
        assert new_email.lower() in emails

    def test_update_user_email_duplicate_rejected(self):
        uid = state["created_user_id"]
        # try to set email to super admin's email
        r = requests.put(
            f"{API}/admin/users/{uid}",
            headers=auth(state["super_token"]),
            json={"email": SUPER_ADMIN["email"]},
            timeout=15,
        )
        assert r.status_code == 400, f"expected 400 duplicate, got {r.status_code} {r.text}"

    def test_update_main_admin_email_blocked(self):
        # Find super_admin id and try to change its email
        r = requests.get(f"{API}/admin/users", headers=auth(state["super_token"]), timeout=15)
        assert r.status_code == 200
        admin_doc = next((u for u in r.json() if u.get("email") == SUPER_ADMIN["email"]), None)
        assert admin_doc, "admin doc not found"
        admin_id = admin_doc.get("id") or admin_doc.get("_id")
        r2 = requests.put(
            f"{API}/admin/users/{admin_id}",
            headers=auth(state["super_token"]),
            json={"email": "changed_main@example.com"},
            timeout=15,
        )
        assert r2.status_code == 400, f"expected 400 blocking main admin email change, got {r2.status_code} {r2.text}"
        assert "admin principal" in r2.text.lower() or "principal" in r2.text.lower()

    def test_update_user_forbidden_for_limited_admin(self):
        uid = state["created_user_id"]
        r = requests.put(
            f"{API}/admin/users/{uid}",
            headers=auth(state["limited_token"]),
            json={"name": "x"},
            timeout=15,
        )
        assert r.status_code == 403


# ── Reset Password ──

class TestResetPassword:
    def test_reset_password_short_rejected(self):
        uid = state["created_user_id"]
        r = requests.post(
            f"{API}/admin/users/{uid}/reset-password",
            headers=auth(state["super_token"]),
            json={"password": "123"},
            timeout=15,
        )
        assert r.status_code == 400
        assert "6 caracteres" in r.text or "6" in r.text

    def test_reset_password_success(self):
        uid = state["created_user_id"]
        new_pwd = "NewPwd987!"
        r = requests.post(
            f"{API}/admin/users/{uid}/reset-password",
            headers=auth(state["super_token"]),
            json={"password": new_pwd},
            timeout=15,
        )
        assert r.status_code == 200
        # Verify we can login with new password
        r2 = requests.post(
            f"{API}/auth/login",
            json={"email": state["created_user_email"], "password": new_pwd},
            timeout=15,
        )
        assert r2.status_code == 200, f"login with new password failed: {r2.text}"

    def test_reset_password_forbidden_for_limited_admin(self):
        uid = state["created_user_id"]
        r = requests.post(
            f"{API}/admin/users/{uid}/reset-password",
            headers=auth(state["limited_token"]),
            json={"password": "OtherPwd123"},
            timeout=15,
        )
        assert r.status_code == 403


# ── Permissions update ──

class TestPermissions:
    def test_update_permissions_all_17(self):
        uid = state["created_user_id"]
        feature_keys = [
            "dashboard", "members", "clients", "packages", "commerce", "categories",
            "clubs", "regalias", "quotations", "analytics", "announcements",
            "push", "import", "referrals", "requests", "users", "settings",
        ]
        perms = {k: True for k in feature_keys}
        r = requests.put(
            f"{API}/admin/users/{uid}/permissions",
            headers=auth(state["super_token"]),
            json={"permissions": perms},
            timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["permissions"] == perms

    def test_update_permissions_invalid_keys_filtered(self):
        uid = state["created_user_id"]
        r = requests.put(
            f"{API}/admin/users/{uid}/permissions",
            headers=auth(state["super_token"]),
            json={"permissions": {"dashboard": True, "hacked_key": True}},
            timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        assert "hacked_key" not in data["permissions"]
        assert data["permissions"].get("dashboard")

    def test_update_permissions_forbidden_for_limited_admin(self):
        uid = state["created_user_id"]
        r = requests.put(
            f"{API}/admin/users/{uid}/permissions",
            headers=auth(state["limited_token"]),
            json={"permissions": {"dashboard": True}},
            timeout=15,
        )
        assert r.status_code == 403


# ── Toggle active ──

class TestToggleActive:
    def test_toggle_active_super_admin(self):
        uid = state["created_user_id"]
        r = requests.put(f"{API}/admin/users/{uid}/toggle-active", headers=auth(state["super_token"]), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "is_active" in d
        first_state = d["is_active"]
        # Toggle again to restore
        r2 = requests.put(f"{API}/admin/users/{uid}/toggle-active", headers=auth(state["super_token"]), timeout=15)
        assert r2.status_code == 200
        assert r2.json()["is_active"] != first_state

    def test_toggle_active_allowed_for_admin_role(self):
        # toggle-active accepts super_admin and admin. Test that limited admin can call it (not 403).
        # It will succeed (200) or at least not be a 403.
        uid = state["created_user_id"]
        r = requests.put(f"{API}/admin/users/{uid}/toggle-active", headers=auth(state["limited_token"]), timeout=15)
        # Per review_request, toggle-active admits admin and super_admin.
        assert r.status_code == 200, f"admin role should be allowed to toggle-active, got {r.status_code} {r.text}"
        # Toggle again with super to restore active
        requests.put(f"{API}/admin/users/{uid}/toggle-active", headers=auth(state["super_token"]), timeout=15)


# ── Audit log ──

class TestAuditLog:
    def test_audit_forbidden_for_limited_admin(self):
        r = requests.get(
            f"{API}/admin/audit/user-changes",
            headers=auth(state["limited_token"]),
            timeout=15,
        )
        assert r.status_code == 403

    def test_audit_returns_entries_for_target(self):
        uid = state["created_user_id"]
        r = requests.get(
            f"{API}/admin/audit/user-changes",
            headers=auth(state["super_token"]),
            params={"target_user_id": uid, "limit": 50},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        entries = r.json()
        assert isinstance(entries, list)
        # We performed: create_user, update_profile, reset_password, update_permissions(x2), toggle_active(x2/3)
        actions = {e.get("action") for e in entries}
        assert "create_user" in actions, f"expected create_user in {actions}"
        assert "update_profile" in actions, f"expected update_profile in {actions}"
        assert "reset_password" in actions, f"expected reset_password in {actions}"
        assert "update_permissions" in actions, f"expected update_permissions in {actions}"
        assert "toggle_active" in actions, f"expected toggle_active in {actions}"
        # Ensure password is NOT stored in audit
        for e in entries:
            if e.get("action") == "reset_password":
                det = e.get("details") or {}
                assert "password" not in det
                assert "password_hash" not in det
                # password_length is ok
                assert "password_length" in det

    def test_audit_filter_by_action(self):
        uid = state["created_user_id"]
        r = requests.get(
            f"{API}/admin/audit/user-changes",
            headers=auth(state["super_token"]),
            params={"target_user_id": uid, "action": "reset_password"},
            timeout=15,
        )
        assert r.status_code == 200
        entries = r.json()
        for e in entries:
            assert e.get("action") == "reset_password"

    def test_audit_filter_by_admin_id(self):
        r = requests.get(
            f"{API}/admin/audit/user-changes",
            headers=auth(state["super_token"]),
            params={"admin_id": state["super_id"], "limit": 20},
            timeout=15,
        )
        assert r.status_code == 200
        entries = r.json()
        for e in entries:
            assert e.get("admin_id") == state["super_id"]


# ── Delete ──

class TestDeleteUser:
    def test_delete_without_code_rejected(self):
        uid = state["created_user_id"]
        r = requests.delete(f"{API}/admin/users/{uid}", headers=auth(state["super_token"]), timeout=15)
        assert r.status_code == 403
        assert "clave" in r.text.lower() or "delete" in r.text.lower() or "eliminaci" in r.text.lower()

    def test_delete_main_admin_blocked(self):
        r = requests.get(f"{API}/admin/users", headers=auth(state["super_token"]), timeout=15)
        admin_doc = next((u for u in r.json() if u.get("email") == SUPER_ADMIN["email"]), None)
        admin_id = admin_doc.get("id") or admin_doc.get("_id")
        r2 = requests.delete(
            f"{API}/admin/users/{admin_id}?delete_code=BORRAR%20YA",
            headers=auth(state["super_token"]),
            timeout=15,
        )
        assert r2.status_code == 400, f"expected 400 blocking main admin deletion, got {r2.status_code} {r2.text}"

    def test_delete_forbidden_for_limited_admin(self):
        uid = state["created_user_id"]
        r = requests.delete(
            f"{API}/admin/users/{uid}?delete_code=BORRAR%20YA",
            headers=auth(state["limited_token"]),
            timeout=15,
        )
        assert r.status_code == 403

    def test_delete_success_with_code(self):
        uid = state["created_user_id"]
        r = requests.delete(
            f"{API}/admin/users/{uid}?delete_code=BORRAR%20YA",
            headers=auth(state["super_token"]),
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # Verify in list
        r2 = requests.get(f"{API}/admin/users", headers=auth(state["super_token"]), timeout=15)
        ids = [u.get("id") or u.get("_id") for u in r2.json()]
        assert uid not in ids
        # Audit should have delete_user
        r3 = requests.get(
            f"{API}/admin/audit/user-changes",
            headers=auth(state["super_token"]),
            params={"target_user_id": uid, "action": "delete_user"},
            timeout=15,
        )
        assert r3.status_code == 200
        assert any(e.get("action") == "delete_user" for e in r3.json())
        state["created_user_id"] = None


# ── Smoke regression ──

class TestSmokeRegression:
    @pytest.mark.parametrize("path", [
        "/admin/users",
        "/admin/all-users",
        "/packages",
        "/quotations",
        "/commerce",
        "/members",
        "/config/social-links",
        "/config/pricing-settings",
        "/config/quotation-settings",
    ])
    def test_endpoint_accessible_for_super_admin(self, path):
        r = requests.get(f"{API}{path}", headers=auth(state["super_token"]), timeout=15)
        assert r.status_code == 200, f"{path} failed: {r.status_code} {r.text[:200]}"
