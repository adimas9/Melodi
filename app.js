// State Management
const appState = {
    notes: [], // Changed to array by default
    transactions: [],
    tasks: [],
    habits: []
};

// Utilities
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
};

const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
};

const saveToLocal = () => {
    localStorage.setItem('melodiApp_v1', JSON.stringify(appState));
};

const loadFromLocal = () => {
    const data = localStorage.getItem('melodiApp_v1');
    if (data) {
        const parsed = JSON.parse(data);
        appState.notes = parsed.notes || "";
        appState.transactions = parsed.transactions || [];
        appState.tasks = parsed.tasks || [];
        appState.habits = parsed.habits || [];
        renderAll();
    }
};

// DOM Elements
const dateEl = document.getElementById('current-date');
const noteInput = document.getElementById('daily-note');
const noteStatus = document.getElementById('note-status');
const saveNoteBtn = document.getElementById('save-note-btn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    dateEl.textContent = formatDate(new Date());
    loadFromLocal();
    initNotes();
    initFinance();
    initTasks();
    initHabits();
});

// --- Notes Section ---
function initNotes() {
    const saveBtn = document.getElementById('save-note-btn');
    const input = document.getElementById('daily-note');

    // Migration: Convert old string format to array object if needed
    if (typeof appState.notes === 'string') {
        if (appState.notes.trim() !== "") {
            appState.notes = [{
                id: Date.now(),
                text: appState.notes,
                date: new Date().toISOString()
            }];
        } else {
            appState.notes = [];
        }
        saveToLocal();
    }
    // Ensure it's an array (just in case of other corruption)
    if (!Array.isArray(appState.notes)) appState.notes = [];

    saveBtn.addEventListener('click', () => {
        const text = input.value;
        if (text.trim()) {
            const newNote = {
                id: Date.now(),
                text: text,
                date: new Date().toISOString()
            };
            appState.notes.unshift(newNote); // Add to top
            saveToLocal();
            renderNotes();
            input.value = ""; // Clear input
            showStatus('Catatan tersimpan ke riwayat!');
        }
    });

    renderNotes();
}

function renderNotes() {
    const list = document.getElementById('notes-list');
    list.innerHTML = '';

    appState.notes.forEach(note => {
        const li = document.createElement('li');
        li.className = 'note-card';
        li.innerHTML = `
            <small class="note-date">${new Date(note.date).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</small>
            <div class="note-content">${note.text}</div>
            <button class="note-delete-btn" onclick="deleteNote(${note.id})"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(li);
    });
}

window.deleteNote = (id) => {
    if (confirm('Hapus catatan ini?')) {
        appState.notes = appState.notes.filter(n => n.id !== id);
        saveToLocal();
        renderNotes();
    }
}

function showStatus(msg) {
    const status = document.getElementById('note-status');
    status.textContent = msg;
    status.style.opacity = 1;
    setTimeout(() => {
        status.style.opacity = 0;
    }, 2000);
}

// --- Finance Section ---
function initFinance() {
    const form = document.getElementById('finance-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = document.getElementById('transaction-desc').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const type = document.getElementById('transaction-type').value;

        if (desc && amount) {
            const transaction = {
                id: Date.now(),
                desc,
                amount,
                type,
                date: new Date().toISOString()
            };
            appState.transactions.push(transaction);
            saveToLocal();
            renderFinance();
            form.reset();
        }
    });

    renderFinance();
}

function renderFinance() {
    const list = document.getElementById('transaction-list');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const totalBalanceEl = document.getElementById('total-balance');

    list.innerHTML = '';
    let income = 0;
    let expense = 0;

    // Show latest first
    const sorted = [...appState.transactions].reverse();

    sorted.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;

        const li = document.createElement('li');
        li.className = `transaction-item ${t.type}-type`;
        li.innerHTML = `
            <div>
                <strong>${t.desc}</strong>
                <span style="font-size: 0.8rem; display:block; color: #aaa;">${new Date(t.date).toLocaleDateString('id-ID')}</span>
            </div>
            <div>
                <span class="t-amount">${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}</span>
                <button onclick="deleteTransaction(${t.id})" class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(li);
    });

    totalIncomeEl.textContent = formatCurrency(income);
    totalExpenseEl.textContent = formatCurrency(expense);
    totalBalanceEl.textContent = formatCurrency(income - expense);
}

window.deleteTransaction = (id) => {
    appState.transactions = appState.transactions.filter(t => t.id !== id);
    saveToLocal();
    renderFinance();
};

// --- Tasks Section ---
function initTasks() {
    const form = document.getElementById('task-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = document.getElementById('task-input').value;
        const date = document.getElementById('task-date').value;

        if (text) {
            appState.tasks.push({
                id: Date.now(),
                text,
                date,
                completed: false
            });
            saveToLocal();
            renderTasks();
            form.reset();
        }
    });
}

function renderTasks() {
    const list = document.getElementById('task-list');
    const progressBar = document.getElementById('task-progress');
    list.innerHTML = '';

    const sorted = [...appState.tasks].sort((a, b) => a.completed - b.completed);

    let completedCount = 0;

    sorted.forEach(t => {
        if (t.completed) completedCount++;
        const li = document.createElement('li');
        li.className = `task-item ${t.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id})">
            <div class="task-info">
                <span>${t.text}</span>
                ${t.date ? `<small class="task-date">Tenggat: ${new Date(t.date).toLocaleDateString('id-ID')}</small>` : ''}
            </div>
            <button onclick="deleteTask(${t.id})" class="delete-btn"><i class="fas fa-times"></i></button>
        `;
        list.appendChild(li);
    });

    // Update Progress
    const total = appState.tasks.length;
    const percentage = total === 0 ? 0 : (completedCount / total) * 100;
    progressBar.style.width = `${percentage}%`;
}

window.toggleTask = (id) => {
    const task = appState.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveToLocal();
        renderTasks();
    }
};

window.deleteTask = (id) => {
    appState.tasks = appState.tasks.filter(t => t.id !== id);
    saveToLocal();
    renderTasks();
};

// --- Habits Section ---
// --- Habits Section ---
function initHabits() {
    const form = document.getElementById('habit-form');
    const resetBtn = document.getElementById('reset-habits');

    // Default habits
    if (appState.habits.length === 0) {
        appState.habits = [
            { id: 1, text: "Minum Air", active: false, streak: 0, lastDate: null },
            { id: 2, text: "Olahraga", active: false, streak: 0, lastDate: null },
            { id: 3, text: "Baca Buku", active: false, streak: 0, lastDate: null }
        ];
    }

    // Daily Reset & Streak Logic Check
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    appState.habits.forEach(h => {
        // Ensure properties exist
        if (typeof h.streak === 'undefined') h.streak = 0;
        if (typeof h.lastDate === 'undefined') h.lastDate = null;

        if (h.lastDate !== today) {
            h.active = false; // Reset daily toggle

            // Check if streak is broken (last date was not yesterday and not today)
            // If lastDate is today, we wouldn't be in this block? Wait, h.lastDate !== today.
            // If lastDate was yesterday, streak survives.
            // If lastDate was < yesterday, streak dies.
            if (h.lastDate !== yesterday && h.lastDate !== today && h.lastDate !== null) {
                h.streak = 0;
            }
        }
    });
    saveToLocal(); // Save the reset state

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = document.getElementById('new-habit-input').value;
        if (text) {
            appState.habits.push({
                id: Date.now(),
                text,
                active: false,
                streak: 0,
                lastDate: null
            });
            saveToLocal();
            renderHabits();
            form.reset();
        }
    });

    resetBtn.addEventListener('click', () => {
        // Manual reset (debug mostly, or "give up")
        appState.habits.forEach(h => {
            h.active = false;
            // Don't reset streak on manual reset button? Or maybe user wants to restart day?
            // Let's just reset active status.
        });
        saveToLocal();
        renderHabits();
    });

    renderHabits();
}

function renderHabits() {
    const grid = document.getElementById('habit-grid');
    grid.innerHTML = '';

    appState.habits.forEach(h => {
        const div = document.createElement('div');
        div.className = `habit-card ${h.active ? 'active' : ''}`;

        // Content with Streak Badge
        div.innerHTML = `
            ${h.text}
            <div class="streak-badge">
                <i class="fas fa-fire streak-icon"></i> ${h.streak}
            </div>
        `;

        div.onclick = () => toggleHabit(h.id);

        div.oncontextmenu = (e) => {
            e.preventDefault();
            if (confirm(`Hapus kebiasaan "${h.text}"?`)) {
                deleteHabit(h.id);
            }
        };

        grid.appendChild(div);
    });
}

window.toggleHabit = (id) => {
    const habit = appState.habits.find(h => h.id === id);
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    if (habit) {
        if (!habit.active) {
            // Turning ON
            habit.active = true;
            habit.streak += 1;
            habit.lastDate = today;
        } else {
            // Turning OFF (Undo)
            habit.active = false;
            if (habit.streak > 0) habit.streak -= 1;
            // Revert date to yesterday to keep streak alive for tomorrow if we re-check it?
            habit.lastDate = yesterday;
        }
        saveToLocal();
        renderHabits();
    }
};

window.deleteHabit = (id) => {
    appState.habits = appState.habits.filter(h => h.id !== id);
    saveToLocal();
    renderHabits();
};

// Global Render Helper
function renderAll() {
    renderFinance();
    renderTasks();
    renderHabits();
    // Notes usually just set value, handled in init
}
