#!/bin/bash

# 每日数据同步脚本
cd /home/ubuntu/Pendle-Finance-Periphery

# 拉取最新代码（如果有）
# git pull

# 安装依赖
npm install

# 运行同步程序
npm run start

# 记录执行日志
echo "$(date): 每日数据同步完成" >> sync.log
