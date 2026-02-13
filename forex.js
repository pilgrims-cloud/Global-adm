// Global Pilgrim Bank - Forex Trading Platform JavaScript
// Connected to Admin Dashboard
// MetaTrader Integration Simulation

// Global State
const FOREX_STATE = {
    tradingMode: 'auto', // auto or manual
    balance: 0,
    equity: 0,
    margin: 0,
    freeMargin: 0,
    todayProfit: 0,
    activeTrades: [],
    tradeHistory: [],
    signals: [],
    pilgrimCoinPrice: 0.50,
    pilgrimCoinVolume: 1234567,
    cscsBalance: 0,
    currentTradeType: null,
    marketPrices: {
        'EUR/USD': 1.08765,
        'GBP/USD': 1.26543,
        'USD/JPY': 149.876,
        'USD/CHF': 0.87654,
        'AUD/USD': 0.65432,
        'USD/CAD': 1.34567
    }
};

// DOM Elements
let autoTradeInterval;
let priceUpdateInterval;

// Initialize Forex Platform
document.addEventListener('DOMContentLoaded', () => {
    loadForexData();
    updateForexDisplay();
    startPriceUpdates();
    generateMarketSignals();
    
    if (FOREX_STATE.tradingMode === 'auto') {
        startAutoTrading();
    }
});

// Load Forex Data from Admin
function loadForexData() {
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    
    // Get profit balance from admin
    FOREX_STATE.balance = adminData.balances?.profit || 0;
    FOREX_STATE.equity = FOREX_STATE.balance;
    FOREX_STATE.todayProfit = 0;
    
    // Load existing trades
    FOREX_STATE.activeTrades = adminData.activeTrades || [];
    
    // Calculate margin and free margin
    FOREX_STATE.margin = calculateMargin();
    FOREX_STATE.freeMargin = FOREX_STATE.equity - FOREX_STATE.margin;
    
    // CSCS balance from profit
    FOREX_STATE.cscsBalance = FOREX_STATE.balance;
}

// Update Forex Display
function updateForexDisplay() {
    // Update balance panel
    document.getElementById('forex-balance').textContent = formatCurrency(FOREX_STATE.balance);
    document.getElementById('forex-equity').textContent = formatCurrency(FOREX_STATE.equity);
    document.getElementById('forex-margin').textContent = formatCurrency(FOREX_STATE.margin);
    document.getElementById('forex-free-margin').textContent = formatCurrency(FOREX_STATE.freeMargin);
    
    // Update profit panel
    document.getElementById('today-profit').textContent = formatCurrency(FOREX_STATE.todayProfit);
    
    // Update CSCS balance
    document.getElementById('cscs-balance').textContent = formatCurrency(FOREX_STATE.cscsBalance);
    
    // Update prices
    updateMarketPrices();
    
    // Update active trades
    updateActiveTradesTable();
    
    // Update trade history
    updateTradeHistoryTable();
    
    // Update signals
    updateSignalsDisplay();
}

// Update Market Prices
function updateMarketPrices() {
    const priceUpdates = {
        'EUR/USD': 'eur-usd-price',
        'GBP/USD': 'gbp-usd-price',
        'USD/JPY': 'usd-jpy-price'
    };
    
    for (const [pair, elementId] of Object.entries(priceUpdates)) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = FOREX_STATE.marketPrices[pair].toFixed(5);
        }
    }
}

// Start Price Updates
function startPriceUpdates() {
    priceUpdateInterval = setInterval(() => {
        // Simulate price movements
        for (const pair in FOREX_STATE.marketPrices) {
            const change = (Math.random() - 0.5) * 0.0010;
            FOREX_STATE.marketPrices[pair] += change;
        }
        
        // Update Pilgrim Coin price based on volume
        updatePilgrimCoinPrice();
        
        // Update active trades with new prices
        updateActiveTrades();
        
        // Update display
        updateForexDisplay();
    }, 3000); // Update every 3 seconds
}

// Update Pilgrim Coin Price
function updatePilgrimCoinPrice() {
    // Price fluctuates based on simulated market demand
    const priceChange = (Math.random() - 0.5) * 0.01;
    FOREX_STATE.pilgrimCoinPrice = Math.max(0.1, FOREX_STATE.pilgrimCoinPrice + priceChange);
    
    const priceElement = document.getElementById('pilgrim-coin-price');
    if (priceElement) {
        priceElement.textContent = `$${FOREX_STATE.pilgrimCoinPrice.toFixed(2)}`;
    }
}

// Calculate Margin
function calculateMargin() {
    return FOREX_STATE.activeTrades.reduce((total, trade) => {
        return total + (trade.amount * 0.01); // 1% margin
    }, 0);
}

// Update Active Trades
function updateActiveTrades() {
    FOREX_STATE.activeTrades.forEach(trade => {
        if (FOREX_STATE.marketPrices[trade.pair]) {
            trade.currentPrice = FOREX_STATE.marketPrices[trade.pair];
            
            // Calculate profit
            if (trade.type === 'buy') {
                trade.profit = (trade.currentPrice - trade.entryPrice) * trade.amount * 100000;
            } else {
                trade.profit = (trade.entryPrice - trade.currentPrice) * trade.amount * 100000;
            }
        } else if (trade.pair === 'Pilgrim Coin') {
            trade.currentPrice = FOREX_STATE.pilgrimCoinPrice;
            if (trade.type === 'buy') {
                trade.profit = (trade.currentPrice - trade.entryPrice) * trade.amount;
            } else {
                trade.profit = (trade.entryPrice - trade.currentPrice) * trade.amount;
            }
        }
    });
    
    // Update equity
    const floatingProfit = FOREX_STATE.activeTrades.reduce((total, trade) => total + trade.profit, 0);
    FOREX_STATE.equity = FOREX_STATE.balance + floatingProfit;
    FOREX_STATE.freeMargin = FOREX_STATE.equity - FOREX_STATE.margin;
    
    // Save to admin
    saveForexData();
}

// Update Active Trades Table
function updateActiveTradesTable() {
    const tbody = document.getElementById('active-trades-body');
    if (!tbody) return;
    
    if (FOREX_STATE.activeTrades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No active trades</td></tr>';
        return;
    }
    
    tbody.innerHTML = FOREX_STATE.activeTrades.map(trade => {
        const profitClass = trade.profit >= 0 ? 'profit-positive' : 'profit-negative';
        return `
            <tr>
                <td>${trade.pair}</td>
                <td><span class="signal-type ${trade.type}">${trade.type.toUpperCase()}</span></td>
                <td>${trade.amount.toFixed(2)}</td>
                <td>${trade.entryPrice.toFixed(5)}</td>
                <td>${trade.currentPrice.toFixed(5)}</td>
                <td class="${profitClass}">${formatCurrency(trade.profit)}</td>
                <td>
                    <button onclick="closeTrade('${trade.id}')" class="btn-secondary" style="padding: 5px 10px; font-size: 12px;">Close</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update Trade History Table
function updateTradeHistoryTable() {
    const tbody = document.getElementById('trade-history-body');
    if (!tbody) return;
    
    if (FOREX_STATE.tradeHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No trade history</td></tr>';
        return;
    }
    
    tbody.innerHTML = FOREX_STATE.tradeHistory.slice(-20).reverse().map(trade => {
        const profitClass = trade.profit >= 0 ? 'profit-positive' : 'profit-negative';
        return `
            <tr>
                <td>${formatDate(trade.date)}</td>
                <td>${trade.pair}</td>
                <td><span class="signal-type ${trade.type}">${trade.type.toUpperCase()}</span></td>
                <td>${trade.amount.toFixed(2)}</td>
                <td>${trade.entryPrice.toFixed(5)}</td>
                <td>${trade.exitPrice.toFixed(5)}</td>
                <td class="${profitClass}">${formatCurrency(trade.profit)}</td>
            </tr>
        `;
    }).join('');
}

// Generate Market Signals
function generateMarketSignals() {
    const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'Pilgrim Coin'];
    const types = ['buy', 'sell'];
    
    FOREX_STATE.signals = pairs.map(pair => {
        const type = types[Math.floor(Math.random() * types.length)];
        const confidence = Math.floor(Math.random() * 30) + 70;
        const target = FOREX_STATE.marketPrices[pair] || FOREX_STATE.pilgrimCoinPrice;
        
        return {
            id: Date.now() + Math.random(),
            pair,
            type,
            confidence,
            entry: target,
            target: type === 'buy' ? target * 1.01 : target * 0.99,
            stopLoss: type === 'buy' ? target * 0.995 : target * 1.005,
            timeframe: '1H'
        };
    });
}

// Update Signals Display
function updateSignalsDisplay() {
    const container = document.getElementById('signals-container');
    if (!container) return;
    
    container.innerHTML = FOREX_STATE.signals.map(signal => `
        <div class="signal-card">
            <div class="signal-header">
                <span class="signal-pair">${signal.pair}</span>
                <span class="signal-type ${signal.type}">${signal.type.toUpperCase()}</span>
            </div>
            <div class="signal-details">
                <p>Confidence: <strong>${signal.confidence}%</strong></p>
                <p>Entry: <strong>${signal.pair === 'Pilgrim Coin' ? '$' + signal.entry.toFixed(2) : signal.entry.toFixed(5)}</strong></p>
                <p>Target: <strong>${signal.pair === 'Pilgrim Coin' ? '$' + signal.target.toFixed(2) : signal.target.toFixed(5)}</strong></p>
                <p>Stop Loss: <strong>${signal.pair === 'Pilgrim Coin' ? '$' + signal.stopLoss.toFixed(2) : signal.stopLoss.toFixed(5)}</strong></p>
            </div>
        </div>
    `).join('');
}

// Show Forex Section
function showForexSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.forex-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from nav items
    document.querySelectorAll('.forex-nav a').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`forex-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav menu
    const navItem = document.querySelector(`.forex-nav a[onclick="showForexSection('${sectionId}')"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
}

// Set Trading Mode
function setTradingMode(mode) {
    FOREX_STATE.tradingMode = mode;
    
    // Update UI
    document.getElementById('auto-mode-btn').classList.toggle('active', mode === 'auto');
    document.getElementById('manual-mode-btn').classList.toggle('active', mode === 'manual');
    
    if (mode === 'auto') {
        startAutoTrading();
    } else {
        stopAutoTrading();
    }
}

// Start Auto Trading
function startAutoTrading() {
    if (autoTradeInterval) clearInterval(autoTradeInterval);
    
    // Auto-trade every 6 seconds as requested
    autoTradeInterval = setInterval(() => {
        executeAutoTrade();
    }, 6000);
}

// Stop Auto Trading
function stopAutoTrading() {
    if (autoTradeInterval) {
        clearInterval(autoTradeInterval);
        autoTradeInterval = null;
    }
}

// Execute Auto Trade
function executeAutoTrade() {
    const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'Pilgrim Coin'];
    const types = ['buy', 'sell'];
    
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const amount = Math.random() * 0.5 + 0.01;
    
    const entryPrice = pair === 'Pilgrim Coin' ? FOREX_STATE.pilgrimCoinPrice : FOREX_STATE.marketPrices[pair];
    
    const trade = {
        id: Date.now() + Math.random(),
        pair,
        type,
        amount,
        entryPrice,
        currentPrice: entryPrice,
        profit: 0,
        date: new Date().toISOString(),
        isAuto: true
    };
    
    // Keep only last 10 active trades
    if (FOREX_STATE.activeTrades.length >= 10) {
        closeTrade(FOREX_STATE.activeTrades[0].id);
    }
    
    FOREX_STATE.activeTrades.push(trade);
    
    // Auto-close some trades for profit
    if (FOREX_STATE.activeTrades.length > 5) {
        setTimeout(() => {
            const randomTrade = FOREX_STATE.activeTrades[Math.floor(Math.random() * FOREX_STATE.activeTrades.length)];
            if (randomTrade && randomTrade.isAuto) {
                closeTrade(randomTrade.id);
            }
        }, 30000 + Math.random() * 60000);
    }
    
    updateForexDisplay();
    saveForexData();
}

// Set Trade Type (Manual)
function setTradeType(type) {
    FOREX_STATE.currentTradeType = type;
    
    document.querySelectorAll('.btn-buy, .btn-sell').forEach(btn => {
        btn.style.opacity = '0.6';
    });
    
    if (type === 'buy') {
        document.querySelector('.btn-buy').style.opacity = '1';
    } else {
        document.querySelector('.btn-sell').style.opacity = '1';
    }
}

// Execute Manual Trade
function executeTrade() {
    if (!FOREX_STATE.currentTradeType) {
        alert('Please select buy or sell');
        return;
    }
    
    const pair = document.getElementById('trade-pair').value;
    const lots = parseFloat(document.getElementById('trade-lots').value);
    const stopLoss = document.getElementById('stop-loss').value;
    const takeProfit = document.getElementById('take-profit').value;
    
    if (lots <= 0) {
        alert('Please enter a valid volume');
        return;
    }
    
    const entryPrice = pair === 'Pilgrim Coin' ? FOREX_STATE.pilgrimCoinPrice : FOREX_STATE.marketPrices[pair];
    
    const trade = {
        id: Date.now(),
        pair,
        type: FOREX_STATE.currentTradeType,
        amount: lots,
        entryPrice,
        currentPrice: entryPrice,
        profit: 0,
        date: new Date().toISOString(),
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        isAuto: false
    };
    
    FOREX_STATE.activeTrades.push(trade);
    
    FOREX_STATE.margin = calculateMargin();
    FOREX_STATE.freeMargin = FOREX_STATE.equity - FOREX_STATE.margin;
    
    updateForexDisplay();
    saveForexData();
    
    alert(`Trade executed successfully!\n\n${type.toUpperCase()} ${pair}\nVolume: ${lots} lots\nEntry: ${entryPrice.toFixed(5)}`);
}

// Close Trade
function closeTrade(tradeId) {
    const tradeIndex = FOREX_STATE.activeTrades.findIndex(t => t.id === tradeId);
    
    if (tradeIndex === -1) return;
    
    const trade = FOREX_STATE.activeTrades[tradeIndex];
    
    // Add to history
    trade.exitPrice = trade.currentPrice;
    trade.closeDate = new Date().toISOString();
    FOREX_STATE.tradeHistory.push(trade);
    
    // Remove from active trades
    FOREX_STATE.activeTrades.splice(tradeIndex, 1);
    
    // Update balance with profit
    if (trade.profit > 0) {
        FOREX_STATE.balance += trade.profit;
        FOREX_STATE.todayProfit += trade.profit;
        
        // Credit profit to Pilgrim Bank profit balance
        creditProfitToBank(trade.profit);
    }
    
    FOREX_STATE.margin = calculateMargin();
    FOREX_STATE.freeMargin = FOREX_STATE.equity - FOREX_STATE.margin;
    
    updateForexDisplay();
    saveForexData();
}

// Credit Profit to Bank
function creditProfitToBank(profit) {
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    
    adminData.balances = adminData.balances || {};
    adminData.balances.profit = (adminData.balances.profit || 0) + profit;
    adminData.balances.total = (adminData.balances.total || 0) + profit;
    
    // Create transaction record
    const transaction = {
        id: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'trading',
        amount: profit,
        from: 'Forex Trading Profit',
        to: 'Profit Balance',
        date: new Date().toISOString(),
        status: 'completed'
    };
    
    adminData.transactions = adminData.transactions || [];
    adminData.transactions.push(transaction);
    
    localStorage.setItem('globalPilgrimBankData', JSON.stringify(adminData));
}

// Sync CSCS Account
function syncCSCS() {
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    
    // Sync profit from forex to CSCS
    FOREX_STATE.cscsBalance = FOREX_STATE.todayProfit;
    
    alert(`CSCS Account synced successfully!\n\nCurrent Balance: ${formatCurrency(FOREX_STATE.cscsBalance)}\nToday's Profit: ${formatCurrency(FOREX_STATE.todayProfit)}`);
    
    updateForexDisplay();
}

// View CSCS Report
function viewCSCSReport() {
    const report = `
        CSCS Account Report
        ===================
        
        Account Number: CSCS/GPB/2024/001
        Account Name: Global Pilgrim Bank Limited
        Clearing House: Central Securities Clearing System
        
        Current Balance: ${formatCurrency(FOREX_STATE.cscsBalance)}
        Today's Profit: ${formatCurrency(FOREX_STATE.todayProfit)}
        Active Trades: ${FOREX_STATE.activeTrades.length}
        Total Trades Today: ${FOREX_STATE.tradeHistory.filter(t => {
            const today = new Date().toDateString();
            return new Date(t.date).toDateString() === today;
        }).length}
        
        Trading Mode: ${FOREX_STATE.tradingMode.toUpperCase()}
        Status: Active
    `;
    
    alert(report);
}

// Buy Pilgrim Coin
function buyPilgrimCoin() {
    const amount = parseFloat(prompt('Enter amount of PLC to buy:'));
    
    if (isNaN(amount) || amount <= 0) {
        alert('Invalid amount');
        return;
    }
    
    const totalCost = amount * FOREX_STATE.pilgrimCoinPrice;
    
    if (totalCost > FOREX_STATE.balance) {
        alert('Insufficient balance');
        return;
    }
    
    // Execute buy
    FOREX_STATE.balance -= totalCost;
    
    // Increase price based on demand
    FOREX_STATE.pilgrimCoinPrice *= 1.0001;
    FOREX_STATE.pilgrimCoinVolume += amount;
    
    // Update admin data
    creditPilgrimCoinToBank(amount);
    
    alert(`Bought ${amount} PLC for ${formatCurrency(totalCost)}\nNew price: $${FOREX_STATE.pilgrimCoinPrice.toFixed(4)}`);
    
    updateForexDisplay();
    saveForexData();
}

// Sell Pilgrim Coin
function sellPilgrimCoin() {
    const amount = parseFloat(prompt('Enter amount of PLC to sell:'));
    
    if (isNaN(amount) || amount <= 0) {
        alert('Invalid amount');
        return;
    }
    
    const totalValue = amount * FOREX_STATE.pilgrimCoinPrice;
    
    // Execute sell
    FOREX_STATE.balance += totalValue;
    
    // Decrease price based on selling
    FOREX_STATE.pilgrimCoinPrice *= 0.9999;
    FOREX_STATE.pilgrimCoinVolume -= amount;
    
    alert(`Sold ${amount} PLC for ${formatCurrency(totalValue)}\nNew price: $${FOREX_STATE.pilgrimCoinPrice.toFixed(4)}`);
    
    updateForexDisplay();
    saveForexData();
}

// Credit Pilgrim Coin to Bank
function creditPilgrimCoinToBank(amount) {
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    
    adminData.balances = adminData.balances || {};
    adminData.balances.pilgrimCoins = (adminData.balances.pilgrimCoins || 0) + amount;
    
    localStorage.setItem('globalPilgrimBankData', JSON.stringify(adminData));
}

// Save Forex Data
function saveForexData() {
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    
    adminData.activeTrades = FOREX_STATE.activeTrades;
    adminData.forexTradeHistory = FOREX_STATE.tradeHistory;
    adminData.balances = adminData.balances || {};
    adminData.balances.profit = FOREX_STATE.balance;
    
    localStorage.setItem('globalPilgrimBankData', JSON.stringify(adminData));
}

// Utility Functions
function formatCurrency(amount) {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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

// Periodic signals update
setInterval(() => {
    generateMarketSignals();
    updateSignalsDisplay();
}, 60000); // Update signals every minute