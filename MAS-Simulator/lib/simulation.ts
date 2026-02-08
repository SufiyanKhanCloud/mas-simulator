// --- Types ---
export interface SimulationRow {
  observation: number;
  cp: number;
  cpLookup: number;
  noBetweenArrivals: number;
  interArrivals: number;
  arrivalTime: number;
  serviceTime: number;
  priority: number;
  serviceStart: number;
  serviceEnd: number;
  turnaroundTime: number;
  waitTime: number;
  responseTime: number;
  server?: string;
}

export interface ServiceChunk {
  label: string;
  start: number;
  end: number;
  server?: string;
}

export interface SimulationResult {
  rows: SimulationRow[];
  chunks: ServiceChunk[];
  averages: SimulationAverages;
}

export interface SimulationAverages {
  avgTurnaround: number;
  avgWait: number;
  avgResponse: number;
  avgInterArrival: number;
  avgService: number;
  serverUtilization: number;
  totalCustomers: number;
}

// --- Utility ---
function randomUniform(): number {
  return Math.random();
}

// --- Poisson PMF iterative computation ---
function buildPoissonCDF(lambda: number): {
  cpCum: number[];
  cpLookup: number[];
  noBetweenArrivals: number[];
} {
  const threshold = 0.99999;
  const maxK = 500;
  const cpCum: number[] = [];
  const noBetweenArrivals: number[] = [];

  let p0 = Math.exp(-lambda);
  let currentP = p0;
  let cum = 0.0;
  let k = 0;

  while (true) {
    cum += currentP;
    cpCum.push(Math.round(cum * 100000) / 100000);
    noBetweenArrivals.push(k);
    if (cum >= threshold || k >= maxK) break;
    k++;
    currentP = currentP * (lambda / k);
  }

  if (cpCum.length > 0) {
    cpCum[cpCum.length - 1] = Math.min(cpCum[cpCum.length - 1], 1.0);
  }

  const cpLookup = [0.0, ...cpCum.slice(0, -1)];

  return { cpCum, cpLookup, noBetweenArrivals };
}

// --- Generate inter-arrival times from CDF ---
function generateInterArrivals(cpCum: number[], cpLookup: number[]): number[] {
  const nRanges = cpCum.length;
  const interArrivals = [0];

  for (let idx = 1; idx < nRanges; idx++) {
    const r = randomUniform();
    let found = false;
    for (let i = 0; i < nRanges; i++) {
      if (cpLookup[i] <= r && r <= cpCum[i]) {
        interArrivals.push(i);
        found = true;
        break;
      }
    }
    if (!found) {
      interArrivals.push(nRanges - 1);
    }
  }

  return interArrivals;
}

// --- Cumulative sum ---
function cumSum(arr: number[]): number[] {
  const result: number[] = [];
  let sum = 0;
  for (const v of arr) {
    sum += v;
    result.push(sum);
  }
  return result;
}

// --- Generate exponential service times ---
function generateServiceTimes(mu: number, count: number): number[] {
  return Array.from({ length: count }, () =>
    Math.max(1, Math.ceil(-mu * Math.log(randomUniform()))),
  );
}

// --- Service time distribution types for M/G queues ---
export type ServiceDistribution = "uniform" | "normal";

// --- Generate uniform distribution service times: a + (b - a) * Ran# ---
function generateUniformServiceTimes(
  a: number,
  b: number,
  count: number,
): number[] {
  return Array.from({ length: count }, () =>
    Math.max(1, Math.ceil(a + (b - a) * randomUniform())),
  );
}

// --- Generate normal distribution service times (Box-Muller): mu + sigma * sqrt(-2 * ln(R1)) * cos(2 * pi * R2) ---
function generateNormalServiceTimes(
  mu: number,
  sigma: number,
  count: number,
): number[] {
  return Array.from({ length: count }, () => {
    const r1 = randomUniform();
    const r2 = randomUniform();
    const z =
      Math.sqrt(-2 * Math.log(r1 === 0 ? 0.0001 : r1)) *
      Math.cos(2 * Math.PI * r2);
    return Math.max(1, Math.ceil(mu + sigma * z));
  });
}

// --- Helper: generate MG service times based on distribution ---
export interface MGDistParams {
  distribution: ServiceDistribution;
  a?: number; // uniform param
  b?: number; // uniform param
  mu?: number; // normal mean
  sigma?: number; // normal std dev
}

function generateMGServiceTimes(params: MGDistParams, count: number): number[] {
  if (params.distribution === "uniform") {
    return generateUniformServiceTimes(params.a!, params.b!, count);
  } else {
    return generateNormalServiceTimes(params.mu!, params.sigma!, count);
  }
}

// --- Generate random priorities 1-3 ---
function generatePriorities(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 3) + 1);
}

// --- M/M/1 Simulation ---
export function mm1Simulation(
  lambda: number,
  mu: number,
  usePriority: boolean,
): SimulationResult {
  const { cpCum, cpLookup, noBetweenArrivals } = buildPoissonCDF(lambda);
  const interArrivals = generateInterArrivals(cpCum, cpLookup);
  const arrivalTimes = cumSum(interArrivals);
  const n = arrivalTimes.length;
  const serviceTimes = generateServiceTimes(mu, n);
  const priorities = generatePriorities(n);
  const remainingTimes = [...serviceTimes];
  const serviceStarts = new Array(n).fill(-1);
  const serviceEnds = new Array(n).fill(0);
  const servedMask = new Array(n).fill(false);
  const chunks: ServiceChunk[] = [];

  let currentTime = 0;

  while (!servedMask.every(Boolean)) {
    const waitingPool = [];
    for (let i = 0; i < n; i++) {
      if (!servedMask[i] && arrivalTimes[i] <= currentTime) {
        waitingPool.push(i);
      }
    }

    if (waitingPool.length === 0) {
      let nextArr = Infinity;
      for (let i = 0; i < n; i++) {
        if (!servedMask[i] && arrivalTimes[i] < nextArr) {
          nextArr = arrivalTimes[i];
        }
      }
      currentTime = nextArr;
      continue;
    }

    let chosenIdx: number;
    if (usePriority) {
      chosenIdx = waitingPool.reduce(
        (best, cur) => (priorities[cur] < priorities[best] ? cur : best),
        waitingPool[0],
      );
    } else {
      chosenIdx = Math.min(...waitingPool);
    }

    if (serviceStarts[chosenIdx] === -1) {
      serviceStarts[chosenIdx] = currentTime;
    }

    // Check for higher-priority interrupts
    const interruptors = [];
    for (let i = 0; i < n; i++) {
      if (
        arrivalTimes[i] > currentTime &&
        priorities[i] < priorities[chosenIdx]
      ) {
        interruptors.push(i);
      }
    }

    let timeToEvent: number;
    if (interruptors.length > 0 && usePriority) {
      const nextInterruptTime = Math.min(
        ...interruptors.map((i) => arrivalTimes[i]),
      );
      timeToEvent = nextInterruptTime - currentTime;
    } else {
      timeToEvent = remainingTimes[chosenIdx];
    }

    const workDuration = Math.min(remainingTimes[chosenIdx], timeToEvent);
    const startChunk = currentTime;
    currentTime += workDuration;
    remainingTimes[chosenIdx] -= workDuration;

    chunks.push({
      label: `C${chosenIdx + 1}`,
      start: startChunk,
      end: currentTime,
    });

    if (remainingTimes[chosenIdx] === 0) {
      serviceEnds[chosenIdx] = currentTime;
      servedMask[chosenIdx] = true;
    }
  }

  const turnaroundTimes = arrivalTimes.map((at, i) => serviceEnds[i] - at);
  const waitTimes = turnaroundTimes.map((tt, i) => tt - serviceTimes[i]);
  const responseTimes = serviceStarts.map((ss, i) => ss - arrivalTimes[i]);

  const rows: SimulationRow[] = arrivalTimes.map((_, i) => ({
    observation: i + 1,
    cp: cpCum[i],
    cpLookup: cpLookup[i],
    noBetweenArrivals: noBetweenArrivals[i],
    interArrivals: interArrivals[i],
    arrivalTime: arrivalTimes[i],
    serviceTime: serviceTimes[i],
    priority: priorities[i],
    serviceStart: serviceStarts[i],
    serviceEnd: serviceEnds[i],
    turnaroundTime: turnaroundTimes[i],
    waitTime: waitTimes[i],
    responseTime: responseTimes[i],
  }));

  const totalBusy = serviceTimes.reduce((a, b) => a + b, 0);
  const totalTime = Math.max(...serviceEnds) - Math.min(...serviceStarts);
  const utilization = totalTime > 0 ? (totalBusy / totalTime) * 100 : 0;

  const averages: SimulationAverages = {
    avgTurnaround: turnaroundTimes.reduce((a, b) => a + b, 0) / n,
    avgWait: waitTimes.reduce((a, b) => a + b, 0) / n,
    avgResponse: responseTimes.reduce((a, b) => a + b, 0) / n,
    avgInterArrival: interArrivals.reduce((a, b) => a + b, 0) / n,
    avgService: serviceTimes.reduce((a, b) => a + b, 0) / n,
    serverUtilization: utilization,
    totalCustomers: n,
  };

  return { rows, chunks, averages };
}

// --- M/M/S Simulation ---
export function mmsSSimulation(
  lambda: number,
  mu: number,
  servers: number,
  usePriority: boolean,
): SimulationResult {
  const { cpCum, cpLookup, noBetweenArrivals } = buildPoissonCDF(lambda);
  const interArrivals = generateInterArrivals(cpCum, cpLookup);
  const arrivalTimes = cumSum(interArrivals);
  const n = arrivalTimes.length;
  const serviceTimes = generateServiceTimes(mu, n);
  const priorities = generatePriorities(n);
  const remainingTimes = [...serviceTimes];
  const serviceStart = new Array(n).fill(-1);
  const serviceEnd = new Array(n).fill(0);
  const serverAssigned: string[] = new Array(n).fill("");
  const servedMask = new Array(n).fill(false);
  const serverOccupancy: (number | null)[] = new Array(servers).fill(null);
  const lastChunkStart = new Array(n).fill(0);
  const chunks: ServiceChunk[] = [];

  let currentTime = 0;

  while (!servedMask.every(Boolean)) {
    // 1. Identify waiting customers not on a server
    const waitingPool: number[] = [];
    for (let i = 0; i < n; i++) {
      if (
        !servedMask[i] &&
        arrivalTimes[i] <= currentTime &&
        !serverOccupancy.includes(i)
      ) {
        waitingPool.push(i);
      }
    }

    // 2. Assign idle servers
    for (let sIdx = 0; sIdx < servers; sIdx++) {
      if (serverOccupancy[sIdx] === null && waitingPool.length > 0) {
        const chosen = usePriority
          ? waitingPool.reduce(
              (best, cur) => (priorities[cur] < priorities[best] ? cur : best),
              waitingPool[0],
            )
          : Math.min(...waitingPool);
        serverOccupancy[sIdx] = chosen;
        const wpIdx = waitingPool.indexOf(chosen);
        waitingPool.splice(wpIdx, 1);
        if (serviceStart[chosen] === -1) serviceStart[chosen] = currentTime;
        serverAssigned[chosen] = `S${sIdx + 1}`;
        lastChunkStart[chosen] = currentTime;
      }
    }

    // 3. Preemption logic
    if (usePriority && waitingPool.length > 0) {
      for (let sIdx = 0; sIdx < servers; sIdx++) {
        const currCust = serverOccupancy[sIdx];
        if (currCust !== null && waitingPool.length > 0) {
          const bestInPool = waitingPool.reduce(
            (best, cur) => (priorities[cur] < priorities[best] ? cur : best),
            waitingPool[0],
          );
          if (priorities[bestInPool] < priorities[currCust]) {
            const duration = currentTime - lastChunkStart[currCust];
            if (duration > 0) {
              chunks.push({
                label: `C${currCust + 1}`,
                start: lastChunkStart[currCust],
                end: currentTime,
                server: `S${sIdx + 1}`,
              });
            }
            waitingPool.push(currCust);
            serverOccupancy[sIdx] = bestInPool;
            const bpIdx = waitingPool.indexOf(bestInPool);
            waitingPool.splice(bpIdx, 1);
            if (serviceStart[bestInPool] === -1)
              serviceStart[bestInPool] = currentTime;
            serverAssigned[bestInPool] = `S${sIdx + 1}`;
            lastChunkStart[bestInPool] = currentTime;
          }
        }
      }
    }

    // 4. Calculate next event
    const possibleEvents: number[] = [];
    for (let i = 0; i < n; i++) {
      if (arrivalTimes[i] > currentTime) {
        possibleEvents.push(arrivalTimes[i]);
        break;
      }
    }
    for (let sIdx = 0; sIdx < servers; sIdx++) {
      const cIdx = serverOccupancy[sIdx];
      if (cIdx !== null) {
        possibleEvents.push(currentTime + remainingTimes[cIdx]);
      }
    }
    if (possibleEvents.length === 0) break;

    const nextEventTime = Math.min(...possibleEvents);
    const timeJump = nextEventTime - currentTime;

    // 5. Execute work
    for (let sIdx = 0; sIdx < servers; sIdx++) {
      const cIdx = serverOccupancy[sIdx];
      if (cIdx !== null) {
        remainingTimes[cIdx] -= timeJump;
        if (remainingTimes[cIdx] <= 0) {
          chunks.push({
            label: `C${cIdx + 1}`,
            start: lastChunkStart[cIdx],
            end: nextEventTime,
            server: `S${sIdx + 1}`,
          });
          serviceEnd[cIdx] = nextEventTime;
          servedMask[cIdx] = true;
          serverOccupancy[sIdx] = null;
        }
      }
    }

    currentTime = nextEventTime;
  }

  const turnaroundTimes = arrivalTimes.map((at, i) => serviceEnd[i] - at);
  const waitTimes = turnaroundTimes.map((tt, i) => tt - serviceTimes[i]);
  const responseTimes = serviceStart.map((ss, i) => ss - arrivalTimes[i]);

  const rows: SimulationRow[] = arrivalTimes.map((_, i) => ({
    observation: i + 1,
    cp: cpCum[i],
    cpLookup: cpLookup[i],
    noBetweenArrivals: noBetweenArrivals[i],
    interArrivals: interArrivals[i],
    arrivalTime: arrivalTimes[i],
    serviceTime: serviceTimes[i],
    priority: priorities[i],
    serviceStart: serviceStart[i],
    serviceEnd: serviceEnd[i],
    turnaroundTime: turnaroundTimes[i],
    waitTime: waitTimes[i],
    responseTime: responseTimes[i],
    server: serverAssigned[i],
  }));

  // ===== Calculate priority-aware server utilization using timeline =====

  // Filter valid service rows
  const validRows = rows.filter(
    (r) => r.serviceStart >= 0 && r.serviceEnd >= 0,
  );

  // Find simulation end time
  const simulationEnd = Math.max(...serviceEnd, 0);

  // Create timeline array to track number of busy servers at each time unit
  const timeline = Array(simulationEnd + 1).fill(0);

  // Mark time units when servers are busy
  for (const r of validRows) {
    for (let t = r.serviceStart; t < r.serviceEnd; t++) {
      timeline[t] += 1; // increment busy servers at this time
    }
  }

  // Sum total busy server time (capped at total servers)
  let totalBusyTime = timeline.reduce(
    (acc, val) => acc + Math.min(val, servers),
    0,
  );

  // Total observed time
  const totalTimeObserved = simulationEnd;

  // Calculate utilization
  const utilization =
    totalTimeObserved > 0
      ? (totalBusyTime / (totalTimeObserved * servers)) * 100
      : 0;

  // Cap at 100%
  const serverUtilization = Math.min(utilization, 100);

  // ===== Averages =====
  const averages: SimulationAverages = {
    avgTurnaround: turnaroundTimes.reduce((a, b) => a + b, 0) / n,
    avgWait: waitTimes.reduce((a, b) => a + b, 0) / n,
    avgResponse: responseTimes.reduce((a, b) => a + b, 0) / n,
    avgInterArrival: interArrivals.reduce((a, b) => a + b, 0) / n,
    avgService: serviceTimes.reduce((a, b) => a + b, 0) / n,
    serverUtilization,
    totalCustomers: n,
  };

  return { rows, chunks, averages };
}

// --- M/G/1 Simulation ---
export function mg1Simulation(
  lambda: number,
  distParams: MGDistParams,
  usePriority: boolean,
): SimulationResult {
  const { cpCum, cpLookup, noBetweenArrivals } = buildPoissonCDF(lambda);
  const interArrivals = generateInterArrivals(cpCum, cpLookup);
  const arrivalTimes = cumSum(interArrivals);
  const n = arrivalTimes.length;
  const serviceTimes = generateMGServiceTimes(distParams, n);
  const priorities = generatePriorities(n);
  const remainingTimes = [...serviceTimes];
  const serviceStarts = new Array(n).fill(-1);
  const serviceEnds = new Array(n).fill(0);
  const servedMask = new Array(n).fill(false);
  const chunks: ServiceChunk[] = [];

  let currentTime = 0;

  while (!servedMask.every(Boolean)) {
    const waitingPool = [];
    for (let i = 0; i < n; i++) {
      if (!servedMask[i] && arrivalTimes[i] <= currentTime) {
        waitingPool.push(i);
      }
    }

    if (waitingPool.length === 0) {
      let nextArr = Infinity;
      for (let i = 0; i < n; i++) {
        if (!servedMask[i] && arrivalTimes[i] < nextArr) {
          nextArr = arrivalTimes[i];
        }
      }
      currentTime = nextArr;
      continue;
    }

    let chosenIdx: number;
    if (usePriority) {
      chosenIdx = waitingPool.reduce(
        (best, cur) => (priorities[cur] < priorities[best] ? cur : best),
        waitingPool[0],
      );
    } else {
      chosenIdx = Math.min(...waitingPool);
    }

    if (serviceStarts[chosenIdx] === -1) {
      serviceStarts[chosenIdx] = currentTime;
    }

    const interruptors = [];
    for (let i = 0; i < n; i++) {
      if (
        arrivalTimes[i] > currentTime &&
        priorities[i] < priorities[chosenIdx]
      ) {
        interruptors.push(i);
      }
    }

    let timeToEvent: number;
    if (interruptors.length > 0 && usePriority) {
      const nextInterruptTime = Math.min(
        ...interruptors.map((i) => arrivalTimes[i]),
      );
      timeToEvent = nextInterruptTime - currentTime;
    } else {
      timeToEvent = remainingTimes[chosenIdx];
    }

    const workDuration = Math.min(remainingTimes[chosenIdx], timeToEvent);
    const startChunk = currentTime;
    currentTime += workDuration;
    remainingTimes[chosenIdx] -= workDuration;

    chunks.push({
      label: `C${chosenIdx + 1}`,
      start: startChunk,
      end: currentTime,
    });

    if (remainingTimes[chosenIdx] === 0) {
      serviceEnds[chosenIdx] = currentTime;
      servedMask[chosenIdx] = true;
    }
  }

  const turnaroundTimes = arrivalTimes.map((at, i) => serviceEnds[i] - at);
  const waitTimes = turnaroundTimes.map((tt, i) => tt - serviceTimes[i]);
  const responseTimes = serviceStarts.map((ss, i) => ss - arrivalTimes[i]);

  const rows: SimulationRow[] = arrivalTimes.map((_, i) => ({
    observation: i + 1,
    cp: cpCum[i],
    cpLookup: cpLookup[i],
    noBetweenArrivals: noBetweenArrivals[i],
    interArrivals: interArrivals[i],
    arrivalTime: arrivalTimes[i],
    serviceTime: serviceTimes[i],
    priority: priorities[i],
    serviceStart: serviceStarts[i],
    serviceEnd: serviceEnds[i],
    turnaroundTime: turnaroundTimes[i],
    waitTime: waitTimes[i],
    responseTime: responseTimes[i],
  }));

  const totalBusy = serviceTimes.reduce((a, b) => a + b, 0);
  const totalTime = Math.max(...serviceEnds) - Math.min(...serviceStarts);
  const utilization = totalTime > 0 ? (totalBusy / totalTime) * 100 : 0;

  const averages: SimulationAverages = {
    avgTurnaround: turnaroundTimes.reduce((a, b) => a + b, 0) / n,
    avgWait: waitTimes.reduce((a, b) => a + b, 0) / n,
    avgResponse: responseTimes.reduce((a, b) => a + b, 0) / n,
    avgInterArrival: interArrivals.reduce((a, b) => a + b, 0) / n,
    avgService: serviceTimes.reduce((a, b) => a + b, 0) / n,
    serverUtilization: utilization,
    totalCustomers: n,
  };

  return { rows, chunks, averages };
}

// --- M/G/S Simulation ---
export function mgsSSimulation(
  lambda: number,
  distParams: MGDistParams,
  servers: number,
  usePriority: boolean,
): SimulationResult {
  const { cpCum, cpLookup, noBetweenArrivals } = buildPoissonCDF(lambda);
  const interArrivals = generateInterArrivals(cpCum, cpLookup);
  const arrivalTimes = cumSum(interArrivals);
  const n = arrivalTimes.length;
  const serviceTimes = generateMGServiceTimes(distParams, n);
  const priorities = generatePriorities(n);
  const remainingTimes = [...serviceTimes];
  const serviceStart = new Array(n).fill(-1);
  const serviceEnd = new Array(n).fill(0);
  const serverAssigned: string[] = new Array(n).fill("");
  const servedMask = new Array(n).fill(false);
  const serverOccupancy: (number | null)[] = new Array(servers).fill(null);
  const lastChunkStart = new Array(n).fill(0);
  const chunks: ServiceChunk[] = [];

  let currentTime = 0;

  while (!servedMask.every(Boolean)) {
    const waitingPool: number[] = [];
    for (let i = 0; i < n; i++) {
      if (
        !servedMask[i] &&
        arrivalTimes[i] <= currentTime &&
        !serverOccupancy.includes(i)
      ) {
        waitingPool.push(i);
      }
    }

    for (let sIdx = 0; sIdx < servers; sIdx++) {
      if (serverOccupancy[sIdx] === null && waitingPool.length > 0) {
        const chosen = usePriority
          ? waitingPool.reduce(
              (best, cur) => (priorities[cur] < priorities[best] ? cur : best),
              waitingPool[0],
            )
          : Math.min(...waitingPool);
        serverOccupancy[sIdx] = chosen;
        const wpIdx = waitingPool.indexOf(chosen);
        waitingPool.splice(wpIdx, 1);
        if (serviceStart[chosen] === -1) serviceStart[chosen] = currentTime;
        serverAssigned[chosen] = `S${sIdx + 1}`;
        lastChunkStart[chosen] = currentTime;
      }
    }

    if (usePriority && waitingPool.length > 0) {
      for (let sIdx = 0; sIdx < servers; sIdx++) {
        const currCust = serverOccupancy[sIdx];
        if (currCust !== null && waitingPool.length > 0) {
          const bestInPool = waitingPool.reduce(
            (best, cur) => (priorities[cur] < priorities[best] ? cur : best),
            waitingPool[0],
          );
          if (priorities[bestInPool] < priorities[currCust]) {
            const duration = currentTime - lastChunkStart[currCust];
            if (duration > 0) {
              chunks.push({
                label: `C${currCust + 1}`,
                start: lastChunkStart[currCust],
                end: currentTime,
                server: `S${sIdx + 1}`,
              });
            }
            waitingPool.push(currCust);
            serverOccupancy[sIdx] = bestInPool;
            const bpIdx = waitingPool.indexOf(bestInPool);
            waitingPool.splice(bpIdx, 1);
            if (serviceStart[bestInPool] === -1)
              serviceStart[bestInPool] = currentTime;
            serverAssigned[bestInPool] = `S${sIdx + 1}`;
            lastChunkStart[bestInPool] = currentTime;
          }
        }
      }
    }

    const possibleEvents: number[] = [];
    for (let i = 0; i < n; i++) {
      if (arrivalTimes[i] > currentTime) {
        possibleEvents.push(arrivalTimes[i]);
        break;
      }
    }
    for (let sIdx = 0; sIdx < servers; sIdx++) {
      const cIdx = serverOccupancy[sIdx];
      if (cIdx !== null) {
        possibleEvents.push(currentTime + remainingTimes[cIdx]);
      }
    }
    if (possibleEvents.length === 0) break;

    const nextEventTime = Math.min(...possibleEvents);
    const timeJump = nextEventTime - currentTime;

    for (let sIdx = 0; sIdx < servers; sIdx++) {
      const cIdx = serverOccupancy[sIdx];
      if (cIdx !== null) {
        remainingTimes[cIdx] -= timeJump;
        if (remainingTimes[cIdx] <= 0) {
          chunks.push({
            label: `C${cIdx + 1}`,
            start: lastChunkStart[cIdx],
            end: nextEventTime,
            server: `S${sIdx + 1}`,
          });
          serviceEnd[cIdx] = nextEventTime;
          servedMask[cIdx] = true;
          serverOccupancy[sIdx] = null;
        }
      }
    }

    currentTime = nextEventTime;
  }

  const turnaroundTimes = arrivalTimes.map((at, i) => serviceEnd[i] - at);
  const waitTimes = turnaroundTimes.map((tt, i) => tt - serviceTimes[i]);
  const responseTimes = serviceStart.map((ss, i) => ss - arrivalTimes[i]);

  const rows: SimulationRow[] = arrivalTimes.map((_, i) => ({
    observation: i + 1,
    cp: cpCum[i],
    cpLookup: cpLookup[i],
    noBetweenArrivals: noBetweenArrivals[i],
    interArrivals: interArrivals[i],
    arrivalTime: arrivalTimes[i],
    serviceTime: serviceTimes[i],
    priority: priorities[i],
    serviceStart: serviceStart[i],
    serviceEnd: serviceEnd[i],
    turnaroundTime: turnaroundTimes[i],
    waitTime: waitTimes[i],
    responseTime: responseTimes[i],
    server: serverAssigned[i],
  }));

  // ===== Priority-aware server utilization =====

  // Filter valid service rows
  const validRows = rows.filter(
    (r) => r.serviceStart >= 0 && r.serviceEnd >= 0,
  );

  // Find the end of the simulation
  const simulationEnd = Math.max(...serviceEnd, 0);

  // Create timeline array to track number of busy servers at each time unit
  const timeline = Array(simulationEnd + 1).fill(0);

  // Mark time units when servers are busy
  for (const r of validRows) {
    for (let t = r.serviceStart; t < r.serviceEnd; t++) {
      timeline[t] += 1; // increment busy servers at this time
    }
  }

  // Sum total busy server time (capped at total servers)
  let totalBusyTime = timeline.reduce(
    (acc, val) => acc + Math.min(val, servers),
    0,
  );

  // Total observed time
  const totalTimeObserved = simulationEnd;

  // Calculate utilization
  const utilization =
    totalTimeObserved > 0
      ? (totalBusyTime / (totalTimeObserved * servers)) * 100
      : 0;

  // ===== Averages =====
  const averages: SimulationAverages = {
    avgTurnaround: turnaroundTimes.reduce((a, b) => a + b, 0) / n,
    avgWait: waitTimes.reduce((a, b) => a + b, 0) / n,
    avgResponse: responseTimes.reduce((a, b) => a + b, 0) / n,
    avgInterArrival: interArrivals.reduce((a, b) => a + b, 0) / n,
    avgService: serviceTimes.reduce((a, b) => a + b, 0) / n,
    serverUtilization: Math.min(utilization, 100),
    totalCustomers: n,
  };

  return { rows, chunks, averages };
}
