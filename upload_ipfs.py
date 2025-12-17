import requests
import json
from io import BytesIO

# Pinata API keys (请替换为自己的)
PINATA_API_KEY = 'your-api-key'
PINATA_API_SECRET = 'your-api-secret'
PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
PINATA_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'



# 新函数：直接上传文本字符串到 IPFS（返回 CID）
def upload_text_to_pinata(text_content: str, filename: str = "text.txt") -> str:
    """
    直接上传纯文本内容到 Pinata/IPFS
    :param text_content: 要上传的文本字符串
    :param filename: 上传时显示的文件名（建议带 .txt 后缀，便于查看）
    :return: IPFS CID (hash)
    """
    headers = {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET
    }
    
    # 将字符串转为字节流，模拟文件
    file_buffer = BytesIO(text_content.encode('utf-8'))
    
    files = {
        'file': (filename, file_buffer, 'text/plain')
    }
    
    response = requests.post(PINATA_API_URL, files=files, headers=headers)
    
    if response.status_code == 200:
        return response.json()['IpfsHash']
    else:
        raise Exception(f"Error uploading text: {response.status_code} {response.text}")

# 原函数保持不变：上传 JSON 元数据
def upload_json_to_pinata(metadata: dict) -> str:
    headers = {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET
    }
    response = requests.post(PINATA_JSON_URL, json=metadata, headers=headers)
    if response.status_code == 200:
        return response.json()['IpfsHash']
    else:
        raise Exception(f"Error uploading JSON: {response.status_code} {response.text}")

# 主函数：输入文本字符串，返回 metadata 的 token_uri（即最终用于铸造NFT的URI）
def upload_text_and_get_preview_url(text_content: str, 
                                  name: str = "My Text Inscription",
                                  description: str = "A piece of text permanently stored on IPFS",file_name:str="0") -> str:
    """
    完整流程：上传文本 → 生成元数据 → 上传元数据 → 返回 token_uri
    """
    # Step 1: 上传纯文本内容
    txt_ipfs_hash = upload_text_to_pinata(text_content, filename=file_name)
    preview_url = f"https://gateway.pinata.cloud/ipfs/{txt_ipfs_hash}"
    
    # Step 2: 构建元数据（可根据需要调整字段）
    metadata = {
        "name": name,
        "description": description,
        "external_url": preview_url,
        "content": text_content,  # 直接把原文放进元数据（可选，体积不大时推荐）
        # "image": None  # 如果没有图片可省略
    }
    
    # Step 3: 上传元数据 JSON
    metadata_ipfs_hash = upload_json_to_pinata(metadata)
    token_uri = f"ipfs://{metadata_ipfs_hash}"
    
    # 可选：打印中间结果便于调试
    print(f"文本预览链接: {preview_url}")
    print(f"Metadata Token URI: {token_uri}")
    
    return preview_url

# 示例：直接运行时测试
if __name__ == "__main__":
    sample_text = """
    编程语言是人类用以指挥计算机的精密工具。它构建了一套兼具逻辑性与可读性的语法体系，充当着人类思维与机器二进制世界之间的翻译桥梁。

与我们日常灵活的语言不同，编程语言的核心在于精确无歧义。通过特定关键词和逻辑结构，我们将复杂问题拆解为一系列可供计算机逐步执行的明确指令。这个过程本质上是将人类的抽象思考——无论是数学计算、数据处理还是智能算法——转化为机器能够理解和运行的精确代码。

从低级语言到高级语言的演进，体现了人类追求更高编程效率与表达能力的历程。高级语言通过更接近人类思维的语法，极大地提升了程序开发的效率，并降低了入门门槛。

因此，编程语言不仅是技术工具，更是思维的延伸。它让我们能够将创意和逻辑严谨地具象化，从而在数字世界中构建出从简单网页到复杂人工智能的万千应用，最终拓展了人类解决问题的能力边界
    """
    url = upload_text_and_get_preview_url(sample_text, name="永恒之言 #1",file_name="0")
    print(f"url for view: {url}")
    print(str(url))