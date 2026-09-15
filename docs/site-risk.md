# Site risk

## What it does
- Calculates an explainable 0–100 priority score. Higher means earlier review.
- Uses 75 points of leading indicators and 25 points of observed burden.
## Input
- Unconfirmed visits scheduled in the next seven days (30 points).
- Overdue/open queries (20 points). Untrained/total staff (15 points).
- Maximum age of records or site signals, capped at 14 days (10 points).
- Maximum severity per affected visit divided by completed or past-scheduled visits, capped at a 20% weighted rate (25 points).
- Major weighs 1; minor .4; administrative .1. Repeated rules on a visit do not double count.
## Output
- Components, denominators, score and band. Critical >=80; high >=60; moderate >=35; otherwise low.
- Compliance counts only fully evaluable visits. Gaps and pending visits are reported separately.
## Where used
- Overview and Site Risk. GET `/api/analysis`.
## By whom
- Risk Manager and CRA.
## How to test
- Run the risk unit tests. Increase an overdue-query rate and check the score does not fall.
## Known limits
- This is an unvalidated demo heuristic, not a prediction or a trial quality tolerance limit.
- No visits yields no score. No staff yields maximum training concern.
- No queries or upcoming visits contributes zero for that component.
- Review decisions do not remove source events from the burden. Correct source records if an event was erroneous.
- A low score with data gaps is not evidence of safety. Coverage must be reviewed.
