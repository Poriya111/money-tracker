const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
const activeSpaceId = parseInt(localStorage.getItem('activeSpaceId'));
const settings = JSON.parse(localStorage.getItem('settings')) || { currency: 'USD' };
const activeSpaceTransactions = transactions.filter(t => t.spaceId === activeSpaceId).sort((a,b) => a.date - b.date);

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: settings.currency,
});

function initAnalytics() {
    renderMetrics();
    renderEquityChart();
    renderMonthlyChart();
    renderTopTransactions();
}

function getComparisonMetrics() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthTransactions = activeSpaceTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastMonthTransactions = activeSpaceTransactions.filter(t => {
        const d = new Date(t.date);
        let lastM = currentMonth - 1;
        let lastY = currentYear;
        if (lastM < 0) { lastM = 11; lastY--; }
        return d.getMonth() === lastM && d.getFullYear() === lastY;
    });

    const calcTotal = (list) => list.reduce((acc, t) => acc + t.amount, 0);
    const calcIncome = (list) => list.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);

    return {
        thisMonthIncome: calcIncome(thisMonthTransactions),
        lastMonthIncome: calcIncome(lastMonthTransactions),
        totalCount: activeSpaceTransactions.length
    };
}

function renderMetrics() {
    const amounts = activeSpaceTransactions.map(t => t.amount);
    const totalVolume = amounts.filter(a => a > 0).reduce((acc, v) => acc + v, 0);
    const expenses = Math.abs(amounts.filter(a => a < 0).reduce((acc, v) => acc + v, 0));
    const comparison = getComparisonMetrics();
    
    document.getElementById('metric-gross').textContent = formatter.format(totalVolume);
    document.getElementById('metric-count').textContent = comparison.totalCount;
    
    const avg = amounts.length ? amounts.reduce((acc, v) => acc + v, 0) / amounts.length : 0;
    document.getElementById('metric-avg').textContent = formatter.format(avg);
    
    const flux = totalVolume > 0 ? ((totalVolume - expenses) / totalVolume * 100).toFixed(1) : 0;
    document.getElementById('metric-burn').textContent = `${flux}%`;

    // Trend Logic
    const incomeDiff = comparison.lastMonthIncome > 0 
        ? ((comparison.thisMonthIncome - comparison.lastMonthIncome) / comparison.lastMonthIncome * 100).toFixed(0)
        : 0;
    
    const trendEl = document.getElementById('trend-gross');
    trendEl.textContent = `${incomeDiff >= 0 ? '+' : ''}${incomeDiff}% vs last month`;
    trendEl.style.color = incomeDiff >= 0 ? 'var(--income)' : 'var(--expense)';
}

function renderEquityChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(250, 250, 250, 0)');

    let runningBalance = 0;
    const labels = activeSpaceTransactions.map(t => 
        new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    );
    const dataPoints = activeSpaceTransactions.map(t => {
        runningBalance += t.amount;
        return runningBalance;
    });

    new Chart(ctx, {
        type: 'line',
        data: { 
            labels: labels,
            datasets: [{
            data: dataPoints,
            borderColor: '#ffffff',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.2,
            fill: true,
            backgroundColor: gradient
        }]},
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#a1a1aa',
                        font: { size: 10 },
                        callback: (value) => formatter.format(value)
                    }
                }
            }
        }
    });
}

function renderMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    const last6Months = Array.from({length: 6}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { month: d.getMonth(), year: d.getFullYear(), label: d.toLocaleDateString(undefined, {month:'short'}) };
    }).reverse();

    const incomeData = last6Months.map(m => 
        activeSpaceTransactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === m.month && d.getFullYear() === m.year && t.amount > 0;
        }).reduce((acc, t) => acc + t.amount, 0)
    );

    const expenseData = last6Months.map(m => 
        Math.abs(activeSpaceTransactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === m.month && d.getFullYear() === m.year && t.amount < 0;
        }).reduce((acc, t) => acc + t.amount, 0))
    );

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last6Months.map(m => m.label),
            datasets: [
                { label: 'In', data: incomeData, backgroundColor: '#10b981', borderRadius: 4 },
                { label: 'Out', data: expenseData, backgroundColor: '#3f3f46', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#71717a', font: { size: 10 } } },
                y: { display: false }
            }
        }
    });
}

function renderTopTransactions() {
    const container = document.getElementById('top-transactions');
    const top = [...activeSpaceTransactions]
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 5);

    if (top.length === 0) {
        container.innerHTML = '<tr><td style="color:var(--text-muted); text-align:center">No data available</td></tr>';
        return;
    }

    container.innerHTML = top.map(t => `
        <tr>
            <td>${t.text}</td>
            <td style="text-align:right; font-weight:700; color:${t.amount < 0 ? 'var(--expense)' : 'var(--income)'}">
                ${formatter.format(t.amount)}
            </td>
        </tr>
    `).join('');
}

initAnalytics();