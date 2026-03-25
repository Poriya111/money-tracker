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

// Settings Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsForm = document.getElementById('settings-form');
const currencySelect = document.getElementById('currency-select');
const themeSelect = document.getElementById('theme-select');
const clearDataBtn = document.getElementById('clear-data');

// Add transaction
function addTransaction(e) {
  e.preventDefault();

  if (text.value.trim() === '' || amount.value.trim() === '') {
    alert('Please add a description and amount');
    return;
  }

  const transaction = {
    id: generateID(),
    text: text.value,
    amount: parseFloat(amount.value),
    spaceId: activeSpaceId,
    date: new Date().getTime()
  };

  transactions.push(transaction);
  addTransactionDOM(transaction);
  updateValues();
  updateLocalStorage();

  text.value = '';
  amount.value = '';
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
        <span class="transaction-text">${transaction.text}</span>
        <span class="transaction-date">${dateString}</span>
    </div>
    <div class="transaction-amount">
        <span>${formatter.format(transaction.amount)}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">Remove</button>
    </div>
  `;

  list.appendChild(item);
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

function saveSpaces() {
    localStorage.setItem('spaces', JSON.stringify(spaces));
    localStorage.setItem('activeSpaceId', activeSpaceId);
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

// Settings Management
function applySettings() {
    document.body.setAttribute('data-theme', settings.theme);
    formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: settings.currency,
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
  init();
}

function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function init() {
  list.innerHTML = '';
  const searchTerm = searchInput.value.toLowerCase();
  
  const activeTransactions = transactions.filter(t => 
    t.spaceId === activeSpaceId && 
    t.text.toLowerCase().includes(searchTerm)
  );

  activeTransactions.forEach(addTransactionDOM);
  
  const currentSpace = spaces.find(s => s.id === activeSpaceId);
  if (currentSpace) {
      currentSpaceDisplay.textContent = currentSpace.name;
  }

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
    }
});

settingsBtn.addEventListener('click', () => settingsOverlay.classList.add('active'));
settingsOverlay.addEventListener('click', (e) => e.target === settingsOverlay && settingsOverlay.classList.remove('active'));
modalOverlay.addEventListener('click', (e) => e.target === modalOverlay && closeModal());
settingsForm.addEventListener('submit', saveSettings);
clearDataBtn.addEventListener('click', clearAllData);
editSpaceBtn.addEventListener('click', openEditModal);
deleteSpaceBtn.addEventListener('click', deleteActiveSpace);