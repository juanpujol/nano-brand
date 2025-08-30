#!/bin/bash
# Sync Supabase storage from Docker container to local filesystem

echo "Syncing storage files from Docker container..."
docker cp supabase_storage_nano-brand:/mnt/stub/stub/storage ./supabase/ 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Storage sync completed"
else
    echo "❌ Storage sync failed - make sure Supabase is running"
fi