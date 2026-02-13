// Global Pilgrim Bank - Customer Portal JavaScript
// Connected to Admin Dashboard

// Global State
const CUSTOMER_STATE = {
    isLoggedIn: false,
    customerData: null,
    isActivated: false,
    lastSync: null,
    syncEarningsToday: 0,
    transactions: [],
    virtualCards: []
};

// DOM Elements
const customerLoginPage = document.getElementById('customer-login-page');
const customerDashboard = document.getElementById('customer-dashboard');
const customerLoginForm = document.getElementById('customer-login-form');

// Initialize Customer Portal
document.addEventListener('DOMContentLoaded', () => {
    setupCustomerEventListeners();
    checkExistingSession();
});

// Setup Event Listeners
function setupCustomerEventListeners() {
    // Login form
    if (customerLoginForm) {
        customerLoginForm.addEventListener('submit', handleCustomerLogin);
    }
    
    // Transfer forms
    const localTransferForm = document.getElementById('local-transfer-form');
    if (localTransferForm) {
        localTransferForm.addEventListener('submit', handleLocalTransfer);
    }
    
    const internationalTransferForm = document.getElementById('international-transfer-form');
    if (internationalTransferForm) {
        internationalTransferForm.addEventListener('submit', handleInternationalTransfer);
    }
}

// Check for Existing Session
function checkExistingSession() {
    const savedSession = localStorage.getItem('pilgrimCustomerSession');
    if (savedSession) {
        const session = JSON.parse(savedSession);
        CUSTOMER_STATE.isLoggedIn = true;
        CUSTOMER_STATE.customerData = session.customerData;
        CUSTOMER_STATE.isActivated = session.isActivated || false;
        CUSTOMER_STATE.lastSync = session.lastSync;
        CUSTOMER_STATE.syncEarningsToday = session.syncEarningsToday || 0;
        
        showCustomerDashboard();
    }
}

// Handle Customer Login
function handleCustomerLogin(e) {
    e.preventDefault();
    
    const accountNumber = document.getElementById('customer-account-number').value;
    const serialNumber = document.getElementById('customer-serial-number').value;
    
    // Get admin data from localStorage
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    
    // Find customer
    const customer = adminData.customers?.find(c => 
        c.accountNumber === accountNumber && 
        c.serialNumber === serialNumber
    );
    
    if (!customer) {
        showError('customer-login-error', 'Invalid account number or serial number');
        return;
    }
    
    if (customer.status === 'suspended') {
        showError('customer-login-error', 'Your account has been suspended. Please contact support.');
        return;
    }
    
    // Successful login
    CUSTOMER_STATE.isLoggedIn = true;
    CUSTOMER_STATE.customerData = customer;
    CUSTOMER_STATE.isActivated = customer.balance > 0; // Account activated if has balance
    
    customerLoginPage.classList.add('hidden');
    customerDashboard.classList.remove('hidden');
    
    // Update display
    updateCustomerDisplay();
    saveCustomerSession();
    
    console.log('Customer logged in:', customer.name);
}

// Show Error
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

// Show Customer Dashboard
function showCustomerDashboard() {
    customerLoginPage.classList.add('hidden');
    customerDashboard.classList.remove('hidden');
    updateCustomerDisplay();
}

// Update Customer Display
function updateCustomerDisplay() {
    const customer = CUSTOMER_STATE.customerData;
    
    // Update header
    document.getElementById('customer-name-display').textContent = `Welcome, ${customer.name}`;
    document.getElementById('display-account-number').textContent = customer.accountNumber;
    document.getElementById('display-serial-number').textContent = customer.serialNumber;
    
    // Update status
    const statusElement = document.getElementById('account-status');
    statusElement.textContent = customer.status === 'active' ? 'Active' : 'Suspended';
    statusElement.className = customer.status === 'active' ? 'status-active' : 'status-suspended';
    
    // Update activation badge
    const activationBadge = document.getElementById('activation-badge');
    if (CUSTOMER_STATE.isActivated) {
        activationBadge.textContent = 'Account Activated';
        activationBadge.className = 'badge-active';
        document.getElementById('request-card-btn').disabled = false;
        document.getElementById('local-transfer-btn').disabled = false;
        document.getElementById('international-transfer-btn').disabled = false;
    } else {
        activationBadge.textContent = 'Account Not Activated';
        activationBadge.className = 'badge-inactive';
        document.getElementById('request-card-btn').disabled = true;
        document.getElementById('local-transfer-btn').disabled = true;
        document.getElementById('international-transfer-btn').disabled = true;
    }
    
    // Update balance
    document.getElementById('customer-balance').textContent = formatCurrency(customer.balance);
    
    // Update sync info
    updateSyncDisplay();
    
    // Load transactions
    loadCustomerTransactions();
    
    // Update stats
    updateCustomerStats();
}

// Update Sync Display
function updateSyncDisplay() {
    if (CUSTOMER_STATE.lastSync) {
        document.getElementById('last-sync-time').textContent = formatDate(CUSTOMER_STATE.lastSync);
    }
    document.getElementById('sync-earnings').textContent = formatCurrency(CUSTOMER_STATE.syncEarningsToday);
    
    // Check if already synced today
    const today = new Date().toDateString();
    const lastSyncDate = CUSTOMER_STATE.lastSync ? new Date(CUSTOMER_STATE.lastSync).toDateString() : null;
    
    const syncBtn = document.getElementById('sync-btn');
    if (lastSyncDate === today) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i class="fas fa-check"></i> Already Synced Today';
    } else {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<i class="fas fa-sync"></i> Synchronize Now';
    }
}

// Load Customer Transactions
function loadCustomerTransactions() {
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    const allTransactions = adminData.transactions || [];
    
    // Filter transactions for this customer
    const customerTransactions = allTransactions.filter(t => 
        t.to === CUSTOMER_STATE.customerData.accountNumber ||
        t.from === CUSTOMER_STATE.customerData.accountNumber
    );
    
    CUSTOMER_STATE.transactions = customerTransactions;
    
    const transactionsList = document.getElementById('customer-transactions-list');
    
    if (customerTransactions.length === 0) {
        transactionsList.innerHTML = '<p class="no-data">No transactions yet</p>';
        return;
    }
    
    transactionsList.innerHTML = customerTransactions.slice(-20).reverse().map(tx => {
        const isDeposit = tx.to === CUSTOMER_STATE.customerData.accountNumber;
        const typeClass = isDeposit ? 'deposit' : 'withdrawal';
        const sign = isDeposit ? '+' : '-';
        
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <h4>${isDeposit ? 'Received' : 'Sent'}</h4>
                    <p>${formatDate(tx.date)}</p>
                    <p>${tx.from} → ${tx.to}</p>
                </div>
                <div class="transaction-amount ${typeClass}">
                    ${sign}${formatCurrency(tx.amount)}
                </div>
            </div>
        `;
    }).join('');
}

// Update Customer Stats
function updateCustomerStats() {
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    const allTransactions = adminData.transactions || [];
    
    const customerTransactions = allTransactions.filter(t => 
        t.to === CUSTOMER_STATE.customerData.accountNumber ||
        t.from === CUSTOMER_STATE.customerData.accountNumber
    );
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalTransfers = 0;
    
    customerTransactions.forEach(tx => {
        if (tx.to === CUSTOMER_STATE.customerData.accountNumber) {
            totalDeposits += tx.amount;
        } else {
            totalWithdrawals += tx.amount;
        }
        
        if (tx.type === 'transfer') {
            totalTransfers += tx.amount;
        }
    });
    
    document.getElementById('total-deposits').textContent = formatCurrency(totalDeposits);
    document.getElementById('total-withdrawals').textContent = formatCurrency(totalWithdrawals);
    document.getElementById('total-transfers').textContent = formatCurrency(totalTransfers);
}

// Show Customer Section
function showCustomerSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.customer-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from nav items
    document.querySelectorAll('.customer-nav-menu a').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`customer-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav menu
    const navItem = document.querySelector(`.customer-nav-menu a[onclick="showCustomerSection('${sectionId}')"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
}

// Show Transfer Tab
function showTransferTab(tab) {
    // Hide all transfer forms
    document.querySelectorAll('.transfer-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected form
    const targetForm = document.getElementById(`${tab}-transfer`);
    if (targetForm) {
        targetForm.classList.add('active');
    }
    
    // Update tab buttons
    const tabBtn = document.querySelector(`.tab-btn[onclick="showTransferTab('${tab}')"]`);
    if (tabBtn) {
        tabBtn.classList.add('active');
    }
}

// Handle Local Transfer
function handleLocalTransfer(e) {
    e.preventDefault();
    
    if (!CUSTOMER_STATE.isActivated) {
        alert('Your account is not activated. Please deposit funds to activate your account.');
        return;
    }
    
    const bank = document.getElementById('transfer-bank').value;
    const accountNumber = document.getElementById('transfer-account-number').value;
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const remark = document.getElementById('transfer-remark').value || 'Transfer';
    
    if (amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    
    if (amount > CUSTOMER_STATE.customerData.balance) {
        alert('Insufficient balance.');
        return;
    }
    
    // Check if transferring to same bank
    let recipientName = 'External Account';
    let transactionType = 'transfer';
    
    if (bank === 'pilgrim') {
        const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
        const recipient = adminData.customers?.find(c => c.accountNumber === accountNumber);
        
        if (recipient) {
            recipientName = recipient.name;
            
            // Update recipient balance
            recipient.balance += amount;
            
            // Update customer balance
            CUSTOMER_STATE.customerData.balance -= amount;
            
            // Save to admin data
            saveCustomerToAdmin();
        } else {
            alert('Recipient account not found.');
            return;
        }
    } else {
        // External transfer
        CUSTOMER_STATE.customerData.balance -= amount;
        saveCustomerToAdmin();
    }
    
    // Create transaction record
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    const transaction = {
        id: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'transfer',
        amount: amount,
        from: CUSTOMER_STATE.customerData.accountNumber,
        to: `${bank} - ${accountNumber} (${recipientName})`,
        date: new Date().toISOString(),
        status: 'completed'
    };
    
    adminData.transactions = adminData.transactions || [];
    adminData.transactions.push(transaction);
    localStorage.setItem('globalPilgrimBankData', JSON.stringify(adminData));
    
    // Clear form
    document.getElementById('local-transfer-form').reset();
    
    // Update display
    updateCustomerDisplay();
    loadCustomerTransactions();
    
    alert(`Transfer successful!\n\nAmount: ${formatCurrency(amount)}\nTo: ${recipientName}\nRemark: ${remark}`);
}

// Handle International Transfer
function handleInternationalTransfer(e) {
    e.preventDefault();
    
    if (!CUSTOMER_STATE.isActivated) {
        alert('Your account is not activated. Please deposit funds to activate your account.');
        return;
    }
    
    const country = document.getElementById('international-country').value;
    const swiftCode = document.getElementById('swift-code').value;
    const ibanNumber = document.getElementById('iban-number').value;
    const recipientName = document.getElementById('recipient-name').value;
    const amount = parseFloat(document.getElementById('international-amount').value);
    
    if (amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    
    if (amount > CUSTOMER_STATE.customerData.balance) {
        alert('Insufficient balance.');
        return;
    }
    
    // Deduct amount (plus 5% international transfer fee)
    const fee = amount * 0.05;
    const totalAmount = amount + fee;
    
    if (totalAmount > CUSTOMER_STATE.customerData.balance) {
        alert('Insufficient balance (including transfer fee of 5%).');
        return;
    }
    
    CUSTOMER_STATE.customerData.balance -= totalAmount;
    saveCustomerToAdmin();
    
    // Create transaction record
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    const transaction = {
        id: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'transfer',
        amount: amount,
        from: CUSTOMER_STATE.customerData.accountNumber,
        to: `${country} - ${recipientName} (${ibanNumber})`,
        date: new Date().toISOString(),
        status: 'completed',
        fee: fee
    };
    
    adminData.transactions = adminData.transactions || [];
    adminData.transactions.push(transaction);
    localStorage.setItem('globalPilgrimBankData', JSON.stringify(adminData));
    
    // Clear form
    document.getElementById('international-transfer-form').reset();
    
    // Update display
    updateCustomerDisplay();
    loadCustomerTransactions();
    
    alert(`International transfer successful!\n\nAmount: ${formatCurrency(amount)}\nFee: ${formatCurrency(fee)}\nTotal: ${formatCurrency(totalAmount)}\nTo: ${recipientName}, ${country}`);
}

// Request Virtual Card
function requestVirtualCard() {
    if (!CUSTOMER_STATE.isActivated) {
        alert('Your account must be activated to request a virtual card.');
        return;
    }
    
    const cardTypes = ['MasterCard', 'Visa', 'Verve'];
    const selectedType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    
    const virtualCard = {
        id: Date.now(),
        type: selectedType,
        number: generateCardNumber(),
        expiry: generateExpiryDate(),
        cvv: generateCVV(),
        createdAt: new Date().toISOString()
    };
    
    CUSTOMER_STATE.virtualCards.push(virtualCard);
    saveCustomerSession();
    
    // Add to admin data
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    adminData.virtualCards = adminData.virtualCards || [];
    adminData.virtualCards.push(virtualCard);
    localStorage.setItem('globalPilgrimBankData', JSON.stringify(adminData));
    
    updateVirtualCardsDisplay();
    alert(`Virtual ${selectedType} card created successfully!\n\nCard Number: ${virtualCard.number}\nExpiry: ${virtualCard.expiry}\nCVV: ${virtualCard.cvv}`);
}

// Generate Card Number
function generateCardNumber() {
    const prefix = ['4', '5', '6'];
    const selectedPrefix = prefix[Math.floor(Math.random() * prefix.length)];
    const numbers = Array(15).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
    return `${selectedPrefix}${numbers}`;
}

// Generate Expiry Date
function generateExpiryDate() {
    const currentYear = new Date().getFullYear();
    const expiryYear = currentYear + Math.floor(Math.random() * 3) + 1;
    const expiryMonth = Math.floor(Math.random() * 12) + 1;
    return `${expiryMonth.toString().padStart(2, '0')}/${expiryYear.toString().substr(2)}`;
}

// Generate CVV
function generateCVV() {
    return Math.floor(100 + Math.random() * 900).toString();
}

// Update Virtual Cards Display
function updateVirtualCardsDisplay() {
    const cardsList = document.getElementById('virtual-cards-list');
    
    if (CUSTOMER_STATE.virtualCards.length === 0) {
        cardsList.innerHTML = '<p class="no-data">No virtual cards yet. Activate your account to request a card.</p>';
        return;
    }
    
    cardsList.innerHTML = CUSTOMER_STATE.virtualCards.map(card => `
        <div class="virtual-card">
            <div class="virtual-card-header">
                <span class="card-brand">${card.type}</span>
                <span class="card-type">Virtual</span>
            </div>
            <div class="virtual-card-number">${formatCardNumber(card.number)}</div>
            <div class="virtual-card-details">
                <div class="card-detail">
                    <label>Expiry</label>
                    <span>${card.expiry}</span>
                </div>
                <div class="card-detail">
                    <label>CVV</label>
                    <span>${card.cvv}</span>
                </div>
                <div class="card-detail">
                    <label>Holder</label>
                    <span>${CUSTOMER_STATE.customerData.name.substring(0, 20).toUpperCase()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Format Card Number
function formatCardNumber(number) {
    return number.replace(/(.{4})/g, '$1 ').trim();
}

// Daily Sync
function dailySync() {
    const today = new Date().toDateString();
    const lastSyncDate = CUSTOMER_STATE.lastSync ? new Date(CUSTOMER_STATE.lastSync).toDateString() : null;
    
    if (lastSyncDate === today) {
        alert('You have already synced today. Come back tomorrow!');
        return;
    }
    
    // Credit $5 to customer account
    const syncAmount = 5;
    
    // Update customer balance
    CUSTOMER_STATE.customerData.balance += syncAmount;
    CUSTOMER_STATE.isActivated = true; // Activate account
    CUSTOMER_STATE.lastSync = new Date().toISOString();
    CUSTOMER_STATE.syncEarningsToday = syncAmount;
    
    // Save to admin
    saveCustomerToAdmin();
    
    // Create transaction
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    const transaction = {
        id: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'deposit',
        amount: syncAmount,
        from: 'Daily Sync Bonus',
        to: CUSTOMER_STATE.customerData.accountNumber,
        date: new Date().toISOString(),
        status: 'completed'
    };
    
    adminData.transactions = adminData.transactions || [];
    adminData.transactions.push(transaction);
    localStorage.setItem('globalPilgrimBankData', JSON.stringify(adminData));
    
    // Save session
    saveCustomerSession();
    
    // Update display
    updateCustomerDisplay();
    loadCustomerTransactions();
    
    alert(`Daily synchronization complete!\n\nYou've earned $5.00\nThis amount has been credited to your account.`);
}

// Save Customer to Admin Data
function saveCustomerToAdmin() {
    const adminData = JSON.parse(localStorage.getItem('globalPilgrimBankData') || '{}');
    
    // Find and update customer in admin data
    const customerIndex = adminData.customers?.findIndex(c => 
        c.accountNumber === CUSTOMER_STATE.customerData.accountNumber
    );
    
    if (customerIndex !== undefined && customerIndex >= 0) {
        adminData.customers[customerIndex] = CUSTOMER_STATE.customerData;
        
        // Update total balance
        adminData.balances = adminData.balances || {};
        let totalBalance = 0;
        adminData.customers.forEach(c => {
            totalBalance += c.balance;
        });
        adminData.balances.total = totalBalance;
        adminData.balances.usd = totalBalance;
    }
    
    localStorage.setItem('globalPilgrimBankData', JSON.stringify(adminData));
}

// Save Customer Session
function saveCustomerSession() {
    const session = {
        isLoggedIn: CUSTOMER_STATE.isLoggedIn,
        customerData: CUSTOMER_STATE.customerData,
        isActivated: CUSTOMER_STATE.isActivated,
        lastSync: CUSTOMER_STATE.lastSync,
        syncEarningsToday: CUSTOMER_STATE.syncEarningsToday,
        virtualCards: CUSTOMER_STATE.virtualCards
    };
    
    localStorage.setItem('pilgrimCustomerSession', JSON.stringify(session));
}

// Customer Logout
function customerLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('pilgrimCustomerSession');
        
        CUSTOMER_STATE.isLoggedIn = false;
        CUSTOMER_STATE.customerData = null;
        CUSTOMER_STATE.isActivated = false;
        
        customerDashboard.classList.add('hidden');
        customerLoginPage.classList.remove('hidden');
        
        // Reset forms
        if (customerLoginForm) {
            customerLoginForm.reset();
        }
    }
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

// Load virtual cards on page load
window.addEventListener('load', () => {
    if (CUSTOMER_STATE.isLoggedIn) {
        updateVirtualCardsDisplay();
    }
});