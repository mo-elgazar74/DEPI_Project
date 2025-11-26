#!/bin/bash

# GitHub Actions CI/CD Setup Script
# هذا الـ script يساعد في إعداد GitHub Secrets

set -e

echo "==================================="
echo "🚀 GitHub Actions CI/CD Setup"
echo "==================================="
echo ""

# التحقق من أن المستخدم في المجلد الصحيح
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ خطأ: لا بد أن تكون في مجلد المشروع"
    exit 1
fi

echo "✅ أنت في مجلد المشروع الصحيح"
echo ""

# اسأل عن GitHub username
read -p "أدخل GitHub username: " GITHUB_USER

echo ""
echo "الآن ستحتاج إلى إضافة Secrets في GitHub manually:"
echo ""
echo "1. اذهب إلى: https://github.com/$GITHUB_USER/DEPI_Project/settings/secrets/actions"
echo ""
echo "2. أضف الـ Secrets التالية (New repository secret):"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 Clerk Keys:"
echo "   Name: CLERK_SECRET_KEY"
echo "   Value: [من Clerk Dashboard]"
echo ""
echo "   Name: CLERK_PUBLISHABLE_KEY"
echo "   Value: [من Clerk Dashboard]"
echo ""
echo "📌 AI Service Keys:"
echo "   Name: DEEPSEEK_API_KEY"
echo "   Value: sk-xxxxxxxxxxxx"
echo ""
echo "   Name: GROQ_API_KEY"
echo "   Value: gsk_xxxxxxxxxxxxx"
echo ""
echo "   Name: HUGGINGFACEHUB_API_TOKEN"
echo "   Value: hf_xxxxxxxxxxxxx"
echo ""
echo "📌 OpenRouter:"
echo "   Name: OPENROUTER_API_KEY"
echo "   Value: sk-or-v1-xxxxxxxxxxxxx"
echo ""
echo "📌 Qdrant:"
echo "   Name: URL_QDRANT"
echo "   Value: https://xxxx.qdrant.io:6333"
echo ""
echo "   Name: API_KEY_QDRANT"
echo "   Value: [من Qdrant Dashboard]"
echo ""
echo "📌 Tavily:"
echo "   Name: TAVILY_API_KEY"
echo "   Value: tvly-xxxxxxxxxxxxx"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ بعد ما تخلص من إضافة الـ Secrets:"
echo "   1. git push على main branch"
echo "   2. اذهب إلى Actions tab في GitHub"
echo "   3. شوف الـ workflows تشتغل تلقائياً"
echo ""
echo "🔗 رابط الـ Workflows:"
echo "   https://github.com/$GITHUB_USER/DEPI_Project/actions"
echo ""
echo "==================================="
echo "✨ Setup كامل!"
echo "==================================="
