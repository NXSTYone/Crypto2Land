class CryptoLandApp {
    constructor() {
        this.web3 = window.cryptoLandWeb3;
        this.utils = window.utils;
        this.currentTab = 'dashboard';
        this.selectedTariff = null;
        this.tariffs = [
            { id: 0, name: "Спальный район", dailyPercent: 0.5, duration: 3, premium: false },
            { id: 1, name: "Жилой квартал", dailyPercent: 0.6, duration: 5, premium: false },
            { id: 2, name: "Новый микрорайон", dailyPercent: 0.7, duration: 7, premium: false },
            { id: 3, name: "Деловой центр", dailyPercent: 0.85, duration: 10, premium: true },
            { id: 4, name: "Бизнес-кластер", dailyPercent: 1.0, duration: 15, premium: true },
            { id: 5, name: "Элитный квартал", dailyPercent: 1.2, duration: 20, premium: true },
            { id: 6, name: "Мегаполис", dailyPercent: 1.5, duration: 30, premium: true }
        ];
        this.levels = [
            { level: 1, percentage: 7, turnover: 0, deposit: 10 },
            { level: 2, percentage: 5, turnover: 500, deposit: 50 },
            { level: 3, percentage: 3, turnover: 1000, deposit: 50 },
            { level: 4, percentage: 2.5, turnover: 2000, deposit: 100 },
            { level: 5, percentage: 2, turnover: 3000, deposit: 100 },
            { level: 6, percentage: 1.8, turnover: 5000, deposit: 250 },
            { level: 7, percentage: 1.5, turnover: 7000, deposit: 250 },
            { level: 8, percentage: 1.3, turnover: 10000, deposit: 500 },
            { level: 9, percentage: 1.1, turnover: 15000, deposit: 500 },
            { level: 10, percentage: 1, turnover: 20000, deposit: 750 },
            { level: 11, percentage: 0.9, turnover: 30000, deposit: 750 },
            { level: 12, percentage: 0.8, turnover: 40000, deposit: 1250 },
            { level: 13, percentage: 0.7, turnover: 50000, deposit: 1250 },
            { level: 14, percentage: 0.6, turnover: 75000, deposit: 2000 },
            { level: 15, percentage: 0.5, turnover: 100000, deposit: 2500 }
        ];

        this.selectedWallet = 'metamask';
        this.init();
    }

    async init() {
        // Прелоадер
        setTimeout(() => {
            document.getElementById('preloader').classList.add('hiding');
            setTimeout(() => {
                document.getElementById('preloader').style.display = 'none';
            }, 600);
        }, 1500);

        // Настройка логотипа
        this.setupLogo();
        
        // Установка ссылок на соцсети
        this.setSocialLinks();
        
        this.initEvents();
        this.renderTariffs();
        this.renderLevels();
        await this.checkConnection();
    }

    setupLogo() {
        const logoImage = document.getElementById('logoImage');
        const logoFallback = document.getElementById('logoFallback');
        
        if (CONFIG.LOGO.useCustomLogo) {
            // Пытаемся загрузить кастомный логотип
            const img = new Image();
            img.src = CONFIG.LOGO.logoPath;
            img.onload = () => {
                logoImage.style.display = 'block';
                logoFallback.style.display = 'none';
            };
            img.onerror = () => {
                logoImage.style.display = 'none';
                logoFallback.style.display = 'flex';
            };
        } else {
            logoImage.style.display = 'none';
            logoFallback.style.display = 'flex';
        }
    }

    setSocialLinks() {
        const supportLink = document.getElementById('telegramSupportLink');
        const channelLink = document.getElementById('telegramChannelLink');
        
        if (supportLink) {
            supportLink.href = CONFIG.SOCIAL.TELEGRAM_SUPPORT;
        }
        if (channelLink) {
            channelLink.href = CONFIG.SOCIAL.TELEGRAM_CHANNEL;
        }
    }

    initEvents() {
        // Навигация
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = tab.dataset.tab;
                this.showTab(tabName);
            });
        });

        // Подключение кошелька
        document.getElementById('headerConnectBtn').addEventListener('click', () => {
            this.showWalletModal();
        });

        // Опции кошельков
        document.querySelectorAll('.wallet-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.wallet-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedWallet = option.dataset.wallet;
            });
        });

        // Кнопки в модалке кошелька
        document.getElementById('connectWallet').addEventListener('click', async () => {
            await this.connectWallet();
        });

        document.getElementById('cancelWallet').addEventListener('click', () => {
            this.hideModal('walletModal');
        });

        // Инвестирование
        document.getElementById('confirmInvest').addEventListener('click', async () => {
            await this.processInvestment();
        });

        document.getElementById('cancelInvest').addEventListener('click', () => {
            this.hideModal('investModal');
        });

        document.getElementById('investAmount').addEventListener('input', (e) => {
            this.updateInvestmentSummary();
        });

        // Реферальная система
        document.getElementById('copyRefLink').addEventListener('click', async () => {
            await this.copyReferralLink();
        });

        // Вывод средств
        document.getElementById('withdrawIncomeBtn').addEventListener('click', async () => {
            await this.withdrawIncome();
        });

        document.getElementById('withdrawTaxBtn').addEventListener('click', async () => {
            await this.withdrawTax();
        });

        document.getElementById('checkDepositsBtn').addEventListener('click', async () => {
            await this.checkDeposits();
        });


        // Кнопки "Начать инвестировать"
        document.getElementById('goToInvest').addEventListener('click', () => {
            this.showTab('dashboard');
        });

        document.getElementById('goToInvestFromDistricts').addEventListener('click', () => {
            this.showTab('dashboard');
        });

        // Фильтры депозитов
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.filterDeposits(pill.dataset.filter);
            });
        });

        // Обновление депозитов
        document.getElementById('refreshDeposits').addEventListener('click', async () => {
            await this.loadDeposits();
        });

        // Фильтры рейтинга
        document.querySelectorAll('.ranking-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.ranking-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadRankings(btn.dataset.type);
            });
        });

        // Поиск по рейтингу
        const searchInput = document.querySelector('.ranking-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterRankings(e.target.value);
            });
        }

        // Фильтр по дате в транзакциях
        const dateFilter = document.getElementById('transactionDateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filterTransactionsByDate(e.target.value);
            });
        }

        // Фильтр по типу в транзакциях
        const typeFilter = document.getElementById('transactionTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filterTransactionsByType(e.target.value);
            });
        }

        // Закрытие модалок
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.currentTarget.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        document.getElementById('modalOverlay').addEventListener('click', () => {
            this.hideAllModals();
        });
    }

    async checkConnection() {
        if (window.ethereum && window.ethereum.selectedAddress) {
            try {
                await this.web3.init();
                await this.updateUserInfo();
                this.utils.showNotification('Кошелек подключен', 'success');
                return true;
            } catch (error) {
                return false;
            }
        }
        return false;
    }

    async connectWallet() {
        try {
            this.hideModal('walletModal');
            this.utils.showNotification('Подключение кошелька...', 'info');
            await this.web3.init();
            await this.updateUserInfo();
            this.utils.showNotification('Кошелек успешно подключен!', 'success');
            this.updateReferralLink();
        } catch (error) {
            this.utils.showNotification('Ошибка подключения. Проверьте, установлен ли MetaMask', 'error');
        }
    }


    async updateUserInfo() {
        if (!this.web3 || !this.web3.isConnected) return;
        
        try {
            const balance = await this.web3.getUSDTBalance();
            document.getElementById('headerWalletBalance').textContent = this.utils.formatNumber(balance, 2);
            
            // Мок данные для демонстрации
            document.getElementById('statPopulation').textContent = '127';
            document.getElementById('statTotal').textContent = this.utils.formatNumber(balance * 1.5, 2) + ' USDT';
            document.getElementById('statTaxes').textContent = this.utils.formatNumber(balance * 0.3, 2) + ' USDT';
            document.getElementById('statIncome').textContent = this.utils.formatNumber(balance * 0.1, 2) + ' USDT';
            
            // Обновление казны
            document.getElementById('treasuryIncome').textContent = this.utils.formatNumber(balance * 0.1, 2) + ' USDT';
            document.getElementById('treasuryTax').textContent = this.utils.formatNumber(balance * 0.3, 2) + ' USDT';
            document.getElementById('treasuryDeposit').textContent = this.utils.formatNumber(balance, 2) + ' USDT';
            
            // Сводка по инвестициям
            document.getElementById('summaryTotal').textContent = this.utils.formatNumber(balance, 2) + ' USDT';
            document.getElementById('summaryActive').textContent = this.utils.formatNumber(balance * 0.8, 2) + ' USDT';
            document.getElementById('summaryAccumulated').textContent = this.utils.formatNumber(balance * 0.2, 2) + ' USDT';
            document.getElementById('summaryAvailable').textContent = this.utils.formatNumber(balance * 0.1, 2) + ' USDT';
            
            // Рефералы
            document.getElementById('totalReferrals').textContent = '127';
            document.getElementById('totalTaxes').textContent = this.utils.formatNumber(balance * 0.3, 2) + ' USDT';
            document.getElementById('totalTurnover').textContent = this.utils.formatNumber(balance * 5, 2) + ' USDT';
            
            // Активация кнопок
            document.getElementById('withdrawIncomeBtn').disabled = false;
            document.getElementById('withdrawTaxBtn').disabled = false;
            
        } catch (error) {
            console.error('Update error:', error);
        }
    }

    renderTariffs() {
        const container = document.getElementById('tariffsGrid');
        if (!container) return;
        
        container.innerHTML = this.tariffs.map(tariff => `
            <div class="tariff-card ${tariff.premium ? 'premium' : ''}">
                <div class="tariff-header">
                    <div class="tariff-name">${tariff.name}</div>
                    ${tariff.premium ? '<div class="tariff-badge">VIP</div>' : ''}
                </div>
                <div class="tariff-body">
                    <div class="tariff-percent">${tariff.dailyPercent}%</div>
                    <div class="tariff-period">ежедневно • ${tariff.duration} дней</div>
                    <ul class="tariff-features">
                        <li><i class="fas fa-check-circle"></i> Мин. сумма: 10 USDT</li>
                        <li><i class="fas fa-check-circle"></i> Вывод процентов ежедневно</li>
                        <li><i class="fas fa-check-circle"></i> Комиссия 15% на вывод</li>
                    </ul>
                    <div class="tariff-actions">
                        <button class="tariff-btn primary-btn" data-tariff-id="${tariff.id}">
                            <i class="fas fa-coins"></i>
                            Инвестировать
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.primary-btn[data-tariff-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tariffId = e.currentTarget.dataset.tariffId;
                this.showInvestModal(tariffId);
            });
        });
    }


    renderLevels() {
        const container = document.getElementById('levelsBody');
        if (!container) return;
        
        container.innerHTML = this.levels.map(level => `
            <tr>
                <!-- Условия -->
                <td><span class="level-badge">${level.level}</span></td>
                <td><span class="profit-percent">${level.percentage}%</span></td>
                <td>${this.utils.formatNumber(level.turnover)} USDT</td>
                <td>от ${level.deposit} USDT</td>
                <!-- Статистика -->
                <td>0</td>
                <td>0 USDT</td>
                <td><span class="bonus-inactive">Неактивен</span></td>
            </tr>
        `).join('');
    }

    showTab(tabName) {
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.nav-tab[data-tab="${tabName}"]`).classList.add('active');
        
        this.currentTab = tabName;
        
        if (tabName === 'tax') {
            this.updateReferralLink();
        }
        if (tabName === 'districts') {
            this.loadDeposits();
        }
        if (tabName === 'rankings') {
            this.loadRankings('tax');
        }
    }

    showWalletModal() {
        this.showModal('walletModal');
    }

    showInvestModal(tariffId) {
        this.selectedTariff = this.tariffs[tariffId];
        document.getElementById('investTitle').textContent = `Инвестиция в ${this.selectedTariff.name}`;
        
        const preview = document.getElementById('tariffPreview');
        preview.innerHTML = `
            <div class="preview-header">
                <h4>${this.selectedTariff.name}</h4>
                ${this.selectedTariff.premium ? '<span class="preview-badge">VIP</span>' : ''}
            </div>
            <div class="preview-stats">
                <div class="preview-stat">
                    <span>Доходность:</span>
                    <span class="highlight">${this.selectedTariff.dailyPercent}% в день</span>
                </div>
                <div class="preview-stat">
                    <span>Срок:</span>
                    <span>${this.selectedTariff.duration} дней</span>
                </div>
                <div class="preview-stat">
                    <span>Общая доходность:</span>
                    <span>${(this.selectedTariff.dailyPercent * this.selectedTariff.duration).toFixed(1)}%</span>
                </div>
            </div>
        `;
        
        this.updateAvailableBalance();
        this.updateInvestmentSummary();
        this.showModal('investModal');
    }

    updateAvailableBalance() {
        const balanceElement = document.getElementById('availableBalance');
        if (this.web3 && this.web3.isConnected) {
            this.web3.getUSDTBalance().then(balance => {
                balanceElement.textContent = `${this.utils.formatNumber(balance, 2)} USDT`;
            });
        } else {
            balanceElement.textContent = '0.00 USDT';
        }
    }

    updateInvestmentSummary() {
        const amount = parseFloat(document.getElementById('investAmount').value) || 10;
        if (!this.selectedTariff) return;
        
        const dailyIncome = (amount * this.selectedTariff.dailyPercent) / 100;
        const totalIncome = dailyIncome * this.selectedTariff.duration;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + this.selectedTariff.duration);
        
        document.getElementById('summaryAmount').textContent = `${this.utils.formatNumber(amount, 2)} USDT`;
        document.getElementById('summaryDaily').textContent = `${this.utils.formatNumber(dailyIncome, 2)} USDT`;
        document.getElementById('summaryTotal').textContent = `${this.utils.formatNumber(totalIncome, 2)} USDT`;
        document.getElementById('summaryEndDate').textContent = endDate.toLocaleDateString('ru-RU');
    }


    async processInvestment() {
        if (!this.web3 || !this.web3.isConnected) {
            this.utils.showNotification('Подключите кошелек', 'error');
            this.showWalletModal();
            return;
        }
        
        const amount = parseFloat(document.getElementById('investAmount').value);
        if (amount < 10) {
            this.utils.showNotification('Минимальная сумма 10 USDT', 'error');
            return;
        }
        
        try {
            this.utils.showNotification('Инвестирование...', 'info');
            // Здесь будет вызов контракта
            this.utils.showNotification('Инвестиция успешна!', 'success');
            this.hideModal('investModal');
            await this.updateUserInfo();
        } catch (error) {
            this.utils.showNotification('Ошибка транзакции', 'error');
        }
    }

    updateReferralLink() {
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            document.getElementById('refLinkInput').value = 'Подключите кошелек';
            return;
        }
        const refLink = `${window.location.origin}?ref=${this.web3.account}`;
        document.getElementById('refLinkInput').value = refLink;
    }

    async copyReferralLink() {
        const refLink = document.getElementById('refLinkInput').value;
        if (refLink === 'Подключите кошелек') {
            this.utils.showNotification('Сначала подключите кошелек', 'error');
            return;
        }
        await this.utils.copyToClipboard(refLink);
        this.utils.showNotification('Ссылка скопирована!', 'success');
    }

    async withdrawIncome() {
        this.utils.showNotification('Функция в разработке', 'info');
    }

    async withdrawTax() {
        this.utils.showNotification('Функция в разработке', 'info');
    }

    async checkDeposits() {
        this.utils.showNotification('Проверка завершенных депозитов...', 'info');
        setTimeout(() => {
            this.utils.showNotification('Завершенных депозитов не найдено', 'warning');
        }, 1000);
    }

    async loadDeposits() {
        const container = document.getElementById('depositsGrid');
        const emptyState = document.getElementById('emptyDeposits');
        
        if (container && emptyState) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            document.getElementById('navDepositCount').textContent = '0';
        }
    }

    filterDeposits(filter) {
        console.log('Filtering deposits:', filter);
    }

    async loadRankings(type) {
        document.getElementById('podiumName1').textContent = 'CryptoKing';
        document.getElementById('podiumValue1').textContent = '15,780 USDT';
        document.getElementById('podiumName2').textContent = 'BlockchainMaster';
        document.getElementById('podiumValue2').textContent = '12,450 USDT';
        document.getElementById('podiumName3').textContent = 'TokenWhale';
        document.getElementById('podiumValue3').textContent = '9,230 USDT';
        
        document.getElementById('userRank').textContent = '#42';
        document.getElementById('userTaxes').textContent = '1,250 USDT';
        document.getElementById('userPopulation').textContent = '127';
        document.getElementById('userTotal').textContent = '3,450 USDT';
        document.getElementById('nextRankDiff').textContent = '780 USDT';
    }

    filterRankings(search) {
        console.log('Searching:', search);
    }

    filterTransactionsByDate(dateFilter) {
        console.log('Date filter:', dateFilter);
    }

    filterTransactionsByType(typeFilter) {
        console.log('Type filter:', typeFilter);
    }

    showModal(modalId) {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('modalOverlay').style.display = 'none';
        }
    }


    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.getElementById('modalOverlay').style.display = 'none';
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CryptoLandApp();
});
