# One-Day Submission Checklist

## Must work
- [ ] Google login is real and backend-verified
- [ ] Two Ethereal senders appear in the compose dropdown
- [ ] CSV/text upload detects and deduplicates addresses
- [ ] Subject, body, start time, delay and hourly limit are accepted
- [ ] Scheduled rows appear immediately
- [ ] Worker sends and Sent rows show an Ethereal preview link
- [ ] Restart test passes without losing future jobs
- [ ] Low-rate test delays remaining jobs instead of failing/dropping them
- [ ] Same idempotency key does not create a second batch
- [ ] No cron dependency exists

## Before recording
- [ ] Remove secrets from terminal and screen
- [ ] Use 3–6 test recipients
- [ ] Schedule 2–3 minutes ahead for restart demo
- [ ] Keep Docker Redis/Postgres running during restart
- [ ] Open Ethereal preview in advance once to verify credentials

## Before submitting
- [ ] Private GitHub repository
- [ ] `.env` is not committed
- [ ] README contains architecture, concurrency, rate limit and idempotency
- [ ] Figma styling is applied
- [ ] Demo video is under 5 minutes
- [ ] `Mitrajit` invited
- [ ] `sarvagya-chaudhary` invited
