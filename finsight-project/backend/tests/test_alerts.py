from fastapi.testclient import TestClient

from app.main import app


def test_alert_lifecycle() -> None:
    with TestClient(app) as client:
        # Register user
        email = "alertuser@finsight.dev"
        client.post(
            "/api/auth/register",
            json={"email": email, "full_name": "Alert User", "password": "Password123!"},
        )
        login_res = client.post(
            "/api/auth/login",
            json={"email": email, "password": "Password123!"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create account
        acc_res = client.post(
            "/api/accounts",
            json={"account_type": "CHECKING", "currency": "USD", "initial_balance": 20000.00},
            headers=headers,
        )
        account_id = acc_res.json()["id"]

        # Trigger high risk transaction
        client.post(
            "/api/transactions",
            json={
                "account_id": account_id,
                "transaction_type": "DEBIT",
                "amount": 15000.00,
                "merchant": "Unrecognized International Merchant",
                "category": "Transfer",
            },
            headers=headers,
        )

        # Get alerts queue
        alerts_res = client.get("/api/alerts", headers=headers)
        assert alerts_res.status_code == 200
        items = alerts_res.json()["items"]
        assert len(items) >= 1
        alert_id = items[0]["id"]
        assert items[0]["status"] == "OPEN"

        # Update alert status to REVIEWED
        patch_res = client.patch(
            f"/api/alerts/{alert_id}",
            json={"status": "REVIEWED", "resolution_notes": "Contacted customer by phone to verify activity."},
            headers=headers,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == "REVIEWED"
        assert patch_res.json()["resolution_notes"] == "Contacted customer by phone to verify activity."

        # Update alert status to RESOLVED
        res_patch = client.patch(
            f"/api/alerts/{alert_id}",
            json={"status": "RESOLVED", "resolution_notes": "Customer confirmed transaction was legitimate."},
            headers=headers,
        )
        assert res_patch.status_code == 200
        assert res_patch.json()["status"] == "RESOLVED"
