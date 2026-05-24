class MoneyTracker {
    constructor() {
        this.transactions = this.loadTransactions();
        this.categories = this.loadCategories();
        this.lastDeletedTransaction = null;
        this.initElements();
        this.setupEventListeners();
        this.initTheme();
        this.renderCategories();
        this.render();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('moneyTrackerTheme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('moneyTrackerTheme', newTheme);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    initElements() {
        this.form = document.getElementById('transactionForm');
        this.amountInput = document.getElementById('amount');
        this.numberPad = document.getElementById('numberPad');
        this.categorySelect = document.getElementById('category');
        this.categoryGroup = document.getElementById('categoryGroup');
        this.categoryPills = document.getElementById('categoryPills');
        this.totalBalance = document.getElementById('totalBalance');
        this.newCategoryInput = document.getElementById('newCategoryInput');
        this.categoriesList = document.getElementById('categoriesList');
        this.categoriesManagerPanel = document.getElementById('categoriesManagerPanel');
        this.undoBtn = document.getElementById('undoBtn');
        this.historyModal = document.getElementById('historyModal');
        this.historyTransactionsList = document.getElementById('historyTransactionsList');
        this.historySearchInput = document.getElementById('historySearchInput');
        this.editModal = document.getElementById('editModal');
        this.editDescription = document.getElementById('editDescription');
        this.editAmount = document.getElementById('editAmount');
        this.editCategory = document.getElementById('editCategory');
        this.editingTransactionId = null;
    }

    setupEventListeners() {
        this.form.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
        this.newCategoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addCategory();
            }
        });
        this.amountInput.addEventListener('focus', () => {
            this.numberPad.style.display = 'block';
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group') && !e.target.closest('.number-pad')) {
                this.numberPad.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.categoriesManagerPanel.style.display !== 'none') {
                    this.toggleCategoriesManager();
                }
            }
        });

        if (this.categoriesManagerPanel) {
            this.categoriesManagerPanel.addEventListener('click', (e) => {
                if (e.target === this.categoriesManagerPanel) {
                    this.toggleCategoriesManager();
                }
            });

            // Add close button handler
            const closeBtn = this.categoriesManagerPanel.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleCategoriesManager();
                });
            }
        }
    }

    addToAmount(value) {
        if (value === '.' && this.amountInput.value.includes('.')) {
            return;
        }
        this.amountInput.value += value;
    }

    deleteFromAmount() {
        this.amountInput.value = this.amountInput.value.slice(0, -1);
    }

    clearAmount() {
        this.amountInput.value = '';
    }

    submitForm(type) {
        if (type === 'spend' && this.categoryGroup.style.display === 'none') {
            this.categoryGroup.style.display = 'block';
            return;
        }

        if (type === 'add' && this.categoryGroup.style.display !== 'none') {
            this.categoryGroup.style.display = 'none';
            return;
        }

        if (!this.amountInput.value || isNaN(parseFloat(this.amountInput.value))) {
            alert('Please enter a valid amount');
            return;
        }

        const amount = parseFloat(this.amountInput.value);
        if (amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }

        if (type === 'spend' && !this.categorySelect.value) {
            alert('Please select a category');
            return;
        }

        const transaction = {
            id: Date.now(),
            description: type === 'spend' ? this.categorySelect.value : 'Added Money',
            amount: amount,
            type: type,
            category: type === 'spend' ? this.categorySelect.value : null,
            date: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
        };

        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.form.reset();
        this.categoryGroup.style.display = 'none';
        this.numberPad.style.display = 'none';
        document.querySelectorAll('.category-pill').forEach(pill => {
            pill.classList.remove('active');
        });
        this.render();
    }

    deleteTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        this.lastDeletedTransaction = transaction;
        this.undoBtn.style.display = 'inline-block';
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
        this.render();
    }

    undoLastTransaction() {
        if (this.lastDeletedTransaction) {
            this.transactions.unshift(this.lastDeletedTransaction);
            this.saveTransactions();
            this.lastDeletedTransaction = null;
            this.undoBtn.style.display = 'none';
            this.render();
        }
    }

    openHistory() {
        this.historyModal.style.display = 'block';
        this.filterTransactionsInModal();
    }

    closeHistory() {
        this.historyModal.style.display = 'none';
    }

    openEditModal(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.editingTransactionId = id;
        this.editDescription.value = transaction.description;
        this.editAmount.value = transaction.amount;

        this.editCategory.innerHTML = '<option value="">Select category</option>';
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            if (cat === transaction.category) {
                option.selected = true;
            }
            this.editCategory.appendChild(option);
        });

        this.editModal.style.display = 'block';
    }

    closeEditModal() {
        this.editModal.style.display = 'none';
        this.editingTransactionId = null;
    }

    saveEdit() {
        if (!this.editingTransactionId) return;

        const transaction = this.transactions.find(t => t.id === this.editingTransactionId);
        if (!transaction) return;

        const newAmount = parseFloat(this.editAmount.value);
        if (!newAmount || newAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (transaction.type === 'spend' && !this.editCategory.value) {
            alert('Please select a category');
            return;
        }

        transaction.amount = newAmount;
        if (transaction.type === 'spend') {
            transaction.category = this.editCategory.value;
            transaction.description = this.editCategory.value;
        } else {
            transaction.description = this.editDescription.value || 'Added Money';
        }

        this.saveTransactions();
        this.closeEditModal();
        this.filterTransactionsInModal();
        this.render();
    }

    deleteFromEdit() {
        if (this.editingTransactionId) {
            this.deleteTransaction(this.editingTransactionId);
            this.closeEditModal();
        }
    }

    filterTransactionsInModal() {
        const searchTerm = this.historySearchInput.value.toLowerCase();
        let filtered = this.transactions;

        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(searchTerm) ||
                (t.category && t.category.toLowerCase().includes(searchTerm))
            );
        }

        this.renderHistoryTransactions(filtered);
    }

    renderHistoryTransactions(transactions) {
        if (transactions.length === 0) {
            this.historyTransactionsList.innerHTML = '<p class="empty-state">No transactions found.</p>';
            return;
        }

        this.historyTransactionsList.innerHTML = transactions.map(transaction => {
            return `
                <div class="history-transaction-item ${transaction.type}">
                    <div class="history-transaction-info">
                        <div class="history-transaction-description">${this.escapeHtml(transaction.description)}</div>
                        <div class="history-transaction-meta">${transaction.date}</div>
                    </div>
                    <div class="history-transaction-actions">
                        <div class="history-transaction-amount ${transaction.type}">
                            ${transaction.type === 'add' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                        </div>
                        <div class="transaction-actions">
                            <button type="button" class="btn-edit" onclick="tracker.openEditModal(${transaction.id})" title="Edit">✏️</button>
                            <button type="button" class="btn-delete-modal" onclick="tracker.deleteTransaction(${transaction.id})" title="Delete">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleCategoriesManager() {
        const isHidden = this.categoriesManagerPanel.style.display === 'none';
        this.categoriesManagerPanel.style.display = isHidden ? 'block' : 'none';
    }

    addCategory() {
        const categoryName = this.newCategoryInput.value.trim();
        if (!categoryName) {
            alert('Please enter a category name');
            return;
        }

        if (this.categories.includes(categoryName)) {
            alert('This category already exists');
            return;
        }

        this.categories.push(categoryName);
        this.categories.sort();
        this.saveCategories();
        this.newCategoryInput.value = '';
        this.renderCategories();
    }

    removeCategory(categoryName) {
        this.categories = this.categories.filter(cat => cat !== categoryName);
        this.saveCategories();
        this.renderCategories();
    }

    renderCategories() {
        this.categorySelect.innerHTML = '<option value="">Select category</option>';
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            this.categorySelect.appendChild(option);
        });

        this.categoriesList.innerHTML = this.categories.map(cat => `
            <div class="category-item">
                <span>${this.escapeHtml(cat)}</span>
                <button type="button" class="btn-remove-category" onclick="tracker.removeCategory('${this.escapeHtml(cat)}')">✕</button>
            </div>
        `).join('');

        this.renderCategoryPills();
    }

    renderCategoryPills() {
        this.categoryPills.innerHTML = this.categories.map(cat => `
            <button type="button" class="category-pill" onclick="tracker.selectCategory('${this.escapeHtml(cat)}')">
                ${this.escapeHtml(cat)}
            </button>
        `).join('');
    }

    selectCategory(cat) {
        this.categorySelect.value = cat;
        document.querySelectorAll('.category-pill').forEach(pill => {
            pill.classList.remove('active');
        });
        event.target.classList.add('active');
    }

    calculateBalance() {
        return this.transactions.reduce((total, t) => {
            return t.type === 'add' ? total + t.amount : total - t.amount;
        }, 0);
    }

    calculateMonthlyStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let monthlyAdded = 0;
        let monthlySpent = 0;

        this.transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                if (t.type === 'add') {
                    monthlyAdded += t.amount;
                } else {
                    monthlySpent += t.amount;
                }
            }
        });

        return { monthlyAdded, monthlySpent };
    }

    getCategoryBreakdown() {
        const breakdown = {};
        this.transactions.forEach(t => {
            if (t.type === 'spend' && t.category) {
                breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
            }
        });
        return breakdown;
    }

    getBiggestExpense() {
        const expenses = this.transactions.filter(t => t.type === 'spend');
        if (expenses.length === 0) return null;
        return expenses.reduce((max, t) => t.amount > max.amount ? t : max);
    }

    getDailyAverage() {
        if (this.transactions.length === 0) return 0;
        const totalSpent = this.transactions
            .filter(t => t.type === 'spend')
            .reduce((sum, t) => sum + t.amount, 0);
        const days = Math.max(1, Math.ceil((Date.now() - new Date(this.transactions[this.transactions.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)) || 1);
        return totalSpent / Math.max(days, 1);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }

    render() {
        this.renderBalance();
        this.renderMonthlyStats();
        this.renderStats();
        this.renderCategoryBreakdown();
    }

    renderBalance() {
        const balance = this.calculateBalance();
        this.totalBalance.textContent = this.formatCurrency(balance);
    }

    renderMonthlyStats() {
        const { monthlyAdded, monthlySpent } = this.calculateMonthlyStats();
        document.getElementById('monthlyAdded').textContent = this.formatCurrency(monthlyAdded);
        const monthlySpentEl = document.getElementById('monthlySpent');
        monthlySpentEl.textContent = this.formatCurrency(monthlySpent);
        monthlySpentEl.className = 'stat-value danger';
    }

    renderStats() {
        const biggestExpense = this.getBiggestExpense();
        document.getElementById('biggestExpense').textContent = biggestExpense
            ? `${biggestExpense.description}: ${this.formatCurrency(biggestExpense.amount)}`
            : '-';
        document.getElementById('totalTransactions').textContent = this.transactions.length;
        document.getElementById('dailyAverage').textContent = this.formatCurrency(this.getDailyAverage());
    }

    renderCategoryBreakdown() {
        const breakdown = this.getCategoryBreakdown();
        const totalSpent = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

        if (Object.keys(breakdown).length === 0) {
            document.getElementById('categoryBreakdown').innerHTML = '<p class="empty-state">No spending yet</p>';
            return;
        }

        const sorted = Object.entries(breakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        document.getElementById('categoryBreakdown').innerHTML = sorted.map(([cat, amount]) => {
            const percent = ((amount / totalSpent) * 100).toFixed(1);
            return `
                <div class="category-item-breakdown">
                    <div class="category-name">${this.escapeHtml(cat)}</div>
                    <div class="category-amount">${this.formatCurrency(amount)}</div>
                    <div class="category-percent">${percent}%</div>
                </div>
            `;
        }).join('');
    }


    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTransactions() {
        localStorage.setItem('moneyTrackerTransactions', JSON.stringify(this.transactions));
    }

    loadTransactions() {
        const saved = localStorage.getItem('moneyTrackerTransactions');
        return saved ? JSON.parse(saved) : [];
    }

    saveCategories() {
        localStorage.setItem('moneyTrackerCategories', JSON.stringify(this.categories));
    }

    loadCategories() {
        const saved = localStorage.getItem('moneyTrackerCategories');
        return saved ? JSON.parse(saved) : ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'];
    }
}

const tracker = new MoneyTracker();
