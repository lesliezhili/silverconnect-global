#!/bin/bash

# SilverConnect AI Customer Service Agent Runner
# This script starts the AI customer service agent

echo "🚀 Starting SilverConnect AI Customer Service Agent..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check for required environment variables
echo "🔍 Checking environment variables..."
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

# Check for AI provider variables
if [ -z "$OPENAI_API_KEY" ] && [ -z "$FOUNDRY_PROJECT_ENDPOINT" ]; then
    missing_vars+=("OPENAI_API_KEY or FOUNDRY_PROJECT_ENDPOINT")
fi

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo ""
    echo "Please set these in your .env file or environment."
    echo "Example:"
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo "OPENAI_API_KEY=your_openai_key"
    echo "# OR for Microsoft Foundry:"
    echo "# FOUNDRY_PROJECT_ENDPOINT=your_foundry_endpoint"
    echo "# FOUNDRY_MODEL_DEPLOYMENT_NAME=your_model_name"
    exit 1
fi

# Set default port if not specified
export PORT=${PORT:-8000}

echo "🤖 Starting AI Agent on port $PORT..."
echo "📞 Contact Numbers:"
echo "   WhatsApp/WeChat: +61452409228"
echo "   China Work: +8618271390346"
echo "   Australia Work: +61452409228"
echo "   Canada Work: +16042486604"
echo ""
echo "🌐 API Endpoints:"
echo "   Customer Service: http://localhost:$PORT/api/customer-service"
echo "   Booking Management: http://localhost:$PORT/api/booking"
echo "   Health Check: http://localhost:$PORT/api/health"
echo ""

# Start the AI agent
python3 ai_customer_service.py