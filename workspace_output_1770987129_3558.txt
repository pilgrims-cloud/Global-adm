// Global Pilgrim Bank - Main JavaScript
// Owner: Olawale Abdul-ganiyu Adeshina (Adegan95)
// Bank Code: Agb 999

// Global State
const APP_STATE = {
    isAdmin: false,
    adminInfo: {
        bvn: "12345678901", // Default admin BVN
        phone: "+2349030277275", // Owner's phone
        serial: "AG9512345678", // Admin serial number
        name: "Olawale Abdul-ganiyu Adeshina",
        alias: "Adegan95"
    },
    customers: [],
    transactions: [],
    pendingApprovals: [],
    wallets: [],
    miningActive: false,
    autoTrading: true,
    balances: {
        total: 0,
        profit: 0,
        usd: 0,
        ngn: 0,
        eur: 0,
        gbp: 0,
        chf: 0,
        pilgrimCoins: 0,
        shares: 0
    },
    minedToday: 0,
    totalMined: 0,
    activeTrades: [],
    networkSessions: []
};

// DOM Elements
const loginPage = document.getElementById('login-page');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    checkNetworkRestriction();
    loadSavedData();
    setupEventListeners();
    updateDashboard();
    startNetworkMonitoring();
    startAutoTrading();
});

// Network Restriction Check
function checkNetworkRestriction() {
    // Simulate network check - only owner's network allowed
    const currentNetwork = "+2349030277275"; // Owner's network
    
    if (currentNetwork !== APP_STATE.adminInfo.phone) {
        showError("Unauthorized network detected. Access denied.");
        return false;
    }
    
    return true;
}

// Event Listeners
function setupEventListeners() {
    // Login form submission
    loginForm.addEventListener('submit', handleLogin);
    
    // Customer creation form
    const customerForm = document.getElementById('create-customer-form');
    if (customerForm) {
        customerForm.addEventListener('submit', createCustomer);
    }
}

// Login Handler
function handleLogin(e) {
    e.preventDefault();
    
    const bvn = document.getElementById('bvn-number').value;
    const phone = document.getElementById('phone-number').value;
    const serial = document.getElementById('serial-number').value;
    
    // Validate admin credentials
    if (bvn !== APP_STATE.adminInfo.bvn || 
        phone !== APP_STATE.adminInfo.phone || 
        serial !== APP_STATE.adminInfo.serial) {
        showError("Invalid credentials. Access denied. Only Olawale Abdul-ganiyu can login.");
        return;
    }
    
    // Successful login
    APP_STATE.isAdmin = true;
    loginPage.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    
    // Update admin display
    document.getElementById('admin-bvn-display').textContent = `BVN: ${bvn}`;
    
    // Add to network sessions
    addNetworkSession('Admin Login', 'Owner Network', 'Olawale Abdul-ganiyu');
    
    updateDashboard();
    logTerminal(`[AUTH] Admin login successful: ${APP_STATE.adminInfo.name}`);
    logTerminal(`[SECURITY] Owner verified: +2349030277275`);
    logTerminal(`[SYSTEM] Dashboard initialized`);
}

// Logout Handler
function logout() {
    APP_STATE.isAdmin = false;
    adminDashboard.classList.add('hidden');
    loginPage.classList.remove('hidden');
    loginForm.reset();
    logTerminal(`[AUTH] Admin logged out`);
}

// Show Error
function showError(message) {
    const errorElement = document.getElementById('login-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

// Section Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from nav items
    document.querySelectorAll('.nav-menu a').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav menu
    const navItem = document.querySelector(`.nav-menu a[onclick="showSection('${sectionId}')"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Update section-specific data
    updateSectionData(sectionId);
}

// Update Section Data
function updateSectionData(sectionId) {
    switch(sectionId) {
        case 'overview':
            updateDashboard();
            break;
        case 'customers':
            updateCustomerTable();
            break;
        case 'transactions':
            updateTransactionTable();
            break;
        case 'crypto':
            updateCryptoSection();
            break;
        case 'forex':
            updateForexSection();
            break;
        case 'terminal':
            updateTerminalSection();
            break;
    }
}

// Update Dashboard
function updateDashboard() {
    // Update balances
    document.getElementById('total-balance').textContent = formatCurrency(APP_STATE.balances.total);
    document.getElementById('profit-balance').textContent = formatCurrency(APP_STATE.balances.profit);
    document.getElementById('total-customers').textContent = APP_STATE.customers.length;
    document.getElementById('pilgrim-coins').textContent = APP_STATE.balances.pilgrimCoins.toFixed(2);
    
    // Update currency balances
    document.getElementById('usd-balance').textContent = formatCurrency(APP_STATE.balances.usd, 'USD');
    document.getElementById('ngn-balance').textContent = formatCurrency(APP_STATE.balances.ngn, 'NGN');
    document.getElementById('eur-balance').textContent = formatCurrency(APP_STATE.balances.eur, 'EUR');
    document.getElementById('gbp-balance').textContent = formatCurrency(APP_STATE.balances.gbp, 'GBP');
    document.getElementById('chf-balance').textContent = formatCurrency(APP_STATE.balances.chf, 'CHF');
    
    // Update network info
    document.getElementById('active-sessions').textContent = APP_STATE.networkSessions.length;
    
    // Update last activity
    const now = new Date();
    document.getElementById('last-activity').textContent = formatTime(now);
}

// Create Customer
function createCustomer(e) {
    e.preventDefault();
    
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const email = document.getElementById('customer-email').value;
    const bvn = document.getElementById('customer-bvn').value;
    const nin = document.getElementById('customer-nin').value;
    const initialDeposit = parseFloat(document.getElementById('customer-deposit').value) || 0;
    
    // Generate account number and serial number
    const accountNumber = generateAccountNumber();
    const serialNumber = generateSerialNumber();
    
    // Create customer object
    const customer = {
        id: Date.now(),
        accountNumber,
        serialNumber,
        name,
        phone,
        email,
        bvn,
        nin,
        balance: initialDeposit,
        status: 'active',
        createdAt: new Date().toISOString(),
        transactions: []
    };
    
    // Add to customers list
    APP_STATE.customers.push(customer);
    
    // Update bank balance
    APP_STATE.balances.total += initialDeposit;
    APP_STATE.balances.usd += initialDeposit;
    
    // Create transaction record
    if (initialDeposit > 0) {
        const transaction = {
            id: generateTransactionId(),
            type: 'deposit',
            amount: initialDeposit,
            from: 'Initial Deposit',
            to: accountNumber,
            date: new Date().toISOString(),
            status: 'completed'
        };
        APP_STATE.transactions.push(transaction);
    }
    
    // Add to pending approvals
    APP_STATE.pendingApprovals.push({
        id: Date.now(),
        type: 'account_creation',
        customer: customer,
        status: 'pending',
        createdAt: new Date().toISOString()
    });
    
    // Clear form
    document.getElementById('create-customer-form').reset();
    
    // Update UI
    updateCustomerTable();
    updateDashboard();
    
    // Log activity
    logTerminal(`[CUSTOMER] New account created: ${accountNumber} - ${name}`);
    alert(`Customer account created successfully!\n\nAccount Number: ${accountNumber}\nSerial Number: ${serialNumber}\n\nPending approval required.`);
    
    saveData();
}

// Generate Account Number
function generateAccountNumber() {
    let accountNumber;
    let isUnique = false;
    
    while (!isUnique) {
        accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        isUnique = !APP_STATE.customers.some(c => c.accountNumber === accountNumber);
    }
    
    return accountNumber;
}

// Generate Serial Number
function generateSerialNumber() {
    const letters = ['AG', 'GP', 'PB', 'MB'];
    const prefix = letters[Math.floor(Math.random() * letters.length)];
    const numbers = Math.floor(10000000 + Math.random() * 90000000).toString();
    return `${prefix}${numbers}`;
}

// Generate Transaction ID
function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Update Customer Table
function updateCustomerTable() {
    const tbody = document.getElementById('customer-table-body');
    tbody.innerHTML = '';
    
    APP_STATE.customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.accountNumber}</td>
            <td>${customer.name}</td>
            <td>${formatCurrency(customer.balance)}</td>
            <td><span class="status-badge ${customer.status}">${customer.status}</span></td>
            <td>
                <button onclick="viewCustomer('${customer.accountNumber}')" class="btn-action">View</button>
                <button onclick="editCustomer('${customer.accountNumber}')" class="btn-warning">Edit</button>
                <button onclick="adjustBalance('${customer.accountNumber}')" class="btn-success">Balance</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View Customer
function viewCustomer(accountNumber) {
    const customer = APP_STATE.customers.find(c => c.accountNumber === accountNumber);
    if (!customer) return;
    
    const customerInfo = `
        Customer Details:
        ----------------
        Name: ${customer.name}
        Account Number: ${customer.accountNumber}
        Serial Number: ${customer.serialNumber}
        Phone: ${customer.phone}
        Email: ${customer.email}
        BVN: ${customer.bvn}
        NIN: ${customer.nin}
        Balance: ${formatCurrency(customer.balance)}
        Status: ${customer.status}
        Created: ${formatDate(customer.createdAt)}
    `;
    
    alert(customerInfo);
}

// Edit Customer
function editCustomer(accountNumber) {
    const customer = APP_STATE.customers.find(c => c.accountNumber === accountNumber);
    if (!customer) return;
    
    const newPhone = prompt("Enter new phone number:", customer.phone);
    const newEmail = prompt("Enter new email address:", customer.email);
    
    if (newPhone) customer.phone = newPhone;
    if (newEmail) customer.email = newEmail;
    
    updateCustomerTable();
    logTerminal(`[CUSTOMER] Customer edited: ${accountNumber}`);
    saveData();
}

// Adjust Balance
function adjustBalance(accountNumber) {
    const customer = APP_STATE.customers.find(c => c.accountNumber === accountNumber);
    if (!customer) return;
    
    const type = prompt("Enter adjustment type (credit/debit):").toLowerCase();
    const amount = parseFloat(prompt("Enter amount:"));
    
    if (!['credit', 'debit'].includes(type) || isNaN(amount) || amount <= 0) {
        alert("Invalid input. Please try again.");
        return;
    }
    
    if (type === 'credit') {
        customer.balance += amount;
        APP_STATE.balances.profit += amount;
    } else {
        if (amount > customer.balance) {
            alert("Insufficient balance.");
            return;
        }
        customer.balance -= amount;
    }
    
    // Create transaction record
    const transaction = {
        id: generateTransactionId(),
        type: type === 'credit' ? 'credit_adjustment' : 'debit_adjustment',
        amount: amount,
        from: 'Admin Adjustment',
        to: accountNumber,
        date: new Date().toISOString(),
        status: 'completed'
    };
    
    APP_STATE.transactions.push(transaction);
    
    updateCustomerTable();
    updateDashboard();
    updateTransactionTable();
    
    logTerminal(`[BALANCE] ${type.toUpperCase()} ${accountNumber}: ${formatCurrency(amount)}`);
    saveData();
}

// Update Transaction Table
function updateTransactionTable() {
    const tbody = document.getElementById('transaction-table-body');
    tbody.innerHTML = '';
    
    APP_STATE.transactions.slice(-50).reverse().forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${formatTransactionType(transaction.type)}</td>
            <td>${formatCurrency(transaction.amount)}</td>
            <td>${transaction.from} → ${transaction.to}</td>
            <td>${formatDate(transaction.date)}</td>
            <td><span class="status-badge ${transaction.status}">${transaction.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Format Transaction Type
function formatTransactionType(type) {
    const types = {
        'deposit': 'Deposit',
        'withdrawal': 'Withdrawal',
        'transfer': 'Transfer',
        'credit_adjustment': 'Credit Adjustment',
        'debit_adjustment': 'Debit Adjustment',
        'mining': 'Mining Reward',
        'trading': 'Trading Profit',
        'share_dividend': 'Share Dividend'
    };
    return types[type] || type;
}

// Approve Accounts
function approveAccounts() {
    if (APP_STATE.pendingApprovals.length === 0) {
        alert("No pending approvals.");
        return;
    }
    
    let approvedCount = 0;
    APP_STATE.pendingApprovals.forEach(approval => {
        if (approval.status === 'pending') {
            approval.status = 'approved';
            approvedCount++;
            
            if (approval.customer) {
                logTerminal(`[APPROVAL] Account approved: ${approval.customer.accountNumber}`);
            }
        }
    });
    
    alert(`${approvedCount} account(s) approved successfully.`);
    updateCustomerTable();
    saveData();
}

// Transfer Profit
function transferProfit() {
    const profitAmount = APP_STATE.balances.profit;
    
    if (profitAmount <= 0) {
        alert("No profit balance to transfer.");
        return;
    }
    
    if (confirm(`Transfer ${formatCurrency(profitAmount)} from profit balance to main balance?`)) {
        APP_STATE.balances.total += profitAmount;
        APP_STATE.balances.profit = 0;
        
        updateDashboard();
        logTerminal(`[TRANSFER] Profit transferred: ${formatCurrency(profitAmount)}`);
        saveData();
        
        alert("Profit transferred successfully!");
    }
}

// Crypto Section Functions
function updateCryptoSection() {
    document.getElementById('pilgrim-coin-balance').textContent = APP_STATE.balances.pilgrimCoins.toFixed(2);
    document.getElementById('share-balance').textContent = APP_STATE.balances.shares.toFixed(2);
    document.getElementById('mined-today').textContent = APP_STATE.minedToday;
    document.getElementById('total-mined').textContent = APP_STATE.totalMined;
    
    const miningStatus = document.getElementById('mining-status');
    miningStatus.textContent = APP_STATE.miningActive ? 'Active' : 'Stopped';
    miningStatus.className = APP_STATE.miningActive ? 'active' : 'stopped';
    
    updateWalletList();
}

// Start Mining
function startMining() {
    if (APP_STATE.miningActive) {
        APP_STATE.miningActive = false;
        logTerminal(`[MINING] Mining stopped`);
    } else {
        APP_STATE.miningActive = true;
        logTerminal(`[MINING] Mining started`);
        mineInterval = setInterval(minePilgrimCoin, 60000); // Mine every minute
    }
    
    updateCryptoSection();
}

// Mine Pilgrim Coin
let mineInterval;

function minePilgrimCoin() {
    if (!APP_STATE.miningActive) return;
    
    const miningReward = 50; // 50 PLC per mining
    const walletAddress = generateWalletAddress();
    
    // Add to balances
    APP_STATE.balances.pilgrimCoins += miningReward;
    APP_STATE.minedToday += miningReward;
    APP_STATE.totalMined += miningReward;
    
    // Convert to USD ($0.5 per PLC)
    const usdValue = miningReward * 0.5;
    APP_STATE.balances.profit += usdValue;
    
    // Create transaction
    const transaction = {
        id: generateTransactionId(),
        type: 'mining',
        amount: usdValue,
        from: 'Mining Reward',
        to: `Wallet: ${walletAddress.substring(0, 10)}...`,
        date: new Date().toISOString(),
        status: 'completed'
    };
    
    APP_STATE.transactions.push(transaction);
    
    // Add to wallets
    APP_STATE.wallets.push({
        address: walletAddress,
        balance: miningReward,
        currency: 'PLC',
        createdAt: new Date().toISOString()
    });
    
    logTerminal(`[MINING] Mined ${miningReward} PLC = ${formatCurrency(usdValue)}`);
    updateCryptoSection();
    updateDashboard();
    
    saveData();
}

// Generate Wallet Address
function generateWalletAddress() {
    const prefix = ['0x', 'TRX', 'BC1', 'LTC'];
    const selectedPrefix = prefix[Math.floor(Math.random() * prefix.length)];
    const randomPart = Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    return `${selectedPrefix}${randomPart}`.substring(0, 42);
}

// Generate Wallet
function generateWallet() {
    const blockchainTypes = ['ERC-20 (Ethereum)', 'BEP-20 (Binance)', 'TRC-20 (TRON)', 'Bitcoin'];
    const blockchain = blockchainTypes[Math.floor(Math.random() * blockchainTypes.length)];
    const address = generateWalletAddress();
    
    const wallet = {
        id: Date.now(),
        address,
        blockchain,
        balance: 0,
        createdAt: new Date().toISOString()
    };
    
    APP_STATE.wallets.push(wallet);
    updateWalletList();
    logTerminal(`[CRYPTO] New wallet generated: ${blockchain}`);
    saveData();
}

// Update Wallet List
function updateWalletList() {
    const walletList = document.getElementById('wallet-list');
    walletList.innerHTML = '';
    
    APP_STATE.wallets.slice(-10).forEach(wallet => {
        const walletItem = document.createElement('div');
        walletItem.className = 'wallet-item';
        walletItem.innerHTML = `
            <p><strong>Address:</strong> ${wallet.address}</p>
            <p><strong>Blockchain:</strong> ${wallet.blockchain}</p>
            <p><strong>Balance:</strong> ${wallet.balance} ${wallet.currency || 'N/A'}</p>
        `;
        walletList.appendChild(walletItem);
    });
}

// Buy Shares
function buyShares() {
    const sharesToBuy = parseFloat(prompt("Enter number of shares to buy ($5 per share):"));
    
    if (isNaN(sharesToBuy) || sharesToBuy <= 0) {
        alert("Invalid amount.");
        return;
    }
    
    const totalCost = sharesToBuy * 5;
    
    if (APP_STATE.balances.total < totalCost) {
        alert("Insufficient balance.");
        return;
    }
    
    APP_STATE.balances.shares += sharesToBuy;
    APP_STATE.balances.total -= totalCost;
    
    logTerminal(`[SHARES] Bought ${sharesToBuy} shares for ${formatCurrency(totalCost)}`);
    updateCryptoSection();
    updateDashboard();
    saveData();
    
    alert(`${sharesToBuy} shares purchased successfully for ${formatCurrency(totalCost)}!`);
}

// Forex Section Functions
function updateForexSection() {
    const tbody = document.getElementById('active-trades-body');
    tbody.innerHTML = '';
    
    APP_STATE.activeTrades.forEach(trade => {
        const row = document.createElement('tr');
        const profitClass = trade.profit >= 0 ? 'success' : 'danger';
        row.innerHTML = `
            <td>${trade.pair}</td>
            <td>${trade.type.toUpperCase()}</td>
            <td>${formatCurrency(trade.amount)}</td>
            <td>${trade.entryPrice}</td>
            <td>${trade.currentPrice}</td>
            <td class="${profitClass}">${formatCurrency(trade.profit)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Update trading mode button
    const autoTradeBtn = document.getElementById('auto-trade-btn');
    if (autoTradeBtn) {
        autoTradeBtn.textContent = `Auto Trading: ${APP_STATE.autoTrading ? 'ON' : 'OFF'}`;
        autoTradeBtn.className = APP_STATE.autoTrading ? 'btn-success' : 'btn-danger';
    }
    
    // Update market signals
    updateMarketSignals();
}

// Toggle Auto Trading
function toggleAutoTrading() {
    APP_STATE.autoTrading = !APP_STATE.autoTrading;
    
    if (APP_STATE.autoTrading) {
        logTerminal(`[TRADING] Auto trading enabled`);
        startAutoTrading();
    } else {
        logTerminal(`[TRADING] Auto trading disabled`);
    }
    
    updateForexSection();
}

// Start Auto Trading
function startAutoTrading() {
    setInterval(() => {
        if (!APP_STATE.autoTrading) return;
        
        executeAutoTrade();
    }, 6000); // Trade every 6 seconds
}

// Execute Auto Trade
function executeAutoTrade() {
    const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD'];
    const types = ['buy', 'sell'];
    
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const amount = Math.random() * 1000 + 100;
    const entryPrice = (Math.random() * 2 + 1).toFixed(5);
    const currentPrice = (parseFloat(entryPrice) + (Math.random() * 0.001 - 0.0005)).toFixed(5);
    const profit = (Math.random() * 100 - 30).toFixed(2);
    
    const trade = {
        id: Date.now(),
        pair,
        type,
        amount,
        entryPrice,
        currentPrice,
        profit: parseFloat(profit),
        date: new Date().toISOString()
    };
    
    // Keep only last 10 trades
    if (APP_STATE.activeTrades.length >= 10) {
        APP_STATE.activeTrades.shift();
    }
    
    APP_STATE.activeTrades.push(trade);
    
    // Add profit to balance
    if (trade.profit > 0) {
        APP_STATE.balances.profit += trade.profit;
        
        // Create transaction
        const transaction = {
            id: generateTransactionId(),
            type: 'trading',
            amount: trade.profit,
            from: 'Auto Trading',
            to: 'Profit Balance',
            date: new Date().toISOString(),
            status: 'completed'
        };
        
        APP_STATE.transactions.push(transaction);
    }
    
    logTerminal(`[TRADING] ${type.toUpperCase()} ${pair}: ${formatCurrency(trade.profit)}`);
    updateForexSection();
    updateDashboard();
    saveData();
}

// Start Manual Trade
function startManualTrade() {
    const pair = prompt("Enter currency pair (e.g., EUR/USD):");
    const type = prompt("Enter type (buy/sell):");
    const amount = parseFloat(prompt("Enter amount:"));
    
    if (!pair || !type || isNaN(amount)) {
        alert("Invalid input.");
        return;
    }
    
    const trade = {
        id: Date.now(),
        pair,
        type,
        amount,
        entryPrice: (Math.random() * 2 + 1).toFixed(5),
        currentPrice: (Math.random() * 2 + 1).toFixed(5),
        profit: 0,
        date: new Date().toISOString()
    };
    
    APP_STATE.activeTrades.push(trade);
    logTerminal(`[TRADING] Manual trade started: ${pair}`);
    updateForexSection();
}

// Update Market Signals
function updateMarketSignals() {
    const signalsList = document.getElementById('market-signals');
    if (!signalsList) return;
    
    const signals = [
        { pair: 'EUR/USD', action: 'BUY', confidence: 85 },
        { pair: 'GBP/USD', action: 'SELL', confidence: 72 },
        { pair: 'USD/JPY', action: 'BUY', confidence: 68 },
        { pair: 'Pilgrim Coin', action: 'BUY', confidence: 90 }
    ];
    
    signalsList.innerHTML = signals.map(signal => `
        <div class="signal-item">
            <span class="pair">${signal.pair}</span>
            <span class="action ${signal.action.toLowerCase()}">${signal.action}</span>
            <span class="confidence">${signal.confidence}%</span>
        </div>
    `).join('');
}

// Terminal Functions
function updateTerminalSection() {
    const sessionsMonitor = document.getElementById('sessions-monitor');
    if (!sessionsMonitor) return;
    
    sessionsMonitor.innerHTML = APP_STATE.networkSessions.map(session => `
        <div class="session-item">
            <p><strong>User:</strong> ${session.user}</p>
            <p><strong>Network:</strong> ${session.network}</p>
            <p><strong>Activity:</strong> ${session.activity}</p>
            <p><strong>Time:</strong> ${formatTime(new Date(session.timestamp))}</p>
        </div>
    `).join('');
}

function logTerminal(message) {
    const terminalOutput = document.getElementById('terminal-output');
    if (!terminalOutput) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function handleTerminalCommand(event) {
    if (event.key === 'Enter') {
        executeCommand();
    }
}

function executeCommand() {
    const input = document.getElementById('terminal-input');
    const command = input.value.trim().toLowerCase();
    
    logTerminal(`[CMD] ${command}`);
    
    switch(command) {
        case 'status':
            logTerminal(`[SYSTEM] Status: Online | Customers: ${APP_STATE.customers.length} | Balance: ${formatCurrency(APP_STATE.balances.total)}`);
            break;
        case 'customers':
            logTerminal(`[CUSTOMERS] Total customers: ${APP_STATE.customers.length}`);
            break;
        case 'transactions':
            logTerminal(`[TRANSACTIONS] Total transactions: ${APP_STATE.transactions.length}`);
            break;
        case 'help':
            logTerminal(`[HELP] Available commands: status, customers, transactions, clear, exit`);
            break;
        case 'clear':
            document.getElementById('terminal-output').innerHTML = '';
            break;
        case 'exit':
            logout();
            break;
        default:
            logTerminal(`[ERROR] Unknown command: ${command}. Type 'help' for available commands.`);
    }
    
    input.value = '';
}

// Network Monitoring
function startNetworkMonitoring() {
    setInterval(() => {
        // Simulate network monitoring
        if (Math.random() < 0.05) { // 5% chance of monitoring event
            const events = [
                'Network scan completed - secure',
                'Encrypted connection verified',
                'Firewall active',
                'SSL certificate valid',
                'Data transmission encrypted'
            ];
            const event = events[Math.floor(Math.random() * events.length)];
            logTerminal(`[NETWORK] ${event}`);
        }
    }, 30000); // Check every 30 seconds
}

function addNetworkSession(user, network, activity) {
    APP_STATE.networkSessions.push({
        user,
        network,
        activity,
        timestamp: new Date().toISOString()
    });
}

// Test Alarm System
function testAlarm() {
    logTerminal(`[ALARM] Testing alarm system...`);
    alert("🚨 ALARM SYSTEM TEST 🚨\n\nThis is a test of the emergency alarm system.\nThe alarm will sound for 5 seconds.\n\nOwner: Olawale Abdul-ganiyu Adeshina\nNetwork: +2349030277275");
    logTerminal(`[ALARM] Alarm system test completed`);
}

// Data Persistence
function saveData() {
    const dataToSave = {
        customers: APP_STATE.customers,
        transactions: APP_STATE.transactions,
        pendingApprovals: APP_STATE.pendingApprovals,
        wallets: APP_STATE.wallets,
        balances: APP_STATE.balances,
        minedToday: APP_STATE.minedToday,
        totalMined: APP_STATE.totalMined,
        activeTrades: APP_STATE.activeTrades,
        networkSessions: APP_STATE.networkSessions
    };
    
    localStorage.setItem('globalPilgrimBankData', JSON.stringify(dataToSave));
}

function loadSavedData() {
    const savedData = localStorage.getItem('globalPilgrimBankData');
    
    if (savedData) {
        const data = JSON.parse(savedData);
        APP_STATE.customers = data.customers || [];
        APP_STATE.transactions = data.transactions || [];
        APP_STATE.pendingApprovals = data.pendingApprovals || [];
        APP_STATE.wallets = data.wallets || [];
        APP_STATE.balances = data.balances || APP_STATE.balances;
        APP_STATE.minedToday = data.minedToday || 0;
        APP_STATE.totalMined = data.totalMined || 0;
        APP_STATE.activeTrades = data.activeTrades || [];
        APP_STATE.networkSessions = data.networkSessions || [];
    }
}

// Utility Functions
function formatCurrency(amount, currency = 'USD') {
    const symbols = {
        'USD': '$',
        'NGN': '₦',
        'EUR': '€',
        'GBP': '£',
        'CHF': 'Fr'
    };
    
    const symbol = symbols[currency] || '$';
    return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Edit Account
function editAccount() {
    const accountNumber = prompt("Enter account number to edit:");
    
    if (!accountNumber) {
        alert("Please enter an account number.");
        return;
    }
    
    editCustomer(accountNumber);
}

// Suspend Account
function suspendAccount() {
    const accountNumber = prompt("Enter account number to suspend:");
    
    if (!accountNumber) {
        alert("Please enter an account number.");
        return;
    }
    
    const customer = APP_STATE.customers.find(c => c.accountNumber === accountNumber);
    
    if (!customer) {
        alert("Customer not found.");
        return;
    }
    
    if (confirm(`Are you sure you want to suspend account ${accountNumber}?`)) {
        customer.status = 'suspended';
        updateCustomerTable();
        logTerminal(`[ACCOUNT] Account suspended: ${accountNumber}`);
        saveData();
        alert("Account suspended successfully!");
    }
}

// Initialize with some demo data
function initializeDemoData() {
    if (APP_STATE.customers.length === 0) {
        // Create demo customer
        const demoCustomer = {
            id: 1,
            accountNumber: "1234567890",
            serialNumber: "AG9512345678",
            name: "Demo Customer",
            phone: "+2348012345678",
            email: "demo@example.com",
            bvn: "12345678901",
            nin: "12345678901",
            balance: 5000,
            status: 'active',
            createdAt: new Date().toISOString(),
            transactions: []
        };
        
        APP_STATE.customers.push(demoCustomer);
        APP_STATE.balances.total = 5000;
        APP_STATE.balances.usd = 5000;
        
        saveData();
    }
}

// Call initialization
initializeDemoData();