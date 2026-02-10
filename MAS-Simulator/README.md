# 🚀 MAS-Simulator: Advanced Multi-Server Queueing Engine

<div align="center">

[![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://queue-simulator-typescript.vercel.app/)

</div>

**MAS-Simulator** is a collaborative group project developed to model and visualize complex stochastic processes. This suite provides an interactive environment for analyzing multi-server system performance under various load conditions using Kendall's Notation.

## 🎯 Project Capabilities

### ⚡ Event-Driven Simulation Logic
The engine utilizes **Discrete Event Simulation (DES)**. Instead of a standard clock, it jumps directly to the next arrival or service completion, ensuring high mathematical precision.

### 🔄 Preemptive Priority Scheduling
Designed to mirror high-availability systems, our group implemented **Preemptive-Resume** logic:
* **Superior Priority (P1)** can interrupt **Inferior Priority (P3)**.
* Service progress is automatically saved and resumed once a server becomes available.

### 📊 Performance Analytics Dashboard
- **Utilization Tracking ($\rho$):** Monitor efficiency across parallel servers.
- **Queue Analysis:** Detailed breakdown of Response Time vs. Waiting Time.
- **Gantt Charts:** Visual timelines with persistent customer color-mapping for clear tracking.



## 🛠️ Technical Architecture
We built this application using a modern, scalable tech stack:
* **Frontend**: React / Next.js for a reactive user interface.
* **Simulation Core**: TypeScript-based algorithms for queueing logic.
* **Design**: Tailwind CSS for a professional, dark-mode focused UI.

## 🚀 How to Run Locally

```bash
# 1. Clone the repository
git clone [https://github.com/SufiyanKhanCloud/mas-simulator.git](https://github.com/SufiyanKhanCloud/mas-simulator.git)

# 2. Install dependencies (using pnpm)
pnpm install

# 3. Start the development server
pnpm dev

```

---

## 👥 Developed By

This project is a collective effort by my **Group**
**UBIT, University of Karachi**

*Under the guidance of our faculty members.*
