#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库初始化脚本
用于手动执行数据库初始化和数据迁移
"""

import os
import sys

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import init_db, migrate_from_json_to_db

def main():
    print("=== 数据库初始化脚本 ===")
    
    # 执行数据库初始化
    print("1. 正在初始化数据库表结构...")
    try:
        init_db()
        print("✅ 数据库表结构初始化成功！")
    except Exception as e:
        print(f"❌ 数据库表结构初始化失败: {e}")
        return False
    
    # 执行数据迁移
    print("2. 正在从users.json迁移数据到数据库...")
    try:
        migrate_from_json_to_db()
        print("✅ 数据迁移成功！")
    except Exception as e:
        print(f"❌ 数据迁移失败: {e}")
        return False
    
    print("\n🎉 数据库初始化和数据迁移完成！")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)