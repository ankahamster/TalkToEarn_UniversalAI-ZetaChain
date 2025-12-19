import argparse
import json
import os
import re
from datetime import UTC, datetime
from typing import Any, Dict, Tuple


def _extract_ipfs_cid(ipfs_url: str) -> str | None:
    if not ipfs_url:
        return None
    match = re.search(r"/ipfs/([a-zA-Z0-9]+)", ipfs_url)
    return match.group(1) if match else None


def _compact_text(text: str, max_len: int = 280) -> str:
    if not text:
        return ""
    compact = re.sub(r"\s+", " ", text).strip()
    if len(compact) <= max_len:
        return compact
    return compact[: max_len - 1] + "…"


def _build_metadata(key: str, record: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    filename = record.get("filename") or "untitled"
    user_id = record.get("user_id") or "unknown"
    upload_time = record.get("upload_time") or ""
    ipfs_url = record.get("ipfs_url") or ""
    content_cid = _extract_ipfs_cid(ipfs_url)
    animation_url = f"ipfs://{content_cid}" if content_cid else None

    name = f"TalkToEarn Badge - {filename}"
    description = _compact_text(record.get("content_preview") or record.get("content") or "")

    attributes = [
        {"trait_type": "key", "value": key},
        {"trait_type": "filename", "value": filename},
        {"trait_type": "user_id", "value": user_id},
    ]

    if upload_time:
        attributes.append({"trait_type": "upload_time", "value": upload_time})
    if "reference_count" in record:
        attributes.append({"trait_type": "reference_count", "value": int(record.get("reference_count") or 0)})
    if "total_reward" in record:
        # Keep as string to avoid JSON float precision issues across toolchains
        attributes.append({"trait_type": "total_reward", "value": str(record.get("total_reward"))})
    if "authorize_rag" in record:
        attributes.append({"trait_type": "authorize_rag", "value": bool(record.get("authorize_rag"))})

    metadata: Dict[str, Any] = {
        "name": name,
        "description": description,
        # Human-friendly web preview (gateway URL). Wallets may ignore this but it's useful for debugging.
        "external_url": ipfs_url or None,
        # Points to the original content on IPFS (text/pdf/etc). Wallet support varies.
        "animation_url": animation_url,
        "attributes": attributes,
    }

    # Remove nulls for cleanliness
    metadata = {k: v for k, v in metadata.items() if v not in (None, "")}

    summary = {
        "key": key,
        "filename": filename,
        "user_id": user_id,
        "content_cid": content_cid,
        "content_ipfs_url": ipfs_url,
    }
    return metadata, summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate NFT metadata.json files from files.json")
    parser.add_argument("--input", default="files.json", help="Path to files.json (default: files.json)")
    parser.add_argument("--outdir", default="metadata", help="Output directory (default: metadata)")
    parser.add_argument("--max-desc-len", type=int, default=280, help="Max description length (default: 280)")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)

    os.makedirs(args.outdir, exist_ok=True)

    index: Dict[str, Any] = {
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "source": os.path.abspath(args.input),
        "items": [],
    }

    for key in sorted(data.keys()):
        record = data[key]
        metadata, summary = _build_metadata(key, record)

        # Apply configurable description length
        if "description" in metadata:
            metadata["description"] = _compact_text(metadata["description"], max_len=args.max_desc_len)

        out_path = os.path.join(args.outdir, f"{key}.metadata.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
            f.write("\n")

        summary["metadata_path"] = out_path.replace("\\", "/")
        index["items"].append(summary)

    index_path = os.path.join(args.outdir, "index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"✅ Generated {len(index['items'])} metadata files into: {args.outdir}/")
    print(f"🧾 Index: {index_path}")


if __name__ == "__main__":
    main()
