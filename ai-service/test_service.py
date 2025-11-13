import requests
import json

# Test the AI service endpoints
BASE_URL = "http://localhost:8001"

def test_root():
    print("Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_classify():
    print("Testing /classify endpoint...")
    data = {
        "text": "I cannot login to my account",
        "labels": ["login", "billing", "bug"]
    }
    response = requests.post(f"{BASE_URL}/classify", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_sentiment():
    print("Testing /sentiment endpoint...")
    data = {
        "text": "I am very angry with this service"
    }
    response = requests.post(f"{BASE_URL}/sentiment", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_embed():
    print("Testing /embed endpoint...")
    data = {
        "text": "My order is late"
    }
    response = requests.post(f"{BASE_URL}/embed", json=data)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Dimensions: {result.get('dimensions')}")
    print(f"First 5 values: {result.get('embedding', [])[:5]}\n")

if __name__ == "__main__":
    try:
        test_root()
        test_classify()
        test_sentiment()
        test_embed()
        print("✅ All tests completed successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
