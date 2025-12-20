from app import init_vector_store, embeddings
import os

# 直接初始化向量库
vector_store = None
if os.path.exists('chroma_db'):
    from langchain_chroma import Chroma
    vector_store = Chroma(
        persist_directory='chroma_db',
        embedding_function=embeddings
    )
    print(f'成功加载本地知识库，共 {vector_store._collection.count()} 条文档块')
    
    # 获取向量库中的文档
    docs = vector_store.get()
    print(f'向量库中共有 {len(docs["ids"])} 个文档')
    # 查看所有文档的元数据
    for i, (id, metadata) in enumerate(zip(docs["ids"], docs["metadatas"])):
        print(f'文档 {i+1}:')
        print(f'  ID: {id}')
        print(f'  元数据: {metadata}')
else:
    print('chroma_db目录不存在')
