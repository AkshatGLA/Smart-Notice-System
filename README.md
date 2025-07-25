# 📢 SmartNotice Agent – Intelligent University Communication Assistant

SmartNotice Agent is a full-stack web application that streamlines university communication. It enables admins to post notices that are instantly visible to relevant students based on their department and academic year. This system ensures no important updates are missed, replacing scattered emails with a centralized, intelligent notification system.

---

## 🚀 Live Demo (Optional)

> Coming soon... (Add deployment link here when hosted)

---

## ✨ Core Features (MVP)

✅ Admin can:
- Create and post notices using a form
- Set the target audience (department, year)
- View all posted notices

✅ Student can:
- View notices filtered by department and year
- See notices in a clean, readable interface
- (Optional) Mark notices as "read" in the future

---

## 🧠 Future AI-Enhanced Features

These features will be added in future phases:

- 🔍 **Automatic Notice Classification** using NLP (e.g., academic, financial)
- 🎯 **Target Audience Prediction** using text analysis
- ✂️ **TL;DR Summarization** for lengthy notices
- 🌐 **Multilingual Translation**
- 🧠 **Duplicate/Similar Notice Detection**
- 📊 **Engagement Analytics**

---

## 🧑‍💻 Tech Stack

| Layer      | Technology          |
|------------|---------------------|
| Frontend   | React.js            |
| Backend    | Node.js, Express    |
| Database   | MongoDB, Mongoose   |
| Styling    | Tailwind CSS / Bootstrap |
| API Calls  | Axios               |

---

## 🗃️ Project Structure

\`\`\`
smartnotice-agent/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Admin.js
│   │   │   ├── Student.js
│   │   └── App.js
│   └── package.json
├── server/                  # Node.js backend
│   ├── models/              # Mongoose schemas
│   │   ├── Notice.js
│   │   └── User.js
│   ├── routes/
│   │   └── notice.js
│   ├── index.js             # Entry point
│   └── package.json
└── README.md
\`\`\`

---

## ⚙️ Installation & Running Locally

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/Aryantiwarib/Smart-Notice-Agent.git
cd smartnotice-agent
\`\`\`

---

### 2. Start Backend (Node.js)
\`\`\`bash
cd server
npm install
node index.js
\`\`\`

- Make sure MongoDB is running locally or set your \`MONGO_URI\` in \`.env\`

---

### 3. Start Frontend (React)
\`\`\`bash
cd client
npm install
npm start
\`\`\`

- React app will start on \`http://localhost:3000\`

---

## 📦 API Endpoints (Backend)

| Method | Route               | Description                     |
|--------|---------------------|---------------------------------|
| POST   | \`/api/notices\`      | Create new notice (Admin)       |
| GET    | \`/api/notices\`      | Get notices for target user     |
| POST   | \`/api/notices/:id/read\` (optional) | Mark notice as read      |

---

## 🧪 Sample Data

### Notice Payload (POST \`/api/notices\`)
\`\`\`json
{
  "title": "Orientation Schedule",
  "content": "All first-year students must attend the orientation on July 10.",
  "department": "CSE",
  "year": 1
}
\`\`\`

### Sample MongoDB Notice Schema
\`\`\`js
{
  title: String,
  content: String,
  department: String,
  year: Number,
  date: Date
}
\`\`\`

---

## 🎯 User Roles (MVP)

- 👨‍🏫 **Admin**
  - Can access \`/admin\` route
  - Can create and manage notices

- 👨‍🎓 **Student**
  - Can access \`/student\`
  - Can view filtered notices

---

## ✅ To-Do List

- [x] Setup React + Node.js base
- [x] Connect MongoDB and create models
- [x] Admin panel to create notices
- [x] Student page to view notices
- [ ] Add "mark as read" feature
- [ ] Add AI-based category classification (Phase 2)
- [ ] Add login system (Google Auth/JWT)

---

## 📄 License

This project is licensed under the **MIT License**.  
Feel free to fork, clone, and contribute!

---

## 🙌 Contributors

- **Aryan Tiwari** – Full Stack Developer  
*Want to contribute? Open an issue or submit a pull request!*

---

## 📬 Contact

For suggestions or issues, please reach out:  
📧 aryan.soron1890@gmail.com 
