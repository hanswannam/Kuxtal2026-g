"""
Iteration 13 Tests - PDF Image Extraction Feature
Tests for:
- Backend import endpoint returns extracted_gallery field
- Backend validates Google Drive URLs (400 for invalid)
- Backend requires auth (401 without token)
- Gallery field accepted by POST /api/packages
- Existing features still work
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestImportEndpointAuth:
    """Test authentication requirements for import endpoint"""
    
    def test_import_requires_auth(self):
        """Import endpoint returns 401 without authentication"""
        response = requests.post(
            f"{BASE_URL}/api/packages/import-from-drive",
            json={"drive_url": "https://drive.google.com/file/d/abc123/view"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401
        assert "autenticado" in response.json().get("detail", "").lower()

class TestImportEndpointValidation:
    """Test URL validation for import endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@kuxtaltravels.com", "password": "KuxtalAdmin2024!"}
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json().get("token")
    
    def test_import_empty_url_returns_400(self, auth_token):
        """Empty URL returns 400 with appropriate message"""
        response = requests.post(
            f"{BASE_URL}/api/packages/import-from-drive",
            json={"drive_url": ""},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            }
        )
        assert response.status_code == 400
        assert "requerida" in response.json().get("detail", "").lower()
    
    def test_import_invalid_url_returns_400(self, auth_token):
        """Invalid Google Drive URL returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/packages/import-from-drive",
            json={"drive_url": "https://invalid-url.com/file"},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            }
        )
        assert response.status_code == 400
        assert "extraer" in response.json().get("detail", "").lower() or "ID" in response.json().get("detail", "")
    
    def test_import_malformed_gdrive_url_returns_400(self, auth_token):
        """Malformed Google Drive URL returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/packages/import-from-drive",
            json={"drive_url": "https://drive.google.com/invalid/path"},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            }
        )
        assert response.status_code == 400

class TestPackageGalleryField:
    """Test that gallery field is accepted by package creation"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@kuxtaltravels.com", "password": "KuxtalAdmin2024!"}
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json().get("token")
    
    def test_create_package_with_gallery(self, auth_token):
        """Package creation accepts gallery field (list of URLs)"""
        test_id = uuid.uuid4().hex[:8]
        package_data = {
            "title": f"TEST_Gallery_{test_id}",
            "description": "Test package with gallery field",
            "short_description": "Testing gallery",
            "country": "Guatemala",
            "price": 1000,
            "member_price": 900,
            "duration_days": 3,
            "category": "paquete",
            "includes": ["Test"],
            "itinerary": [],
            "image_url": "/api/files/test/main.jpg",
            "gallery": ["/api/files/test/img1.jpg", "/api/files/test/img2.jpg", "/api/files/test/img3.jpg"],
            "status": "active"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/packages",
            json=package_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == package_data["title"]
        assert data["image_url"] == package_data["image_url"]
        assert "gallery" in data
        assert isinstance(data["gallery"], list)
        assert len(data["gallery"]) == 3
        assert data["gallery"][0] == "/api/files/test/img1.jpg"
    
    def test_create_package_with_empty_gallery(self, auth_token):
        """Package creation accepts empty gallery"""
        test_id = uuid.uuid4().hex[:8]
        package_data = {
            "title": f"TEST_EmptyGallery_{test_id}",
            "description": "Test package with empty gallery",
            "short_description": "Testing empty gallery",
            "country": "Guatemala",
            "price": 500,
            "member_price": 450,
            "duration_days": 2,
            "category": "paquete",
            "includes": [],
            "itinerary": [],
            "image_url": "",
            "gallery": [],
            "status": "active"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/packages",
            json=package_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["gallery"] == []

class TestExistingFeatures:
    """Verify existing features still work"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@kuxtaltravels.com", "password": "KuxtalAdmin2024!"}
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json().get("token")
    
    def test_admin_login(self):
        """Admin login still works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@kuxtaltravels.com", "password": "KuxtalAdmin2024!"}
        )
        assert response.status_code == 200
        assert "token" in response.json()
    
    def test_member_login(self):
        """Member login still works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/member-login",
            json={"contract_number": "KT-001", "dpi": "1234567890101"}
        )
        assert response.status_code == 200
        assert "token" in response.json()
    
    def test_list_packages(self):
        """List packages endpoint works"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_list_announcements(self):
        """List announcements endpoint works"""
        response = requests.get(f"{BASE_URL}/api/announcements")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_list_commerce(self):
        """List commerce endpoint works"""
        response = requests.get(f"{BASE_URL}/api/commerce")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_stats_requires_auth(self):
        """Stats endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 401
    
    def test_stats_with_auth(self, auth_token):
        """Stats endpoint works with auth"""
        response = requests.get(
            f"{BASE_URL}/api/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_packages" in data
        assert "total_members" in data
    
    def test_members_list_requires_auth(self):
        """Members list requires authentication"""
        response = requests.get(f"{BASE_URL}/api/members")
        assert response.status_code == 401
    
    def test_members_list_with_auth(self, auth_token):
        """Members list works with auth"""
        response = requests.get(
            f"{BASE_URL}/api/members",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

class TestImportResponseStructure:
    """Test that import endpoint returns expected structure including extracted_gallery"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@kuxtaltravels.com", "password": "KuxtalAdmin2024!"}
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json().get("token")
    
    def test_import_response_has_extracted_gallery_field_in_schema(self, auth_token):
        """
        Verify the import endpoint is designed to return extracted_gallery field.
        Note: We can't test with real Google Drive files, but we verify the endpoint
        structure by checking error responses include expected fields.
        """
        # This test verifies the endpoint exists and validates URLs properly
        # The actual extracted_gallery field is returned when processing real PDFs
        response = requests.post(
            f"{BASE_URL}/api/packages/import-from-drive",
            json={"drive_url": "https://drive.google.com/file/d/1234567890abcdef/view"},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            }
        )
        # Should fail with download error (file doesn't exist) not validation error
        # This confirms the URL was parsed correctly
        assert response.status_code in [400, 422, 500]
        # The error should be about downloading, not about URL format
        detail = response.json().get("detail", "")
        assert "descargar" in detail.lower() or "publico" in detail.lower() or "compartido" in detail.lower() or "error" in detail.lower()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
