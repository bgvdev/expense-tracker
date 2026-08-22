# Backup and Recovery

## Database Backups

### Neon Built-in Backups

Neon provides automatic backups on all plans:
- **Free tier:** 7-day history with point-in-time restore (PITR) at branch-level granularity.
- **Paid tiers:** Longer retention and more granular PITR.

Backups are accessible from the Neon Console → Project → Branches.

### Manual Backup

Run before any destructive operation (schema change, data migration, etc.):

```bash
# Requires pg_dump and the DATABASE_URL from Neon dashboard
export DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"

pg_dump "$DATABASE_URL" \
  --no-acl \
  --no-owner \
  -f backup_$(date +%Y%m%d_%H%M%S).sql

# Verify the dump
wc -l backup_*.sql
```

Store backups in a safe location (S3, local encrypted drive, etc.). Do not commit them to the repository.

### Automated Backup Script

> **Not implemented.** The script below is a reference implementation only — there
> is no `backup.sh` in this repository and nothing schedules it. Backups currently
> rely entirely on Neon's built-in point-in-time recovery. If you need file-level
> dumps, save this as `backup.sh` outside the repo (or add it and keep the output
> path outside the working tree — `*.sql`/`*.sql.gz` are gitignored).

```bash
#!/bin/bash
# backup.sh — run via cron or scheduled task
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${HOME}/backups/expense-tracker"
FILENAME="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

pg_dump "$DATABASE_URL" --no-acl --no-owner | gzip > "$FILENAME"
echo "Backup saved: $FILENAME"

# Keep last 30 days only
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

---

## Recovery Procedures

### Restore from a `pg_dump` file

```bash
# Plain SQL dump
psql "$DATABASE_URL" < backup_20260608_120000.sql

# Gzipped dump
gunzip -c backup_20260608_120000.sql.gz | psql "$DATABASE_URL"
```

**Warning:** Restoring into a non-empty database will cause constraint errors. Either drop all tables first or restore into a fresh database.

### Restore via Neon Branch

Neon allows creating a new branch from any point in time:

1. Neon Console → Project → Branches → **Restore**
2. Select a timestamp
3. A new branch is created — test your recovery on it before promoting to main

---

## Application State Recovery

The application has no file-based state — all data is in PostgreSQL. Recovery is fully covered by the database restore procedure above.

If a bad deploy causes issues:

1. **Backend:** Roll back via Render Dashboard → Deploys → select previous deploy → Redeploy.
2. **Frontend:** Roll back via Vercel Dashboard → Deployments → select previous deploy → Promote to Production.
3. **Database schema:** Roll back the last migration: `php artisan migrate:rollback --step=1`

---

## What Is Not Backed Up

| Item | Reason |
|------|--------|
| Uploaded files | No file uploads exist in this app |
| Redis cache | No shared cache to back up (SESSION_DRIVER=cookie; CACHE_STORE=file, holding only rate-limit counters, which are safe to lose) |
| Application logs | Render streams logs — they are not persisted beyond ~7 days |
| Docker volumes (local) | Local-only; not production data |

---

## Recovery Time Objectives

| Scenario | Recovery Time | Method |
|----------|--------------|--------|
| Render deploy failure | < 5 minutes | Rollback to previous deploy |
| Vercel deploy failure | < 2 minutes | Rollback to previous deploy |
| Accidental data deletion | < 30 minutes | Neon PITR branch restore |
| Complete DB loss | 1–2 hours | Restore from manual pg_dump backup |
