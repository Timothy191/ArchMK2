# portal architecture and middleware

> seed-2 · depth 0

## Sources

- [Student-Portal](https://github.com/raykaris/Student-Portal)
- [student-course-portal](https://github.com/yashav-shukla/student-course-portal)

## Claims

- # 🎓 Student Portal API

A full-stack CRUD API for managing a Student Portal using **Node.js**, **Express**, and **MySQL**. [^src-1]

- This application provides routes for managing students, courses, instructors, and enrollments. [^src-2]
- Data is held in memory for fast local development and clear demonstration of routing, middleware, and modular Express design. [^src-3]
- Students: Alice, Bob, Charlie
  Student: Alice
  Courses: Frontend, Backend
  Course: Backend, Description: Node.js, Express, MongoDB

```

---

## Images

Screenshots for the API (stored in [`images/`](images/)). [^src-4]
- Capture screenshots (browser or Postman) for `/`, `/students`, and `/courses/1`
3. [^src-5]
- Save as `banner.png`, `api-root.png`, `students-list.png`, `course-detail.png` in `docs/images/`
4. [^src-6]
- Update image paths in this README from `.svg` to `.png`

---

## Interview Talking Points

1. [^src-7]
- **Express routing** — `app.use('/students', studentsRouter)` keeps `server.js` thin. [^src-8]

## Open follow-ups

_Auto-extracted; review and prune._
```
