#!/usr/bin/env python3
"""
AI Insights Daily Generator
实时获取GitHub AI热门项目和明星项目新闻，生成中英双语日报
"""

import os
import json
import requests
from datetime import datetime
from pathlib import Path
import argparse

# Configuration
GITHUB_API_BASE = "https://api.github.com"
PROJECT_DIR = "/home/ecs-user/.openclaw/workspace/ai_insights_system"
TODAY = datetime.now().strftime("%Y-%m-%d")
REPORT_DIR = os.path.join(PROJECT_DIR, "daily_reports", TODAY)
SOURCE_DIR = os.path.join(PROJECT_DIR, "source_data")

os.makedirs(REPORT_DIR, exist_ok=True)
os.makedirs(SOURCE_DIR, exist_ok=True)

def log(message):
    """Log message"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

def fetch_github_ai_projects():
    """Fetch latest AI projects from GitHub"""
    log("Fetching GitHub AI data...")
    
    all_repos = []
    seen = set()
    
    # Search queries for AI projects
    queries = [
        "AI OR artificial intelligence OR machine learning",
        "LLM OR GPT OR language model",
        "deep learning OR neural network",
        "computer vision OR image generation",
        "AI agent OR autonomous AI"
    ]
    
    for query in queries:
        url = f"https://api.github.com/search/repositories"
        params = {
            "q": query,
            "sort": "stars",
            "order": "desc",
            "per_page": 20
        }
        headers = {"Accept": "application/vnd.github.v3+json"}
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=30)
            if response.status_code == 200:
                items = response.json().get("items", [])
                for item in items:
                    if item["full_name"] not in seen:
                        seen.add(item["full_name"])
                        all_repos.append({
                            "name": item["full_name"],
                            "description": item.get("description", ""),
                            "stars": item.get("stargazers_count", 0),
                            "forks": item.get("forks_count", 0),
                            "language": item.get("language", "Unknown"),
                            "url": item.get("html_url", ""),
                            "topics": item.get("topics", []),
                            "updated": item.get("updated_at", ""),
                        })
        except Exception as e:
            log(f"Error searching {query}: {e}")
    
    # Sort by stars
    all_repos.sort(key=lambda x: x["stars"], reverse=True)
    
    # Save raw data
    with open(os.path.join(SOURCE_DIR, f"github_data_{TODAY}.json"), "w", encoding="utf-8") as f:
        json.dump(all_repos, f, indent=2, ensure_ascii=False)
    
    log(f"Fetched {len(all_repos)} AI projects")
    return all_repos[:50]

def categorize_projects(repos):
    """Categorize projects by type"""
    categories = {
        "LLM & Language Models": [],
        "Machine Learning Frameworks": [],
        "Computer Vision & Image Gen": [],
        "AI Agents & Automation": [],
        "AI Tools & Utilities": []
    }
    
    keywords = {
        "LLM & Language Models": ["llm", "gpt", "language", "nlp", "text", "chat", "transformer", "bert", "gemma", "mistral", "llama"],
        "Machine Learning Frameworks": ["pytorch", "tensorflow", "keras", "machine learning", "train", "torch"],
        "Computer Vision & Image Gen": ["vision", "image", "stable diffusion", "diffusion", "image generation", "sd", "sora"],
        "AI Agents & Automation": ["agent", "autonomous", "auto", "automation", "agentic"],
        "AI Tools & Utilities": ["api", "tool", "sdk", "library", "server", "deploy", "cli"]
    }
    
    for repo in repos:
        desc = (repo.get("description") or "").lower()
        topics = " ".join(repo.get("topics", [])).lower()
        text = desc + " " + topics
        
        categorized = False
        for cat, kwds in keywords.items():
            if any(k in text for k in kwds):
                categories[cat].append(repo)
                categorized = True
                break
        
        if not categorized:
            categories["AI Tools & Utilities"].append(repo)
    
    return categories

def generate_reports(repos):
    """Generate bilingual reports"""
    log("Generating reports...")
    
    categories = categorize_projects(repos)
    
    # Chinese report
    zh_content = generate_chinese_report(repos, categories)
    zh_file = os.path.join(REPORT_DIR, f"ai_insights_{TODAY}_zh.md")
    with open(zh_file, 'w', encoding='utf-8') as f:
        f.write(zh_content)
    log(f"Chinese report: {zh_file}")
    
    # English report
    en_content = generate_english_report(repos, categories)
    en_file = os.path.join(REPORT_DIR, f"ai_insights_{TODAY}_en.md")
    with open(en_file, 'w', encoding='utf-8') as f:
        f.write(en_content)
    log(f"English report: {en_file}")
    
    return zh_file, en_file

def generate_chinese_report(repos, categories):
    """Generate Chinese report"""
    date_str = datetime.now().strftime("%Y年%m月%d日")
    
    content = f"""# 🤖 AI技术每日洞察 {date_str}

## 📊 今日概览

- **追踪项目总数**: {len(repos)}
- **数据来源**: GitHub API (实时获取)

---

## ⭐ 热门AI项目 TOP 15

| 排名 | 项目 | ⭐ Stars | 语言 | 描述 |
|:---:|:-----|:--------:|:----:|:-----|
"""
    
    for i, repo in enumerate(repos[:15], 1):
        desc = repo.get("description") or "无描述"
        if len(desc) > 50:
            desc = desc[:47] + "..."
        content += f"| {i} | [{repo['name']}]({repo['url']}) | {repo['stars']:,} | {repo['language']} | {desc} |\n"
    
    content += "\n---\n\n## 📂 项目分类\n\n"
    
    for cat, repos_list in categories.items():
        if repos_list:
            content += f"### {cat} ({len(repos_list)}个)\n\n"
            for repo in repos_list[:5]:
                content += f"- ⭐ {repo['stars']:,} [{repo['name']}]({repo['url']})\n"
            content += "\n"
    
    # Language stats
    langs = {}
    for repo in repos:
        lang = repo.get("language", "Unknown")
        langs[lang] = langs.get(lang, 0) + 1
    
    content += """---

## 🌍 编程语言分布

"""
    for lang, count in sorted(langs.items(), key=lambda x: x[1], reverse=True)[:8]:
        pct = count / len(repos) * 100
        content += f"- **{lang}**: {count} ({pct:.1f}%)\n"
    
    content += f"""

---

## 💡 今日洞察

1. **LLM持续火热** - 大语言模型项目持续获得最高关注
2. **AI工具涌现** - 各类AI工具和实用库快速发展
3. **开源活跃** - 开源AI项目持续推动行业发展

---

*报告生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}*
*数据来源: GitHub API*
"""
    return content

def generate_english_report(repos, categories):
    """Generate English report"""
    date_str = datetime.now().strftime("%B %d, %Y")
    
    content = f"""# 🤖 AI Insights Daily Report - {date_str}

## 📊 Overview

- **Total Projects Tracked**: {len(repos)}
- **Data Source**: GitHub API (Real-time)

---

## ⭐ Top 15 Trending AI Projects

| Rank | Project | ⭐ Stars | Language | Description |
|:---:|:--------|:--------:|:--------:|:------------|
"""
    
    for i, repo in enumerate(repos[:15], 1):
        desc = repo.get("description") or "No description"
        if len(desc) > 50:
            desc = desc[:47] + "..."
        content += f"| {i} | [{repo['name']}]({repo['url']}) | {repo['stars']:,} | {repo['language']} | {desc} |\n"
    
    content += "\n---\n\n## 📂 Project Categories\n\n"
    
    for cat, repos_list in categories.items():
        if repos_list:
            content += f"### {cat} ({len(repos_list)})\n\n"
            for repo in repos_list[:5]:
                content += f"- ⭐ {repo['stars']:,} [{repo['name']}]({repo['url']})\n"
            content += "\n"
    
    # Language stats
    langs = {}
    for repo in repos:
        lang = repo.get("language", "Unknown")
        langs[lang] = langs.get(lang, 0) + 1
    
    content += """---

## 🌍 Programming Language Distribution

"""
    for lang, count in sorted(langs.items(), key=lambda x: x[1], reverse=True)[:8]:
        pct = count / len(repos) * 100
        content += f"- **{lang}**: {count} ({pct:.1f}%)\n"
    
    content += f"""

---

## 💡 Key Insights

1. **LLMs Dominate** - Large Language Model projects continue to gain highest attention
2. **Tools Proliferation** - Various AI tools and utilities are developing rapidly
3. **Open Source Active** - Open source AI projects continue driving industry growth

---

*Report generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}*
*Data source: GitHub API*
"""
    return content

def push_to_git():
    """Push to GitHub repository"""
    import subprocess
    
    try:
        subprocess.run(["git", "add", "-A"], cwd=PROJECT_DIR, check=True, capture_output=True)
        result = subprocess.run(["git", "status", "--porcelain"], cwd=PROJECT_DIR, capture_output=True, text=True)
        
        if result.stdout.strip():
            commit_msg = f"AI Insights Report - {TODAY}"
            subprocess.run(["git", "commit", "-m", commit_msg], cwd=PROJECT_DIR, check=True, capture_output=True)
            subprocess.run(["git", "push"], cwd=PROJECT_DIR, check=True, capture_output=True)
            log("Successfully pushed to GitHub!")
            return True
    except Exception as e:
        log(f"Git push error: {e}")
        return False

def generate_ai_insights():
    """Main function"""
    log("=" * 50)
    log("AI Insights Daily Report Generator Started")
    log("=" * 50)
    
    # Fetch real-time data
    repos = fetch_github_ai_projects()
    
    # Generate reports
    zh_file, en_file = generate_reports(repos)
    
    # Push to Git
    push_to_git()
    
    log("=" * 50)
    log("Completed!")
    log("=" * 50)
    
    return {"status": "success", "files": [zh_file, en_file]}


def main():
    parser = argparse.ArgumentParser(description='Generate AI Insights Reports')
    parser.add_argument('--date', type=str, help='Date in YYYY-MM-DD format')
    args = parser.parse_args()
    
    generate_ai_insights()


if __name__ == "__main__":
    main()
