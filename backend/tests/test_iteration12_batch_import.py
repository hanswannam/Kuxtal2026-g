"""
Iteration 12 Tests: Batch Import Feature
Tests for the batch import UI and backend API endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vacation-club-portal.preview.emergentagent.com')

class TestHealthAndBasicEndpoints:
    """Basic health and endpoint tests"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        print(f"API health check passed - {len(response.json())} packages found")
    
    def test_countries_endpoint(self):
        """Test countries endpoint"""
        response = requests.get(f"{BASE_URL}/api/countries")
        assert response.status_code == 200
        countries = response.json()
        assert isinstance(countries, list)
        print(f"Countries endpoint passed - {len(countries)} countries found")


class TestAdminAuth:
    """Admin authentication tests"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kuxtaltravels.com",
            "password": "KuxtalAdmin2024!"
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        return session
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kuxtaltravels.com",
            "password": "KuxtalAdmin2024!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["role"] in ["admin", "super_admin"]
        print(f"Admin login passed - role: {data['role']}")
    
    def test_admin_me_endpoint(self, admin_session):
        """Test /auth/me endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@kuxtaltravels.com"
        print("Admin /me endpoint passed")


class TestImportFromDriveEndpoint:
    """Tests for POST /api/packages/import-from-drive endpoint"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kuxtaltravels.com",
            "password": "KuxtalAdmin2024!"
        })
        assert login_response.status_code == 200
        return session
    
    def test_import_requires_auth(self):
        """Test import endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/packages/import-from-drive", json={
            "drive_url": "https://drive.google.com/file/d/test123"
        })
        assert response.status_code == 401
        print("Import requires auth - passed")
    
    def test_import_empty_url_validation(self, admin_session):
        """Test import endpoint validates empty URL"""
        response = admin_session.post(f"{BASE_URL}/api/packages/import-from-drive", json={
            "drive_url": ""
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"Empty URL validation passed - error: {data['detail']}")
    
    def test_import_invalid_url_validation(self, admin_session):
        """Test import endpoint validates invalid Google Drive URL"""
        response = admin_session.post(f"{BASE_URL}/api/packages/import-from-drive", json={
            "drive_url": "https://example.com/not-a-drive-url"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"Invalid URL validation passed - error: {data['detail']}")
    
    def test_import_malformed_url(self, admin_session):
        """Test import endpoint handles malformed URLs"""
        response = admin_session.post(f"{BASE_URL}/api/packages/import-from-drive", json={
            "drive_url": "not-a-url-at-all"
        })
        assert response.status_code == 400
        print("Malformed URL validation passed")


class TestPackagesCRUD:
    """Tests for packages CRUD operations"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kuxtaltravels.com",
            "password": "KuxtalAdmin2024!"
        })
        assert login_response.status_code == 200
        return session
    
    def test_list_packages(self):
        """Test listing packages"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        packages = response.json()
        assert isinstance(packages, list)
        print(f"List packages passed - {len(packages)} packages")
    
    def test_get_single_package(self):
        """Test getting a single package"""
        # First get list
        list_response = requests.get(f"{BASE_URL}/api/packages")
        packages = list_response.json()
        if packages:
            pkg_id = packages[0]["_id"]
            response = requests.get(f"{BASE_URL}/api/packages/{pkg_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["_id"] == pkg_id
            print(f"Get single package passed - {data['title']}")
    
    def test_create_package(self, admin_session):
        """Test creating a package (simulating what batch import would do)"""
        import uuid
        test_id = uuid.uuid4().hex[:8]
        package_data = {
            "title": f"TEST_BatchImport_{test_id}",
            "description": "Test package created by batch import test",
            "short_description": "Test batch import",
            "country": "Guatemala",
            "price": 5000,
            "member_price": 4500,
            "duration_days": 5,
            "category": "paquete",
            "includes": ["Transporte", "Hospedaje", "Comidas"],
            "itinerary": [
                {"day": 1, "title": "Dia 1", "description": "Llegada y bienvenida"},
                {"day": 2, "title": "Dia 2", "description": "Tour principal"}
            ],
            "accommodation_type": "hotel",
            "difficulty": "facil",
            "min_group": 2,
            "max_group": 15,
            "rating": 4.8,
            "image_url": "",
            "gallery": [],
            "featured": False,
            "status": "active"
        }
        
        response = admin_session.post(f"{BASE_URL}/api/packages", json=package_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == package_data["title"]
        assert data["country"] == "Guatemala"
        assert data["price"] == 5000
        assert len(data["itinerary"]) == 2
        print(f"Create package passed - {data['title']}")
        
        # Verify it was persisted
        get_response = requests.get(f"{BASE_URL}/api/packages/{data['_id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == package_data["title"]
        print("Package persistence verified")


class TestMemberLogin:
    """Tests for member login"""
    
    def test_member_login(self):
        """Test member login with contract number and DPI"""
        response = requests.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": "KT-001",
            "dpi": "1234567890101"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "member"
        assert "token" in data
        print(f"Member login passed - {data['name']}")
    
    def test_member_invalid_contract(self):
        """Test member login with invalid contract"""
        response = requests.post(f"{BASE_URL}/api/auth/member-login", json={
            "contract_number": "INVALID-999",
            "dpi": "1234567890101"
        })
        assert response.status_code == 401
        print("Invalid contract validation passed")


class TestSearchAndFilters:
    """Tests for search and filter functionality"""
    
    def test_search_packages(self):
        """Test package search"""
        response = requests.get(f"{BASE_URL}/api/packages", params={"search": "Guatemala"})
        assert response.status_code == 200
        packages = response.json()
        print(f"Search packages passed - {len(packages)} results for 'Guatemala'")
    
    def test_filter_by_category(self):
        """Test filter by category"""
        response = requests.get(f"{BASE_URL}/api/packages", params={"category": "paquete"})
        assert response.status_code == 200
        packages = response.json()
        for pkg in packages:
            assert pkg["category"] == "paquete"
        print(f"Filter by category passed - {len(packages)} paquetes")
    
    def test_filter_by_price_range(self):
        """Test filter by price range"""
        response = requests.get(f"{BASE_URL}/api/packages", params={
            "min_price": 1000,
            "max_price": 10000
        })
        assert response.status_code == 200
        packages = response.json()
        for pkg in packages:
            assert 1000 <= pkg["price"] <= 10000
        print(f"Filter by price range passed - {len(packages)} packages")
    
    def test_sort_by_price(self):
        """Test sort by price"""
        response = requests.get(f"{BASE_URL}/api/packages", params={"sort": "price_asc"})
        assert response.status_code == 200
        packages = response.json()
        if len(packages) > 1:
            for i in range(len(packages) - 1):
                assert packages[i]["price"] <= packages[i+1]["price"]
        print("Sort by price passed")


class TestOtherEndpoints:
    """Tests for other endpoints to ensure they still work"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kuxtaltravels.com",
            "password": "KuxtalAdmin2024!"
        })
        assert login_response.status_code == 200
        return session
    
    def test_announcements_endpoint(self):
        """Test announcements endpoint"""
        response = requests.get(f"{BASE_URL}/api/announcements")
        assert response.status_code == 200
        print("Announcements endpoint passed")
    
    def test_commerce_categories(self):
        """Test commerce categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/commerce/categories")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        print(f"Commerce categories passed - {len(categories)} categories")
    
    def test_commerce_list(self):
        """Test commerce list endpoint"""
        response = requests.get(f"{BASE_URL}/api/commerce")
        assert response.status_code == 200
        print("Commerce list endpoint passed")
    
    def test_stats_endpoint(self, admin_session):
        """Test admin stats endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_members" in data
        assert "total_packages" in data
        print(f"Stats endpoint passed - {data['total_packages']} packages, {data['total_members']} members")
    
    def test_whatsapp_config(self):
        """Test WhatsApp config endpoint"""
        response = requests.get(f"{BASE_URL}/api/config/whatsapp")
        assert response.status_code == 200
        print("WhatsApp config endpoint passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
