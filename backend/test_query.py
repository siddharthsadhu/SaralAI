import requests

def test():
    print("Testing /api/query")
    payload = {
        "query": "What is PM Kisan scheme?",
        "language": "en"
    }
    r = requests.post("http://localhost:8000/api/query", json=payload)
    print(r.status_code)
    print(r.text[:500])

    print("\nTesting /api/query with Hindi translation")
    payload_hi = {
        "query": "What is PM Kisan scheme?",
        "language": "hi"
    }
    r_hi = requests.post("http://localhost:8000/api/query", json=payload_hi)
    print(r_hi.status_code)
    try:
        j = r_hi.json()
        print("Summary:", j.get("content", {}).get("summary", "")[:100])
    except Exception as e:
        print("Not json", e)

if __name__ == "__main__":
    test()
