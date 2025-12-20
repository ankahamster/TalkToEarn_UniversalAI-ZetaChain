import requests
from io import BytesIO
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# ================== 配置 ==================

PINATA_API_KEY = "api-key"
PINATA_API_SECRET = "api-secret"

PINATA_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"
PINATA_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"

NFT_CONTRACT_ADDRESS = "0xB7277D1C77B6239910f0F67ad72A23cB13a6Df66"

# ==========================================


class MintRequest(BaseModel):
    wallet: str
    text: str
    name: str
    description: str


def upload_text(text: str, filename="content.txt") -> str:
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_API_SECRET,
    }
    buffer = BytesIO(text.encode("utf-8"))
    files = {"file": (filename, buffer, "text/plain")}
    res = requests.post(PINATA_FILE_URL, files=files, headers=headers)
    res.raise_for_status()
    return res.json()["IpfsHash"]


def upload_metadata(metadata: dict) -> str:
    headers = {
        "Content-Type": "application/json",
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_API_SECRET,
    }
    res = requests.post(PINATA_JSON_URL, json=metadata, headers=headers)
    res.raise_for_status()
    return res.json()["IpfsHash"]


@app.post("/prepare-mint")
def prepare_mint(req: MintRequest):
    # 1. 上传文本
    text_cid = upload_text(req.text)
    preview_url = f"https://gateway.pinata.cloud/ipfs/{text_cid}"

    # 2. 构造 metadata
    metadata = {
        "name": req.name,
        "description": req.description,
        "external_url": preview_url,
        "content": req.text,
    }

    metadata_cid = upload_metadata(metadata)
    token_uri = f"ipfs://{metadata_cid}"

    return {
        "wallet": req.wallet,
        "tokenURI": token_uri,
        "previewURL": preview_url,
        "nftContract": NFT_CONTRACT_ADDRESS,
    }
