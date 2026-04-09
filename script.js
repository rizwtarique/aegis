// AEGIS Core Logic Engine

const state = {
    income: 50000,
    fixed: 15000,
    savingsGoal: 100000,
    shadowBudgetTotal: 7500, // 15% of 50000
    shadowBudgetSpent: 0,
    emis: [],
    currentVibe: 'Nominal',
    eomBaseline: 27500, // Projected End of Month
    
    // Configurable Risk Multipliers based on "Vibe"
    vibeMultipliers: {
        'Nominal': 1.0,
        'Stressed': 1.4, // 40% more likely to spend
        'Elated': 1.3,
        'Bored': 1.5
    }
};

// UI Elements
const els = {
    shadowRem: document.getElementById('shadow-budget-rem'),
    shadowSpent: document.getElementById('shadow-spent'),
    shadowProgress: document.getElementById('shadow-progress'),
    eomBalance: document.getElementById('eom-balance'),
    feed: document.getElementById('ai-feed'),
    investBtn: document.getElementById('invest-btn'),
    investAmount: document.getElementById('invest-amount'),
    simBtn: document.getElementById('sim-btn'),
    simAmount: document.getElementById('sim-amount'),
    simCategory: document.getElementById('sim-category'),
    spendBtn: document.getElementById('spend-btn'),
    emiBtn: document.getElementById('emi-btn'),
    emiAmount: document.getElementById('emi-amount'),
    emiTenure: document.getElementById('emi-tenure'),
    fixedDisplay: document.getElementById('fixed-costs-disp'),
    customBudgetBtn: document.getElementById('custom-budget-btn'),
    customBudgetInput: document.getElementById('custom-budget'),
    budgetLabel: document.getElementById('budget-allocation-label'),
    shadowTotalDisp: document.getElementById('shadow-total-disp'),
    marketSearchBtn: document.getElementById('market-search-btn'),
    marketSearchInput: document.getElementById('market-search'),
    vibeBtns: document.querySelectorAll('.vibe-btn'),
    statusIcon: document.getElementById('status-icon'),
    systemStatus: document.getElementById('system-status'),
    headerPanel: document.querySelector('header.glass-panel')
};

// Format Currency
function formatMoney(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

// Update UI Data
function updateUI() {
    const rem = state.shadowBudgetTotal - state.shadowBudgetSpent;
    els.shadowRem.textContent = formatMoney(rem);
    els.shadowSpent.textContent = formatMoney(state.shadowBudgetSpent);
    els.eomBalance.textContent = formatMoney(state.eomBaseline);
    if(els.fixedDisplay) els.fixedDisplay.textContent = formatMoney(state.fixed);
    if(els.shadowTotalDisp) els.shadowTotalDisp.textContent = formatMoney(state.shadowBudgetTotal);
    
    let percent = (state.shadowBudgetSpent / state.shadowBudgetTotal) * 100;
    if (percent > 100) percent = 100;
    els.shadowProgress.style.width = `${percent}%`;

    // Visual Red-zone for shadow budget
    if (percent > 85) {
        document.body.classList.add('red-zone-active');
        els.shadowProgress.classList.replace('bg-aegis-900', 'bg-danger');
        els.shadowProgress.classList.replace('shadow-[0_0_10px_#00e5ff]', 'shadow-[0_0_10px_#ff2a5f]');
        els.headerPanel.classList.add('border-danger');
        els.systemStatus.textContent = "RED-ZONE ALERT";
        els.systemStatus.classList.replace('text-gray-300', 'text-danger');
        els.statusIcon.classList.replace('text-aegis-900', 'text-danger');
        els.statusIcon.classList.replace('fa-bolt', 'fa-triangle-exclamation');
    }
}

// Add message to terminal
function addTerminalMessage(title, text, isWarning = false) {
    const msg = document.createElement('div');
    const colorClass = isWarning ? 'text-danger' : 'text-aegis-900';
    const bgStripe = isWarning ? 'bg-danger' : 'bg-aegis-900';
    
    msg.className = 'ai-message bg-gray-900/50 border border-gray-800 p-4 rounded-lg rounded-tl-none relative isolate animate-terminal-in';
    msg.innerHTML = `
        <div class="absolute top-0 left-0 w-1 h-full ${bgStripe}"></div>
        <p class="${colorClass} font-bold mb-1 break-words">${title}</p>
        <p class="text-gray-300 leading-relaxed text-sm break-words">${text}</p>
    `;
    
    els.feed.appendChild(msg);
    els.feed.scrollTop = els.feed.scrollHeight;
}

// Handle "What-If" Simulation
els.simBtn.addEventListener('click', () => {
    const amount = parseFloat(els.simAmount.value);
    const category = els.simCategory.value || 'General';

    if (isNaN(amount) || amount <= 0) {
        addTerminalMessage('System Error', 'Invalid amount entered for simulation.', true);
        return;
    }

    // Pre-mortem calculation
    const impact6Mo = amount * 6; // Compound/Opportunity cost logic (simplistic)
    const newEOM = state.eomBaseline - amount;
    
    els.eomBalance.textContent = formatMoney(newEOM);
    if(newEOM < 1000) els.eomBalance.classList.replace('text-white', 'text-danger');

    let response = `Simulating purchase: ${formatMoney(amount)} [${category}].<br><br>`;
    response += `> Impact on Current EOM: Drops to ${formatMoney(newEOM)}.<br>`;
    response += `> 6-Month Trajectory Impact: If this becomes a recurring habit, it delays your ₹1,00,000 savings goal by approximately 3 weeks. <br><br>`;
    
    if (amount > (state.shadowBudgetTotal - state.shadowBudgetSpent)) {
        response += `<strong>WARNING:</strong> This purchase exceeds your remaining Shadow Budget. Expect financial friction if you proceed.`;
        addTerminalMessage('PRE-MORTEM RESULT: HIGH RISK', response, true);
    } else {
        response += `Action within acceptable variances, though not optimal. Proceed if necessary.`;
        addTerminalMessage('PRE-MORTEM RESULT: CLEAR', response, false);
    }
    
    // Clear inputs
    els.simAmount.value = '';
    els.simCategory.value = '';
});

// Handle "Log Spend"
els.spendBtn.addEventListener('click', () => {
    const amount = parseFloat(els.simAmount.value);
    const category = els.simCategory.value || 'General';

    if (isNaN(amount) || amount <= 0) {
        addTerminalMessage('System Error', 'Invalid amount entered to log spend.', true);
        return;
    }

    // Actual Spend decreases shadow budget and EOM
    state.shadowBudgetSpent += amount;
    state.eomBaseline -= amount;
    
    updateUI();

    let response = `Logged actual spend of ${formatMoney(amount)} [${category}].<br><br>`;
    response += `> Shadow budget decreased to ${formatMoney(state.shadowBudgetTotal - state.shadowBudgetSpent)} remaining.<br>`;
    
    addTerminalMessage('EXPENSE LOGGED', response, false);
    
    // Clear inputs
    els.simAmount.value = '';
    els.simCategory.value = '';
});

// Handle Custom Budget Set
if(els.customBudgetBtn) {
    els.customBudgetBtn.addEventListener('click', () => {
        const customAmt = parseFloat(els.customBudgetInput.value);
        if (isNaN(customAmt) || customAmt <= 0) {
            addTerminalMessage('System Error', 'Invalid custom budget amount.', true);
            return;
        }

        const oldBudget = state.shadowBudgetTotal;
        const diff = customAmt - oldBudget;

        state.shadowBudgetTotal = customAmt;
        state.eomBaseline -= diff; 
        
        updateUI();

        if(els.budgetLabel) {
            els.budgetLabel.textContent = "MANUAL OVERRIDE";
            els.budgetLabel.classList.remove('bg-gray-800', 'text-gray-300');
            els.budgetLabel.classList.add('bg-danger', 'text-white');
        }

        let response = `Shadow Budget constraint manually overridden to ${formatMoney(customAmt)}.<br><br>`;
        response += `> Your projected EOM balance shifted to ${formatMoney(state.eomBaseline)}.<br>`;
        
        if (customAmt > (state.income * 0.3)) {
            response += `<strong class="text-danger">WARNING: You have authorized over 30% of income for random friction. You are endangering your saving velocity.</strong>`;
            addTerminalMessage('BUDGET OVERRIDE: HIGH RISK', response, true);
        } else {
            addTerminalMessage('BUDGET OVERRIDE: LOGGED', response, false);
        }
        
        els.customBudgetInput.value = '';
    });
}

// Handle EMI Execution
els.emiBtn.addEventListener('click', () => {
    const total = parseFloat(els.emiAmount.value);
    const tenure = parseInt(els.emiTenure.value);

    if (isNaN(total) || total <= 0 || isNaN(tenure) || tenure <= 0) {
        addTerminalMessage('System Error', 'Invalid amount or tenure for EMI.', true);
        return;
    }

    const monthlyDeduction = total / tenure;
    
    // Update State
    state.emis.push({ total, tenure, monthlyDeduction });
    state.fixed += monthlyDeduction;
    state.eomBaseline -= monthlyDeduction;
    
    updateUI();

    let response = `EMI debt registered: ${formatMoney(total)} over ${tenure} months.<br><br>`;
    response += `> Your Fixed Costs permanently increased by ${formatMoney(monthlyDeduction)}/mo.<br>`;
    response += `> Target EOM Baseline dropped to ${formatMoney(state.eomBaseline)}.<br>`;
    
    if (state.fixed > (state.income * 0.5)) {
        response += `<br><strong class="text-danger">CRITICAL WARNING: Base expenses exceed 50% of income. Restrict discretionary spending immediately.</strong>`;
        addTerminalMessage('EMI REGISTERED: HIGH RISK', response, true);
    } else {
        addTerminalMessage('EMI REGISTERED: DEFINITIVE', response, false);
    }
    
    // Clear inputs
    els.emiAmount.value = '';
    els.emiTenure.value = '';
});

// Handle Wealth Architecture Allocation
els.investBtn.addEventListener('click', () => {
    const amount = parseFloat(els.investAmount.value);
    
    if (isNaN(amount) || amount <= 0) {
        addTerminalMessage('System Error', 'Invalid capital input for allocation.', true);
        return;
    }

    // 50% ETF, 30% HYSA, 20% High-Risk
    const etf = amount * 0.5;
    const hysa = amount * 0.3;
    const risk = amount * 0.2;

    let response = `Optimizing allocation for ${formatMoney(amount)} surplus capital.<br><br>`;
    
    response += `<strong>1. Core Growth (50%) - ${formatMoney(etf)}</strong><br>`;
    response += `Allocate to an S&P 500 Index ETF (e.g., VOO or FXAIX). Historical avg return ~10%.<br><br>`;
    
    response += `<strong>2. Liquid Safety (30%) - ${formatMoney(hysa)}</strong><br>`;
    response += `Deposit into High-Yield Savings Account (HYSA) yielding ~4.5%. Buffer against severe shocks.<br><br>`;
    
    response += `<strong>3. Asymmetric Risk (20%) - ${formatMoney(risk)}</strong><br>`;
    response += `Deploy into high-conviction individual equities or hold cash for market dips.<br><br>`;
    
    response += `<em>Directive: Automate these transfers directly from checking account.</em>`;

    addTerminalMessage('WEALTH ARCHITECTURE: ALLOCATION COMPLETE', response, false);
    
    els.investAmount.value = '';
});

// Handle Vibe Check
els.vibeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Reset styles
        els.vibeBtns.forEach(b => {
             b.classList.remove('active', 'bg-gray-800');
             b.classList.replace('bg-[rgba(0,229,255,0.1)]', 'bg-transparent');
             b.style.borderColor = '';
             b.style.color = '';
        });
        
        // Active styles
        const target = e.target;
        target.classList.add('active');
        target.style.background = 'rgba(0, 229, 255, 0.1)';
        target.style.borderColor = '#00e5ff';
        target.style.color = 'white';

        const vibe = target.dataset.vibe;
        state.currentVibe = vibe;

        processVibeChange(vibe);
    });
});

function processVibeChange(vibe) {
    if (vibe === 'Stressed') {
        addTerminalMessage(
            'BEHAVIORAL WARNING: CORTISOL SPIKE DETECTED', 
            `You marked your state as "Stressed/Exhausted". Historical data indicates you are 40% more likely to order impulse takeout or take Ubers. I am temporarily locking an additional ₹1500 into the Shadow Budget restriction. Stay sharp.`, 
            true
        );
        state.shadowBudgetSpent += 1500; // Simulate lock
        updateUI();
    } 
    else if (vibe === 'Bored') {
        addTerminalMessage(
            'BEHAVIORAL PATTERN: IDLE BROWSING', 
            `"Bored/Scrolling" state active. This is the #1 trigger for micro-transactions and targeted AD conversions. I recommend closing shopping apps immediately. If you attempt a purchase, run the simulation first.`, 
            true
        );
    }
    else if (vibe === 'Elated') {
        addTerminalMessage(
            'BEHAVIORAL NOTE: CELEBRATORY DEFICIT', 
            `"Elated" state active. You are prone to treating others or overspending on experiences right now. Remember the ₹1,00,000 savings goal. Keep the celebration within bounds.`, 
            false
        );
    }
    else {
         addTerminalMessage(
            'SYSTEM STATUS: NOMINAL', 
            `Emotional state stabilized. Resuming standard monitoring.`, 
            false
        );
    }
}

// TradingView Dynamic Widget Integration
function loadChart(symbol) {
    if (typeof TradingView === 'undefined') {
        console.error("TradingView SDK not loaded.");
        return;
    }
    
    const container = document.getElementById('tradingview_aegis');
    if(container) container.innerHTML = '';

    new TradingView.widget({
        "autosize": true,
        "symbol": symbol,
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "backgroundColor": "rgba(14, 14, 17, 0.4)",
        "gridColor": "rgba(42, 46, 57, 0.06)",
        "hide_top_toolbar": false, 
        "hide_legend": false,
        "save_image": false,
        "container_id": "tradingview_aegis"
    });
}

if(els.marketSearchBtn) {
    els.marketSearchBtn.addEventListener('click', () => {
        const symbol = els.marketSearchInput.value.trim().toUpperCase();
        if(!symbol) return;
        
        loadChart(symbol);
        addTerminalMessage('MARKET FEED ENGAGED', `Establishing live matrix feed for requested asset: [${symbol}].`, false);
    });
}

// Initial draw
updateUI();
setTimeout(() => loadChart("NASDAQ:NVDA"), 300); // slight delay for glassmorphism render
