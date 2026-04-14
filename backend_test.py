import requests
import sys
import json
from datetime import datetime

class KuxtalTravelAPITester:
    def __init__(self, base_url="https://vacation-club-portal.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.member_token = None
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def test_admin_login(self):
        """Test admin login"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/login", 
                json={"email": "admin@kuxtaltravels.com", "password": "KuxtalAdmin2024!"})
            
            if response.status_code == 200:
                data = response.json()
                if data.get("role") in ["super_admin", "admin"]:
                    self.admin_token = data.get("token")
                    self.log_test("Admin Login", True)
                    return True
                else:
                    self.log_test("Admin Login", False, f"Invalid role: {data.get('role')}")
            else:
                self.log_test("Admin Login", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Admin Login", False, str(e))
        return False

    def test_member_login(self):
        """Test member login"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/member-login", 
                json={"contract_number": "KT-001", "dpi": "1234567890101"})
            
            if response.status_code == 200:
                data = response.json()
                if data.get("role") == "member":
                    self.member_token = data.get("token")
                    self.log_test("Member Login", True)
                    return True
                else:
                    self.log_test("Member Login", False, f"Invalid role: {data.get('role')}")
            else:
                self.log_test("Member Login", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Member Login", False, str(e))
        return False

    def test_auth_me(self):
        """Test /api/auth/me endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/auth/me")
            success = response.status_code == 200
            self.log_test("Auth Me", success, "" if success else f"Status {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Auth Me", False, str(e))
            return False

    def test_packages_list(self):
        """Test packages listing"""
        try:
            response = self.session.get(f"{self.base_url}/api/packages")
            if response.status_code == 200:
                packages = response.json()
                success = isinstance(packages, list) and len(packages) > 0
                self.log_test("Packages List", success, f"Found {len(packages)} packages" if success else "No packages found")
                return success
            else:
                self.log_test("Packages List", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Packages List", False, str(e))
        return False

    def test_packages_featured(self):
        """Test featured packages"""
        try:
            response = self.session.get(f"{self.base_url}/api/packages?featured=true")
            if response.status_code == 200:
                packages = response.json()
                success = isinstance(packages, list)
                self.log_test("Featured Packages", success, f"Found {len(packages)} featured packages")
                return success
            else:
                self.log_test("Featured Packages", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Featured Packages", False, str(e))
        return False

    def test_packages_search(self):
        """Test package search functionality"""
        try:
            # Test category filter
            response = self.session.get(f"{self.base_url}/api/packages?category=paquete")
            if response.status_code == 200:
                packages = response.json()
                self.log_test("Package Search by Category", True, f"Found {len(packages)} packages")
            else:
                self.log_test("Package Search by Category", False, f"Status {response.status_code}")
                return False

            # Test country filter
            response = self.session.get(f"{self.base_url}/api/packages?country=Argentina")
            success = response.status_code == 200
            self.log_test("Package Search by Country", success)
            return success
        except Exception as e:
            self.log_test("Package Search", False, str(e))
            return False

    def test_countries_list(self):
        """Test countries endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/countries")
            if response.status_code == 200:
                countries = response.json()
                success = isinstance(countries, list)
                self.log_test("Countries List", success, f"Found {len(countries)} countries")
                return success
            else:
                self.log_test("Countries List", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Countries List", False, str(e))
        return False

    def test_quotation_submission(self):
        """Test quotation submission (public)"""
        try:
            quotation_data = {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "+502 5555-1234",
                "message": "Test quotation request",
                "guests": 2
            }
            response = self.session.post(f"{self.base_url}/api/quotations", json=quotation_data)
            success = response.status_code == 200
            self.log_test("Public Quotation Submission", success, "" if success else f"Status {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Public Quotation Submission", False, str(e))
            return False

    def test_member_quotation_submission(self):
        """Test member quotation submission"""
        try:
            quotation_data = {
                "name": "Member Test",
                "email": "member@example.com", 
                "phone": "+502 5555-5678",
                "contract_number": "KT-001",
                "message": "Member quotation request",
                "guests": 3
            }
            response = self.session.post(f"{self.base_url}/api/quotations", json=quotation_data)
            success = response.status_code == 200
            self.log_test("Member Quotation Submission", success, "" if success else f"Status {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Member Quotation Submission", False, str(e))
            return False

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        if not self.admin_token:
            self.log_test("Admin Endpoints", False, "No admin token available")
            return False

        try:
            # Test stats
            response = self.session.get(f"{self.base_url}/api/stats")
            if response.status_code == 200:
                stats = response.json()
                self.log_test("Admin Stats", True, f"Stats: {stats}")
            else:
                self.log_test("Admin Stats", False, f"Status {response.status_code}")

            # Test members list
            response = self.session.get(f"{self.base_url}/api/members")
            if response.status_code == 200:
                members = response.json()
                self.log_test("Admin Members List", True, f"Found {len(members)} members")
            else:
                self.log_test("Admin Members List", False, f"Status {response.status_code}")

            # Test quotations list
            response = self.session.get(f"{self.base_url}/api/quotations")
            if response.status_code == 200:
                quotations = response.json()
                self.log_test("Admin Quotations List", True, f"Found {len(quotations)} quotations")
            else:
                self.log_test("Admin Quotations List", False, f"Status {response.status_code}")

            # Test announcements
            response = self.session.get(f"{self.base_url}/api/announcements")
            success = response.status_code == 200
            self.log_test("Admin Announcements", success)

            # Test vacation requests
            response = self.session.get(f"{self.base_url}/api/vacation-requests")
            success = response.status_code == 200
            self.log_test("Admin Vacation Requests", success)

            return True
        except Exception as e:
            self.log_test("Admin Endpoints", False, str(e))
            return False

    def test_member_endpoints(self):
        """Test member-specific endpoints"""
        if not self.member_token:
            self.log_test("Member Endpoints", False, "No member token available")
            return False

        try:
            # Test member quotations
            response = self.session.get(f"{self.base_url}/api/quotations")
            if response.status_code == 200:
                quotations = response.json()
                self.log_test("Member Quotations List", True, f"Found {len(quotations)} quotations")
            else:
                self.log_test("Member Quotations List", False, f"Status {response.status_code}")

            # Test member announcements
            response = self.session.get(f"{self.base_url}/api/announcements?target=members")
            if response.status_code == 200:
                announcements = response.json()
                self.log_test("Member Announcements", True, f"Found {len(announcements)} announcements")
            else:
                self.log_test("Member Announcements", False, f"Status {response.status_code}")

            # Test vacation request creation
            vacation_data = {
                "destination": "Test Destination",
                "travel_date": "2024-12-25",
                "guests": 2,
                "message": "Test vacation request"
            }
            response = self.session.post(f"{self.base_url}/api/vacation-requests", json=vacation_data)
            success = response.status_code == 200
            self.log_test("Member Vacation Request Creation", success)

            return True
        except Exception as e:
            self.log_test("Member Endpoints", False, str(e))
            return False

    def test_whatsapp_config(self):
        """Test WhatsApp configuration"""
        try:
            response = self.session.get(f"{self.base_url}/api/config/whatsapp")
            success = response.status_code == 200
            self.log_test("WhatsApp Config", success)
            return success
        except Exception as e:
            self.log_test("WhatsApp Config", False, str(e))
            return False

    def test_logout(self):
        """Test logout"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/logout")
            success = response.status_code == 200
            self.log_test("Logout", success)
            return success
        except Exception as e:
            self.log_test("Logout", False, str(e))
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Kuxtal Travel API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)

        # Public endpoints (no auth required)
        self.test_packages_list()
        self.test_packages_featured()
        self.test_packages_search()
        self.test_countries_list()
        self.test_quotation_submission()
        self.test_member_quotation_submission()
        self.test_whatsapp_config()

        # Authentication tests
        admin_login_success = self.test_admin_login()
        if admin_login_success:
            self.test_auth_me()
            self.test_admin_endpoints()

        member_login_success = self.test_member_login()
        if member_login_success:
            self.test_auth_me()
            self.test_member_endpoints()

        # Logout test
        self.test_logout()

        # Print summary
        print("=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = KuxtalTravelAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())