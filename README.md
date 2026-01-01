# MAS Simulator

A Queueing Theory Simulator implementing **M/M/1** and **M/M/S** models using Python and Tkinter, fully containerized and automated using CI/CD best practices.

![Docker](https://img.shields.io/badge/Docker-Automated-blue)

---

## 🚀 Project Overview

MAS Simulator is a GUI-based simulation tool developed as part of a **Modeling & Simulation** course project and enhanced with **real-world DevOps practices**.

The project demonstrates how an academic Python application can be:
- Containerized using Docker
- Version-controlled using GitHub
- Automatically built and published using GitHub Actions (CI/CD)

---

## ✨ Features

- GUI-based simulation (Tkinter)
- Poisson arrivals & exponential service times
- Performance metrics:
  - Waiting Time
  - Turnaround Time
  - Response Time
- Gantt chart visualization
- Fully Dockerized for portability
- Automated CI/CD pipeline

---

## 🛠 Tech Stack

- **Language:** Python 3.12
- **GUI:** Tkinter
- **Libraries:** NumPy, Pandas, Matplotlib
- **Containerization:** Docker
- **CI/CD:** GitHub Actions
- **OS:** Linux (VirtualBox VM)

---

## 📁 Project Structure

MAS_Simulator/ ├── index.py ├── requirements.txt ├── Dockerfile ├── .github/workflows/docker-ci.yml └── README.md

---

## 🔄 CI/CD Pipeline (GitHub Actions)

The project uses **GitHub Actions** to automate the Docker workflow.

### Workflow:
1. Code pushed to `main` branch
2. GitHub Actions triggered automatically
3. Docker image is built
4. Image is pushed to Docker Hub

This ensures:
- Consistent builds
- No manual Docker commands
- Production-ready automation

---

## 🐳 Docker Image

**Docker Hub Repository:**  
👉 `docker.io/sufiyankhan10/mas-simulator`

The image is automatically updated on every push to `main`.

---

## ▶️ Run the Application (Docker – Linux GUI)

### Prerequisites
- Linux system
- Docker installed
- X11 enabled

### Command

```bash
xhost +local:docker

docker run -it --rm \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v $HOME/.Xauthority:/root/.Xauthority:rw \
  sufiyankhan10/mas-simulator:latest


---

## 📌 Current Status

- ✔ Application running successfully inside Docker
- ✔ CI/CD pipeline implemented using GitHub Actions
- ✔ Docker image automatically built and published to Docker Hub

---

## 🔜 Future Enhancements

- ☁️ Cloud deployment on AWS EC2
- 🖥️ Headless execution mode for server environments
- 📊 Monitoring and logging integration

---

## 👤 Author

**Sufiyan Khan**  
DevOps & Cloud Enthusiast
