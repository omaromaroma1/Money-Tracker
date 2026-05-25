class MoneyTracker {
    constructor() {
        this.transactions = this.loadTransactions();
        this.categories = this.loadCategories();
        this.goals = this.loadGoals();
        this.lastDeletedTransaction = null;
        this.language = this.loadLanguage();
        this.useNumberPad = this.loadNumberPadSetting();
        this.currency = this.loadCurrency();
        this.resetConfirmPending = false;
        this.currentGoalContributionId = null;
        this.currentGoalContributionAmount = '';
        this.initElements();
        this.updateAmountInputMode();
        this.setupEventListeners();
        this.initTheme();
        this.renderCategories();
        this.updateLanguage();
        this.render();
        this.showScreen('home');
    }

    initTheme() {
        const savedTheme = localStorage.getItem('moneyTrackerTheme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon();
        this.updateLogoTheme();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('moneyTrackerTheme', newTheme);
        this.updateThemeIcon();
        this.updateLogoTheme();
    }

    updateLogoTheme() {
        const appLogo = document.getElementById('appLogo');
        if (appLogo) {
            appLogo.src = 'logo-dark.png';
        }
    }

    updateThemeIcon() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.style.display = 'flex';
    }

    closeError() {
        this.errorModal.style.display = 'none';
    }

    initElements() {
        this.form = document.getElementById('transactionForm');
        this.amountInput = document.getElementById('amount');
        this.numberPad = document.getElementById('numberPad');
        this.categorySelect = document.getElementById('categorySpend') || document.getElementById('category');
        this.categoryGroup = document.getElementById('categoryGroupSpend') || document.getElementById('categoryGroup');
        this.categoryPills = document.getElementById('categoryPillsSpend') || document.getElementById('categoryPills');
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
        this.numberPadToggle = document.getElementById('numberPadToggle');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
    }

    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
            });
        }
        if (this.newCategoryInput) {
            this.newCategoryInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addCategory();
                }
            });
        }
        if (this.amountInput) {
            this.amountInput.addEventListener('focus', () => {
                if (this.useNumberPad && this.numberPad) {
                    this.numberPad.style.display = 'block';
                }
            });
        }
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group') && !e.target.closest('.number-pad')) {
                if (this.numberPad) this.numberPad.style.display = 'none';
                const numberPadAdd = document.getElementById('numberPad');
                const numberPadSpend = document.getElementById('numberPadSpend');
                if (numberPadAdd) numberPadAdd.style.display = 'none';
                if (numberPadSpend) numberPadSpend.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.categoriesManagerPanel && this.categoriesManagerPanel.style.display !== 'none') {
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

            const closeBtn = this.categoriesManagerPanel.querySelector('.categories-panel-header .close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleCategoriesManager();
                });
            }
        }

        // Add close button listeners for modals
        const historyCloseBtn = document.querySelector('#historyModal .close-btn');
        if (historyCloseBtn) {
            historyCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeHistory();
            });
        }

        const editCloseBtn = document.querySelector('#editModal .close-btn');
        if (editCloseBtn) {
            editCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeEditModal();
            });
        }

        // Add Money Modal event listeners
        const amountInput = document.getElementById('amount');
        const numberPadAdd = document.getElementById('numberPad');
        if (amountInput && numberPadAdd) {
            amountInput.addEventListener('focus', () => {
                if (this.useNumberPad) {
                    numberPadAdd.style.display = 'block';
                }
            });
        }

        // Spend Money Modal event listeners
        const amountSpendInput = document.getElementById('amountSpend');
        const numberPadSpend = document.getElementById('numberPadSpend');
        if (amountSpendInput && numberPadSpend) {
            amountSpendInput.addEventListener('focus', () => {
                if (this.useNumberPad) {
                    numberPadSpend.style.display = 'block';
                }
            });
        }

        const goalContributionInput = document.getElementById('goalContributionInput');
        if (goalContributionInput) {
            goalContributionInput.addEventListener('input', () => {
                this.updateGoalContributionDisplay();
            });
        }

        const goalCloseBtn = document.querySelector('#goalContributionModal .close-btn');
        if (goalCloseBtn) {
            goalCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeGoalContribution();
            });
        }

        const errorCloseBtn = document.querySelector('.error-close-btn');
        if (errorCloseBtn) {
            errorCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeError();
            });
        }

        const historyOverlay = document.querySelector('#historyModal .history-modal-overlay');
        if (historyOverlay) {
            historyOverlay.addEventListener('click', (e) => {
                if (e.target === historyOverlay) {
                    this.closeHistory();
                }
            });
        }

        const editOverlay = document.querySelector('#editModal .history-modal-overlay');
        if (editOverlay) {
            editOverlay.addEventListener('click', (e) => {
                if (e.target === editOverlay) {
                    this.closeEditModal();
                }
            });
        }

        const goalModal = document.getElementById('goalContributionModal');
        if (goalModal) {
            goalModal.addEventListener('click', (e) => {
                if (e.target === goalModal) {
                    this.closeGoalContribution();
                }
            });
        }

        const errorModal = document.getElementById('errorModal');
        if (errorModal) {
            errorModal.addEventListener('click', (e) => {
                if (e.target === errorModal) {
                    this.closeError();
                }
            });
        }
    }

    addToAmount(value) {
        const addMoneyModal = document.getElementById('addMoneyModal');
        const spendMoneyModal = document.getElementById('spendMoneyModal');
        let amountInput;

        if (addMoneyModal && addMoneyModal.style.display === 'flex') {
            amountInput = document.getElementById('amount');
        } else if (spendMoneyModal && spendMoneyModal.style.display === 'flex') {
            amountInput = document.getElementById('amountSpend');
        }

        if (!amountInput) return;

        if (value === '.' && amountInput.value.includes('.')) {
            return;
        }
        amountInput.value += value;
    }

    deleteFromAmount() {
        const addMoneyModal = document.getElementById('addMoneyModal');
        const spendMoneyModal = document.getElementById('spendMoneyModal');
        let amountInput;

        if (addMoneyModal && addMoneyModal.style.display === 'flex') {
            amountInput = document.getElementById('amount');
        } else if (spendMoneyModal && spendMoneyModal.style.display === 'flex') {
            amountInput = document.getElementById('amountSpend');
        }

        if (!amountInput) return;
        amountInput.value = amountInput.value.slice(0, -1);
    }

    clearAmount() {
        const addMoneyModal = document.getElementById('addMoneyModal');
        const spendMoneyModal = document.getElementById('spendMoneyModal');
        let amountInput;

        if (addMoneyModal && addMoneyModal.style.display === 'flex') {
            amountInput = document.getElementById('amount');
        } else if (spendMoneyModal && spendMoneyModal.style.display === 'flex') {
            amountInput = document.getElementById('amountSpend');
        }

        if (!amountInput) return;
        amountInput.value = '';
    }

    submitForm(type) {
        let amountInput, descriptionInput, categorySelect, numberPad;

        if (type === 'add') {
            amountInput = document.getElementById('amount');
            descriptionInput = document.getElementById('description');
            numberPad = document.getElementById('numberPad');
        } else if (type === 'spend') {
            amountInput = document.getElementById('amountSpend');
            descriptionInput = document.getElementById('descriptionSpend');
            categorySelect = document.getElementById('categorySpend');
            numberPad = document.getElementById('numberPadSpend');
        }

        if (!amountInput || !amountInput.value || isNaN(parseFloat(amountInput.value))) {
            this.showError('Please enter a valid amount');
            return;
        }

        const amount = parseFloat(amountInput.value);
        if (amount <= 0) {
            this.showError('Amount must be greater than 0');
            return;
        }

        if (type === 'spend' && (!categorySelect || !categorySelect.value)) {
            this.showError('Please select a category');
            return;
        }

        const description = descriptionInput ? descriptionInput.value.trim() : '';

        const transaction = {
            id: Date.now(),
            description: type === 'spend' ? (description || categorySelect.value) : (description || 'Added Money'),
            amount: amount,
            type: type,
            category: type === 'spend' ? categorySelect.value : null,
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

        amountInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        if (numberPad) numberPad.style.display = 'none';
        document.querySelectorAll('.category-pill').forEach(pill => {
            pill.classList.remove('active');
        });

        if (type === 'add') {
            this.closeAddMoneyModal();
        } else {
            this.closeSpendMoneyModal();
        }

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
        this.historyModal.style.display = 'flex';
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

        this.editModal.style.display = 'flex';
    }

    closeEditModal() {
        this.editModal.style.display = 'none';
        this.editingTransactionId = null;
    }

    openAddMoneyModal() {
        const addMoneyModal = document.getElementById('addMoneyModal');
        if (addMoneyModal) {
            addMoneyModal.style.display = 'flex';
            setTimeout(() => {
                document.getElementById('amount').focus();
            }, 100);
            document.getElementById('amount').value = '';
            document.getElementById('description').value = '';
        }
    }

    closeAddMoneyModal() {
        const addMoneyModal = document.getElementById('addMoneyModal');
        if (addMoneyModal) {
            addMoneyModal.style.display = 'none';
            document.getElementById('amount').value = '';
            document.getElementById('description').value = '';
            this.numberPad.style.display = 'none';
        }
    }

    openSpendMoneyModal() {
        const spendMoneyModal = document.getElementById('spendMoneyModal');
        if (spendMoneyModal) {
            spendMoneyModal.style.display = 'flex';
            this.updateCategoryPillsSpend();
            setTimeout(() => {
                document.getElementById('amountSpend').focus();
            }, 100);
            document.getElementById('amountSpend').value = '';
            document.getElementById('descriptionSpend').value = '';
        }
    }

    closeSpendMoneyModal() {
        const spendMoneyModal = document.getElementById('spendMoneyModal');
        if (spendMoneyModal) {
            spendMoneyModal.style.display = 'none';
            document.getElementById('amountSpend').value = '';
            document.getElementById('descriptionSpend').value = '';
            document.getElementById('numberPadSpend').style.display = 'none';
        }
    }

    saveEdit() {
        if (!this.editingTransactionId) return;

        const transaction = this.transactions.find(t => t.id === this.editingTransactionId);
        if (!transaction) return;

        const newAmount = parseFloat(this.editAmount.value);
        if (!newAmount || newAmount <= 0) {
            this.showError('Please enter a valid amount');
            return;
        }

        if (transaction.type === 'spend' && !this.editCategory.value) {
            this.showError('Please select a category');
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
        this.categoriesManagerPanel.style.display = isHidden ? 'flex' : 'none';
    }

    addCategory() {
        const categoryName = this.newCategoryInput.value.trim();
        if (!categoryName) {
            this.showError('Please enter a category name');
            return;
        }

        if (this.categories.includes(categoryName)) {
            this.showError('This category already exists');
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

        const categorySelectSpend = document.getElementById('categorySpend');
        if (categorySelectSpend) {
            categorySelectSpend.innerHTML = '<option value="">Select category</option>';
            this.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categorySelectSpend.appendChild(option);
            });
        }

        if (this.categoriesList) {
            this.categoriesList.innerHTML = this.categories.map(cat => `
                <div class="category-item">
                    <span>${this.escapeHtml(cat)}</span>
                    <button type="button" class="btn-remove-category" onclick="tracker.removeCategory('${this.escapeHtml(cat)}')">✕</button>
                </div>
            `).join('');
        }

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

    updateCategoryPillsSpend() {
        const categoryPillsSpend = document.getElementById('categoryPillsSpend');
        if (!categoryPillsSpend) return;

        categoryPillsSpend.innerHTML = this.categories.map(cat => `
            <button type="button" class="category-pill" onclick="tracker.selectCategorySpend('${this.escapeHtml(cat)}')">
                ${this.escapeHtml(cat)}
            </button>
        `).join('');
    }

    selectCategorySpend(cat) {
        const categorySelectSpend = document.getElementById('categorySpend');
        if (categorySelectSpend) {
            categorySelectSpend.value = cat;
        }
        const categoryPillsSpend = document.getElementById('categoryPillsSpend');
        if (categoryPillsSpend) {
            categoryPillsSpend.querySelectorAll('.category-pill').forEach(pill => {
                pill.classList.remove('active');
            });
            event.target.classList.add('active');
        }
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
        const localeMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'ar': 'ar-SA'
        };
        const locale = localeMap[this.language] || 'en-US';

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: this.currency || 'USD',
        }).format(amount);
    }

    formatNumber(num) {
        const localeMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'ar': 'ar-SA'
        };
        const locale = localeMap[this.language] || 'en-US';

        return new Intl.NumberFormat(locale).format(num);
    }

    render() {
        this.renderBalance();
        this.renderMonthlyStats();
        this.renderStats();
        this.renderCategoryBreakdown();
    }

    renderBalance() {
        const balance = this.calculateBalance();
        const formattedBalance = this.formatCurrency(balance);
        this.totalBalance.textContent = formattedBalance;

        const balanceMinimal = document.getElementById('balanceMinimal');
        if (balanceMinimal) {
            balanceMinimal.textContent = formattedBalance;
            const balanceDisplay = document.querySelector('.balance-display-minimal');
            if (balance < 0) {
                balanceDisplay.classList.add('negative');
            } else {
                balanceDisplay.classList.remove('negative');
            }
        }

        const summaryCardBalance = document.querySelector('.summary-card.balance');
        if (summaryCardBalance) {
            if (balance < 0) {
                summaryCardBalance.classList.add('negative');
            } else {
                summaryCardBalance.classList.remove('negative');
            }
        }
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
        document.getElementById('totalTransactions').textContent = this.formatNumber(this.transactions.length);
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


    goToAnalytics() {
        document.getElementById('quickAddScreen').style.display = 'none';
        document.getElementById('analyticsScreen').style.display = 'block';
    }

    goToQuickAdd() {
        document.getElementById('analyticsScreen').style.display = 'none';
        document.getElementById('quickAddScreen').style.display = 'block';
    }

    showScreen(screenName) {
        const screens = ['quickAddScreen', 'analyticsScreen', 'goalsScreen', 'settingsScreen'];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                el.scrollTop = 0;
            }
        });

        const header = document.querySelector('header');
        if (header) header.style.display = screenName === 'home' ? 'flex' : 'none';

        if (screenName === 'home') {
            const el = document.getElementById('quickAddScreen');
            if (el) el.style.display = 'block';
        } else if (screenName === 'analytics') {
            const el = document.getElementById('analyticsScreen');
            if (el) el.style.display = 'block';
        } else if (screenName === 'goals') {
            const el = document.getElementById('goalsScreen');
            if (el) el.style.display = 'block';
            this.renderGoalsScreen();
        } else if (screenName === 'settings') {
            const el = document.getElementById('settingsScreen');
            if (el) {
                el.style.display = 'block';
                this.numberPadToggle.checked = this.useNumberPad;
                this.updateLanguageButtons();
                this.updateCurrencyButtons();
            }
        }

        this.updateMenuBar(screenName);
    }

    updateMenuBar(screenName) {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        const screens = { home: 0, goals: 1, analytics: 2, settings: 3 };
        const index = screens[screenName];
        if (index !== undefined) {
            document.querySelectorAll('.menu-item')[index].classList.add('active');
        }
    }

    addGoal() {
        const goalNameInput = document.getElementById('goalName');
        const goalAmountInput = document.getElementById('goalAmount');
        const goalName = goalNameInput.value.trim();
        const goalAmount = parseFloat(goalAmountInput.value);

        if (!goalName) {
            this.showError('Please enter a goal name');
            return;
        }
        if (isNaN(goalAmount) || goalAmount <= 0) {
            this.showError('Please enter a valid goal amount');
            return;
        }

        const goal = {
            id: Date.now(),
            name: goalName,
            target: goalAmount,
            saved: 0,
            createdDate: new Date().toISOString()
        };

        this.goals.push(goal);
        this.saveGoals();
        goalNameInput.value = '';
        goalAmountInput.value = '';
        this.renderGoalsScreen();
    }

    deleteGoal(goalId) {
        this.goals = this.goals.filter(g => g.id !== goalId);
        this.saveGoals();
        this.renderGoalsScreen();
    }

    addMoneyToGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        this.currentGoalContributionId = goalId;
        this.currentGoalContributionAmount = '';
        document.getElementById('goalContributionName').textContent = goal.name;

        const goalNumberPad = document.getElementById('goalNumberPad');
        const goalInput = document.getElementById('goalContributionInput');

        if (this.useNumberPad) {
            goalNumberPad.style.display = 'grid';
            goalInput.style.display = 'none';
        } else {
            goalNumberPad.style.display = 'none';
            goalInput.style.display = 'block';
            goalInput.value = '';
            goalInput.focus();
        }

        document.getElementById('goalContributionModal').style.display = 'flex';
        this.updateGoalContributionDisplay();
    }

    addToGoalAmount(value) {
        if (value === '.' && this.currentGoalContributionAmount.includes('.')) {
            return;
        }
        this.currentGoalContributionAmount += value;
        this.updateGoalContributionDisplay();
    }

    deleteFromGoalAmount() {
        this.currentGoalContributionAmount = this.currentGoalContributionAmount.slice(0, -1);
        this.updateGoalContributionDisplay();
    }

    clearGoalAmount() {
        this.currentGoalContributionAmount = '';
        this.updateGoalContributionDisplay();
    }

    updateGoalContributionDisplay() {
        const goalInput = document.getElementById('goalContributionInput');

        if (!this.useNumberPad && goalInput.style.display !== 'none') {
            this.currentGoalContributionAmount = goalInput.value;
        }

        const amount = this.currentGoalContributionAmount || '0';
        const formattedAmount = this.formatCurrency(parseFloat(amount) || 0);
        document.getElementById('contributionAmount').textContent = formattedAmount;
    }

    confirmGoalContribution() {
        if (!this.currentGoalContributionAmount || isNaN(parseFloat(this.currentGoalContributionAmount))) {
            this.showError('Please enter a valid amount');
            return;
        }

        const amount = parseFloat(this.currentGoalContributionAmount);
        if (amount <= 0) {
            this.showError('Amount must be greater than 0');
            return;
        }

        const currentBalance = this.calculateBalance();
        if (currentBalance - amount < 0) {
            this.showError('Insufficient balance! You cannot add more than you have.');
            return;
        }

        const goal = this.goals.find(g => g.id === this.currentGoalContributionId);
        if (!goal) return;

        goal.saved += amount;
        if (goal.saved > goal.target) {
            goal.saved = goal.target;
        }

        this.transactions.unshift({
            id: Date.now(),
            description: `Added to goal: ${goal.name}`,
            amount: amount,
            type: 'spend',
            category: 'Goals',
            date: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
        });

        this.saveGoals();
        this.saveTransactions();
        this.closeGoalContribution();
        this.render();
        this.renderGoalsScreen();
    }

    closeGoalContribution() {
        document.getElementById('goalContributionModal').style.display = 'none';
        this.currentGoalContributionId = null;
        this.currentGoalContributionAmount = '';
    }

    renderGoalsScreen() {
        const container = document.getElementById('goalsList');
        if (!container) return;

        if (this.goals.length === 0) {
            container.innerHTML = '<p class="empty-state">No goals yet. Create one to get started!</p>';
            return;
        }

        container.innerHTML = this.goals.map(goal => {
            const percentage = Math.min((goal.saved / goal.target) * 100, 100);
            const isCompleted = goal.saved >= goal.target;
            return `
                <div class="goal-item ${isCompleted ? 'completed' : ''}">
                    <div class="goal-header">
                        <div class="goal-name">${this.escapeHtml(goal.name)}</div>
                        <button type="button" class="btn-delete-goal" onclick="tracker.deleteGoal(${goal.id})" title="Delete goal">✕</button>
                    </div>
                    <div class="goal-progress">
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="goal-progress-text">${Math.round(percentage)}%</div>
                    </div>
                    <div class="goal-amounts">
                        <div class="goal-saved">${this.formatCurrency(goal.saved)}</div>
                        <div class="goal-divider">/</div>
                        <div class="goal-target">${this.formatCurrency(goal.target)}</div>
                    </div>
                    <div class="goal-actions">
                        <button type="button" class="btn-add-money-goal" onclick="tracker.addMoneyToGoal(${goal.id})">💰 Add Money</button>
                        ${isCompleted ? '<span class="goal-completed-badge">✓ Completed!</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    setLanguage(lang) {
        console.log('setLanguage called with:', lang);
        this.language = lang;
        localStorage.setItem('moneyTrackerLanguage', lang);
        this.updateLanguage();
        this.updateLanguageButtons();
        this.render();
        console.log('Language set to:', this.language);
    }

    updateLanguageButtons() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-lang') === this.language) {
                btn.classList.add('active');
            }
        });
    }

    toggleNumberPadOption() {
        this.useNumberPad = this.numberPadToggle.checked;
        localStorage.setItem('moneyTrackerUseNumberPad', JSON.stringify(this.useNumberPad));
        this.numberPad.style.display = this.useNumberPad ? 'block' : 'none';
        this.updateAmountInputMode();
    }

    updateAmountInputMode() {
        if (this.useNumberPad) {
            this.amountInput.inputMode = 'none';
        } else {
            this.amountInput.inputMode = 'decimal';
        }
    }

    handleResetClick() {
        const btn = document.getElementById('resetBalanceBtn');
        if (!this.resetConfirmPending) {
            this.resetConfirmPending = true;
            const originalText = btn.textContent;
            btn.textContent = '⚠️ Click again to confirm!';
            btn.classList.add('confirm-click');
            setTimeout(() => {
                this.resetConfirmPending = false;
                btn.textContent = originalText;
                btn.classList.remove('confirm-click');
            }, 3000);
        } else {
            this.resetConfirmPending = false;
            const savedCurrency = this.currency;
            this.transactions = [];
            this.saveTransactions();
            this.currency = savedCurrency;
            localStorage.setItem('moneyTrackerCurrency', savedCurrency);
            this.showScreen('home');
            this.render();
            btn.classList.remove('confirm-click');
            const originalText = btn.getAttribute('data-i18n') ? this.getTranslation('resetBalance') : 'Reset Balance';
            btn.textContent = originalText;
        }
    }

    getTranslation(key) {
        const translations = {
            en: { resetBalance: 'Reset Balance' },
            es: { resetBalance: 'Reiniciar Saldo' },
            fr: { resetBalance: 'Réinitialiser le Solde' },
            ar: { resetBalance: 'إعادة تعيين الرصيد' }
        };
        return translations[this.language][key] || 'Reset Balance';
    }

    updateLanguage() {
        const translations = {
            en: {
                addSpend: 'Add or Spend Money',
                amount: 'Amount ($)',
                whatDidYouBuy: 'What did you buy? (optional)',
                descriptionPlaceholder: 'e.g., Groceries, Gas, Movie tickets...',
                chooseCategory: 'Choose Category',
                addMoney: '+ Add Money',
                spendMoney: '- Spend Money',
                manageCategories: '⚙️ Manage Categories',
                editCategories: 'Edit Categories',
                addNewCategory: 'Add new category',
                addBtn: '+ Add',
                balance: 'Current Balance',
                clickHint: 'Click to see history',
                thisMonth: 'This Month',
                spent: 'Spent',
                added: 'Added',
                quickStats: 'Quick Stats',
                biggest: 'Biggest Expense',
                totalTx: 'Total Transactions',
                daily: 'Daily Average',
                categoryBreakdown: 'Spending by Category',
                history: 'Transaction History',
                search: 'Search transactions...',
                editTx: 'Edit Transaction',
                description: 'Description',
                category: 'Category',
                save: 'Save',
                delete: 'Delete',
                cancel: 'Cancel',
                settings: 'Settings',
                language: 'Language',
                currency: 'Currency',
                useNumberPad: 'Use Virtual Number Pad',
                undoBtn: 'Undo',
                clearAll: 'Clear All',
                resetBalance: 'Reset Balance',
                home: 'Home',
                goals: 'Goals',
                analytics: 'Analytics',
                savingsGoals: 'Savings Goals',
                goalName: 'Goal Name',
                goalAmount: 'Target Amount',
                addGoal: 'Add Goal',
                noGoals: 'No goals yet. Create one to get started!',
                tips: 'Tips'
            },
            es: {
                addSpend: 'Agregar o Gastar Dinero',
                amount: 'Cantidad ($)',
                whatDidYouBuy: '¿Qué compraste? (opcional)',
                descriptionPlaceholder: 'p. ej., Groceries, Gasolina, Entradas de cine...',
                chooseCategory: 'Seleccionar Categoría',
                addMoney: '+ Agregar Dinero',
                spendMoney: '- Gastar Dinero',
                manageCategories: '⚙️ Administrar Categorías',
                editCategories: 'Editar Categorías',
                addNewCategory: 'Agregar nueva categoría',
                addBtn: '+ Agregar',
                balance: 'Saldo Actual',
                clickHint: 'Haz clic para ver el historial',
                thisMonth: 'Este Mes',
                spent: 'Gastado',
                added: 'Agregado',
                quickStats: 'Estadísticas Rápidas',
                biggest: 'Gasto Más Grande',
                totalTx: 'Transacciones Totales',
                daily: 'Promedio Diario',
                categoryBreakdown: 'Gasto por Categoría',
                history: 'Historial de Transacciones',
                search: 'Buscar transacciones...',
                editTx: 'Editar Transacción',
                description: 'Descripción',
                category: 'Categoría',
                save: 'Guardar',
                delete: 'Eliminar',
                cancel: 'Cancelar',
                settings: 'Configuración',
                language: 'Idioma',
                currency: 'Moneda',
                useNumberPad: 'Usar Teclado Numérico Virtual',
                undoBtn: 'Deshacer',
                clearAll: 'Limpiar Todo',
                resetBalance: 'Reiniciar Saldo',
                home: 'Inicio',
                goals: 'Objetivos',
                analytics: 'Análisis',
                savingsGoals: 'Objetivos de Ahorro',
                goalName: 'Nombre del Objetivo',
                goalAmount: 'Cantidad Objetivo',
                addGoal: 'Agregar Objetivo',
                noGoals: '¡Sin objetivos aún. Crea uno para empezar!',
                tips: 'Consejos'
            },
            fr: {
                addSpend: 'Ajouter ou Dépenser de l\'Argent',
                amount: 'Montant ($)',
                whatDidYouBuy: 'Qu\'avez-vous acheté? (optionnel)',
                descriptionPlaceholder: 'ex., Épicerie, Essence, Billets de cinéma...',
                chooseCategory: 'Choisir une Catégorie',
                addMoney: '+ Ajouter de l\'Argent',
                spendMoney: '- Dépenser de l\'Argent',
                manageCategories: '⚙️ Gérer les Catégories',
                editCategories: 'Modifier les Catégories',
                addNewCategory: 'Ajouter une nouvelle catégorie',
                addBtn: '+ Ajouter',
                balance: 'Solde Actuel',
                clickHint: 'Cliquez pour voir l\'historique',
                thisMonth: 'Ce Mois',
                spent: 'Dépensé',
                added: 'Ajouté',
                quickStats: 'Statistiques Rapides',
                biggest: 'Plus Grande Dépense',
                totalTx: 'Transactions Totales',
                daily: 'Moyenne Quotidienne',
                categoryBreakdown: 'Dépenses par Catégorie',
                history: 'Historique des Transactions',
                search: 'Rechercher des transactions...',
                editTx: 'Modifier la Transaction',
                description: 'Description',
                category: 'Catégorie',
                save: 'Enregistrer',
                delete: 'Supprimer',
                cancel: 'Annuler',
                settings: 'Paramètres',
                language: 'Langue',
                currency: 'Devise',
                useNumberPad: 'Utiliser le Clavier Numérique Virtuel',
                undoBtn: 'Annuler',
                clearAll: 'Tout Effacer',
                resetBalance: 'Réinitialiser le Solde',
                home: 'Accueil',
                goals: 'Objectifs',
                analytics: 'Analytique',
                savingsGoals: 'Objectifs d\'Épargne',
                goalName: 'Nom de l\'Objectif',
                goalAmount: 'Montant Cible',
                addGoal: 'Ajouter un Objectif',
                noGoals: 'Pas d\'objectifs pour le moment. Créez-en un pour commencer!',
                tips: 'Conseils'
            },
            ar: {
                addSpend: 'إضافة أو إنفاق الأموال',
                amount: 'المبلغ ($)',
                whatDidYouBuy: 'ماذا اشتريت؟ (اختياري)',
                descriptionPlaceholder: 'مثال: البقالة، الوقود، تذاكر السينما...',
                chooseCategory: 'اختر الفئة',
                addMoney: '+ إضافة أموال',
                spendMoney: '- إنفاق الأموال',
                manageCategories: '⚙️ إدارة الفئات',
                editCategories: 'تعديل الفئات',
                addNewCategory: 'إضافة فئة جديدة',
                addBtn: '+ إضافة',
                balance: 'الرصيد الحالي',
                clickHint: 'انقر لمشاهدة السجل',
                thisMonth: 'هذا الشهر',
                spent: 'مصروف',
                added: 'مضاف',
                quickStats: 'إحصائيات سريعة',
                biggest: 'أكبر نفقة',
                totalTx: 'إجمالي المعاملات',
                daily: 'المتوسط اليومي',
                categoryBreakdown: 'الإنفاق حسب الفئة',
                history: 'سجل المعاملات',
                search: 'البحث عن المعاملات...',
                editTx: 'تعديل المعاملة',
                description: 'الوصف',
                category: 'الفئة',
                save: 'حفظ',
                delete: 'حذف',
                cancel: 'إلغاء',
                settings: 'الإعدادات',
                language: 'اللغة',
                currency: 'العملة',
                useNumberPad: 'استخدام لوحة الأرقام الافتراضية',
                undoBtn: 'تراجع',
                clearAll: 'مسح الكل',
                resetBalance: 'إعادة تعيين الرصيد',
                home: 'الرئيسية',
                goals: 'الأهداف',
                analytics: 'التحليلات',
                savingsGoals: 'أهداف الادخار',
                goalName: 'اسم الهدف',
                goalAmount: 'المبلغ المستهدف',
                addGoal: 'إضافة هدف',
                noGoals: 'لا توجد أهداف حتى الآن. أنشئ واحدة للبدء!',
                tips: 'نصائح'
            }
        };

        const t = translations[this.language] || translations.en;
        console.log('Translating with:', Object.keys(t).length, 'keys');

        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        console.log('Found', elements.length, 'elements to translate');

        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                const oldText = el.textContent;
                // For labels with input children, replace text node only
                if (el.tagName === 'LABEL' && el.querySelector('input')) {
                    for (let i = 0; i < el.childNodes.length; i++) {
                        if (el.childNodes[i].nodeType === 3) { // Text node
                            el.childNodes[i].textContent = ' ' + t[key];
                            break;
                        }
                    }
                } else {
                    el.textContent = t[key];
                }
                console.log('Updated:', key, 'from', oldText, 'to', t[key]);
            }
        });

        // Update all elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (t[key]) {
                el.placeholder = t[key];
            }
        });

        // Set document direction for RTL languages
        if (this.language === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
        }

        console.log('✓ Language fully updated to:', this.language);
    }

    loadLanguage() {
        return localStorage.getItem('moneyTrackerLanguage') || 'en';
    }

    loadNumberPadSetting() {
        const saved = localStorage.getItem('moneyTrackerUseNumberPad');
        return saved ? JSON.parse(saved) : true;
    }

    setCurrency(curr) {
        console.log('setCurrency called with:', curr);
        this.currency = curr;
        localStorage.setItem('moneyTrackerCurrency', curr);
        this.updateCurrencyButtons();
        this.render();
        console.log('Currency set to:', this.currency);
    }

    updateCurrencyButtons() {
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-currency') === this.currency) {
                btn.classList.add('active');
            }
        });
    }

    loadCurrency() {
        return localStorage.getItem('moneyTrackerCurrency') || 'USD';
    }

    loadGoals() {
        const saved = localStorage.getItem('moneyTrackerGoals');
        return saved ? JSON.parse(saved) : [];
    }

    saveGoals() {
        localStorage.setItem('moneyTrackerGoals', JSON.stringify(this.goals));
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
