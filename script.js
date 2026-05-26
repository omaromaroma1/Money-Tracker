class MoneyTracker {
    constructor() {
        this.transactions = this.loadTransactions();
        this.categories = this.loadCategories();
        this.goals = this.loadGoals();
        this.recurring = this.loadRecurring();
        this.lastDeletedTransaction = null;
        this.language = this.loadLanguage();
        this.useNumberPad = this.loadNumberPadSetting();
        this.currency = this.loadCurrency();
        this.resetConfirmPending = false;
        this.currentGoalContributionId = null;
        this.currentGoalContributionAmount = '';
        this.goalContributionMode = 'add';
        this.pendingDeleteGoalId = null;
        this.recType = 'spend';
        this.recFreq = 'weekly';
        this.editingRecurringId = null;
        this.pendingDeleteRecurringId = null;
        this.initElements();
        this.updateAmountInputMode();
        this.setupEventListeners();
        this.initTheme();
        this.renderCategories();
        this.updateLanguage();
        this.checkRecurring();
        this.render();
        this.renderRecurringList();
        this.renderRecurringAnalytics();
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

    showSuccess(message) {
        document.getElementById('successMessage').textContent = message;
        document.getElementById('successModal').style.display = 'flex';
    }

    closeSuccess() {
        document.getElementById('successModal').style.display = 'none';
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
        this.undoContainer = document.getElementById('undoContainer');
        this.undoRingProgress = document.getElementById('undoRingProgress');
        this.undoTimer = null;
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

    animateDeleteTransaction(id) {
        const row = this.historyTransactionsList.querySelector(`[data-id="${id}"]`);
        if (row) {
            row.classList.add('deleting');
            row.addEventListener('animationend', () => {
                this.deleteTransaction(id);
                this.filterTransactionsInModal();
            }, { once: true });
        } else {
            this.deleteTransaction(id);
            this.filterTransactionsInModal();
        }
    }

    deleteTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        this.lastDeletedTransaction = transaction;
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
        this.render();
        this.showUndoWithCountdown();
    }

    showUndoWithCountdown() {
        if (this.undoTimer) clearTimeout(this.undoTimer);
        this.undoRingProgress.classList.remove('counting');
        void this.undoRingProgress.offsetWidth;
        this.undoContainer.style.display = 'flex';
        this.undoRingProgress.classList.add('counting');
        this.undoTimer = setTimeout(() => {
            this.undoContainer.style.display = 'none';
            this.undoRingProgress.classList.remove('counting');
            this.lastDeletedTransaction = null;
            this.undoTimer = null;
        }, 10000);
    }

    undoLastTransaction() {
        if (this.lastDeletedTransaction) {
            if (this.undoTimer) { clearTimeout(this.undoTimer); this.undoTimer = null; }
            this.undoContainer.style.display = 'none';
            this.undoRingProgress.classList.remove('counting');
            this.transactions.unshift(this.lastDeletedTransaction);
            this.saveTransactions();
            this.lastDeletedTransaction = null;
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
            transaction.description = this.editDescription.value || this.editCategory.value;
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
                <div class="history-transaction-item ${transaction.type}" data-id="${transaction.id}">
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
                            <button type="button" class="btn-delete-modal" onclick="tracker.animateDeleteTransaction(${transaction.id})" title="Delete">🗑️</button>
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

    renderCharts() {
        this.renderBalanceChart();
        this.renderSpendingChart();
        this.renderRecurringAnalytics();
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
        const breakdown = this.getCategoryBreakdown();
        const topCat = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0];
        const el = document.getElementById('biggestExpense');
        el.textContent = topCat ? `${topCat[0]}: ${this.formatCurrency(topCat[1])}` : '-';
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
            setTimeout(() => this.renderCharts(), 50);
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
        if (this.pendingDeleteGoalId !== goalId) {
            this.pendingDeleteGoalId = goalId;
            this.renderGoalsScreen();
            return;
        }
        const goal = this.goals.find(g => g.id === goalId);
        if (goal && goal.saved > 0) {
            this.transactions.unshift({
                id: Date.now(),
                description: `Goal deleted: ${goal.name}`,
                amount: goal.saved,
                type: 'add',
                category: null,
                date: new Date().toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                }),
            });
            this.saveTransactions();
        }
        this.pendingDeleteGoalId = null;
        this.goals = this.goals.filter(g => g.id !== goalId);
        this.saveGoals();
        this.render();
        this.renderGoalsScreen();
    }

    addMoneyToGoal(goalId) {
        this.openGoalContributionModal(goalId, 'add');
    }

    withdrawFromGoal(goalId) {
        this.openGoalContributionModal(goalId, 'withdraw');
    }

    openGoalContributionModal(goalId, mode) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        this.currentGoalContributionId = goalId;
        this.currentGoalContributionAmount = '';
        this.goalContributionMode = mode;

        document.getElementById('goalContributionName').textContent = goal.name;

        const isWithdraw = mode === 'withdraw';
        document.getElementById('goalContributionTitle').innerHTML =
            `${isWithdraw ? '💸 Withdraw from' : '💰 Add Money to'} <span id="goalContributionName">${this.escapeHtml(goal.name)}</span>`;
        document.getElementById('contributionLabel').textContent =
            isWithdraw ? 'Amount to Withdraw:' : 'Amount to Add:';
        const confirmBtn = document.getElementById('goalContributionConfirmBtn');
        confirmBtn.textContent = isWithdraw ? 'Withdraw' : 'Add to Goal';
        confirmBtn.style.background = isWithdraw
            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
            : '';

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

        const goal = this.goals.find(g => g.id === this.currentGoalContributionId);
        if (!goal) return;

        if (this.goalContributionMode === 'withdraw') {
            if (amount > goal.saved) {
                this.showError(`You only have ${this.formatCurrency(goal.saved)} saved in this goal.`);
                return;
            }
            goal.saved -= amount;
            this.transactions.unshift({
                id: Date.now(),
                description: `Withdrew from goal: ${goal.name}`,
                amount,
                type: 'add',
                category: 'Goals',
                date: new Date().toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                }),
            });
        } else {
            const currentBalance = this.calculateBalance();
            if (currentBalance - amount < 0) {
                this.showError('Insufficient balance! You cannot add more than you have.');
                return;
            }
            const wasComplete = goal.saved >= goal.target;
            goal.saved += amount;
            if (goal.saved > goal.target) goal.saved = goal.target;
            const justCompleted = !wasComplete && goal.saved >= goal.target;

            this.transactions.unshift({
                id: Date.now(),
                description: `Added to goal: ${goal.name}`,
                amount,
                type: 'spend',
                category: 'Goals',
                date: new Date().toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                }),
            });

            this.saveGoals();
            this.saveTransactions();
            this.closeGoalContribution();
            this.render();
            this.renderGoalsScreen();
            if (justCompleted) this.triggerConfetti();
            return;
        }

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
                        <button type="button" class="btn-delete-goal ${this.pendingDeleteGoalId === goal.id ? 'confirm' : ''}" onclick="tracker.deleteGoal(${goal.id})" title="Delete goal">${this.pendingDeleteGoalId === goal.id ? 'Sure?' : '✕'}</button>
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
                        <button type="button" class="btn-add-money-goal" onclick="tracker.addMoneyToGoal(${goal.id})">💰 Add</button>
                        ${goal.saved > 0 ? `<button type="button" class="btn-withdraw-goal" onclick="tracker.withdrawFromGoal(${goal.id})">💸 Withdraw</button>` : ''}
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
                tips: 'Tips',
                goalsTip: '💭 Tips: The progress bar automatically caps at 100% when you reach your target. Create multiple goals for different savings targets!'
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
                tips: 'Consejos',
                goalsTip: '💭 Consejos: La barra de progreso se limita automáticamente al 100% cuando alcanzas tu objetivo. ¡Crea múltiples objetivos para diferentes metas de ahorro!'
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
                tips: 'Conseils',
                goalsTip: '💭 Conseils: La barre de progression se limite automatiquement à 100% lorsque vous atteignez votre objectif. Créez plusieurs objectifs pour différentes cibles d\'épargne!'
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
                tips: 'نصائح',
                goalsTip: '💭 نصائح: يتوقف شريط التقدم تلقائياً عند 100% عند الوصول إلى هدفك. أنشئ أهدافاً متعددة لأهداف ادخار مختلفة!'
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

    // ── Recurring ──────────────────────────────────────────────
    loadRecurring() {
        const saved = localStorage.getItem('moneyTrackerRecurring');
        return saved ? JSON.parse(saved) : [];
    }

    saveRecurring() {
        localStorage.setItem('moneyTrackerRecurring', JSON.stringify(this.recurring));
    }

    checkRecurring() {
        const todayStr = new Date().toISOString().split('T')[0];
        let fired = false;
        this.recurring.forEach(rec => {
            if (todayStr >= rec.nextDue) {
                this.transactions.unshift({
                    id: Date.now() + Math.random(),
                    description: rec.description,
                    amount: parseFloat(rec.amount),
                    type: rec.type,
                    category: rec.category,
                    date: new Date().toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    }),
                });
                const due = new Date(rec.nextDue + 'T12:00:00');
                if (rec.frequency === 'daily') due.setDate(due.getDate() + 1);
                else if (rec.frequency === 'weekly') due.setDate(due.getDate() + 7);
                else due.setMonth(due.getMonth() + 1);
                rec.nextDue = due.toISOString().split('T')[0];
                fired = true;
            }
        });
        if (fired) { this.saveTransactions(); this.saveRecurring(); }
    }

    openRecurringModal(id) {
        const modal = document.getElementById('recurringModal');
        if (!modal) return;
        this.pendingDeleteRecurringId = null;
        this.editingRecurringId = id || null;
        const rec = id ? this.recurring.find(r => r.id === id) : null;
        document.getElementById('recModalTitle').textContent = rec ? '✏️ Edit Recurring' : '🔄 Recurring Transaction';
        document.getElementById('recSaveBtn').textContent = rec ? '💾 Update Recurring' : '💾 Save Recurring';
        document.getElementById('recName').value = rec ? rec.description : '';
        document.getElementById('recAmount').value = rec ? rec.amount : '';
        document.getElementById('recStartDate').value = rec ? rec.nextDue : new Date().toISOString().split('T')[0];
        this.recType = rec ? rec.type : 'spend';
        document.querySelectorAll('.rec-type-pill').forEach(b => b.classList.toggle('active', b.dataset.type === this.recType));
        this.recFreq = rec ? rec.frequency : 'weekly';
        document.querySelectorAll('.rec-freq-pills .freq-btn').forEach(b => b.classList.toggle('active', b.dataset.freq === this.recFreq));
        modal.style.display = 'flex';
    }

    closeRecurringModal() {
        const modal = document.getElementById('recurringModal');
        if (modal) modal.style.display = 'none';
        this.editingRecurringId = null;
    }

    setRecType(type) {
        this.recType = type;
        document.querySelectorAll('.rec-type-pill').forEach(b => b.classList.toggle('active', b.dataset.type === type));
    }

    setRecFreq(freq) {
        this.recFreq = freq;
        document.querySelectorAll('.rec-freq-pills .freq-btn').forEach(b => b.classList.toggle('active', b.dataset.freq === freq));
    }

    saveRecurringTransaction() {
        const name = document.getElementById('recName').value.trim();
        const amount = parseFloat(document.getElementById('recAmount').value);
        const startDate = document.getElementById('recStartDate').value;
        if (!name) { this.showError('Please enter a description'); return; }
        if (!amount || amount <= 0) { this.showError('Please enter a valid amount'); return; }
        if (!startDate) { this.showError('Please pick a start date'); return; }
        if (this.editingRecurringId) {
            const rec = this.recurring.find(r => r.id === this.editingRecurringId);
            if (rec) { rec.description = name; rec.amount = amount; rec.type = this.recType; rec.frequency = this.recFreq; rec.nextDue = startDate; }
        } else {
            this.recurring.push({ id: Date.now(), description: name, amount, type: this.recType, category: null, frequency: this.recFreq, nextDue: startDate });
        }
        this.saveRecurring();
        this.checkRecurring();
        this.render();
        this.renderRecurringList();
        this.renderRecurringAnalytics();
        this.closeRecurringModal();
    }

    deleteRecurring(id) {
        if (this.pendingDeleteRecurringId !== id) {
            this.pendingDeleteRecurringId = id;
            this.renderRecurringList();
            return;
        }
        this.pendingDeleteRecurringId = null;
        this.recurring = this.recurring.filter(r => r.id !== id);
        this.saveRecurring();
        this.renderRecurringList();
        this.renderRecurringAnalytics();
    }

    renderRecurringList() {
        const container = document.getElementById('recurringList');
        if (!container) return;
        if (this.recurring.length === 0) {
            container.innerHTML = '<p class="empty-state" style="padding:12px 0;font-size:0.85em;">No recurring transactions</p>';
            return;
        }
        container.innerHTML = this.recurring.map(rec => {
            const isPending = this.pendingDeleteRecurringId === rec.id;
            const freqLabel = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[rec.frequency] || rec.frequency;
            const typeColor = rec.type === 'add' ? '#10b981' : '#ef4444';
            return `
            <div class="recurring-item">
                <div class="recurring-item-left">
                    <span class="recurring-type-dot" style="background:${typeColor}"></span>
                    <div class="recurring-info">
                        <span class="recurring-desc">${this.escapeHtml(rec.description)}</span>
                        <span class="recurring-meta">${freqLabel} · ${this.formatCurrency(rec.amount)} · next: ${rec.nextDue}</span>
                    </div>
                </div>
                <div class="recurring-actions">
                    <button type="button" class="btn-edit-recurring" onclick="tracker.openRecurringModal(${rec.id})" title="Edit">✏️</button>
                    <button type="button" class="btn-remove-recurring ${isPending ? 'confirm' : ''}" onclick="tracker.deleteRecurring(${rec.id})">${isPending ? 'Sure?' : '✕'}</button>
                </div>
            </div>`;
        }).join('');
    }

    renderRecurringAnalytics() {
        const container = document.getElementById('recurringAnalyticsList');
        if (!container) return;
        if (this.recurring.length === 0) {
            container.innerHTML = '<p class="empty-state" style="padding:12px 0;font-size:0.85em;">No recurring transactions set up</p>';
            return;
        }
        const freqLabel = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
        container.innerHTML = this.recurring.map(rec => `
            <div class="rec-analytics-item">
                <div class="rec-analytics-left">
                    <span class="rec-analytics-badge ${rec.type === 'add' ? 'income' : 'expense'}">${rec.type === 'add' ? '+ Income' : '− Expense'}</span>
                    <span class="rec-analytics-name">${this.escapeHtml(rec.description)}</span>
                </div>
                <div class="rec-analytics-right">
                    <span class="rec-analytics-amount ${rec.type === 'add' ? 'income' : 'expense'}">${rec.type === 'add' ? '+' : '-'}${this.formatCurrency(rec.amount)}</span>
                    <span class="rec-analytics-freq">${freqLabel[rec.frequency] || rec.frequency} · next ${rec.nextDue}</span>
                </div>
            </div>
        `).join('');
    }

    // ── Export CSV ─────────────────────────────────────────────
    exportToCSV() {
        const headers = ['Date', 'Description', 'Type', 'Amount', 'Category'];
        const rows = this.transactions.map(t => [
            `"${t.date}"`,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            t.type,
            t.amount.toFixed(2),
            `"${(t.category || '').replace(/"/g, '""')}"`
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Import CSV ─────────────────────────────────────────────
    importFromCSV(input) {
        const file = input.files[0];
        if (!file) return;
        input.value = '';
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split(/\r?\n/).filter(l => l.trim());
                if (lines.length < 2) { this.showError('CSV has no data rows.'); return; }

                // Parse header to find column indices (case-insensitive)
                const parseRow = (line) => {
                    const cols = [];
                    let cur = '', inQuote = false;
                    for (let i = 0; i < line.length; i++) {
                        const ch = line[i];
                        if (ch === '"') {
                            if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
                            else { inQuote = !inQuote; }
                        } else if (ch === ',' && !inQuote) {
                            cols.push(cur.trim()); cur = '';
                        } else { cur += ch; }
                    }
                    cols.push(cur.trim());
                    return cols;
                };

                const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
                const idx = (name) => headers.indexOf(name);
                const iDate = idx('date'), iDesc = idx('description'), iType = idx('type'),
                      iAmt  = idx('amount'), iCat = idx('category');

                if (iAmt === -1 || iType === -1) {
                    this.showError('CSV must have "Type" and "Amount" columns.'); return;
                }

                let imported = 0, skipped = 0;
                for (let i = 1; i < lines.length; i++) {
                    const cols = parseRow(lines[i]);
                    const type = (cols[iType] || '').toLowerCase();
                    if (type !== 'add' && type !== 'spend') { skipped++; continue; }
                    const amount = parseFloat(cols[iAmt]);
                    if (!amount || amount <= 0) { skipped++; continue; }

                    this.transactions.push({
                        id: Date.now() + Math.random() + i,
                        description: iDesc >= 0 ? (cols[iDesc] || 'Imported') : 'Imported',
                        amount,
                        type,
                        category: iCat >= 0 ? (cols[iCat] || null) : null,
                        date: iDate >= 0 && cols[iDate]
                            ? cols[iDate]
                            : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    });
                    imported++;
                }

                if (imported === 0) { this.showError('No valid rows found in CSV.'); return; }
                this.saveTransactions();
                this.render();
                this.showSuccess(`Imported ${imported} transaction${imported !== 1 ? 's' : ''}${skipped ? ` (${skipped} skipped)` : ''}!`);
            } catch (err) {
                this.showError('Failed to parse CSV. Make sure it\'s a valid file.');
            }
        };
        reader.readAsText(file);
    }

    // ── Confetti ───────────────────────────────────────────────
    triggerConfetti() {
        const colors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#ffffff'];
        for (let i = 0; i < 80; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            const size = Math.random() * 10 + 6;
            piece.style.cssText = `
                left:${Math.random() * 100}vw;
                width:${size}px;
                height:${Math.random() > 0.5 ? size : size * 0.4}px;
                background:${colors[Math.floor(Math.random() * colors.length)]};
                animation-duration:${Math.random() * 2 + 2}s;
                animation-delay:${Math.random() * 0.8}s;
                border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
            `;
            document.body.appendChild(piece);
            piece.addEventListener('animationend', () => piece.remove());
        }
    }

    // ── Charts ─────────────────────────────────────────────────
    renderSpendingChart() {
        const canvas = document.getElementById('spendingChart');
        const emptyEl = document.getElementById('spendingChartEmpty');
        if (!canvas) return;

        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), dateStr: d.toDateString(), amount: 0 });
        }
        this.transactions.filter(t => t.type === 'spend').forEach(t => {
            const tDate = new Date(t.date);
            if (isNaN(tDate)) return;
            const day = days.find(d => d.dateStr === tDate.toDateString());
            if (day) day.amount += t.amount;
        });

        const maxAmount = Math.max(...days.map(d => d.amount), 1);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width) return;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;
        const pad = { top: 16, right: 10, bottom: 36, left: 48 };
        const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
        const barW = (cW / 7) * 0.55, barGap = cW / 7;
        const textColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
        const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (cH / 4) * i;
            ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
            ctx.fillStyle = textColor; ctx.font = `10px -apple-system,sans-serif`; ctx.textAlign = 'right';
            ctx.fillText(this.formatCurrency(maxAmount * (1 - i / 4)).replace(/\.00$/, ''), pad.left - 4, y + 4);
        }
        days.forEach((day, i) => {
            const x = pad.left + barGap * i + (barGap - barW) / 2;
            const bH = (day.amount / maxAmount) * cH;
            const y = pad.top + cH - bH;
            if (day.amount > 0) {
                const g = ctx.createLinearGradient(0, y, 0, y + bH);
                g.addColorStop(0, '#f87171'); g.addColorStop(1, '#dc2626');
                ctx.fillStyle = g;
            } else {
                ctx.fillStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
            }
            const r = Math.min(6, bH);
            ctx.beginPath();
            ctx.moveTo(x + r, y); ctx.lineTo(x + barW - r, y);
            ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
            ctx.lineTo(x + barW, y + bH); ctx.lineTo(x, y + bH); ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill();
            ctx.fillStyle = textColor; ctx.font = `10px -apple-system,sans-serif`; ctx.textAlign = 'center';
            ctx.fillText(day.label, x + barW / 2, H - pad.bottom + 16);
        });
        if (emptyEl) emptyEl.style.display = 'none';
    }

    renderBalanceChart() {
        const canvas = document.getElementById('balanceChart');
        const emptyEl = document.getElementById('balanceChartEmpty');
        if (!canvas) return;
        if (this.transactions.length === 0) {
            canvas.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'flex';
            return;
        }
        canvas.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';

        const sorted = [...this.transactions].reverse();
        const points = [];
        let bal = 0;
        sorted.forEach(t => {
            bal += t.type === 'add' ? t.amount : -t.amount;
            points.push(bal);
        });

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width) return;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;
        const pad = { top: 16, right: 10, bottom: 20, left: 52 };
        const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
        const minV = Math.min(...points, 0), maxV = Math.max(...points, 0);
        const range = maxV - minV || 1;
        const textColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
        const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (cH / 4) * i;
            ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
            ctx.fillStyle = textColor; ctx.font = `10px -apple-system,sans-serif`; ctx.textAlign = 'right';
            ctx.fillText(this.formatCurrency(maxV - (range / 4) * i).replace(/\.00$/, ''), pad.left - 4, y + 4);
        }
        const toX = i => pad.left + (points.length < 2 ? cW / 2 : (i / (points.length - 1)) * cW);
        const toY = v => pad.top + cH - ((v - minV) / range) * cH;
        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
        grad.addColorStop(0, 'rgba(99,102,241,0.35)'); grad.addColorStop(1, 'rgba(99,102,241,0.02)');
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(points[0]));
        points.forEach((v, i) => { if (i > 0) ctx.lineTo(toX(i), toY(v)); });
        ctx.lineTo(toX(points.length - 1), pad.top + cH);
        ctx.lineTo(toX(0), pad.top + cH);
        ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(points[0]));
        points.forEach((v, i) => { if (i > 0) ctx.lineTo(toX(i), toY(v)); });
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
        [0, points.length - 1].forEach(i => {
            ctx.beginPath(); ctx.arc(toX(i), toY(points[i]), 4, 0, Math.PI * 2);
            ctx.fillStyle = '#6366f1'; ctx.fill();
            ctx.strokeStyle = isDark ? '#1a1a2e' : '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        });
    }
}

const tracker = new MoneyTracker();
