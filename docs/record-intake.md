# Record intake

## What it does
- Starts with 204 fictional sites and 5,304 visits.
- Replaces the full study dataset in one transaction after validation.
## Input
- JSON object with `sites` and `visits` arrays. Download the current data in Settings for the full schema.
- Site fields: id, name, region, openQueries, overdueQueries, staffCount, untrainedStaff, signalsUpdatedAt.
- Visit fields: id, participantId, siteId, scheduledDate, actualDate, doseMg, medications, documented, confirmed, updatedAt.
- Use null for unknown clinical values. Dates use YYYY-MM-DD. All dose values use mg.
## Output
- Saved counts or a readable validation error. An invalid batch changes nothing.
## Where used
- Settings. GET `/api/data` and POST `/api/import`.
## By whom
- Data manager and Site Coordinator.
## How to test
- Download the seed. Import it. Add a duplicate visit ID and import again. Expect rejection.
## Known limits
- Full replacement, not incremental merge. Current review IDs remain stored but changed evidence needs new review.
- Maximum request is 20 MB. No EDC connector, patient identity matching or real-time feed.
