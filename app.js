// State Management
const appState = {
    notes: [], // Changed to array by default
    transactions: [],
    tasks: [],
    habits: [],
    habitLogs: []
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
        appState.habitLogs = parsed.habitLogs || [];
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
    initNavigation();
});

// --- Navigation Section (Tabbed View) ---
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('section');

    // Helper to switch tabs
    const switchTab = (targetId) => {
        // 1. Hide all sections
        sections.forEach(sec => {
            sec.classList.remove('active-section');
            sec.style.display = 'none'; // Ensure hidden
        });

        // 2. Show target section
        const targetSection = document.querySelector(`.${targetId} `);
        if (targetSection) {
            targetSection.style.display = 'block';
            setTimeout(() => targetSection.classList.add('active-section'), 10);
        }

        // 3. Update Nav State
        navItems.forEach(nav => {
            nav.classList.remove('active');
            if (nav.getAttribute('data-target') === targetId) {
                nav.classList.add('active');
            }
        });

        // 4. Update Header Title (Optional, for better UX)
        const titles = {
            'section-notes': 'Catatan Harian',
            'section-finance': 'Dompet Digital',
            'section-tasks': 'Daftar Tugas',
            'section-habits': 'Target Harian'
        };
        const headerTitle = document.querySelector('.header-content h1');
        if (headerTitle && titles[targetId]) {
            headerTitle.textContent = titles[targetId];
        }
    };

    // Event Listeners
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            switchTab(targetId);
        });
    });

    // Initialize: Show Notes by default
    switchTab('section-notes');
}

// --- Notes Section ---
function initNotes() {
    const saveBtn = document.getElementById('save-note-btn');
    const input = document.getElementById('daily-note');

    // Migration & Safety
    if (typeof appState.notes === 'string') {
        appState.notes = appState.notes.trim() ? [{ id: Date.now(), text: appState.notes, date: new Date().toISOString() }] : [];
        saveToLocal();
    }
    if (!Array.isArray(appState.notes)) appState.notes = [];

    saveBtn.addEventListener('click', () => {
        const text = input.value;
        if (text.trim()) {
            // Check if we are editing
            const editingId = saveBtn.getAttribute('data-editing-id');
            if (editingId) {
                // Update existing note
                const note = appState.notes.find(n => n.id == editingId);
                if (note) {
                    note.text = text;
                    note.date = new Date().toISOString(); // Update date on edit? Or keep original? Let's update.
                    saveToLocal();
                    renderNotes();
                    showStatus('Catatan diperbarui!');
                }
                // Reset mode
                saveBtn.removeAttribute('data-editing-id');
                saveBtn.textContent = 'Simpan Catatan';
            } else {
                // New Note
                const newNote = {
                    id: Date.now(),
                    text: text,
                    date: new Date().toISOString()
                };
                appState.notes.unshift(newNote);
                saveToLocal();
                renderNotes();
                showStatus('Catatan tersimpan!');
            }
            input.value = "";
        }
    });

    // Modal Logic
    const modal = document.getElementById('note-modal');
    const modalInput = document.getElementById('modal-note-input');
    const modalSave = document.getElementById('modal-save-btn');
    const modalCancel = document.getElementById('modal-cancel-btn');

    modalCancel.onclick = () => modal.classList.add('hidden');

    modalSave.onclick = () => {
        const id = modal.getAttribute('data-id');
        const note = appState.notes.find(n => n.id == id);
        if (note) {
            note.text = modalInput.value;
            saveToLocal();
            renderNotes();
            modal.classList.add('hidden');
        }
    };

    renderNotes();
}

function renderNotes() {
    const list = document.getElementById('notes-list');
    list.innerHTML = '';

    appState.notes.forEach(note => {
        const li = document.createElement('li');
        li.className = 'note-card';

        // Truncate logic
        const isLong = note.text.length > 100;
        const displayText = isLong ? note.text.substring(0, 100) + '...' : note.text;

        li.innerHTML = `
            <small class="note-date">${new Date(note.date).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</small>
            <div class="note-content">${displayText}</div>
            <div class="note-actions" style="margin-top: 10px; display: flex; gap: 10px;">
                ${isLong ? `<button class="btn-text" onclick="viewNote(${note.id})">Baca Selengkapnya</button>` : ''}
                <button class="btn-text" onclick="editNote(${note.id})">Edit</button>
                <button class="btn-text" onclick="deleteNote(${note.id})" style="color: var(--danger-color)">Hapus</button>
            </div>
`;
        list.appendChild(li);
    });
}

window.viewNote = (id) => {
    const note = appState.notes.find(n => n.id === id);
    if (note) {
        const modal = document.getElementById('note-modal');
        const modalInput = document.getElementById('modal-note-input');
        modalInput.value = note.text;
        modal.setAttribute('data-id', id);
        modal.classList.remove('hidden');
    }
};

window.editNote = (id) => {
    const note = appState.notes.find(n => n.id === id);
    if (note) {
        const input = document.getElementById('daily-note');
        const saveBtn = document.getElementById('save-note-btn');
        input.value = note.text;
        saveBtn.textContent = 'Update Catatan';
        saveBtn.setAttribute('data-editing-id', id);
        input.focus();

        // Scroll to top of notes section if needed
        document.querySelector('.note-input-area').scrollIntoView({ behavior: 'smooth' });
    }
};

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
    renderTasks(); // Initial render
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
    progressBar.style.width = `${percentage}% `;
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
function initHabits() {
    const form = document.getElementById('habit-form');
    const resetBtn = document.getElementById('reset-habits'); // Removed from DOM but keep ref safe

    // Migrate/Safe check for habitLogs
    if (!appState.habitLogs || !Array.isArray(appState.habitLogs)) {
        appState.habitLogs = [];
    }

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
    saveToLocal();

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

    // resetBtn.addEventListener('click', () => { // This button is removed from DOM
    //     // Manual reset (debug mostly, or "give up")
    //     appState.habits.forEach(h => {
    //         h.active = false;
    //         // Don't reset streak on manual reset button? Or maybe user wants to restart day?
    //         // Let's just reset active status.
    //     });
    //     saveToLocal();
    //     renderHabits();
    // });

    renderHabits();
    renderHabitLogs();
}

function renderHabits() {
    const grid = document.getElementById('habit-grid');
    grid.innerHTML = '';

    appState.habits.forEach(h => {
        const div = document.createElement('div');
        div.className = `habit - card ${h.active ? 'active' : ''} `;

        // Note: We don't show the dailyNote in the card anymore if it's in the history log?
        // Let's keep it simple here, just the streak.
        div.innerHTML = `
            ${h.text}
<div class="streak-badge">
    <i class="fas fa-fire streak-icon"></i> ${h.streak}
</div>
`;

        div.onclick = () => toggleHabit(h.id);

        div.oncontextmenu = (e) => {
            e.preventDefault();
            if (confirm(`Hapus kebiasaan "${h.text}" ? `)) {
                deleteHabit(h.id);
            }
        };

        grid.appendChild(div);
    });
}

function renderHabitLogs() {
    const list = document.getElementById('habit-logs-list');
    list.innerHTML = '';

    // Sort by newest
    const sortedLogs = [...appState.habitLogs].reverse();

    sortedLogs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'note-card'; // Reuse note style
        li.innerHTML = `
            <small class="note-date">${new Date(log.date).toLocaleString('id-ID')}</small>
            <div class="note-content">
                <strong>${log.habitName}</strong>: ${log.note || "Tercapai"}
            </div>
            <button class="btn-text" onclick="deleteHabitLog(${log.id})" style="color:red; float:right; margin-top:-20px;">Hapus</button>
        `;
        list.appendChild(li);
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
            let userNote = prompt(`Catatan untuk ${habit.text} hari ini ? `);
            // If cancel, abort
            if (userNote === null) return;

            habit.active = true;
            habit.streak += 1;
            habit.lastDate = today;

            // LOG IT
            appState.habitLogs.push({
                id: Date.now(),
                habitName: habit.text,
                note: userNote,
                date: new Date().toISOString()
            });

        } else {
            // Turning OFF (Undo)
            if (confirm(`Batalkan "${habit.text}" untuk hari ini ? Streak akan berkurang.`)) {
                habit.active = false;
                if (habit.streak > 0) habit.streak -= 1;
                habit.lastDate = yesterday;
                // Note: We don't automatically delete the log, or maybe we should?
                // Let's leave logs as historical record unless manually deleted.
            }
        }
        saveToLocal();
        renderHabits();
        renderHabitLogs();
    }
};

window.deleteHabit = (id) => {
    appState.habits = appState.habits.filter(h => h.id !== id);
    saveToLocal();
    renderHabits();
};

window.deleteHabitLog = (id) => {
    if (confirm("Hapus riwayat ini?")) {
        appState.habitLogs = appState.habitLogs.filter(l => l.id !== id);
        saveToLocal();
        renderHabitLogs();
    }
};


// Global Render Helper
function renderAll() {
    renderFinance();
    renderTasks();
    renderHabits();
    renderHabitLogs();
    // Notes usually just set value, handled in init
}
