import requests
import json
import os

# Pinata API keys (replace with your own)
PINATA_API_KEY = 'your_pinata_api_key'
PINATA_API_SECRET = 'your_pinata_api_secret'
PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
PINATA_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

# Function to upload file to Pinata
def upload_file_to_pinata(file_path):
    headers = {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET
    }
    with open(file_path, 'rb') as file:
        files = {'file': (os.path.basename(file_path), file)}
        response = requests.post(PINATA_API_URL, files=files, headers=headers)
        if response.status_code == 200:
            return response.json()['IpfsHash']
        else:
            raise Exception(f"Error uploading file: {response.text}")

# Function to upload JSON to Pinata
def upload_json_to_pinata(metadata):
    headers = {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET
    }
    response = requests.post(PINATA_JSON_URL, json=metadata, headers=headers)
    if response.status_code == 200:
        return response.json()['IpfsHash']
    else:
        raise Exception(f"Error uploading JSON: {response.text}")

# Main process
def main(txt_file_path):
    # Step 1: Upload txt file to IPFS via Pinata
    txt_ipfs_hash = upload_file_to_pinata(txt_file_path)
    preview_url = f"https://gateway.pinata.cloud/ipfs/{txt_ipfs_hash}"
    
    # Step 2: Generate metadata JSON
    # with open(txt_file_path, 'r') as f:
    #     txt_content = f.read()
    
    with open(txt_file_path, 'r', encoding='utf-8') as f:
        txt_content = f.read()
    
    metadata = {
        "name": "My TXT File",
        "description": "A simple TXT file uploaded to IPFS",
        "external_url": preview_url,
        "text_content": txt_content  # Include txt content if needed
    }
    
    # Step 3: Upload metadata JSON to IPFS via Pinata
    metadata_ipfs_hash = upload_json_to_pinata(metadata)
    token_uri = f"ipfs://{metadata_ipfs_hash}"  # Or https://gateway.pinata.cloud/ipfs/{metadata_ipfs_hash}
    
    # Print results
    print(f"Preview URL (text preview): {preview_url}")
    print(f"Metadata CID (Token URI): {token_uri}")

# Example usage
if __name__ == "__main__":
    txt_file_path = 'path/to/your/local/file.txt'  # Replace with your local txt file path
    main(txt_file_path)