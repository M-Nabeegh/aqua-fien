# Supabase Database Setup Instructions

## What You Need to Do:

1. **Get Your Supabase Database Connection Details:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → Database
   - Copy the connection string or individual connection parameters

2. **Update Environment Variables:**
   Replace the placeholder values in `.env` with your actual Supabase details:
   
   ```bash
   # Example Supabase configuration:
   DATABASE_URL=postgres://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   DB_HOST=aws-0-us-west-1.pooler.supabase.com
   DB_PORT=6543
   DB_NAME=postgres
   DB_USER=postgres.YOUR_PROJECT_REF
   DB_PASSWORD=YOUR_ACTUAL_PASSWORD
   DB_SSL=true
   USE_CONNECTION_STRING=true
   ```

3. **Set Vercel Environment Variables:**
   Run these commands with your actual values:
   ```bash
   vercel env add DATABASE_URL
   vercel env add DB_HOST
   vercel env add DB_PORT
   vercel env add DB_NAME
   vercel env add DB_USER
   vercel env add DB_PASSWORD
   vercel env add DB_SSL
   vercel env add USE_CONNECTION_STRING
   ```

## Where to Find Your Supabase Details:
- **Project Reference**: In your Supabase URL (e.g., if URL is `abc123.supabase.co`, then `abc123` is your project reference)
- **Password**: The database password you set when creating the project
- **Connection String**: Available in Settings → Database → Connection string

## Important Notes:
- Use the connection pooler URL (port 6543) for better performance
- Make sure SSL is enabled (DB_SSL=true)
- Your database schema should already be imported from the aquafine-schema.sql file

Let me know your Supabase project details and I'll update the configuration for you!
