import os
from dotenv import load_dotenv
from langchain_community.chat_models import ChatTongyi

# 加载.env文件
load_dotenv()

# 获取API密钥
API_KEY = os.getenv('QWEN_API_KEY', os.getenv('DASHSCOPE_API_KEY', 'your-api-key'))

if not API_KEY or API_KEY == 'your-api-key':
    print("❌ API密钥未配置，请检查.env文件")
    exit(1)

print(f"✅ API密钥: {API_KEY[:8]}...{API_KEY[-4:]}")

# 初始化Qwen聊天模型
try:
    llm = ChatTongyi(
        model="qwen-turbo",
        temperature=0.3,
        dashscope_api_key=API_KEY
    )
    print("✅ 成功初始化Qwen模型")
    
    # 测试API调用
    response = llm.invoke("你好，我在测试Qwen API连接")
    print(f"✅ API调用成功: {response.content}")
    
except Exception as e:
    import traceback
    print(f"❌ API错误: {str(e)}")
    print("详细错误信息:")
    traceback.print_exc()
