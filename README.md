# MAS Simulator

A Queueing Theory Simulator implementing **M/M/1** and **M/M/S** models using Python and Tkinter, fully containerized and automated using CI/CD best practices.

![Docker](https://img.shields.io/badge/Docker-Automated-blue)
![CI/CD](https://github.com/SufiyanKhanCloud/mas-simulator/actions/workflows/docker.yml/badge.svg)

---

## 🚀 Project Overview

MAS Simulator is a GUI-based simulation tool developed as part of a **Modeling & Simulation** course project and later enhanced using **real-world DevOps practices**.

This project demonstrates how an academic Python application can be transformed into a **reproducible, automated, and production-ready workflow** using modern DevOps tooling.

The project covers:
- Containerization of a GUI-based application
- Automated CI/CD using GitHub Actions
- Docker image publishing via Docker Hub

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
- **Registry:** Docker Hub
- **OS:** Linux (Ubuntu – VirtualBox VM)

---

## 📁 Project Structure

```text
MAS_Simulator/
├── index.py
├── requirements.txt
├── Dockerfile
├── .github/workflows/docker-ci.yml
└── README.md
````

---

## 🔄 CI/CD Pipeline (GitHub Actions)

The project uses **GitHub Actions** to fully automate the Docker workflow.

### Workflow Steps:

1. Code is pushed to the `main` branch
2. GitHub Actions workflow triggers automatically
3. Docker image is built
4. Image is authenticated and pushed to Docker Hub using GitHub Secrets

### Benefits:

* No manual Docker builds
* Consistent and reproducible images
* Production-style automation

---

## 🐳 Docker Image

**Docker Hub Repository:**
👉 `docker.io/sufiyankhan10/mas-simulator`

The image is **automatically updated** on every push to the `main` branch via CI/CD.

---

## ▶️ Run the Application (Docker – Linux GUI)

### Prerequisites

* Linux system
* Docker installed
* X11 enabled

> ⚠️ Note: GUI execution via Docker is supported on Linux systems using X11.
> Windows/macOS require additional configuration (not covered yet).

### Command

```bash
xhost +local:docker

docker run -it --rm \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v $HOME/.Xauthority:/root/.Xauthority:rw \
  sufiyankhan10/mas-simulator:latest
```

---

## 🎯 Why This Project Matters

* Demonstrates real-world containerization of a GUI-based application
* Solves non-trivial X11 forwarding challenges in Docker
* Implements end-to-end CI/CD automation
* Bridges academic software with production DevOps workflows

---

## 📌 Current Status

* ✔ Application runs successfully inside Docker
* ✔ CI/CD pipeline implemented using GitHub Actions
* ✔ Docker image automatically built and published to Docker Hub

---

## 🔜 Future Enhancements

* ☁️ Deployment on AWS EC2
* 🖥️ Headless execution mode for server environments
* 📊 Monitoring and logging integration

---

## 👤 Author

**Sufiyan Khan**
DevOps & Cloud Enthusiast
