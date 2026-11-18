// ==========================================
// 1. SIMPLE STATE & DATA
// ==========================================

let isRunning = true;
let customerId = 1;
let totalServed = 0;
let totalWaitTime = 0;

// Waiting customer queue
let queue = [];

// 3 Simple Counters
let counters = [
  { id: 1, name: "Counter 1 (Express - Max 3 items)", type: "Express", isOpen: true, customer: null, servedCount: 0 },
  { id: 2, name: "Counter 2 (Regular Checkout)",     type: "Regular", isOpen: true, customer: null, servedCount: 0 },
  { id: 3, name: "Counter 3 (VIP / Priority)",      type: "VIP",     isOpen: true, customer: null, servedCount: 0 }
];

// ==========================================
// 2. SIMULATION LOOP (RUNS EVERY SECOND)
// ==========================================

setInterval(function() {
  if (!isRunning) return;

  // 1. Increase waiting time for everyone in queue
  for (let i = 0; i < queue.length; i++) {
    queue[i].waitTime++;
  }

  // 2. Assign waiting customers to available counters (Priority Rules)
  assignQueueToCounters();

  // 3. Process checkout (scan 1 item per second)
  processCheckouts();

  // 4. Update the screen
  updateUI();
}, 1000);

// ==========================================
// 3. PRIORITY RULES & COUNTER ALLOCATION
// ==========================================

function assignQueueToCounters() {
  if (queue.length === 0) return;

  for (let i = 0; i < counters.length; i++) {
    let counter = counters[i];

    // Only assign if counter is open and has no customer
    if (!counter.isOpen || counter.customer !== null) continue;

    let targetIndex = -1;

    // Rule A: VIP Counter prefers VIP customers
    if (counter.type === "VIP") {
      targetIndex = queue.findIndex(c => c.type === "VIP");
      // If no VIP is waiting, take the next regular person
      if (targetIndex === -1 && queue.length > 0) targetIndex = 0;
    }
    // Rule B: Express Counter prefers customers with 3 or fewer items
    else if (counter.type === "Express") {
      targetIndex = queue.findIndex(c => c.items <= 3);
      if (targetIndex === -1 && queue.length >= 3) targetIndex = 0;
    }
    // Rule C: Regular Counter takes VIP first (if any), otherwise First-Come First-Served
    else {
      let vipIndex = queue.findIndex(c => c.type === "VIP");
      targetIndex = vipIndex !== -1 ? vipIndex : 0;
    }

    // If we found a matching customer, move them to the counter
    if (targetIndex !== -1 && targetIndex < queue.length) {
      counter.customer = queue.splice(targetIndex, 1)[0];
    }
  }
}

// ==========================================
// 4. PROCESS CHECKOUT (SCAN ITEMS)
// ==========================================

function processCheckouts() {
  for (let i = 0; i < counters.length; i++) {
    let counter = counters[i];

    if (counter.isOpen && counter.customer !== null) {
      counter.customer.items--; // Scan 1 item

      // When all items are scanned, checkout is complete
      if (counter.customer.items <= 0) {
        totalServed++;
        totalWaitTime += counter.customer.waitTime;
        counter.servedCount++;
        counter.customer = null; // Counter is free again
      }
    }
  }
}

// ==========================================
// 5. USER ACTIONS (BUTTON CLICKS)
// ==========================================

// Add a single customer
function addCustomer(type) {
  let items = 5;
  if (type === "Express") items = 3;
  if (type === "VIP") items = 4;

  queue.push({
    id: customerId++,
    name: "Customer #" + customerId,
    type: type,
    items: items,
    waitTime: 0
  });

  updateUI();
}

// Add 4 customers at once (simulate rush)
function addRush() {
  addCustomer("Regular");
  addCustomer("Express");
  addCustomer("VIP");
  addCustomer("Regular");
}

// Pause or Resume simulation
function togglePause() {
  isRunning = !isRunning;
  document.getElementById("pauseBtn").textContent = isRunning ? "Pause" : "Resume";
}

// Open or Close a counter
function toggleCounter(id) {
  let counter = counters.find(c => c.id === id);
  if (!counter) return;

  counter.isOpen = !counter.isOpen;

  // If counter is closed while serving, return customer to front of queue
  if (!counter.isOpen && counter.customer !== null) {
    queue.unshift(counter.customer);
    counter.customer = null;
  }

  updateUI();
}

// Reset everything to start
function resetSim() {
  queue = [];
  totalServed = 0;
  totalWaitTime = 0;
  customerId = 1;

  for (let i = 0; i < counters.length; i++) {
    counters[i].isOpen = true;
    counters[i].customer = null;
    counters[i].servedCount = 0;
  }

  updateUI();
}

// ==========================================
// 6. UPDATE HTML (DOM DISPLAY)
// ==========================================

function updateUI() {
  // 1. Update Dashboard Stats
  document.getElementById("queueCount").textContent = queue.length;
  document.getElementById("servedCount").textContent = totalServed;
  
  let avg = totalServed === 0 ? 0 : Math.round(totalWaitTime / totalServed);
  document.getElementById("avgWait").textContent = avg + "s";

  let openCount = counters.filter(c => c.isOpen).length;
  document.getElementById("openCounters").textContent = openCount + " / " + counters.length;

  // 2. Render Counters
  let countersHtml = "";
  for (let i = 0; i < counters.length; i++) {
    let c = counters[i];

    let statusText = "IDLE";
    let statusClass = "status-idle";
    let boxClass = "counter-box idle";

    if (!c.isOpen) {
      statusText = "CLOSED";
      statusClass = "status-closed";
      boxClass = "counter-box closed";
    } else if (c.customer !== null) {
      statusText = "BUSY";
      statusClass = "status-busy";
      boxClass = "counter-box busy";
    }

    let customerInfo = "Waiting for customer...";
    if (!c.isOpen) customerInfo = "Counter is Closed";
    if (c.customer !== null) {
      customerInfo = "Serving <strong>" + c.customer.name + " (" + c.customer.type + ")</strong> - " + c.customer.items + " items left";
    }

    countersHtml += `
      <div class="${boxClass}">
        <div class="counter-header">
          <span>${c.name}</span>
          <span class="counter-status ${statusClass}">${statusText}</span>
        </div>
        <p style="margin: 8px 0; font-size: 13px;">${customerInfo}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <small>Total Served: ${c.servedCount}</small>
          <button class="toggle-btn" onclick="toggleCounter(${c.id})">${c.isOpen ? "Close Counter" : "Open Counter"}</button>
        </div>
      </div>
    `;
  }
  document.getElementById("countersList").innerHTML = countersHtml;

  // 3. Render Queue List
  if (queue.length === 0) {
    document.getElementById("queueList").innerHTML = `<li class="empty-text">Queue is empty. Click "+ Add Customer" above!</li>`;
  } else {
    let queueHtml = "";
    for (let i = 0; i < queue.length; i++) {
      let cust = queue[i];
      let itemClass = "queue-item";
      if (cust.type === "VIP") itemClass += " vip";
      if (cust.type === "Express") itemClass += " express";

      queueHtml += `
        <li class="${itemClass}">
          <div>
            <strong>#${i + 1} ${cust.name}</strong> (${cust.type})<br>
            <small>${cust.items} items</small>
          </div>
          <div>
            <span style="font-weight: bold; color: #666;">Wait: ${cust.waitTime}s</span>
          </div>
        </li>
      `;
    }
    document.getElementById("queueList").innerHTML = queueHtml;
  }
}

// Initial draw on page load
updateUI();
