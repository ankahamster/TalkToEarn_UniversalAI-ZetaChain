import os
import sqlite3
import json

# 检查数据库文件是否存在
db_file = 'talktoearn.db'
if os.path.exists(db_file):
    print(f"✅ 数据库文件 {db_file} 已存在")
    
    # 连接到数据库并验证表结构和数据
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # 检查用户表
    print("\n📊 检查用户表 (users):")
    cursor.execute('SELECT * FROM users')
    users = cursor.fetchall()
    print(f"用户总数: {len(users)}")
    for user in users:
        print(f"  用户ID: {user[0]}, 余额: {user[2]}, 注册时间: {user[5]}, 钱包地址: {user[6] if len(user) > 6 else '未设置'}")
    
    # 检查上传文件表
    print("\n📁 检查上传文件表 (uploaded_files):")
    cursor.execute('SELECT * FROM uploaded_files')
    uploaded_files = cursor.fetchall()
    print(f"上传文件总数: {len(uploaded_files)}")
    for file in uploaded_files[:10]:  # 只显示前10个
        print(f"  用户ID: {file[1]}, 文件ID: {file[2]}")
    
    # 检查引用文件表
    print("\n📄 检查引用文件表 (referenced_files):")
    cursor.execute('SELECT * FROM referenced_files')
    referenced_files = cursor.fetchall()
    print(f"引用文件总数: {len(referenced_files)}")
    for ref in referenced_files[:10]:  # 只显示前10个
        print(f"  用户ID: {ref[1]}, 文件ID: {ref[2]}, 奖励: {ref[4]}")
    
    conn.close()
else:
    print(f"❌ 数据库文件 {db_file} 不存在")
    
    # 检查 users.json 文件
    users_json_file = 'users.json'
    if os.path.exists(users_json_file):
        print(f"📋 用户数据文件 users.json 已存在")
        with open(users_json_file, 'r', encoding='utf-8') as f:
            users = json.load(f)
        print(f"用户总数: {len(users)}")
        for user_id, user_data in users.items():
            print(f"  用户ID: {user_id}, 余额: {user_data['coin_balance']}")
    else:
        print("❌ 用户数据文件 users.json 也不存在")