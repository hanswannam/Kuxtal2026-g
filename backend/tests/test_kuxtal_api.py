"""
Kuxtal Travels API Tests - Iteration 6
Tests for code review fixes: is/== patterns, auth flows, CRUD operations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@kuxtaltravels.com"
ADMIN_PASSWORD = "KuxtalAdmin2024!"
MEMBER_CONTRACT = "KT-001"
MEMBER_DPI = "1234567890101"
FAMILY_DPI = "9876543210101"
DELETE_SECRET = "BORRAR YA"


class TestAuthFlows:
    """Test authentication endpoints - verify is/== fix doesn't break auth"""
    
    def test_admin_login_success(self):
        """Admin login should work and return token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "id" in data, "ID not in response"
        assert data["role"] == "super_admin", f"Expected super_admin role, got {data['role']}"
        assert data["email"] == ADMIN_EMAIL
    
    def test_admin_login_invalid_password(self):
        """Invalid password should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_member_login_success(self):
        """Member login with contract and DPI should work"""
        response = requests.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": MEMBER_CONTRACT,
            "dpi": MEMBER_DPI
        })
        assert response.status_code == 200, f"Member login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] == "member"
        assert data["contract_number"] == MEMBER_CONTRACT
        assert "member" in data
        assert data["is_family_member"] == False
    
    def test_family_member_login_success(self):
        """Family member login should work"""
        response = requests.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": MEMBER_CONTRACT,
            "dpi": FAMILY_DPI
        })
        assert response.status_code == 200, f"Family login failed: {response.text}"
        data = response.json()
        assert data["is_family_member"] == True
    
    def test_member_login_invalid_dpi(self):
        """Invalid DPI should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": MEMBER_CONTRACT,
            "dpi": "0000000000000"
        })
        assert response.status_code == 401
    
    def test_auth_me_without_token(self):
        """Auth/me without token should return 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
    
    def test_auth_me_with_token(self):
        """Auth/me with valid token should return user data"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Then check /me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL


class TestPackagesAPI:
    """Test packages CRUD operations"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_list_packages(self):
        """List packages should work without auth"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_list_featured_packages(self):
        """List featured packages should work"""
        response = requests.get(f"{BASE_URL}/api/packages?featured=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_package(self, admin_token):
        """Create package should work with admin token"""
        response = requests.post(f"{BASE_URL}/api/packages", 
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "title": "TEST_Package_Iteration6",
                "description": "Test package for iteration 6",
                "country": "Guatemala",
                "price": 1000,
                "member_price": 800,
                "duration_days": 3,
                "category": "paquete",
                "includes": ["Hotel", "Transporte"],
                "status": "active"
            }
        )
        assert response.status_code == 200, f"Create package failed: {response.text}"
        data = response.json()
        assert data["title"] == "TEST_Package_Iteration6"
        assert "_id" in data


class TestMembersAPI:
    """Test members CRUD operations"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_list_members(self, admin_token):
        """List members should work with admin token"""
        response = requests.get(f"{BASE_URL}/api/members",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_member(self, admin_token):
        """Create member should work"""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        response = requests.post(f"{BASE_URL}/api/members",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "contract_number": f"TEST-{unique_id}",
                "dpi": f"TEST{unique_id}123",
                "name": "Test Member Iteration6",
                "email": f"test{unique_id}@test.com",
                "phone": "+502 1234-5678",
                "service_years": 1,
                "membership_start": "2026-01-01",
                "membership_end": "2027-01-01",
                "family_members_allowed": 2,
                "status": "active"
            }
        )
        assert response.status_code == 200, f"Create member failed: {response.text}"
        data = response.json()
        assert "TEST" in data["contract_number"]


class TestAnnouncementsAPI:
    """Test announcements CRUD"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_list_announcements(self, admin_token):
        """List announcements should work"""
        response = requests.get(f"{BASE_URL}/api/announcements",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_announcement(self, admin_token):
        """Create announcement should work"""
        response = requests.post(f"{BASE_URL}/api/announcements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "title": "TEST_Announcement_Iteration6",
                "content": "Test announcement content",
                "target": "all",
                "status": "active"
            }
        )
        assert response.status_code == 200, f"Create announcement failed: {response.text}"


class TestDeleteWithCode:
    """Test DELETE endpoints with BORRAR YA secret code"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_delete_without_code_fails(self, admin_token):
        """Delete without code should fail with 403"""
        # First create a test package
        create_resp = requests.post(f"{BASE_URL}/api/packages",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "title": "TEST_ToDelete",
                "description": "Will be deleted",
                "country": "Test",
                "price": 100,
                "duration_days": 1,
                "category": "paquete",
                "status": "active"
            }
        )
        package_id = create_resp.json()["_id"]
        
        # Try delete without code
        response = requests.delete(f"{BASE_URL}/api/packages/{package_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    
    def test_delete_with_wrong_code_fails(self, admin_token):
        """Delete with wrong code should fail"""
        # Create test package
        create_resp = requests.post(f"{BASE_URL}/api/packages",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "title": "TEST_ToDelete2",
                "description": "Will be deleted",
                "country": "Test",
                "price": 100,
                "duration_days": 1,
                "category": "paquete",
                "status": "active"
            }
        )
        package_id = create_resp.json()["_id"]
        
        # Try delete with wrong code
        response = requests.delete(f"{BASE_URL}/api/packages/{package_id}?delete_code=WRONG",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 403
    
    def test_delete_with_correct_code_succeeds(self, admin_token):
        """Delete with correct code should succeed"""
        # Create test package
        create_resp = requests.post(f"{BASE_URL}/api/packages",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "title": "TEST_ToDelete3",
                "description": "Will be deleted",
                "country": "Test",
                "price": 100,
                "duration_days": 1,
                "category": "paquete",
                "status": "active"
            }
        )
        package_id = create_resp.json()["_id"]
        
        # Delete with correct code
        response = requests.delete(
            f"{BASE_URL}/api/packages/{package_id}?delete_code={DELETE_SECRET.replace(' ', '%20')}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Delete failed: {response.text}"


class TestCommerceAPI:
    """Test commerce endpoints"""
    
    def test_list_commerce(self):
        """List commerce should work without auth"""
        response = requests.get(f"{BASE_URL}/api/commerce")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_commerce_categories(self):
        """Commerce categories should return list"""
        response = requests.get(f"{BASE_URL}/api/commerce/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert "Restaurantes" in data


class TestMemberDashboardEndpoints:
    """Test endpoints used by MemberDashboard after api interceptor migration"""
    
    @pytest.fixture
    def member_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": MEMBER_CONTRACT,
            "dpi": MEMBER_DPI
        })
        return response.json()["token"]
    
    def test_quotations_endpoint(self, member_token):
        """Quotations endpoint should work for members"""
        response = requests.get(f"{BASE_URL}/api/quotations",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_announcements_for_members(self, member_token):
        """Announcements with target=members should work"""
        response = requests.get(f"{BASE_URL}/api/announcements?target=members",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_vacation_requests(self, member_token):
        """Vacation requests endpoint should work"""
        response = requests.get(f"{BASE_URL}/api/vacation-requests",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_referral_code(self, member_token):
        """Referral code endpoint should work"""
        response = requests.get(f"{BASE_URL}/api/referral/my-code",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "code" in data  # API returns 'code' field


class TestStatsAndAnalytics:
    """Test stats and analytics endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_stats_endpoint(self, admin_token):
        """Stats endpoint should work"""
        response = requests.get(f"{BASE_URL}/api/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "members" in data or "total_members" in data or isinstance(data, dict)
    
    def test_analytics_endpoint(self, admin_token):
        """Analytics endpoint should work"""
        response = requests.get(f"{BASE_URL}/api/analytics",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200


class TestWhatsAppConfig:
    """Test WhatsApp configuration endpoint"""
    
    def test_whatsapp_config(self):
        """WhatsApp config should be accessible"""
        response = requests.get(f"{BASE_URL}/api/config/whatsapp")
        assert response.status_code == 200
        data = response.json()
        assert "phone" in data


class TestPackageImportFromDrive:
    """Test AI-powered package import from Google Drive - Iteration 9"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_import_requires_auth(self):
        """Import endpoint should require admin authentication"""
        response = requests.post(f"{BASE_URL}/api/packages/import-from-drive", json={
            "drive_url": "https://drive.google.com/file/d/test/view"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_import_empty_url_returns_400(self, admin_token):
        """Empty drive_url should return 400"""
        response = requests.post(f"{BASE_URL}/api/packages/import-from-drive",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"drive_url": ""}
        )
        assert response.status_code == 400
        assert "URL de Google Drive requerida" in response.json()["detail"]
    
    def test_import_invalid_url_returns_400(self, admin_token):
        """Invalid URL format should return 400"""
        response = requests.post(f"{BASE_URL}/api/packages/import-from-drive",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"drive_url": "https://invalid-url.com/not-gdrive"}
        )
        assert response.status_code == 400
        assert "No se pudo extraer el ID" in response.json()["detail"]
    
    def test_import_nonexistent_file_returns_400(self, admin_token):
        """Valid GDrive URL format but non-existent file should return 400"""
        response = requests.post(f"{BASE_URL}/api/packages/import-from-drive",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"drive_url": "https://drive.google.com/file/d/1234567890abcdef/view"}
        )
        assert response.status_code == 400
        assert "Error al descargar archivo" in response.json()["detail"]
    
    def test_import_various_gdrive_url_formats(self, admin_token):
        """Test that various Google Drive URL formats are recognized"""
        # These should all fail with download error (not URL parsing error)
        valid_formats = [
            "https://drive.google.com/file/d/abc123/view",
            "https://drive.google.com/file/d/abc123/view?usp=sharing",
            "https://drive.google.com/open?id=abc123",
            "https://drive.google.com/uc?id=abc123",
        ]
        for url in valid_formats:
            response = requests.post(f"{BASE_URL}/api/packages/import-from-drive",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={"drive_url": url}
            )
            # Should fail with download error, not URL parsing error
            assert response.status_code == 400
            assert "Error al descargar" in response.json()["detail"], f"URL format not recognized: {url}"


class TestAccentInsensitiveSearch:
    """Test accent-insensitive search for packages - Iteration 10"""
    
    def test_search_mexico_without_accent(self):
        """Search 'Mexico' should match 'México'"""
        response = requests.get(f"{BASE_URL}/api/packages?search=Mexico")
        assert response.status_code == 200
        data = response.json()
        # Should find packages with México
        mexico_packages = [p for p in data if 'México' in p.get('country', '') or 'Mexico' in p.get('country', '')]
        assert len(mexico_packages) > 0, "Should find packages with México when searching 'Mexico'"
    
    def test_search_peru_without_accent(self):
        """Search 'Peru' should match 'Perú'"""
        response = requests.get(f"{BASE_URL}/api/packages?search=Peru")
        assert response.status_code == 200
        data = response.json()
        # Should find packages with Perú
        peru_packages = [p for p in data if 'Perú' in p.get('country', '') or 'Peru' in p.get('country', '')]
        assert len(peru_packages) > 0, "Should find packages with Perú when searching 'Peru'"
    
    def test_search_panama_without_accent(self):
        """Search 'Panama' should match 'Panamá'"""
        response = requests.get(f"{BASE_URL}/api/packages?search=Panama")
        assert response.status_code == 200
        data = response.json()
        # Should find packages with Panamá
        panama_packages = [p for p in data if 'Panamá' in p.get('country', '') or 'Panama' in p.get('country', '')]
        assert len(panama_packages) > 0, "Should find packages with Panamá when searching 'Panama'"
    
    def test_country_filter_accent_insensitive(self):
        """Country filter should also be accent-insensitive"""
        response = requests.get(f"{BASE_URL}/api/packages?country=Mexico")
        assert response.status_code == 200
        data = response.json()
        # Should find packages with México country
        assert len(data) > 0, "Should find packages with México when filtering by 'Mexico'"
        for pkg in data:
            assert 'Méx' in pkg.get('country', '') or 'Mex' in pkg.get('country', ''), f"Package country should contain Mexico/México: {pkg.get('country')}"


class TestHomepageSearchNavigation:
    """Test homepage search functionality - Iteration 10"""
    
    def test_countries_endpoint(self):
        """Countries endpoint should return list of countries"""
        response = requests.get(f"{BASE_URL}/api/countries")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Should include countries with accents
        assert any('México' in c for c in data), "Should include México"
    
    def test_packages_by_category(self):
        """Packages can be filtered by category"""
        for category in ['paquete', 'alojamiento', 'experiencia']:
            response = requests.get(f"{BASE_URL}/api/packages?category={category}")
            assert response.status_code == 200
            data = response.json()
            # All returned packages should have the correct category
            for pkg in data:
                assert pkg.get('category') == category, f"Package category mismatch: expected {category}, got {pkg.get('category')}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
