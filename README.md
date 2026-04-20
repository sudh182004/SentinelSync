# 🛡️ SentinelSync: Real-Time Guard Monitoring System

SentinelSync is a modern, high-performance web application designed to track security personnel, log shift activity, and manage incident reports in real time. It utilizes a React-based frontend bundled with Vite, incredibly fast data synchronization powered by Convex, and sleek, responsive layouts crafted with Tailwind CSS v4.

## 🌟 Key Features

### 👮 Guard Portal
- **Strict Shift Management**: Guards can check in only once a day and cannot check out until an active shift is started.
- **Incident Reporting System**: Quickly report categorized incidents (Theft, Violence, Medical, Hazard) with detailed descriptions directly to the administration.
- **Status Tracking**: Guards can see the live resolution status of their reported incidents (Pending or Resolved).
- **History View**: Personal history feed showing recent shifts and total hours worked.

### 👑 Admin Dashboard
- **Real-Time Telemetry**: Instantly see active guards, completed shifts, and automatically tracked absences.
- **Interactive Data Insights**: Click on any key metric card to reveal beautifully animated **Recharts** bar graphs giving a quick breakdown of workforce distribution.
- **Dynamic Filtering & Search**: Deep search shift histories and incidents using multi-parameter dropdown filters (Status, Status types, String matching).
- **Incident Resolution**: View all incoming threat reports, track them live, and mark them as "Resolved" to close out tickets instantly.

## 🛠️ Technology Stack
- **Frontend Framework**: React.js (Vite)
- **Styling UI**: Tailwind CSS v4, Lucide React Icons
- **Data Visualization**: Recharts
- **Date Parsing**: Date-fns
- **Backend / Real-time Database**: Convex

---

## 🚀 Getting Started

Follow these steps to get the environment fully running on your local machine:

### 1. Install Dependencies
Ensure you have Node.js installed, then clone the repository and install all required standard dependencies:
```bash
npm install
```

### 2. Initialize the Convex Backend
Convex takes care of the backend schema, real-time database, and APIs. To start your personal environment (this will prompt you to quickly verify/login in a browser):
```bash
npx convex dev
```
*Note: This command will deploy the specific schema constraints and create a `.env.local` containing your `VITE_CONVEX_URL` automatically. **Keep this terminal running** while developing!*

### 3. Start the Frontend Server
Open a **new, split terminal window** in the project directory and start the Vite development server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`. 

---

## 📸 Usage flow
1. Upon loading the app, you can create a test user by deciding the role as **Guard** or **Admin**.
2. **As an Admin**: You will land on the Admin Portal. No data will be gathered initially.
3. **As a Guard**: You will be blocked from checking out, but can start your shift. You can submit an incident.
4. If you have two tabs open, watch the Admin portal populate the guard's check-in instantly, without a browser refresh!

## 📄 License
This project is open-source and available under the terms of the [MIT License](LICENSE).
