# Lumina Tutors — Home Tutor Finder

Student / Teacher / Admin app with a live OpenStreetMap, class bookings, chat, homework, quizzes, attendance, fees, holiday calendar and an admin login monitor.

## Demo accounts (password `demo123`)
- Student: `aisha@htf.com`
- Tutor: `priya@htf.com`
- Admin: `admin@htf.com` / `admin123`

## What it does
- Find tutors on a real map (radius, subject, search, sort by distance / fee / rating)
- Send requests, enrol, rate tutors, favourite them
- Book class slots (accept / decline / complete)
- In-app chat between connected students and teachers
- Homework assign + mark done
- Quizzes with auto-score + teacher evaluation
- Attendance, monthly fees, progress reports, holiday calendar
- Live updates every 4s while the tab is visible
- Admin: accounts, last login, login activity, block / reset / remove

## Deploy (GitHub → Vercel)
1. Push this repo to GitHub.
2. vercel.com → Add New → Project → import. Framework: Other. Leave build empty.
3. **Storage:** Project → Storage → Upstash Redis (free) so data persists on serverless. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
4. Environment: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, then Redeploy.

## Run locally
`node server.js` → http://localhost:3000 (stores `data.json`). Delete `data.json` once if you want the demo tutors re-seeded.
