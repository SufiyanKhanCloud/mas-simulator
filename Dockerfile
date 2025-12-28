# Base image
FROM python:3.12-slim

# Install Tkinter (required for GUI)
RUN apt-get update && apt-get install -y python3-tk && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Run the simulator
CMD ["python3", "index.py"]
