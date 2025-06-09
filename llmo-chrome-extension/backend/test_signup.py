import requests
import uuid
import json


def test_signup():
    # Test data
    test_data = {
        "email": "test123@example.com",
        "password": "testpass123",
        "anonymous_id": str(uuid.uuid4()),
        "is_premium": False,
    }

    print("\n=== Testing Signup ===")
    print(f"Sending data: {json.dumps(test_data, indent=2)}")

    try:
        # Make signup request
        response = requests.post(
            "http://localhost:8000/api/v1/auth/signup",
            json=test_data,
            headers={"Content-Type": "application/json"},
        )

        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            print("\nSignup successful! Testing signin...")

            # Test signin with the same credentials
            signin_data = {
                "username": test_data["email"],
                "password": test_data["password"],
            }

            signin_response = requests.post(
                "http://localhost:8000/api/v1/auth/signin", data=signin_data
            )

            print(f"\nSignin Status Code: {signin_response.status_code}")
            print(f"Signin Response: {json.dumps(signin_response.json(), indent=2)}")

    except Exception as e:
        print(f"\nError occurred: {str(e)}")


if __name__ == "__main__":
    test_signup()
