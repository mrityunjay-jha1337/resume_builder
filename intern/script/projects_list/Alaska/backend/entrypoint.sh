#!/bin/sh
# Wait for the database to be ready (optional but good practice)
# We rely on Prisma to retry connection if needed.
echo "please wait while backend pre requisites are being built ..."
echo "Pushing database schema..."
npx prisma db push

echo "Starting the server..."
npm run dev
