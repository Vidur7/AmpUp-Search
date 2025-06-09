import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api/v1/auth"


def test_signup():
    # Generate a random anonymous_id
    anonymous_id = str(uuid.uuid4())

    # Test signup
    signup_data = {
        "email": "test@example.com",
        "password": "testpass123",
        "anonymous_id": anonymous_id,
        "is_premium": False,
    }

    response = requests.post(f"{BASE_URL}/signup", json=signup_data)
    print("\n=== Signup Test ===")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return signup_data


def test_signin(email, password):
    # Test signin
    signin_data = {
        "username": email,  # FastAPI OAuth expects username field
        "password": password,
    }

    response = requests.post(
        f"{BASE_URL}/signin",
        data=signin_data,  # Use data instead of json for form data
    )
    print("\n=== Signin Test ===")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.json().get("access_token") if response.ok else None


def test_me(token):
    # Test get current user
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(f"{BASE_URL}/me", headers=headers)
    print("\n=== Get Current User Test ===")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


if __name__ == "__main__":
    # Run the test flow
    print("Starting authentication tests...")

    # 1. Sign up
    user_data = test_signup()

    # 2. Sign in
    token = test_signin(user_data["email"], user_data["password"])

    # 3. Get user info
    if token:
        test_me(token)
    else:
        print("Failed to get token, skipping /me endpoint test")
