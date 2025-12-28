# MAS Simulator

A Queueing Theory Simulator implementing **M/M/1** and **M/M/S** models using Python and Tkinter.

## Features
- GUI-based simulation
- Poisson arrivals, exponential service times
- Performance metrics (Waiting time, Turnaround time, Response time)
- Gantt chart visualization
- Dockerized for portability

## Tech Stack
- Python 3
- Tkinter
- NumPy, Pandas, Matplotlib
- Docker

## How to Run (Docker)
```bash
docker build -t mas-simulator .
docker run mas-simulator
