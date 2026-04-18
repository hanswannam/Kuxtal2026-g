"""
Test suite for Digital Coupon QR System - Iteration 16
Tests: coupon generation, validation, redemption, and history
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from environment
ADMIN_EMAIL = os.environ.get('TEST_ADMIN_EMAIL', 'admin@kuxtaltravels.com')
ADMIN_PASSWORD = os.environ.get('TEST_ADMIN_PASSWORD', 'KuxtalAdmin2024!')
MEMBER_CONTRACT = os.environ.get('TEST_MEMBER_CONTRACT', 'KT-001')
MEMBER_DPI = os.environ.get('TEST_MEMBER_DPI', '1234567890101')


class TestCouponSystem:
    """Digital Coupon QR System tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.member_token = None
        self.admin_token = None
        self.commerce_id = None
        self.generated_coupon_code = None
    
    def test_01_get_commerce_list(self):
        """Get list of commerces for coupon generation"""
        response = self.session.get(f"{BASE_URL}/api/commerce")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of commerces"
        if len(data) > 0:
            self.commerce_id = data[0]["_id"]
            print(f"Found {len(data)} commerces, using: {data[0]['name']} ({self.commerce_id})")
        else:
            pytest.skip("No commerces available for testing")
    
    def test_02_member_login(self):
        """Member login to get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": MEMBER_CONTRACT,
            "dpi": MEMBER_DPI
        })
        assert response.status_code == 200, f"Member login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        self.member_token = data["token"]
        print(f"Member logged in: {data.get('name', 'Unknown')}")
    
    def test_03_admin_login(self):
        """Admin login to get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        self.admin_token = data["token"]
        print(f"Admin logged in: {data.get('name', 'Admin')}")


class TestCouponGeneration:
    """Test coupon generation by members"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as member
        response = self.session.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": MEMBER_CONTRACT,
            "dpi": MEMBER_DPI
        })
        if response.status_code == 200:
            self.member_token = response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.member_token}"})
        # Get commerce
        commerce_resp = self.session.get(f"{BASE_URL}/api/commerce")
        if commerce_resp.status_code == 200 and len(commerce_resp.json()) > 0:
            self.commerce_id = commerce_resp.json()[0]["_id"]
            self.commerce_name = commerce_resp.json()[0]["name"]
    
    def test_generate_coupon_requires_commerce_id(self):
        """POST /api/coupons/generate requires commerce_id"""
        response = self.session.post(f"{BASE_URL}/api/coupons/generate", json={})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "commerce_id" in response.json().get("detail", "").lower()
    
    def test_generate_coupon_success(self):
        """POST /api/coupons/generate creates coupon with KX- prefix"""
        if not hasattr(self, 'commerce_id') or not self.commerce_id:
            pytest.skip("No commerce available")
        
        response = self.session.post(f"{BASE_URL}/api/coupons/generate", json={
            "commerce_id": self.commerce_id
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify coupon structure
        assert "code" in data, "No code in response"
        assert data["code"].startswith("KX-"), f"Code should start with KX-, got: {data['code']}"
        assert data["status"] == "active", f"Expected active status, got: {data['status']}"
        assert data["commerce_id"] == self.commerce_id
        print(f"Generated coupon: {data['code']} for {data.get('commerce_name', 'Unknown')}")
    
    def test_generate_coupon_returns_existing_active(self):
        """Generating coupon for same commerce returns existing active coupon"""
        if not hasattr(self, 'commerce_id') or not self.commerce_id:
            pytest.skip("No commerce available")
        
        # Generate first coupon
        resp1 = self.session.post(f"{BASE_URL}/api/coupons/generate", json={
            "commerce_id": self.commerce_id
        })
        code1 = resp1.json().get("code")
        
        # Try to generate again - should return same coupon
        resp2 = self.session.post(f"{BASE_URL}/api/coupons/generate", json={
            "commerce_id": self.commerce_id
        })
        code2 = resp2.json().get("code")
        
        assert code1 == code2, f"Expected same coupon code, got {code1} vs {code2}"
        print(f"Correctly returned existing active coupon: {code1}")


class TestCouponValidation:
    """Test coupon validation endpoint (public)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_validate_invalid_code_returns_404(self):
        """GET /api/coupons/validate/{code} returns 404 for invalid code"""
        response = self.session.get(f"{BASE_URL}/api/coupons/validate/INVALID-CODE-123")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_validate_existing_coupon(self):
        """GET /api/coupons/validate/{code} returns coupon details + visit_history"""
        # First login and generate a coupon
        login_resp = self.session.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": MEMBER_CONTRACT,
            "dpi": MEMBER_DPI
        })
        if login_resp.status_code != 200:
            pytest.skip("Member login failed")
        
        token = login_resp.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get commerce
        commerce_resp = self.session.get(f"{BASE_URL}/api/commerce")
        if commerce_resp.status_code != 200 or len(commerce_resp.json()) == 0:
            pytest.skip("No commerce available")
        
        commerce_id = commerce_resp.json()[0]["_id"]
        
        # Generate coupon
        gen_resp = self.session.post(f"{BASE_URL}/api/coupons/generate", json={
            "commerce_id": commerce_id
        })
        if gen_resp.status_code != 200:
            pytest.skip("Could not generate coupon")
        
        coupon_code = gen_resp.json().get("code")
        
        # Now validate (public endpoint - no auth needed)
        self.session.headers.pop("Authorization", None)
        validate_resp = self.session.get(f"{BASE_URL}/api/coupons/validate/{coupon_code}")
        
        assert validate_resp.status_code == 200, f"Expected 200, got {validate_resp.status_code}"
        data = validate_resp.json()
        
        # Verify response structure
        assert data["code"] == coupon_code
        assert "status" in data
        assert "commerce_name" in data
        assert "discount_description" in data
        assert "visit_history" in data, "Missing visit_history in response"
        assert "visit_count" in data, "Missing visit_count in response"
        print(f"Validated coupon {coupon_code}: status={data['status']}, visits={data['visit_count']}")


class TestCouponRedemption:
    """Test coupon redemption"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_redeem_invalid_code_returns_404(self):
        """POST /api/coupons/redeem/{code} returns 404 for invalid code"""
        response = self.session.post(f"{BASE_URL}/api/coupons/redeem/INVALID-CODE-XYZ", json={})
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_redeem_coupon_success(self):
        """POST /api/coupons/redeem/{code} marks coupon as used"""
        # Login as member and generate a fresh coupon
        login_resp = self.session.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": MEMBER_CONTRACT,
            "dpi": MEMBER_DPI
        })
        if login_resp.status_code != 200:
            pytest.skip("Member login failed")
        
        token = login_resp.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get a different commerce to generate a new coupon
        commerce_resp = self.session.get(f"{BASE_URL}/api/commerce")
        if commerce_resp.status_code != 200 or len(commerce_resp.json()) < 2:
            # Use first commerce but we need to find an active coupon or create new
            commerces = commerce_resp.json() if commerce_resp.status_code == 200 else []
            if len(commerces) == 0:
                pytest.skip("No commerce available")
            commerce_id = commerces[-1]["_id"]  # Use last commerce
        else:
            commerce_id = commerce_resp.json()[1]["_id"]  # Use second commerce
        
        # Generate coupon
        gen_resp = self.session.post(f"{BASE_URL}/api/coupons/generate", json={
            "commerce_id": commerce_id
        })
        if gen_resp.status_code != 200:
            pytest.skip("Could not generate coupon")
        
        coupon_code = gen_resp.json().get("code")
        coupon_status = gen_resp.json().get("status")
        
        if coupon_status == "used":
            print(f"Coupon {coupon_code} already used, skipping redeem test")
            pytest.skip("Coupon already used")
        
        # Redeem the coupon (no auth required for redemption)
        self.session.headers.pop("Authorization", None)
        redeem_resp = self.session.post(f"{BASE_URL}/api/coupons/redeem/{coupon_code}", json={
            "commerce_name": "Test Commerce"
        })
        
        assert redeem_resp.status_code == 200, f"Expected 200, got {redeem_resp.status_code}: {redeem_resp.text}"
        data = redeem_resp.json()
        assert "message" in data
        assert data["code"] == coupon_code.upper()
        print(f"Redeemed coupon: {coupon_code}")
        
        # Verify coupon is now marked as used
        validate_resp = self.session.get(f"{BASE_URL}/api/coupons/validate/{coupon_code}")
        assert validate_resp.status_code == 200
        assert validate_resp.json()["status"] == "used", "Coupon should be marked as used"
    
    def test_redeem_already_used_coupon_returns_400(self):
        """POST /api/coupons/redeem/{code} returns 400 for already used coupon"""
        # First, find or create a used coupon
        login_resp = self.session.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": MEMBER_CONTRACT,
            "dpi": MEMBER_DPI
        })
        if login_resp.status_code != 200:
            pytest.skip("Member login failed")
        
        token = login_resp.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get my coupons and find a used one
        my_coupons_resp = self.session.get(f"{BASE_URL}/api/coupons/my")
        if my_coupons_resp.status_code != 200:
            pytest.skip("Could not get coupons")
        
        used_coupons = [c for c in my_coupons_resp.json() if c["status"] == "used"]
        if len(used_coupons) == 0:
            pytest.skip("No used coupons available for testing")
        
        used_code = used_coupons[0]["code"]
        
        # Try to redeem again
        self.session.headers.pop("Authorization", None)
        redeem_resp = self.session.post(f"{BASE_URL}/api/coupons/redeem/{used_code}", json={})
        
        assert redeem_resp.status_code == 400, f"Expected 400, got {redeem_resp.status_code}"
        assert "ya fue utilizado" in redeem_resp.json().get("detail", "").lower() or "already" in redeem_resp.json().get("detail", "").lower()
        print(f"Correctly rejected re-redemption of {used_code}")


class TestMemberCoupons:
    """Test member's coupon list"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as member
        response = self.session.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": MEMBER_CONTRACT,
            "dpi": MEMBER_DPI
        })
        if response.status_code == 200:
            self.member_token = response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.member_token}"})
    
    def test_get_my_coupons(self):
        """GET /api/coupons/my returns member's coupons"""
        response = self.session.get(f"{BASE_URL}/api/coupons/my")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of coupons"
        print(f"Member has {len(data)} coupons")
        
        # Verify coupon structure if any exist
        if len(data) > 0:
            coupon = data[0]
            assert "code" in coupon
            assert "status" in coupon
            assert "commerce_name" in coupon
            assert coupon["code"].startswith("KX-")


class TestAdminCoupons:
    """Test admin coupon creation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.admin_token = response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
        # Get commerce
        commerce_resp = self.session.get(f"{BASE_URL}/api/commerce")
        if commerce_resp.status_code == 200 and len(commerce_resp.json()) > 0:
            self.commerce_id = commerce_resp.json()[0]["_id"]
    
    def test_admin_create_coupon_requires_commerce_id(self):
        """POST /api/admin/coupons requires commerce_id"""
        response = self.session.post(f"{BASE_URL}/api/admin/coupons", json={})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_admin_create_coupon_success(self):
        """POST /api/admin/coupons creates admin coupon"""
        if not hasattr(self, 'commerce_id') or not self.commerce_id:
            pytest.skip("No commerce available")
        
        response = self.session.post(f"{BASE_URL}/api/admin/coupons", json={
            "commerce_id": self.commerce_id,
            "discount_description": "TEST Admin Special Discount 50%"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "code" in data
        assert data["code"].startswith("KX-")
        assert data["created_by"] == "admin"
        assert "TEST Admin Special" in data.get("discount_description", "")
        print(f"Admin created coupon: {data['code']}")


class TestCommerceCouponHistory:
    """Test commerce coupon history endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.admin_token = response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
        # Get commerce
        commerce_resp = self.session.get(f"{BASE_URL}/api/commerce")
        if commerce_resp.status_code == 200 and len(commerce_resp.json()) > 0:
            self.commerce_id = commerce_resp.json()[0]["_id"]
    
    def test_get_commerce_coupon_history(self):
        """GET /api/commerce/{id}/coupons returns coupon history"""
        if not hasattr(self, 'commerce_id') or not self.commerce_id:
            pytest.skip("No commerce available")
        
        response = self.session.get(f"{BASE_URL}/api/commerce/{self.commerce_id}/coupons")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of coupons"
        print(f"Commerce has {len(data)} coupons in history")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
