javascript
class CryptoLandApp {
    constructor() {
        this.web3 = window.cryptoLandWeb3;
        this.utils = window.utils;
        this.currentTab = 'dashboard';
        this.userData = null;
        this.tariffs = [
            {
                id: 0,
                name: "Спальный район",
                dailyPercent: 0.5,
                duration: 3,
                color: "blue",
                description: "Начальный уровень для тестирования",
                minAmount: 10
            },
            {
                id: 1,
                name: "Жилой квартал",
                dailyPercent: 0.6,
                duration: 5,
                color: "blue",
                description: "Стабильный доход",
                minAmount: 25
            },
            {
                id: 2,
                name: "Новый микрорайон",
                dailyPercent: 0.7,
                duration: 7,
                color: "blue",
                description: "Повышенная доходность",
                minAmount: 50
            },
            {
                id: 3,
                name: "Деловой центр",
                dailyPercent: 0.85,
                duration: 10,
                color: "gold",
                description: "Премиум уровень",
                premium: true,
                minAmount: 100
            },
            {
                id: 4,
                name: "Бизнес-кластер",
                dailyPercent: 1.0,
                duration: 15,
                color: "gold",
                description: "Высокая доходность",
                premium: true,
                minAmount: 250
            },
            {
                id: 5,
                name: "Элитный квартал",
                dailyPercent: 1.2,
                duration: 20,
                color: "gold",
                description: "Эксклюзивный уровень",
                premium: true,
                minAmount: 500
            },
            {
                id: 6,
                name: "Мегаполис",
                dailyPercent: 1.5,
                duration: 30,
                color: "gold",
                description: "Максимальная доходность",
                premium: true,
                minAmount: 1000
            }
        ];
        
        this.levels = [
            { level: 1, percentage: 7, turnover: 0, deposit: 10, current: false },
            { level: 2, percentage: 5, turnover: 500, deposit: 50, current: false },
            { level: 3, percentage: 3, turnover: 1000, deposit: 50, current: false },
            { level: 4, percentage: 2.5, turnover: 2000, deposit: 100, current: false },
            { level: 5, percentage: 2, turnover: 3000, deposit: 100, current: false },
            { level: 6, percentage: 1.8, turnover: 5000, deposit: 250, current: false },
            { level: 7, percentage: 1.5, turnover: 7000, deposit: 250, current: false },
            { level: 8, percentage: 1.3, turnover: 10000, deposit: 500, current: false },
            { level: 9, percentage: 1.1, turnover: 15000, deposit: 500, current: false },
            { level: 10, percentage: 1, turnover: 20000, deposit: 750, current: false },
            { level: 11, percentage: 0.9, turnover: 30000, deposit: 750, current: false },
            { level: 12, percentage: 0.8, turnover: 40000, deposit: 1250, current: false },
            { level: 13, percentage: 0.7, turnover: 50000, deposit: 1250, current: false },
            { level: 14, percentage: 0.6, turnover: 75000, deposit: 2000, current: false },
            { level: 15, percentage: 0.5, turnover: 100000, deposit: 2500, current: false }
        ];
        
        this.selectedWallet = 'metamask';
        this.selectedTariff = null;
        this.userDeposits = [];
        this.transactions = [];
        this.rankingData = [];
        this.currentDepositsFilter = 'all';
        
        this.init();
    }

    async init() {
        // Скрыть прелоадер с анимацией
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            preloader.classList.add('hiding');
            setTimeout(() => {
                preloader.style.display = 'none';
                document.querySelector('.app-container').style.opacity = '1';
                document.querySelector('.app-container').style.transform = 'translateY(0)';
            }, 500);
        }, 1500);
        
        // Инициализация событий
        this.initEvents();
        
        // Загрузка начальных данных
        this.renderTariffs();
        this.renderLevels();
        this.updateHeroStats();
        this.loadRankings();
        
        // Проверка подключения кошелька
        await this.checkConnection();
        
        // Обновление UI
        this.updateUI();
        
        // Добавление динамических стилей
        this.addDynamicStyles();
        
        // Проверка реферальной ссылки в URL
        this.checkReferralInUrl();
    }

    initEvents() {
        // Навигация в сайдбаре
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.dataset.tab;
                this.showTab(tab);
            });
        });

        // Навигационные карточки на главной
        document.querySelectorAll('.nav-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tab = card.dataset.tab;
                this.showTab(tab);
            });
        });

        // Подключение кошелька
        document.getElementById('sidebarConnectBtn').addEventListener('click', () => {
            this.showWalletModal();
        });

        document.getElementById('connectWallet').addEventListener('click', async () => {
            await this.connectWallet();
        });

        document.getElementById('cancelWallet').addEventListener('click', () => {
            this.hideModal('walletModal');
        });

        // Опции кошельков в модальном окне
        document.querySelectorAll('.wallet-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.wallet-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                this.selectedWallet = option.dataset.wallet;
            });
        });

        // Инвестирование - кнопки на тарифах
        document.addEventListener('click', (e) => {
            if (e.target.closest('.tariff-btn')) {
                const btn = e.target.closest('.tariff-btn');
                if (btn.classList.contains('primary-btn')) {
                    const tariffId = parseInt(btn.dataset.tariffId);
                    this.showInvestModal(tariffId);
                } else if (btn.classList.contains('details-btn')) {
                    const tariffId = parseInt(btn.dataset.tariffDetails);
                    this.showTariffDetails(tariffId);
                }
            }
        });

        // Модальное окно инвестирования
        document.getElementById('cancelInvest').addEventListener('click', () => {
            this.hideModal('investModal');
        });

        document.getElementById('confirmInvest').addEventListener('click', async () => {
            await this.processInvestment();
        });

        // Обновление суммы инвестиции
        const investAmountInput = document.getElementById('investAmount');
        if (investAmountInput) {
            investAmountInput.addEventListener('input', (e) => {
                this.updateInvestmentSummary();
            });
            investAmountInput.addEventListener('change', (e) => {
                this.validateInvestmentAmount();
            });
        }

        // Реферальная система
        document.getElementById('sidebarRefBtn')?.addEventListener('click', () => {
            this.showReferralModal();
        });

        document.getElementById('copyRefLink')?.addEventListener('click', async () => {
            await this.copyReferralLink();
        });

        document.getElementById('copyReferralLink')?.addEventListener('click', async () => {
            await this.copyReferralLink();
        });

        // Вывод средств
        document.getElementById('withdrawIncomeBtn')?.addEventListener('click', async () => {
            await this.withdrawIncome();
        });

        document.getElementById('withdrawTaxBtn')?.addEventListener('click', async () => {
            await this.withdrawTax();
        });

        document.getElementById('checkDepositsBtn')?.addEventListener('click', async () => {
            await this.checkDeposits();
        });

        // Экспорт транзакций
        document.getElementById('exportTransactions')?.addEventListener('click', async () => {
            await this.exportTransactions();
        });

        // Кнопка "Начать инвестировать" в пустом состоянии
        document.getElementById('goToInvest')?.addEventListener('click', () => {
            this.showTab('dashboard');
        });

        document.getElementById('newInvestmentBtn')?.addEventListener('click', () => {
            this.showTab('dashboard');
        });

        // Обновление депозитов
        document.getElementById('refreshDeposits')?.addEventListener('click', async () => {
            await this.loadDeposits(true);
        });

        // Быстрые действия в шапке
        document.getElementById('refreshData')?.addEventListener('click', async () => {
            await this.updateAllData();
        });

        document.getElementById('buyUsdtBtn')?.addEventListener('click', () => {
            this.utils.showNotification('Для покупки USDT перейдите на биржу (Binance, Bybit, MEXC)', 'info');
        });

        // Support кнопка
        document.getElementById('supportBtn')?.addEventListener('click', () => {
            this.utils.showNotification('Support: support@cryptoland.city\nTelegram: @cryptoland_support', 'info');
        });

        // Фильтры во вкладке районы
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.filterDeposits(filter);
            });
        });

        // Фильтры в рейтинге
        document.querySelectorAll('.ranking-filter').forEach(filter => {
            filter.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.filterRankings(type);
            });
        });

        // Поиск в рейтинге
        const searchInput = document.getElementById('rankingSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchRankings(e.target.value);
            });
        }

        // Время в рейтинге
        document.getElementById('rankingTime')?.addEventListener('change', (e) => {
            this.filterRankingsByTime(e.target.value);
        });

        // Закрытие модальных окон
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.currentTarget.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        document.getElementById('modalOverlay')?.addEventListener('click', () => {
            this.hideAllModals();
        });

        // Обработка изменения сети в кошельке
        if (window.ethereum) {
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });

            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.handleDisconnect();
                } else {
                    this.handleAccountChange(accounts[0]);
                }
            });
        }

        // Обновление времени
        this.updateTime();
        setInterval(() => this.updateTime(), 60000);
    }

    async checkConnection() {
        if (window.ethereum && window.ethereum.selectedAddress) {
            try {
                await this.web3.init();
                await this.updateUserInfo();
                this.utils.showNotification('Кошелек подключен', 'success');
                return true;
            } catch (error) {
                console.error('Connection error:', error);
                this.utils.showNotification('Ошибка подключения кошелька', 'error');
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
            
            // Обновление реферальной ссылки
            this.updateReferralLink();
            
            // Загрузка данных
            await this.updateAllData();
            
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.utils.showNotification('Ошибка подключения: ' + error.message, 'error');
        }
    }

    handleDisconnect() {
        this.utils.showNotification('Кошелек отключен', 'warning');
        this.resetUserData();
    }

    handleAccountChange(newAccount) {
        this.utils.showNotification('Аккаунт изменен', 'info');
        this.web3.account = newAccount;
        this.updateUserInfo();
        this.updateAllData();
    }

    resetUserData() {
        // Сброс данных пользователя
        document.getElementById('userName').textContent = 'Гость';
        document.getElementById('userStatus').innerHTML = '<div class="status-dot offline"></div>';
        document.getElementById('sidebarBalance').textContent = '0.00';
        
        // Сброс статистики
        document.getElementById('statTotal').textContent = '0 USDT';
        document.getElementById('statActive').textContent = '0';
        document.getElementById('statTaxes').textContent = '0 USDT';
        document.getElementById('statIncome').textContent = '0 USDT';
        
        // Сброс hero статистики
        this.updateHeroStats();
        
        // Очистка депозитов
        this.userDeposits = [];
        this.renderDeposits();
        
        // Сброс реферальной ссылки
        document.getElementById('refLinkInput').value = 'Подключите кошелек для получения ссылки';
        document.getElementById('referralLink').value = 'Подключите кошелек для получения ссылки';
        
        // Очистка QR кода
        const qrContainer = document.getElementById('qrContainer');
        if (qrContainer) qrContainer.innerHTML = '';
        
        const referralQr = document.getElementById('referralQr');
        if (referralQr) referralQr.innerHTML = '';
    }

    async updateUserInfo() {
        if (!this.web3.isConnected) return;

        try {
            const userAddress = this.web3.account;
            
            // Обновление имени пользователя
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = this.utils.formatAddress(userAddress, 6, 4);
                userName.title = userAddress;
            }

            // Обновление статуса
            const userStatus = document.getElementById('userStatus');
            if (userStatus) {
                userStatus.innerHTML = '<div class="status-dot online"></div>';
            }

            // Обновление баланса USDT
            const balance = await this.web3.getUSDTBalance();
            const sidebarBalance = document.getElementById('sidebarBalance');
            const availableBalance = document.getElementById('availableBalance');
            
            if (sidebarBalance) {
                sidebarBalance.textContent = this.utils.formatNumber(balance, 2);
                sidebarBalance.title = `${balance} USDT`;
            }
            
            if (availableBalance) {
                availableBalance.textContent = `${this.utils.formatNumber(balance, 2)} USDT`;
            }

            // Обновление статистики
            await this.updateStats();

        } catch (error) {
            console.error('Update user info error:', error);
            this.utils.showNotification('Ошибка обновления данных', 'error');
        }
    }

    async updateStats() {
        try {
            if (!this.web3.isConnected) return;
            
            const stats = await this.web3.getUserStats();
            
            // Обновление карточек статистики на главной
            const totalValue = parseFloat(stats.activeDeposits) + 
                             parseFloat(stats.availableInterest) + 
                             parseFloat(stats.availableReferral);
            
            document.getElementById('statTotal').textContent = `${this.utils.formatNumber(totalValue, 2)} USDT`;
            document.getElementById('statActive').textContent = stats.activeDeposits > 0 ? '1+' : '0';
            document.getElementById('statTaxes').textContent = `${this.utils.formatNumber(stats.availableReferral, 2)} USDT`;
            document.getElementById('statIncome').textContent = `${this.utils.formatNumber(stats.availableInterest, 2)} USDT`;
            
            // Обновление казны
            document.getElementById('treasuryIncome').textContent = `${this.utils.formatNumber(stats.availableInterest, 2)} USDT`;
            document.getElementById('treasuryTax').textContent = `${this.utils.formatNumber(stats.availableReferral, 2)} USDT`;
            document.getElementById('treasuryDeposit').textContent = `${this.utils.formatNumber(stats.activeDeposits, 2)} USDT`;
            
            // Активация кнопок вывода
            const withdrawIncomeBtn = document.getElementById('withdrawIncomeBtn');
            const withdrawTaxBtn = document.getElementById('withdrawTaxBtn');
            
            if (withdrawIncomeBtn) {
                withdrawIncomeBtn.disabled = parseFloat(stats.availableInterest) <= 0;
                if (!withdrawIncomeBtn.disabled) {
                    withdrawIncomeBtn.classList.remove('disabled');
                } else {
                    withdrawIncomeBtn.classList.add('disabled');
                }
            }
            
            if (withdrawTaxBtn) {
                withdrawTaxBtn.disabled = parseFloat(stats.availableReferral) <= 0;
                if (!withdrawTaxBtn.disabled) {
                    withdrawTaxBtn.classList.remove('disabled');
                } else {
                    withdrawTaxBtn.classList.add('disabled');
                }
            }
            
            // Обновление сводки в разделе районы
            document.getElementById('summaryTotal')?.textContent = `${this.utils.formatNumber(stats.totalDeposits, 2)} USDT`;
            document.getElementById('summaryActive')?.textContent = `${this.utils.formatNumber(stats.activeDeposits, 2)} USDT`;
            document.getElementById('summaryAccumulated')?.textContent = `${this.utils.formatNumber(parseFloat(stats.availableInterest) + parseFloat(stats.availableReferral), 2)} USDT`;
            document.getElementById('summaryAvailable')?.textContent = `${this.utils.formatNumber(stats.availableInterest, 2)} USDT`;
            
            // Обновление реферальной статистики
            document.getElementById('totalReferrals')?.textContent = '0'; // Заглушка, нужно получить из контракта
            document.getElementById('totalTaxes')?.textContent = `${this.utils.formatNumber(stats.availableReferral, 2)} USDT`;
            document.getElementById('totalTurnover')?.textContent = `${this.utils.formatNumber(stats.totalDeposits, 2)} USDT`;
            
            // Обновление hero статистики
            this.updateHeroStats();
            
        } catch (error) {
            console.error('Update stats error:', error);
        }
    }

    updateHeroStats() {
        // Временные данные для демонстрации
        // В реальном приложении эти данные будут браться из контракта
        const totalInvested = this.userDeposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
        const dailyIncome = this.userDeposits.reduce((sum, deposit) => {
            const tariff = this.tariffs.find(t => t.id === deposit.tariffId);
            if (tariff && deposit.active) {
                return sum + (parseFloat(deposit.amount) * tariff.dailyPercent / 100);
            }
            return sum;
        }, 0);
        
        document.getElementById('heroTotalInvested').textContent = this.utils.formatNumber(totalInvested, 0);
        document.getElementById('heroDailyIncome').textContent = this.utils.formatNumber(dailyIncome, 2);
        document.getElementById('heroReferrals').textContent = '0'; // Заглушка
    }

    renderTariffs() {
        const container = document.getElementById('tariffsGrid');
        if (!container) return;
        
        container.innerHTML = this.tariffs.map(tariff => `
            <div class="tariff-card ${tariff.premium ? 'premium' : ''}">
                <div class="tariff-header">
                    <div class="tariff-name">${tariff.name}</div>
                </div>
                <div class="tariff-body">
                    <div class="tariff-percent">${tariff.dailyPercent}%</div>
                    <div class="tariff-period">в день • ${tariff.duration} дней</div>
                    
                    <ul class="tariff-features">
                        <li><i class="fas fa-check"></i> Минимальная сумма: ${tariff.minAmount} USDT</li>
                        <li><i class="fas fa-check"></i> Автовывод тела депозита</li>
                        <li><i class="fas fa-check"></i> Вывод процентов ежедневно</li>
                        <li><i class="fas fa-check"></i> Комиссия на вывод процентов: 15%</li>
                    </ul>
                    
                    <div class="tariff-actions">
                        <button class="tariff-btn primary-btn" data-tariff-id="${tariff.id}">
                            <i class="fas fa-coins"></i>
                            Инвестировать
                        </button>
                        <button class="tariff-btn secondary-btn details-btn" data-tariff-details="${tariff.id}">
                            <i class="fas fa-info-circle"></i>
                            Подробнее
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderLevels() {
        const container = document.getElementById('levelsBody');
        if (!container) return;
        
        // Определяем текущий уровень (заглушка - первый уровень)
        this.levels[0].current = true;
        
        container.innerHTML = this.levels.map(level => `
            <tr class="${level.current ? 'current-level' : ''}">
                <td><strong class="${level.current ? 'text-gold' : ''}">${level.level}</strong></td>
                <td><span class="text-gold font-bold">${level.percentage}%</span></td>
                <td>${this.utils.formatNumber(level.turnover)} USDT</td>
                <td>от ${level.deposit} USDT</td>
                <td>0</td>
                <td>
                    <span class="level-bonus ${level.current ? 'bonus-active' : 'bonus-inactive'}">
                        <i class="fas fa-${level.current ? 'check' : 'times'}"></i>
                        ${level.current ? 'Активен' : 'Неактивен'}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    async loadDeposits(forceRefresh = false) {
        try {
            if (!this.web3.isConnected) {
                this.userDeposits = [];
                this.renderDeposits();
                return;
            }
            
            if (forceRefresh) {
                this.utils.showNotification('Обновление депозитов...', 'info');
            }
            
            // Загрузка депозитов из контракта
            // Временные данные для демонстрации
            const mockDeposits = [
                {
                    id: 1,
                    tariffId: 0,
                    amount: '50',
                    startTime: Math.floor(Date.now() / 1000) - 86400, // 1 день назад
                    lastWithdrawTime: Math.floor(Date.now() / 1000) - 43200, // 12 часов назад
                    active: true
                },
                {
                    id: 2,
                    tariffId: 3,
                    amount: '200',
                    startTime: Math.floor(Date.now() / 1000) - 172800, // 2 дня назад
                    lastWithdrawTime: Math.floor(Date.now() / 1000) - 86400, // 1 день назад
                    active: true
                }
            ];
            
            this.userDeposits = mockDeposits;
            this.renderDeposits();
            
            if (forceRefresh) {
                this.utils.showNotification('Депозиты обновлены', 'success');
            }
            
        } catch (error) {
            console.error('Load deposits error:', error);
            this.utils.showNotification('Ошибка загрузки депозитов', 'error');
        }
    }

    renderDeposits() {
        const container = document.getElementById('depositsGrid');
        const emptyState = document.getElementById('emptyDeposits');
        
        if (!container) return;
        
        if (this.userDeposits.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            document.getElementById('depositCount').textContent = '0';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        document.getElementById('depositCount').textContent = this.userDeposits.length.toString();
        
        const filteredDeposits = this.filterDepositsByType(this.userDeposits, this.currentDepositsFilter);
        
        container.innerHTML = filteredDeposits.map(deposit => {
            const tariff = this.tariffs.find(t => t.id === deposit.tariffId);
            if (!tariff) return '';
            
            const startDate = new Date(deposit.startTime * 1000);
            const endDate = new Date(startDate.getTime() + (tariff.duration * 86400000));
            const now = Date.now();
            const daysPassed = Math.floor((now - startDate.getTime()) / 86400000);
            const daysLeft = Math.max(0, tariff.duration - daysPassed);
            const progress = Math.min(100, (daysPassed / tariff.duration) * 100);
            
            const dailyIncome = (parseFloat(deposit.amount) * tariff.dailyPercent) / 100;
            const totalIncome = dailyIncome * daysPassed;
            const availableIncome = dailyIncome * Math.floor((now - deposit.lastWithdrawTime * 1000) / 86400000);
            
            return `
                <div class="deposit-card" data-deposit-id="${deposit.id}" data-status="${deposit.active ? 'active' : 'finished'}">
                    <div class="deposit-header">
                        <h4 class="deposit-name">${tariff.name}</h4>
                        <span class="deposit-status ${deposit.active ? 'active' : 'finished'}">
                            ${deposit.active ? 'Активный' : 'Завершенный'}
                        </span>
                    </div>
                    
                    <div class="deposit-stats">
                        <div class="deposit-stat">
                            <span class="stat-label">Инвестировано</span>
                            <span class="stat-value">${this.utils.formatNumber(deposit.amount, 2)} USDT</span>
                        </div>
                        <div class="deposit-stat">
                            <span class="stat-label">Доходность</span>
                            <span class="stat-value">${tariff.dailyPercent}% в день</span>
                        </div>
                        <div class="deposit-stat">
                            <span class="stat-label">Накоплено</span>
                            <span class="stat-value profit">${this.utils.formatNumber(totalIncome, 2)} USDT</span>
                        </div>
                        <div class="deposit-stat">
                            <span class="stat-label">${deposit.active ? 'Дней осталось' : 'Завершен'}</span>
                            <span class="stat-value">${deposit.active ? daysLeft : '✓'}</span>
                        </div>
                    </div>
                    
                    ${deposit.active ? `
                    <div class="deposit-progress">
                        <div class="progress-info">
                            <span class="time-left">${daysPassed} из ${tariff.duration} дней</span>
                            <span>${Math.round(progress)}%</span>
                        </div>
                        <div class="progress-container">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="deposit-actions">
                        <button class="action-btn withdraw-btn" data-deposit-id="${deposit.id}" ${availableIncome <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-download"></i>
                            Вывести ${this.utils.formatNumber(availableIncome, 2)} USDT
                        </button>
                        <button class="action-btn details-btn" data-deposit-details="${deposit.id}">
                            <i class="fas fa-info-circle"></i>
                            Подробнее
                        </button>
                    </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        // Добавляем обработчики событий для кнопок в депозитах
        this.addDepositEvents();
    }

    addDepositEvents() {
        // Кнопки вывода дохода
        document.querySelectorAll('.deposit-actions .withdraw-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const depositId = parseInt(e.currentTarget.dataset.depositId);
                await this.withdrawDepositIncome(depositId);
            });
        });
        
        // Кнопки подробнее
        document.querySelectorAll('.deposit-actions .details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const depositId = parseInt(e.currentTarget.dataset.depositId);
                this.showDepositDetails(depositId);
            });
        });
    }

    filterDeposits(filter) {
        this.currentDepositsFilter = filter;
        
        // Обновление активной кнопки фильтра
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Фильтрация депозитов
        const depositCards = document.querySelectorAll('.deposit-card');
        let visibleCount = 0;
        
        depositCards.forEach(card => {
            const status = card.dataset.status;
            let shouldShow = false;
            
            switch (filter) {
                case 'all':
                    shouldShow = true;
                    break;
                case 'active':
                    shouldShow = status === 'active';
                    break;
                case 'finished':
                    shouldShow = status === 'finished';
                    break;
            }
            
            if (shouldShow) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Показать/скрыть состояние "пусто"
        const emptyState = document.getElementById('emptyDeposits');
        if (emptyState) {
            if (visibleCount === 0 && this.userDeposits.length > 0) {
                emptyState.style.display = 'flex';
                emptyState.querySelector('h4').textContent = 'Нет депозитов по выбранному фильтру';
                emptyState.querySelector('p').textContent = 'Измените фильтр чтобы увидеть другие депозиты';
            } else if (visibleCount === 0) {
                emptyState.style.display = 'flex';
                emptyState.querySelector('h4').textContent = 'У вас пока нет районов';
                emptyState.querySelector('p').textContent = 'Начните инвестировать в районы для получения пассивного дохода';
            } else {
                emptyState.style.display = 'none';
            }
        }
    }

    filterDepositsByType(deposits, filter) {
        switch (filter) {
            case 'all':
                return deposits;
            case 'active':
                return deposits.filter(d => d.active);
            case 'finished':
                return deposits.filter(d => !d.active);
            default:
                return deposits;
        }
    }

    async loadRankings() {
        try {
            // Временные данные для демонстрации
            const mockRankings = Array.from({length: 50}, (_, i) => ({
                rank: i + 1,
                address: `0x${this.generateRandomHex(10)}...${this.generateRandomHex(6)}`,
                taxes: (Math.random() * 10000).toFixed(2),
                population: Math.floor(Math.random() * 1000),
                total: (Math.random() * 50000).toFixed(2),
                city: ['Криптоград', 'Блокчейнсити', 'Токенвиль', 'Дефибург', 'НФТополис'][Math.floor(Math.random() * 5)]
            }));
            
            // Сортировка по налогам (по умолчанию)
            mockRankings.sort((a, b) => parseFloat(b.taxes) - parseFloat(a.taxes));
            
            this.rankingData = mockRankings;
            this.renderRankings();
            
            // Обновление топ-3
            this.updateTopRankings();
            
            // Обновление позиции пользователя
            this.updateUserRanking();
            
        } catch (error) {
            console.error('Load rankings error:', error);
        }
    }

    renderRankings() {
        const container = document.getElementById('rankingBody');
        if (!container) return;
        
        container.innerHTML = this.rankingData.slice(0, 20).map(item => `
            <tr>
                <td>
                    <div class="rank-badge">${item.rank}</div>
                </td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar small">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="user-info">
                            <span class="user-address">${item.address}</span>
                            <span class="user-city">${item.city}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="value-tag gold">${this.utils.formatNumber(item.taxes)} USDT</span>
                </td>
                <td>
                    <span class="value-tag">${item.population}</span>
                </td>
                <td>
                    <span class="value-tag blue">${this.utils.formatNumber(item.total)} USDT</span>
                </td>
            </tr>
        `).join('');
    }

    updateTopRankings() {
        if (this.rankingData.length < 3) return;
        
        const top3 = this.rankingData.slice(0, 3);
        
        // Первое место
        const firstPlace = document.querySelector('.top-place.first');
        if (firstPlace) {
            firstPlace.querySelector('.place-name').textContent = `Мэр #${top3[0].rank}`;
            firstPlace.querySelector('.place-value').textContent = `${this.utils.formatNumber(top3[0].taxes)} USDT`;
        }
        
        // Второе место
        const secondPlace = document.querySelector('.top-place.second');
        if (secondPlace) {
            secondPlace.querySelector('.place-name').textContent = `Мэр #${top3[1].rank}`;
            secondPlace.querySelector('.place-value').textContent = `${this.utils.formatNumber(top3[1].taxes)} USDT`;
        }
        
        // Третье место
        const thirdPlace = document.querySelector('.top-place.third');
        if (thirdPlace) {
            thirdPlace.querySelector('.place-name').textContent = `Мэр #${top3[2].rank}`;
            thirdPlace.querySelector('.place-value').textContent = `${this.utils.formatNumber(top3[2].taxes)} USDT`;
        }
    }

    updateUserRanking() {
        // Временная заглушка - пользователь на 15 месте
        const userRank = 15;
        const userData = {
            taxes: '1250.50',
            population: 42,
            total: '8450.75'
        };
        
        document.getElementById('userRank').textContent = userRank;
        document.getElementById('userTaxes').textContent = `${this.utils.formatNumber(userData.taxes)} USDT`;
        document.getElementById('userPopulation').textContent = userData.population;
        document.getElementById('userTotal').textContent = `${this.utils.formatNumber(userData.total)} USDT`;
        
        // Расчет до следующего места
        const nextRankDiff = 250; // USDT до 14 места
        document.getElementById('nextRankDiff').textContent = `${nextRankDiff} USDT`;
        
        // Прогресс бар (пример: 75% до следующего места)
        const progressFill = document.querySelector('.user-rank-progress .progress-fill');
        if (progressFill) {
            progressFill.style.width = '75%';
        }
    }

    filterRankings(type) {
        // Обновление активного фильтра
        document.querySelectorAll('.ranking-filter').forEach(filter => {
            filter.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Сортировка данных по выбранному типу
        let sortedData;
        switch (type) {
            case 'tax':
                sortedData = [...this.rankingData].sort((a, b) => parseFloat(b.taxes) - parseFloat(a.taxes));
                break;
            case 'population':
                sortedData = [...this.rankingData].sort((a, b) => b.population - a.population);
                break;
            case 'total':
                sortedData = [...this.rankingData].sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
                break;
            default:
                sortedData = this.rankingData;
        }
        
        // Обновление отображения
        this.rankingData = sortedData;
        this.renderRankings();
        this.updateTopRankings();
        
        // Обновление значений в топ-3
        document.querySelectorAll('.place-value').forEach(el => {
            el.dataset.type = type;
        });
    }

    filterRankingsByTime(timeRange) {
        // В реальном приложении здесь будет фильтрация по времени
        this.utils.showNotification(`Фильтр по времени: ${timeRange}`, 'info');
    }

    searchRankings(query) {
        if (!query.trim()) {
            // Показать все записи
            this.renderRankings();
            return;
        }
        
        const searchTerm = query.toLowerCase();
        const filteredData = this.rankingData.filter(item => 
            item.address.toLowerCase().includes(searchTerm) ||
            item.city.toLowerCase().includes(searchTerm)
        );
        
        const container = document.getElementById('rankingBody');
        if (!container) return;
        
        container.innerHTML = filteredData.slice(0, 20).map(item => `
            <tr>
                <td>
                    <div class="rank-badge">${item.rank}</div>
                </td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar small">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="user-info">
                            <span class="user-address">${item.address}</span>
                            <span class="user-city">${item.city}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="value-tag gold">${this.utils.formatNumber(item.taxes)} USDT</span>
                </td>
                <td>
                    <span class="value-tag">${item.population}</span>
                </td>
                <td>
                    <span class="value-tag blue">${this.utils.formatNumber(item.total)} USDT</span>
                </td>
            </tr>
        `).join('');
    }

    showWalletModal() {
        this.showModal('walletModal');
    }

    showInvestModal(tariffId) {
        if (!this.web3.isConnected) {
            this.utils.showNotification('Сначала подключите кошелек', 'error');
            this.showWalletModal();
            return;
        }
        
        this.selectedTariff = this.tariffs[tariffId];
        
        if (!this.selectedTariff) {
            this.utils.showNotification('Тариф не найден', 'error');
            return;
        }
        
        // Обновление информации о тарифе
        document.getElementById('investTitle').textContent = `Инвестиция в ${this.selectedTariff.name}`;
        
        const preview = document.getElementById('tariffPreview');
        if (preview) {
            preview.innerHTML = `
                <div class="preview-header">
                    <h4 class="preview-name">${this.selectedTariff.name}</h4>
                    ${this.selectedTariff.premium ? '<span class="preview-badge">ПРЕМИУМ</span>' : ''}
                </div>
                <div class="preview-stats">
                    <div class="preview-stat">
                        <span class="stat-label">Доходность:</span>
                        <span class="stat-value highlight">${this.selectedTariff.dailyPercent}% в день</span>
                    </div>
                    <div class="preview-stat">
                        <span class="stat-label">Срок инвестиции:</span>
                        <span class="stat-value">${this.selectedTariff.duration} дней</span>
                    </div>
                    <div class="preview-stat">
                        <span class="stat-label">Общая доходность:</span>
                        <span class="stat-value">${(this.selectedTariff.dailyPercent * this.selectedTariff.duration).toFixed(1)}%</span>
                    </div>
                    <div class="preview-stat">
                        <span class="stat-label">Минимальная сумма:</span>
                        <span class="stat-value">${this.selectedTariff.minAmount} USDT</span>
                    </div>
                </div>
            `;
        }
        
        // Установка минимальной суммы
        const investAmountInput = document.getElementById('investAmount');
        if (investAmountInput) {
            investAmountInput.min = this.selectedTariff.minAmount;
            investAmountInput.value = this.selectedTariff.minAmount;
            investAmountInput.step = this.selectedTariff.minAmount >= 100 ? 10 : 1;
        }
        
        // Обновление доступного баланса
        this.updateAvailableBalance();
        
        // Обновление сводки
        this.updateInvestmentSummary();
        
        this.showModal('investModal');
    }

    updateAvailableBalance() {
        const balanceElement = document.getElementById('availableBalance');
        if (!balanceElement) return;
        
        if (this.web3.isConnected) {
            this.web3.getUSDTBalance().then(balance => {
                balanceElement.textContent = `${this.utils.formatNumber(balance, 2)} USDT`;
                balanceElement.title = `Доступно: ${balance} USDT`;
                
                // Предупреждение если баланс меньше минимальной суммы
                const investAmountInput = document.getElementById('investAmount');
                if (investAmountInput && parseFloat(balance) < parseFloat(investAmountInput.min)) {
                    this.utils.showNotification(`Недостаточно USDT. Минимум: ${investAmountInput.min} USDT`, 'warning');
                }
            }).catch(error => {
                balanceElement.textContent = 'Ошибка загрузки';
                console.error('Balance update error:', error);
            });
        } else {
            balanceElement.textContent = '0 USDT';
        }
    }

    validateInvestmentAmount() {
        const input = document.getElementById('investAmount');
        if (!input || !this.selectedTariff) return;
        
        const amount = parseFloat(input.value);
        const minAmount = this.selectedTariff.minAmount;
        
        if (amount < minAmount) {
            input.value = minAmount;
            this.utils.showNotification(`Минимальная сумма: ${minAmount} USDT`, 'warning');
        }
        
        this.updateInvestmentSummary();
    }

    updateInvestmentSummary() {
        const amount = parseFloat(document.getElementById('investAmount').value) || this.selectedTariff?.minAmount || 10;
        const tariff = this.selectedTariff;
        
        if (!tariff) return;
        
        const dailyIncome = (amount * tariff.dailyPercent) / 100;
        const totalIncome = dailyIncome * tariff.duration;
        
        // Расчет даты окончания
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + tariff.duration);
        
        document.getElementById('summaryAmount').textContent = `${this.utils.formatNumber(amount, 2)} USDT`;
        document.getElementById('summaryDaily').textContent = `${this.utils.formatNumber(dailyIncome, 2)} USDT/день`;
        document.getElementById('summaryTotal').textContent = `${this.utils.formatNumber(totalIncome, 2)} USDT`;
        document.getElementById('summaryEndDate').textContent = endDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    async processInvestment() {
        try {
            if (!this.web3.isConnected) {
                this.utils.showNotification('Сначала подключите кошелек', 'error');
                this.showWalletModal();
                return;
            }
            
            const amount = parseFloat(document.getElementById('investAmount').value);
            const referrer = document.getElementById('referrerAddress')?.value.trim() || '';
            
            if (amount < this.selectedTariff.minAmount) {
                this.utils.showNotification(`Минимальная сумма ${this.selectedTariff.minAmount} USDT`, 'error');
                return;
            }
            
            // Проверка баланса
            const balance = await this.web3.getUSDTBalance();
            if (parseFloat(balance) < amount) {
                this.utils.showNotification(`Недостаточно USDT. Доступно: ${this.utils.formatNumber(balance, 2)} USDT`, 'error');
                return;
            }
            
            if (referrer && !this.utils.isValidAddress(referrer)) {
                this.utils.showNotification('Неверный адрес реферера', 'error');
                return;
            }
            
            this.utils.showNotification('Отправка транзакции...', 'info');
            
            // Симуляция инвестирования (в реальном приложении будет вызов контракта)
            await this.simulateInvestment(amount, this.selectedTariff.id, referrer);
            
            this.utils.showNotification('Инвестиция успешно завершена!', 'success');
            this.hideModal('investModal');
            
            // Обновление данных
            await this.updateAllData();
            
        } catch (error) {
            console.error('Investment error:', error);
            this.utils.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    async simulateInvestment(amount, tariffId, referrer) {
        // Симуляция задержки транзакции
        return new Promise(resolve => {
            setTimeout(() => {
                // Добавление депозита в список
                const newDeposit = {
                    id: this.userDeposits.length + 1,
                    tariffId: tariffId,
                    amount: amount.toString(),
                    startTime: Math.floor(Date.now() / 1000),
                    lastWithdrawTime: Math.floor(Date.now() / 1000),
                    active: true
                };
                
                this.userDeposits.push(newDeposit);
                
                // Добавление транзакции в историю
                this.addTransaction({
                    type: 'invest',
                    amount: amount,
                    date: new Date().toISOString(),
                    status: 'success',
                    hash: '0x' + this.generateRandomHex(64)
                });
                
                resolve();
            }, 2000);
        });
    }

    showReferralModal() {
        if (!this.web3.isConnected) {
            this.utils.showNotification('Сначала подключите кошелек', 'error');
            this.showWalletModal();
            return;
        }
        
        this.updateReferralLink();
        this.showModal('referralModal');
    }

    updateReferralLink() {
        if (!this.web3.isConnected) return;
        
        const refLink = `${window.location.origin}${window.location.pathname}?ref=${this.web3.account}`;
        
        // Обновление ссылки
        const refLinkInput = document.getElementById('refLinkInput');
        const referralLink = document.getElementById('referralLink');
        
        if (refLinkInput) refLinkInput.value = refLink;
        if (referralLink) referralLink.value = refLink;
        
        // Генерация QR кода
        this.generateReferralQR(refLink);
    }

    generateReferralQR(refLink) {
        // Генерация QR кода для реферальной ссылки
        const qrContainer = document.getElementById('qrContainer');
        const referralQr = document.getElementById('referralQr');
        
        if (window.QRCode && qrContainer) {
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: refLink,
                width: 200,
                height: 200,
                colorDark: "#F59E0B",
                colorLight: "#1A2142",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
        
        if (window.QRCode && referralQr) {
            referralQr.innerHTML = '';
            new QRCode(referralQr, {
                text: refLink,
                width: 200,
                height: 200,
                colorDark: "#F59E0B",
                colorLight: "#1A2142",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }

    async copyReferralLink() {
        const refLink = document.getElementById('referralLink')?.value || 
                       document.getElementById('refLinkInput')?.value;
        
        if (!refLink || refLink.includes('Подключите кошелек')) {
            this.utils.showNotification('Сначала подключите кошелек', 'error');
            return;
        }
        
        const success = await this.utils.copyToClipboard(refLink);
        if (success) {
            this.utils.showNotification('Ссылка скопирована в буфер обмена!', 'success');
        } else {
            this.utils.showNotification('Не удалось скопировать ссылку', 'error');
        }
    }

    checkReferralInUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const refAddress = urlParams.get('ref');
        
        if (refAddress && this.utils.isValidAddress(refAddress)) {
            // Сохраняем реферера в localStorage
            localStorage.setItem('cryptoland_referrer', refAddress);
            
            // Автозаполнение поля реферера при инвестировании
            const referrerInput = document.getElementById('referrerAddress');
            if (referrerInput) {
                referrerInput.value = refAddress;
            }
            
            this.utils.showNotification('Реферальная ссылка активирована', 'success');
        }
    }

    async withdrawIncome() {
        try {
            if (!this.web3.isConnected) {
                this.utils.showNotification('Сначала подключите кошелек', 'error');
                return;
            }
            
            this.utils.showNotification('Вывод дохода...', 'info');
            
            // Симуляция вывода (в реальном приложении будет вызов контракта)
            await this.simulateWithdraw('income');
            
            this.utils.showNotification('Доход успешно выведен!', 'success');
            await this.updateStats();
            
        } catch (error) {
            console.error('Withdraw income error:', error);
            this.utils.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    async withdrawTax() {
        try {
            if (!this.web3.isConnected) {
                this.utils.showNotification('Сначала подключите кошелек', 'error');
                return;
            }
            
            this.utils.showNotification('Вывод налогов...', 'info');
            
            // Симуляция вывода (в реальном приложении будет вызов контракта)
            await this.simulateWithdraw('tax');
            
            this.utils.showNotification('Налоги успешно выведены!', 'success');
            await this.updateStats();
            
        } catch (error) {
            console.error('Withdraw tax error:', error);
            this.utils.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    async withdrawDepositIncome(depositId) {
        try {
            if (!this.web3.isConnected) {
                this.utils.showNotification('Сначала подключите кошелек', 'error');
                return;
            }
            
            const deposit = this.userDeposits.find(d => d.id === depositId);
            if (!deposit) {
                this.utils.showNotification('Депозит не найден', 'error');
                return;
            }
            
            this.utils.showNotification('Вывод дохода с депозита...', 'info');
            
            // Симуляция вывода
            await this.simulateWithdraw('deposit', depositId);
            
            this.utils.showNotification('Доход с депозита выведен!', 'success');
            await this.updateStats();
            await this.loadDeposits(true);
            
        } catch (error) {
            console.error('Withdraw deposit error:', error);
            this.utils.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    async simulateWithdraw(type, depositId = null) {
        return new Promise(resolve => {
            setTimeout(() => {
                // Добавление транзакции в историю
                const amount = type === 'income' ? 25.50 : 
                              type === 'tax' ? 12.75 : 
                              type === 'deposit' ? 8.25 : 0;
                
                this.addTransaction({
                    type: 'withdraw',
                    subType: type,
                    amount: amount,
                    date: new Date().toISOString(),
                    status: 'success',
                    hash: '0x' + this.generateRandomHex(64),
                    depositId: depositId
                });
                
                resolve();
            }, 1500);
        });
    }

    async checkDeposits() {
        try {
            if (!this.web3.isConnected) {
                this.utils.showNotification('Сначала подключите кошелек', 'error');
                return;
            }
            
            this.utils.showNotification('Проверка завершения депозитов...', 'info');
            
            // Симуляция проверки
            await this.simulateCheckDeposits();
            
            this.utils.showNotification('Проверка завершена!', 'success');
            await this.loadDeposits(true);
            await this.updateStats();
            
        } catch (error) {
            console.error('Check deposits error:', error);
            this.utils.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    async simulateCheckDeposits() {
        return new Promise(resolve => {
            setTimeout(() => {
                // Помечаем старые депозиты как завершенные
                const now = Math.floor(Date.now() / 1000);
                this.userDeposits.forEach(deposit => {
                    const tariff = this.tariffs.find(t => t.id === deposit.tariffId);
                    if (tariff && deposit.active) {
                        const depositEndTime = deposit.startTime + (tariff.duration * 86400);
                        if (now > depositEndTime) {
                            deposit.active = false;
                        }
                    }
                });
                
                resolve();
            }, 1000);
        });
    }

    async exportTransactions() {
        try {
            if (this.transactions.length === 0) {
                this.utils.showNotification('Нет транзакций для экспорта', 'info');
                return;
            }
            
            this.utils.showNotification('Подготовка файла...', 'info');
            
            // Формирование CSV
            const headers = ['Тип операции', 'Сумма (USDT)', 'Дата', 'Статус', 'Хэш транзакции'];
            const csvData = [
                headers.join(','),
                ...this.transactions.map(t => [
                    this.getTransactionTypeLabel(t.type, t.subType),
                    t.amount,
                    new Date(t.date).toLocaleString('ru-RU'),
                    t.status === 'success' ? 'Успешно' : 'Ошибка',
                    t.hash
                ].join(','))
            ].join('\n');
            
            // Создание и скачивание файла
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `cryptoland_transactions_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.utils.showNotification('Файл успешно экспортирован', 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            this.utils.showNotification('Ошибка экспорта', 'error');
        }
    }

    addTransaction(transaction) {
        this.transactions.unshift(transaction); // Добавляем в начало
        
        // Ограничиваем историю 50 записями
        if (this.transactions.length > 50) {
            this.transactions.pop();
        }
        
        // Обновляем таблицу если открыта вкладка казны
        if (this.currentTab === 'treasury') {
            this.renderTransactions();
        }
    }

    renderTransactions() {
        const container = document.getElementById('transactionsBody');
        if (!container) return;
        
        if (this.transactions.length === 0) {
            container.innerHTML = `
                <tr class="empty-row">
                    <td colspan="5">
                        <div class="table-empty">
                            <i class="fas fa-exchange-alt"></i>
                            <p>Транзакций пока нет</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = this.transactions.map(transaction => `
            <tr>
                <td>
                    <div class="transaction-type">
                        <i class="fas ${this.getTransactionIcon(transaction.type, transaction.subType)}"></i>
                        <span>${this.getTransactionTypeLabel(transaction.type, transaction.subType)}</span>
                    </div>
                </td>
                <td>
                    <span class="transaction-amount ${transaction.type === 'withdraw' ? 'positive' : 'negative'}">
                        ${transaction.type === 'withdraw' ? '+' : '-'}${this.utils.formatNumber(transaction.amount, 2)} USDT
                    </span>
                </td>
                <td>${new Date(transaction.date).toLocaleString('ru-RU')}</td>
                <td>
                    <span class="status-badge ${transaction.status}">
                        ${transaction.status === 'success' ? 'Успешно' : 'Ошибка'}
                    </span>
                </td>
                <td>
                    <span class="transaction-hash" title="${transaction.hash}">
                        ${this.utils.formatAddress(transaction.hash, 8, 8)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    getTransactionIcon(type, subType = null) {
        const icons = {
            invest: 'fa-coins',
            withdraw: subType === 'income' ? 'fa-home' : 
                     subType === 'tax' ? 'fa-users' : 
                     subType === 'deposit' ? 'fa-piggy-bank' : 'fa-download',
            referral: 'fa-user-plus',
            bonus: 'fa-gift'
        };
        return icons[type] || 'fa-exchange-alt';
    }

    getTransactionTypeLabel(type, subType = null) {
        const labels = {
            invest: 'Инвестиция',
            withdraw: subType === 'income' ? 'Вывод дохода' : 
                     subType === 'tax' ? 'Вывод налогов' : 
                     subType === 'deposit' ? 'Вывод с депозита' : 'Вывод средств',
            referral: 'Реферальное вознаграждение',
            bonus: 'Бонус'
        };
        return labels[type] || 'Транзакция';
    }

    showTab(tabName) {
        // Обновление хлебных крошек
        const pageTitles = {
            dashboard: 'Панель мэра',
            districts: 'Мои районы',
            treasury: 'Городская казна',
            tax: 'Налоговая',
            rankings: 'Рейтинг мэров'
        };
        
        const currentPageElement = document.getElementById('currentPage');
        if (currentPageElement) {
            currentPageElement.textContent = pageTitles[tabName] || tabName;
        }
        
        // Скрыть все табы
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Убрать активный класс у всех пунктов меню
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Показать выбранный таб
        const section = document.getElementById(tabName);
        if (section) {
            section.classList.add('active');
        }
        
        // Активировать пункт меню
        const menuItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
        }
        
        // Обновить заголовок страницы
        document.getElementById('pageTitle').textContent = pageTitles[tabName] || 'CryptoLand';
        
        this.currentTab = tabName;
        
        // Загрузка данных для таба
        switch (tabName) {
            case 'dashboard':
                this.renderTariffs();
                this.updateHeroStats();
                break;
            case 'districts':
                this.loadDeposits();
                break;
            case 'treasury':
                this.renderTransactions();
                break;
            case 'tax':
                this.updateReferralLink();
                break;
            case 'rankings':
                this.loadRankings();
                break;
        }
        
        // Плавный скролл к началу
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showModal(modalId) {
        document.getElementById('modalOverlay').style.display = 'block';
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
        
        // Анимация появления
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
        
        // Блокировка скролла body
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.opacity = '0';
            modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
            
            setTimeout(() => {
                modal.style.display = 'none';
                document.getElementById('modalOverlay').style.display = 'none';
                
                // Разблокировка скролла body
                document.body.style.overflow = '';
            }, 300);
        }
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.hideModal(modal.id);
        });
    }

    async updateAllData() {
        this.utils.showNotification('Обновление данных...', 'info');
        
        try {
            if (this.web3.isConnected) {
                await this.updateUserInfo();
                await this.updateStats();
                await this.loadDeposits(true);
                this.updateHeroStats();
                
                // Обновление данных в зависимости от текущей вкладки
                switch (this.currentTab) {
                    case 'treasury':
                        this.renderTransactions();
                        break;
                    case 'rankings':
                        await this.loadRankings();
                        break;
                    case 'tax':
                        this.updateReferralLink();
                        break;
                }
                
                this.utils.showNotification('Данные обновлены', 'success');
            }
        } catch (error) {
            console.error('Update all data error:', error);
            this.utils.showNotification('Ошибка обновления данных', 'error');
        }
    }

    updateUI() {
        // Обновление времени
        this.updateTime();
        
        // Проверка состояния сети
        this.checkNetworkStatus();
    }

    updateTime() {
        const now = new Date();
        const timeElement = document.querySelector('.current-time');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    checkNetworkStatus() {
        // Проверка статуса сети (заглушка)
        const networkStatus = document.getElementById('networkStatus');
        if (networkStatus) {
            networkStatus.innerHTML = '<i class="fas fa-wifi"></i> Онлайн';
            networkStatus.className = 'network-status online';
        }
    }

    showTariffDetails(tariffId) {
        const tariff = this.tariffs[tariffId];
        if (!tariff) return;
        
        this.utils.showNotification(`
            <div class="tariff-details">
                <h4>${tariff.name}</h4>
                <p><strong>Доходность:</strong> ${tariff.dailyPercent}% в день</p>
                <p><strong>Срок:</strong> ${tariff.duration} дней</p>
                <p><strong>Общая доходность:</strong> ${(tariff.dailyPercent * tariff.duration).toFixed(1)}%</p>
                <p><strong>Минимальная сумма:</strong> ${tariff.minAmount} USDT</p>
                <p>${tariff.description}</p>
            </div>
        `, 'info', 5000);
    }

    showDepositDetails(depositId) {
        const deposit = this.userDeposits.find(d => d.id === depositId);
        if (!deposit) return;
        
        const tariff = this.tariffs.find(t => t.id === deposit.tariffId);
        if (!tariff) return;
        
        const startDate = new Date(deposit.startTime * 1000);
        const endDate = new Date(startDate.getTime() + (tariff.duration * 86400000));
        const now = Date.now();
        const daysPassed = Math.floor((now - startDate.getTime()) / 86400000);
        const daysLeft = Math.max(0, tariff.duration - daysPassed);
        const dailyIncome = (parseFloat(deposit.amount) * tariff.dailyPercent) / 100;
        const totalIncome = dailyIncome * daysPassed;
        
        this.utils.showNotification(`
            <div class="deposit-details">
                <h4>${tariff.name}</h4>
                <p><strong>Сумма:</strong> ${this.utils.formatNumber(deposit.amount, 2)} USDT</p>
                <p><strong>Начало:</strong> ${startDate.toLocaleDateString('ru-RU')}</p>
                <p><strong>Окончание:</strong> ${endDate.toLocaleDateString('ru-RU')}</p>
                <p><strong>Дней прошло:</strong> ${daysPassed} из ${tariff.duration}</p>
                <p><strong>Дней осталось:</strong> ${daysLeft}</p>
                <p><strong>Ежедневный доход:</strong> ${this.utils.formatNumber(dailyIncome, 2)} USDT</p>
                <p><strong>Общий доход:</strong> ${this.utils.formatNumber(totalIncome, 2)} USDT</p>
                <p><strong>Статус:</strong> ${deposit.active ? 'Активный' : 'Завершенный'}</p>
            </div>
        `, 'info', 6000);
    }

    addDynamicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .rank-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: 10px;
                background: var(--gradient-card);
                border: 1px solid var(--border-light);
                font-weight: 700;
                font-size: 0.9rem;
            }
            
            .user-cell {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .user-avatar.small {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                background: var(--gradient-blue);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                color: white;
            }
            
            .user-info {
                display: flex;
                flex-direction: column;
            }
            
            .user-address {
                font-family: monospace;
                font-size: 0.85rem;
                font-weight: 600;
            }
            
            .user-city {
                font-size: 0.75rem;
                color: var(--text-secondary);
            }
            
            .value-tag {
                padding: 0.5rem 0.75rem;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.85rem;
                display: inline-block;
            }
            
            .value-tag.gold {
                background: rgba(245, 158, 11, 0.1);
                color: var(--accent-gold);
                border: 1px solid rgba(245, 158, 11, 0.3);
            }
            
            .value-tag.blue {
                background: rgba(59, 130, 246, 0.1);
                color: var(--accent-blue);
                border: 1px solid rgba(59, 130, 246, 0.3);
            }
            
            .table-empty {
                text-align: center;
                padding: 3rem;
                color: var(--text-secondary);
            }
            
            .table-empty i {
                font-size: 3rem;
                margin-bottom: 1rem;
                opacity: 0.5;
            }
            
            .transaction-type {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .transaction-type i {
                color: var(--accent-blue);
                font-size: 1.1rem;
            }
            
            .transaction-amount {
                font-weight: 700;
                font-family: 'Orbitron', sans-serif;
            }
            
            .transaction-amount.positive {
                color: var(--accent-green);
            }
            
            .transaction-amount.negative {
                color: var(--accent-blue);
            }
            
            .status-badge {
                padding: 0.375rem 0.75rem;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                display: inline-block;
            }
            
            .status-badge.success {
                background: rgba(16, 185, 129, 0.1);
                color: var(--accent-green);
                border: 1px solid rgba(16, 185, 129, 0.3);
            }
            
            .status-badge.error {
                background: rgba(239, 68, 68, 0.1);
                color: #EF4444;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            
            .transaction-hash {
                font-family: monospace;
                font-size: 0.85rem;
                cursor: pointer;
                color: var(--accent-blue-light);
                text-decoration: underline dotted;
            }
            
            .transaction-hash:hover {
                color: var(--accent-blue);
            }
            
            .level-bonus {
                padding: 0.375rem 0.75rem;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                display: inline-block;
            }
            
            .bonus-active {
                background: rgba(245, 158, 11, 0.1);
                color: var(--accent-gold);
                border: 1px solid rgba(245, 158, 11, 0.3);
            }
            
            .bonus-inactive {
                background: rgba(148, 163, 184, 0.1);
                color: var(--text-muted);
                border: 1px solid rgba(148, 163, 184, 0.3);
            }
            
            .current-level {
                background: rgba(59, 130, 246, 0.05);
            }
            
            .current-level td {
                border-left: 3px solid var(--accent-blue);
            }
            
            .deposit-status {
                padding: 0.375rem 0.75rem;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                display: inline-block;
            }
            
            .deposit-status.active {
                background: rgba(16, 185, 129, 0.1);
                color: var(--accent-green);
                border: 1px solid rgba(16, 185, 129, 0.3);
            }
            
            .deposit-status.finished {
                background: rgba(148, 163, 184, 0.1);
                color: var(--text-muted);
                border: 1px solid rgba(148, 163, 184, 0.3);
            }
            
            .profit {
                color: var(--accent-green) !important;
            }
            
            .disabled {
                opacity: 0.5;
                cursor: not-allowed !important;
            }
            
            .disabled:hover {
                transform: none !important;
                box-shadow: none !important;
            }
            
            .network-status {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.85rem;
                font-weight: 600;
            }
            
            .network-status.online {
                color: var(--accent-green);
            }
            
            .network-status.offline {
                color: var(--accent-red);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .content-section.active {
                animation: fadeIn 0.3s ease;
            }
            
            .tariff-details, .deposit-details {
                text-align: left;
            }
            
            .tariff-details h4, .deposit-details h4 {
                margin-bottom: 0.75rem;
                color: var(--accent-gold);
            }
            
            .tariff-details p, .deposit-details p {
                margin-bottom: 0.5rem;
                line-height: 1.4;
            }
            
            .tariff-details strong, .deposit-details strong {
                color: var(--text-primary);
            }
        `;
        document.head.appendChild(style);
    }

    generateRandomHex(length) {
        return Array.from({length}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем элемент для отображения времени
    const timeElement = document.createElement('div');
    timeElement.className = 'current-time';
    document.querySelector('.header-right')?.appendChild(timeElement);
    
    // Инициализация приложения
    window.app = new CryptoLandApp();
    
    // Автообновление данных каждые 30 секунд
    setInterval(() => {
        if (window.app && window.app.web3 && window.app.web3.isConnected) {
            window.app.updateStats();
            window.app.updateHeroStats();
        }
    }, 30000);
    
    // Обновление времени каждую секунду
    setInterval(() => {
        if (window.app) window.app.updateTime();
    }, 1000);
    
    // Глобальные обработчики
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.app.hideAllModals();
        }
    });
});
