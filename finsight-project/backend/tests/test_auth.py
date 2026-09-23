from fastapi.testclient import TestClient

from app.main import app


def test_user_registration_and_login() -> None:
    with TestClient(app) as client:
        # Register user
        reg_payload = {
            "email": "testuser@finsight.dev",
            "full_name": "Test User",
            "password": "SecurePassword123!",
        }
        reg_res = client.post("/api/auth/register", json=reg_payload)
        assert reg_res.status_code == 201, reg_res.text
        data = reg_res.json()
        assert data["email"] == "testuser@finsight.dev"
        assert data["full_name"] == "Test User"
        assert "id" in data

        # Duplicate email registration attempt
        dup_res = client.post("/api/auth/register", json=reg_payload)
        assert dup_res.status_code == 400

        # Login user
        login_payload = {
            "email": "testuser@finsight.dev",
            "password": "SecurePassword123!",
        }
        login_res = client.post("/api/auth/login", json=login_payload)
        assert login_res.status_code == 200, login_res.text
        token_data = login_res.json()
        assert "access_token" in token_data
        token = token_data["access_token"]

        # Fetch /api/auth/me using Bearer token
        headers = {"Authorization": f"Bearer {token}"}
        me_res = client.get("/api/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "testuser@finsight.dev"
