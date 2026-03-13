#!/bin/bash
# 1. Build Frontend
echo "Building Frontend..."
cd frontend
npm install
npm run build
cp -r dist ../backend/public
cd ..

# 2. Install Backend
echo "Installing Backend Dependencies..."
cd backend
npm install
