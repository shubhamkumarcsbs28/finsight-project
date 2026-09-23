from fastapi.testclient import TestClient

from app.main import app


def test_accounts_and_transactions_flow() -> None:
    with TestClient(app) as client:
        # Register & login user
        email = "txuser@finsight.dev"
        client.post(
            "/api/auth/register",
            json={"email": email, "full_name": "Tx User", "password": "Password123!"},
        )
        login_res = client.post(
            "/api/auth/login",
            json={"email": email, "password": "Password123!"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create account
        acc_payload = {
            "account_type": "CHECKING",
            "currency": "USD",
            "initial_balance": 2000.00,
        }
        acc_res = client.post("/api/accounts", json=acc_payload, headers=headers)
        assert acc_res.status_code == 201, acc_res.text
        account_id = acc_res.json()["id"]

        # Execute legitimate debit transaction ($50.00)
        tx_payload = {
            "account_id": account_id,
            "transaction_type": "DEBIT",
            "amount": 50.00,
            "merchant": "Target Superstore",
            "category": "Shopping",
            "description": "Household items",
        }
        tx_res = client.post("/api/transactions", json=tx_payload, headers=headers)
        assert tx_res.status_code == 201, tx_res.text
        tx_data = tx_res.json()
        assert tx_data["risk_score"] < 30
        assert tx_data["amount"] == "50.00"

        # Check balance after debit (should be 1950.00)
        bal_res = client.get(f"/api/accounts/{account_id}/balance", headers=headers)
        assert bal_res.status_code == 200
        assert bal_res.json()["balance"] == "1950.00"

        # Execute high value transaction (> $5000) to trigger fraud alert
        large_tx_payload = {
            "account_id": account_id,
            "transaction_type": "DEBIT",
            "amount": 6000.00,
            "merchant": "Wire Escrow Global",
            "category": "Transfer",
            "description": "High value escrow transfer",
        }
        # First add credit so balance is sufficient
        client.post(
            "/api/transactions",
            json={
                "account_id": account_id,
                "transaction_type": "CREDIT",
                "amount": 10000.00,
                "merchant": "Payroll Deposit",
                "category": "Income",
            },
            headers=headers,
        )

        large_res = client.post("/api/transactions", json=large_tx_payload, headers=headers)
        assert large_res.status_code == 201, large_res.text
        large_data = large_res.json()
        assert large_data["risk_score"] >= 30, f"Expected risk score >= 30, got {large_data['risk_score']}"

        # Verify fraud alert was created
        alerts_res = client.get("/api/alerts", headers=headers)
        assert alerts_res.status_code == 200
        alerts_data = alerts_res.json()
        assert alerts_data["total"] >= 1
