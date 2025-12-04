#!/usr/bin/env bash
set -e

echo "=== Taiko State Viewer Setup ==="
echo ""

# Create Next.js project
echo "Creating Next.js project..."
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install viem @tanstack/react-query

# Install shadcn/ui
echo ""
echo "Setting up shadcn/ui..."
npx shadcn-ui@latest init -y

# Add UI components
echo ""
echo "Adding UI components..."
npx shadcn-ui@latest add card button input table badge tabs separator skeleton

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env.local and fill in values"
echo "  2. Run 'npm run dev' to start development server"
echo "  3. Deploy with 'vercel'"
echo ""
