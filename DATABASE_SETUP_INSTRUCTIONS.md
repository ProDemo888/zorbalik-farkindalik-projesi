# Database Setup Instructions for Live Student Dashboard

To enable the live student dashboard with optimal performance, you need to run the following SQL commands in your Supabase dashboard.

## Steps to Setup Database:

1. **Go to your Supabase project dashboard**
   - Navigate to: https://ygnpdapnwuxtsyspguul.supabase.co
   - Login with your credentials

2. **Open the SQL Editor**
   - In the left sidebar, click on "SQL Editor" (the icon that looks like `</>`)
   - Click "New query" to create a new SQL file

3. **Copy and paste the SQL from `database-optimization.sql`**
   - Open the file `database-optimization.sql` in your project
   - Copy the entire SQL content
   - Paste it into the SQL Editor in Supabase

4. **Run the SQL**
   - Click the "Run" button (or press `Ctrl+Enter` / `Cmd+Enter`)
   - Wait for the execution to complete (should be instant)
   - You should see "Success. No rows returned" message

5. **Run the unique constraint migration**
   - Copy the SQL from `migrations/add_unique_constraint.sql`
   - Paste it into a new SQL Editor query
   - Run it to add the unique constraint for proper upsert behavior

6. **Verify the setup**
   - In the SQL Editor, run this query to check if the materialized view was created:
     ```sql
     SELECT * FROM mv_student_status;
     ```
   - You should see student status data if any responses exist
   - Verify the unique constraint exists:
     ```sql
     SELECT conname FROM pg_constraint WHERE conname = 'responses_unique_submission';
     ```

## What This SQL Does:

1. **Creates performance indexes** for faster queries
   - `idx_responses_student_completion`: Helps track student completion status
   - `idx_responses_created_at`: Optimizes live feed sorting by time

2. **Creates a materialized view** `mv_student_status`
   - Automatically tracks student completion status
   - Refreshes efficiently when new data is added
   - Provides O(1) lookup for student statistics

3. **Sets up auto-refresh triggers**
   - Automatically updates the materialized view when new responses are inserted
   - Ensures statistics are always current without manual intervention

## Troubleshooting:

**If you get "relation already exists" errors:**
- This is normal if you're running the script multiple times
- The SQL uses `IF NOT EXISTS` clauses to handle this safely

**If you get permission errors:**
- Make sure you're logged in as the project owner
- You need admin permissions to create indexes and materialized views

**If the materialized view doesn't update:**
- Check if the trigger was created successfully:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'trg_refresh_student_status';
  ```
- If not found, run the SQL script again

## Performance Benefits:

Without these optimizations, the live dashboard would:
- Query the entire `responses` table for every statistic update
- Calculate student completion status on every page load
- Become slow as more students participate

With these optimizations:
- Statistics queries are O(1) - instant regardless of data size
- Live feed queries use indexed sorting - fast pagination
- Materialized view refreshes in the background - no UI blocking

## Security Notes:

- These changes don't modify any existing data
- No access controls or permissions are altered
- Only performance improvements are added
- Your existing RLS policies remain intact