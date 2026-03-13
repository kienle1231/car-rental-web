#!/bin/bash
# Install & build frontend
cd ../frontend
npm install
npm run build

# Copy build to backend/public
cp -r dist ../backend/public

# Install backend deps
cd ../backend
npm install
