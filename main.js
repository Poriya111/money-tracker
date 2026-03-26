const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');

// Initialize state
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let spaces = JSON.parse(localStorage.getItem('spaces')) || [{ id: 1, name: 'Main' }];
let activeSpaceId = parseInt(localStorage.getItem('activeSpaceId')) || spaces[0].id;
let settings = JSON.parse(localStorage.getItem('settings')) || { currency: 'USD', theme: 'dark' };

// Track previous values for animations
let prevTotal = 0;
let prevIncome = 0;
let prevExpense = 0;

let formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: settings.currency,
});

const spacesList = document.getElementById('spaces-list');
const currentSpaceDisplay = document.getElementById('current-space-name');
const searchInput = document.getElementById('search');

// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const spaceForm = document.getElementById('space-form');
const spaceNameInput = document.getElementById('space-name');
const spaceDescInput = document.getElementById('space-desc');
const closeModalBtn = document.getElementById('close-modal');
const addSpaceBtn = document.getElementById('add-space-btn');

// Space Settings Elements
const editSpaceBtn = document.getElementById('edit-space-btn');
const deleteSpaceBtn = document.getElementById('delete-space-btn');
let isEditingSpace = false;

// Amount Toggle Logic
const amountSelector = document.getElementById('amount-selector');
const btnExpense = document.getElementById('btn-expense');
const btnIncome = document.getElementById('btn-income');
const amountCurrencySymbol = document.getElementById('amount-currency-symbol');
let amountType = 'expense';

// Settings Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsForm = document.getElementById('settings-form');
const currencySelect = document.getElementById('currency-select');
const themeSelect = document.getElementById('theme-select');
const clearDataBtn = document.getElementById('clear-data');

// Select Space Elements
const selectSpaceTrigger = document.getElementById('select-space-trigger');
const selectSpaceOverlay = document.getElementById('select-space-overlay');
const modalSpacesList = document.getElementById('modal-spaces-list');
const closeSelectSpaceModalBtn = document.getElementById('close-select-space-modal');

const addTransactionOverlay = document.getElementById('add-transaction-overlay');
const openAddTransactionBtn = document.getElementById('open-add-transaction');
const closeAddModalBtn = document.getElementById('close-add-modal');
const category = document.getElementById('category');

// Edit Transaction Elements
const editOverlay = document.getElementById('edit-transaction-overlay');
const editForm = document.getElementById('edit-form');
const editText = document.getElementById('edit-text');
const editAmount = document.getElementById('edit-amount');
const editCategory = document.getElementById('edit-category');
const editAmountSelector = document.getElementById('edit-amount-selector');
const editBtnExpense = document.getElementById('edit-btn-expense');
const editBtnIncome = document.getElementById('edit-btn-income');
const closeEditModalBtn = document.getElementById('close-edit-modal');
const editDeleteBtn = document.getElementById('edit-delete-btn');

// Transfer Wizard Elements
const transferTrigger = document.getElementById('transfer-trigger');
const transferOverlay = document.getElementById('transfer-overlay');
const transferSpaceList = document.getElementById('transfer-space-list');
const transferAmountOut = document.getElementById('transfer-amount-out');
const transferAmountIn = document.getElementById('transfer-amount-in');
const transferOutLabel = document.getElementById('transfer-out-label');
const transferInLabel = document.getElementById('transfer-in-label');
const transferText = document.getElementById('transfer-text');
const transferCategory = document.getElementById('transfer-category');
const transferNextBtn = document.getElementById('transfer-next-btn');
const transferBackBtn = document.getElementById('transfer-back-btn');
const closeTransferModalBtn = document.getElementById('close-transfer-modal');

let transferStep = 1;
let transferData = { targetId: null };

let editingTransactionId = null;
let editAmountType = 'expense';

// Add transaction
function addTransaction(e) {
  e.preventDefault();

  if (text.value.trim() === '' || amount.value.trim() === '') {
    alert('Please add a description and amount');
    return;
  }

  const val = parseFloat(amount.value);
  const finalAmount = amountType === 'expense' ? -Math.abs(val) : Math.abs(val);

  const transaction = {
    id: generateID(),
    text: text.value,
    amount: finalAmount,
    category: category.value,
    spaceId: activeSpaceId,
    date: new Date().getTime()
  };

  transactions.push(transaction);
  addTransactionDOM(transaction);
  updateValues();
  updateLocalStorage();

  form.reset();
  addTransactionOverlay.classList.remove('active');
  setAmountType('expense');
}

// Generate random ID
function generateID() {
  return Math.floor(Math.random() * 100000000);
}

// Rolling Counter Animation
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
    const current = easeProgress * (end - start) + start;

    if (obj === money_plus) {
        obj.innerText = `+${formatter.format(current)}`;
    } else if (obj === money_minus) {
        obj.innerText = `-${formatter.format(current)}`;
    } else {
        obj.innerText = formatter.format(current);
    }

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
  const item = document.createElement('li');

  const date = new Date(transaction.date || Date.now());
  const dateString = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

  item.innerHTML = `
    <div class="transaction-info">
        <div style="display:flex; align-items:center; gap:8px;">
            <span class="transaction-text">${transaction.text}</span>
            <span class="category-tag">${transaction.category || 'General'}</span>
        </div>
        <span class="transaction-date">${dateString}</span>
    </div>
    <div class="transaction-amount">
        <span>${formatter.format(transaction.amount)}</span>
    </div>
  `;

  item.onclick = () => openEditTransactionModal(transaction.id);
  list.appendChild(item);
}

function openEditTransactionModal(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    editingTransactionId = id;
    editText.value = transaction.text;
    editAmount.value = Math.abs(transaction.amount);
    editCategory.value = transaction.category || 'General';
    
    setEditAmountType(transaction.amount < 0 ? 'expense' : 'income');
    
    editOverlay.classList.add('active');
}

function setEditAmountType(type) {
    editAmountType = type;
    if (type === 'expense') {
        editAmountSelector.classList.add('expense-active');
        editAmountSelector.classList.remove('income-active');
    } else {
        editAmountSelector.classList.add('income-active');
        editAmountSelector.classList.remove('expense-active');
    }
}

function handleEditSubmit(e) {
    e.preventDefault();
    
    const index = transactions.findIndex(t => t.id === editingTransactionId);
    if (index === -1) return;

    const val = parseFloat(editAmount.value);
    const finalAmount = editAmountType === 'expense' ? -Math.abs(val) : Math.abs(val);

    transactions[index].text = editText.value;
    transactions[index].amount = finalAmount;
    transactions[index].category = editCategory.value;

    updateLocalStorage();
    closeEditModal();
    init();
}

function closeEditModal() {
    editOverlay.classList.remove('active');
    editingTransactionId = null;
}

// Update the balance, income and expense summaries
function updateValues() {
  const activeTransactions = transactions.filter(t => t.spaceId === activeSpaceId);
  const amounts = activeTransactions.map(t => t.amount);

  const total = amounts.reduce((acc, item) => (acc += item), 0);
  
  const income = amounts
    .filter(item => item > 0)
    .reduce((acc, item) => (acc += item), 0);
  const expense = (
    amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1
  );

  animateValue(balance, prevTotal, total, 1000);
  animateValue(money_plus, prevIncome, income, 1000);
  animateValue(money_minus, prevExpense, expense, 1000);

  prevTotal = total;
  prevIncome = income;
  prevExpense = expense;

  // Apply negative style if balance is below zero
  if (total < 0) {
    balance.classList.add('negative');
  } else {
    balance.classList.remove('negative');
  }
}

// Space Management Logic
function openModal() {
    isEditingSpace = false;
    document.querySelector('#modal-overlay h3').textContent = 'New Tracking Space';
    document.querySelector('#space-form .btn:not(.btn-ghost)').textContent = 'Create Space';
    modalOverlay.classList.add('active');
    spaceNameInput.focus();
}

function openEditModal() {
    isEditingSpace = true;
    const currentSpace = spaces.find(s => s.id === activeSpaceId);
    document.querySelector('#modal-overlay h3').textContent = 'Edit Tracking Space';
    document.querySelector('#space-form .btn:not(.btn-ghost)').textContent = 'Save Changes';
    spaceNameInput.value = currentSpace.name;
    spaceDescInput.value = currentSpace.description || '';
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
    spaceForm.reset();
}

function handleSpaceSubmit(e) {
    e.preventDefault();
    
    const name = spaceNameInput.value.trim();
    if (name) {
        if (isEditingSpace) {
            const spaceIndex = spaces.findIndex(s => s.id === activeSpaceId);
            spaces[spaceIndex].name = name;
            spaces[spaceIndex].description = spaceDescInput.value.trim();
        } else {
            const newSpace = {
                id: generateID(),
                name: name,
                description: spaceDescInput.value.trim()
            };
            spaces.push(newSpace);
            activeSpaceId = newSpace.id;
        }
        
        saveSpaces();
        closeModal();
        init();
    }
}

function renderSpaces() {
    spacesList.innerHTML = '';
    
    if (spaces.length > 2) {
        selectSpaceTrigger.style.display = 'flex';
        spacesList.style.display = 'none';
    } else {
        selectSpaceTrigger.style.display = 'none';
        spacesList.style.display = 'flex';

        spaces.forEach(space => {
            const btn = document.createElement('button');
            btn.classList.add('space-tab');
            if (space.id === activeSpaceId) btn.classList.add('active');
            
            btn.textContent = space.name;
            
            btn.onclick = () => {
                activeSpaceId = space.id;
                localStorage.setItem('activeSpaceId', activeSpaceId);
                init();
            };
            spacesList.appendChild(btn);
        });
    }
}

function saveSpaces() {
    localStorage.setItem('spaces', JSON.stringify(spaces));
    localStorage.setItem('activeSpaceId', activeSpaceId);
}

function getSpaceBalance(spaceId) {
    return transactions
        .filter(t => t.spaceId === spaceId)
        .reduce((acc, t) => acc + t.amount, 0);
}

function openSelectSpaceModal() {
    modalSpacesList.innerHTML = '';
    
    const totalNetWorth = spaces.reduce((acc, s) => acc + getSpaceBalance(s.id), 0);
    const portfolioHeader = document.createElement('div');
    portfolioHeader.style.marginBottom = '24px';
    portfolioHeader.innerHTML = `
        <div class="metric-label">Total Portfolio Value</div>
        <div class="metric-value" style="color: var(--accent); font-size: 1.8rem;">${formatter.format(totalNetWorth)}</div>
    `;
    modalSpacesList.appendChild(portfolioHeader);

    spaces.forEach(space => {
        const div = document.createElement('div');
        div.classList.add('space-selection-item');
        if (space.id === activeSpaceId) div.classList.add('active');
        
        const spaceBalance = getSpaceBalance(space.id);
        
        div.innerHTML = `
            <div>
                <div style="font-weight:700; font-size:0.9rem;">${space.name}</div>
                <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${space.description || 'Primary Workspace'}</div>
            </div>
            <div class="space-balance" style="color: ${spaceBalance < 0 ? 'var(--expense)' : 'var(--text-main)'}">
                ${formatter.format(spaceBalance)}
            </div>
        `;
        
        div.onclick = () => {
            activeSpaceId = space.id;
            localStorage.setItem('activeSpaceId', activeSpaceId);
            closeSelectSpaceModal();
            init();
        };
        modalSpacesList.appendChild(div);
    });
    selectSpaceOverlay.classList.add('active');
}

function openTransferModal() {
    transferStep = 1;
    transferData = { targetId: null };
    transferAmountOut.value = '';
    transferAmountIn.value = '';
    transferText.value = '';
    updateTransferWizardUI();
    renderTransferSpaceSelection();
    transferOverlay.classList.add('active');
}

function renderTransferSpaceSelection() {
    transferSpaceList.innerHTML = '';
    spaces.filter(s => s.id !== activeSpaceId).forEach(space => {
        const div = document.createElement('div');
        div.classList.add('space-selection-item');
        div.innerHTML = `
            <div style="font-weight:700;">${space.name}</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">${space.description || ''}</div>
        `;
        div.onclick = () => {
            transferData.targetId = space.id;
            transferOutLabel.textContent = `Send to ${space.name}`;
            transferInLabel.textContent = `Receive from ${space.name} (optional)`;
            goToTransferStep(2);
        };
        transferSpaceList.appendChild(div);
    });
}

function goToTransferStep(step) {
    transferStep = step;
    updateTransferWizardUI();
}

function updateTransferWizardUI() {
    document.querySelectorAll('.transfer-step').forEach((el, idx) => {
        el.classList.toggle('active', idx + 1 === transferStep);
    });
    document.getElementById('step-indicator').textContent = `STEP ${transferStep}/3`;
    transferBackBtn.style.display = transferStep > 1 ? 'block' : 'none';
    transferNextBtn.textContent = transferStep === 3 ? 'Complete Transfer' : 'Next Step';
}

function handleTransferNext() {
    if (transferStep === 1 && !transferData.targetId) {
        alert('Please select a target space');
        return;
    }
    if (transferStep === 2) {
        const outVal = parseFloat(transferAmountOut.value) || 0;
        const inVal = parseFloat(transferAmountIn.value) || 0;
        if (outVal <= 0 && inVal <= 0) {
            alert('Please enter at least one amount to transfer');
            return;
        }
        goToTransferStep(3);
        transferText.focus();
        return;
    }
    if (transferStep === 3) {
        executeTransfer();
    } else {
        goToTransferStep(transferStep + 1);
    }
}

function executeTransfer() {
    const amountOut = parseFloat(transferAmountOut.value) || 0;
    const amountIn = parseFloat(transferAmountIn.value) || 0;
    const label = transferText.value || 'Internal Transfer';
    const cat = transferCategory.value;
    const targetSpace = spaces.find(s => s.id === transferData.targetId);
    const currentSpace = spaces.find(s => s.id === activeSpaceId);

    if (amountOut > 0) {
        transactions.push({
            id: generateID(),
            text: `${label} (to ${targetSpace.name})`,
            amount: -amountOut,
            category: cat,
            spaceId: activeSpaceId,
            date: new Date().getTime()
        }, {
            id: generateID(),
            text: `${label} (from ${currentSpace.name})`,
            amount: amountOut,
            category: cat,
            spaceId: transferData.targetId,
            date: new Date().getTime()
        });
    }

    if (amountIn > 0) {
        transactions.push({
            id: generateID(),
            text: `${label} (from ${targetSpace.name})`,
            amount: amountIn,
            category: cat,
            spaceId: activeSpaceId,
            date: new Date().getTime()
        }, {
            id: generateID(),
            text: `${label} (to ${currentSpace.name})`,
            amount: -amountIn,
            category: cat,
            spaceId: transferData.targetId,
            date: new Date().getTime()
        });
    }

    updateLocalStorage();
    transferOverlay.classList.remove('active');
    init();
}

function closeSelectSpaceModal() {
    selectSpaceOverlay.classList.remove('active');
}

function deleteActiveSpace() {
    if (spaces.length <= 1) {
        alert("You must have at least one tracking space.");
        return;
    }
    
    const currentSpace = spaces.find(s => s.id === activeSpaceId);
    if (confirm(`Are you sure you want to delete "${currentSpace.name}"? All transactions in this space will be deleted.`)) {
        transactions = transactions.filter(t => t.spaceId !== activeSpaceId);
        spaces = spaces.filter(s => s.id !== activeSpaceId);
        activeSpaceId = spaces[0].id;
        saveSpaces();
        updateLocalStorage();
        init();
    }
}

// Handle Amount Toggle
function setAmountType(type) {
    amountType = type;
    if (type === 'expense') {
        amountSelector.classList.add('expense-active');
        amountSelector.classList.remove('income-active');
        btnExpense.classList.add('active');
        btnIncome.classList.remove('active');
    } else {
        amountSelector.classList.add('income-active');
        amountSelector.classList.remove('expense-active');
        btnIncome.classList.add('active');
        btnExpense.classList.remove('active');
    }
}

// Settings Management
function applySettings() {
    document.body.setAttribute('data-theme', settings.theme);
    const tempFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: settings.currency,
    });
    
    formatter = tempFormatter;
    
    // Extract just the symbol for the massive input
    const parts = tempFormatter.formatToParts(0);
    const symbol = parts.find(p => p.type === 'currency').value;
    amountCurrencySymbol.textContent = symbol;
    
    document.querySelectorAll('.edit-currency-symbol').forEach(el => {
        el.textContent = symbol;
    });

    currencySelect.value = settings.currency;
    themeSelect.value = settings.theme;
    init();
}

function saveSettings(e) {
    e.preventDefault();
    settings.currency = currencySelect.value;
    settings.theme = themeSelect.value;
    localStorage.setItem('settings', JSON.stringify(settings));
    settingsOverlay.classList.remove('active');
    applySettings();
}

function clearAllData() {
    if (confirm('Are you absolutely sure? This will delete all spaces and transactions forever.')) {
        localStorage.clear();
        location.reload();
    }
}

// Remove transaction by ID
function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  updateLocalStorage();
  closeEditModal();
  init();
}

function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function init() {
  list.innerHTML = '';
  const searchTerm = searchInput.value.toLowerCase();

  // Reset prev values to 0 when switching spaces to force a full roll
  prevTotal = 0;
  prevIncome = 0;
  prevExpense = 0;

  const activeTransactions = transactions.filter(t => 
    t.spaceId === activeSpaceId && 
    t.text.toLowerCase().includes(searchTerm)
  );

  activeTransactions.forEach(addTransactionDOM);
  
  const currentSpace = spaces.find(s => s.id === activeSpaceId);
  if (currentSpace) {
      currentSpaceDisplay.textContent = currentSpace.name;
  }

  transferTrigger.style.display = spaces.length > 1 ? 'block' : 'none';

  updateValues();
  renderSpaces();
}

applySettings();
form.addEventListener('submit', addTransaction);
addSpaceBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
spaceForm.addEventListener('submit', handleSpaceSubmit);
searchInput.addEventListener('input', init);

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        settingsOverlay.classList.remove('active');
        closeEditModal();
        closeSelectSpaceModal();
        addTransactionOverlay.classList.remove('active');
        transferOverlay.classList.remove('active');
    }
});

settingsBtn.addEventListener('click', () => settingsOverlay.classList.add('active'));
settingsOverlay.addEventListener('click', (e) => e.target === settingsOverlay && settingsOverlay.classList.remove('active'));
editOverlay.addEventListener('click', (e) => e.target === editOverlay && closeEditModal());
modalOverlay.addEventListener('click', (e) => e.target === modalOverlay && closeModal());
selectSpaceOverlay.addEventListener('click', (e) => e.target === selectSpaceOverlay && closeSelectSpaceModal());
addTransactionOverlay.addEventListener('click', (e) => e.target === addTransactionOverlay && addTransactionOverlay.classList.remove('active'));
transferOverlay.addEventListener('click', (e) => e.target === transferOverlay && transferOverlay.classList.remove('active'));

openAddTransactionBtn.addEventListener('click', () => {
    addTransactionOverlay.classList.add('active');
    text.focus();
});

closeAddModalBtn.addEventListener('click', () => {
    addTransactionOverlay.classList.remove('active');
    form.reset();
    setAmountType('expense');
});

settingsForm.addEventListener('submit', saveSettings);
clearDataBtn.addEventListener('click', clearAllData);
editSpaceBtn.addEventListener('click', openEditModal);
deleteSpaceBtn.addEventListener('click', deleteActiveSpace);
btnExpense.addEventListener('click', () => setAmountType('expense'));
btnIncome.addEventListener('click', () => setAmountType('income'));
const viewAnalyticsBtn = document.getElementById('view-analytics');

transferTrigger.addEventListener('click', openTransferModal);
transferBackBtn.addEventListener('click', () => goToTransferStep(transferStep - 1));
transferNextBtn.addEventListener('click', handleTransferNext);
closeTransferModalBtn.addEventListener('click', () => transferOverlay.classList.remove('active'));

if(viewAnalyticsBtn) {
    viewAnalyticsBtn.addEventListener('click', () => window.location.href = 'analytics.html');
}
selectSpaceTrigger.addEventListener('click', openSelectSpaceModal);
closeSelectSpaceModalBtn.addEventListener('click', closeSelectSpaceModal);
editBtnExpense.addEventListener('click', () => setEditAmountType('expense'));
editBtnIncome.addEventListener('click', () => setEditAmountType('income'));
editForm.addEventListener('submit', handleEditSubmit);
closeEditModalBtn.addEventListener('click', closeEditModal);
editDeleteBtn.addEventListener('click', () => removeTransaction(editingTransactionId));