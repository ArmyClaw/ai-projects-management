#!/bin/bash

# AI Insights Daily Generator Script
# Generates bilingual (Chinese/English) AI technology trend reports

echo "开始执行AI Insights每日报告生成系统..."

# 获取当前日期
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_DATETIME=$(date +%Y%m%d_%H%M%S)

echo "当前日期: $CURRENT_DATE"
echo "生成时间: $CURRENT_DATETIME"

# 创建必要的目录结构
mkdir -p ai_insights_system/daily_reports/$CURRENT_DATE
mkdir -p ai_insights_system/archive

echo "开始生成AI洞察报告..."

# 执行Python脚本生成中英文双语报告
python3 ai_insights_system/generate_ai_insights.py

# 检查执行结果
if [ $? -eq 0 ]; then
    echo "AI Insights报告生成成功！"
    
    # 显示生成的文件
    echo "生成的报告文件:"
    ls -la ai_insights_system/daily_reports/$CURRENT_DATE/
    
    # 可选：将旧报告移动到归档目录（保留最近7天的报告在主目录）
    find ai_insights_system/daily_reports -maxdepth 1 -type d -name "????-??-??" \
        -not -name "$CURRENT_DATE" -mtime +7 -exec mv {} ai_insights_system/archive/ \; 2>/dev/null || true
    
    echo "AI Insights每日报告生成完成！"
else
    echo "AI Insights报告生成失败！"
    exit 1
fi