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
                description: "Начальный уровень для тестирования"
            },
            {
                id: 1,
                name: "Жилой квартал",
                dailyPercent: 0.6,
                duration: 5,
                color: "blue",
                description: "Стабильный доход"
            },
            {
                id: 2,
                name: "Новый микрорайон",
                dailyPercent: 0.7,
                duration: 7,
                color: "blue",
                description: "Повышенная доходность"
            },
            {
                id: 3,
                name: "Деловой центр",
                dailyPercent: 0.85,
                duration: 10,
                color: "gold",
                description: "Премиум уровень",
                premium: true
            },
            {
                id: 4,
                name: "Бизнес-кластер",
                dailyPercent: 1.0,
                duration: 15,
                color: "gold",
                description: "Высокая доходность",
                premium: true
            },
            {
                id: 5,
                name: "Элитный квартал",
                dailyPercent: 1.2,
                duration: 20,
                color: "gold",
                description: "Эксклюзивный уровень",
                premium: true
            },
            {
                id: 6,
                name: "Мегаполис",
                dailyPercent: 1.5,
                duration: 30,
                color: "gold",
                description: "Максимальная доходность",
                premium: true
            }
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
        this.selectedTariff = null;
        
        this.init();
    }

    async init() {
        // Скрыть прелоадер
        setTimeout(() => {
            document.getElementById('preloader').classList.add('hiding');
            setTimeout(() => {
                document.getElementById('preloader').style.display = 'none';
                document.querySelector('.app-container').style.opacity = '1';
            }, 500);
        }, 1500);
        
        // Инициализация событий
        this.initEvents();
        
        // Загрузка данных
        this.renderTariffs();
        this.renderLevels();
        this.updateUI();
        
        // Проверка подключения
        await this.checkConnection();
    }


    initEvents() {
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.dataset.tab;
                this.showTab(tab);
            });
        });

        // Переключение меню на мобильных
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });

        // Подключение кошелька
        document.getElementById('sidebarConnectBtn').addEventListener('click', () => {
            this.showWalletModal();
        });

        // Опции кошельков
        document.querySelectorAll('.wallet-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.wallet-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                this.selectedWallet = option.dataset.wallet;
            });
        });

        // Подключение выбранного кошелька
        document.getElementById('connectWallet').addEventListener('click', async () => {
            await this.connectWallet();
        });

        document.getElementById('cancelWallet').addEventListener('click', () => {
            this.hideModal('walletModal');
        });

        // Инвестирование
        document.querySelectorAll('.tariff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tariffId = e.currentTarget.dataset.tariffId;
                this.showInvestModal(tariffId);
            });
        });

        // Кнопки в модальном инвестировании
        document.getElementById('cancelInvest').addEventListener('click', () => {
            this.hideModal('investModal');
        });

        document.getElementById('confirmInvest').addEventListener('click', async () => {
            await this.processInvestment();
        });

        // Обновление суммы инвестиции
        document.getElementById('investAmount').addEventListener('input', (e) => {
            this.updateInvestmentSummary();
        });

        // Реферальная ссылка
        document.getElementById('sidebarRefBtn').addEventListener('click', () => {
            this.showReferralModal();
        });

        document.getElementById('copyReferralLink').addEventListener('click', async () => {
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

        // Закрытие модальных окон
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.currentTarget.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        document.getElementById('modalOverlay').addEventListener('click', () => {
            this.hideAllModals();
        });

        // Кнопка "Начать инвестировать"
        document.getElementById('goToInvest').addEventListener('click', () => {
            this.showTab('dashboard');
        });

        // Обновление депозитов
        document.getElementById('refreshDeposits').addEventListener('click', async () => {
            await this.loadDeposits();
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
                console.error('Connection error:', error);
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
            
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.utils.showNotification('Ошибка подключения: ' + error.message, 'error');
        }
    }

    async updateUserInfo() {
        if (!this.web3.isConnected) return;

        try {
            // Обновление имени пользователя
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = this.utils.formatAddress(this.web3.account);
            }

            // Обновление статуса
            const userStatus = document.getElementById('userStatus');
            if (userStatus) {
                userStatus.innerHTML = '<div class="status-dot online"></div>';
            }

            // Обновление баланса
            const balance = await this.web3.getUSDTBalance();
            const sidebarBalance = document.getElementById('sidebarBalance');
            const walletBalance = document.getElementById('walletBalance');
            
            if (sidebarBalance) sidebarBalance.textContent = this.utils.formatNumber(balance, 2);
            if (walletBalance) walletBalance.textContent = `${this.utils.formatNumber(balance, 2)} USDT`;

            // Обновление статистики
            await this.updateStats();

        } catch (error) {
            console.error('Update user info error:', error);
        }
    }


    async updateStats() {
        try {
            const stats = await this.web3.getUserStats();
            
            // Обновление карточек статистики
            document.getElementById('statTotal').textContent = `${this.utils.formatNumber(parseFloat(stats.activeDeposits) + parseFloat(stats.availableInterest) + parseFloat(stats.availableReferral), 2)} USDT`;
            document.getElementById('statActive').textContent = stats.activeDeposits > 0 ? '1+' : '0';
            document.getElementById('statTaxes').textContent = `${this.utils.formatNumber(stats.availableReferral, 2)} USDT`;
            document.getElementById('statIncome').textContent = `${this.utils.formatNumber(stats.availableInterest, 2)} USDT`;
            
            // Обновление казны
            document.getElementById('headerTreasury').textContent = `${this.utils.formatNumber(parseFloat(stats.activeDeposits) + parseFloat(stats.availableInterest) + parseFloat(stats.availableReferral), 0)} USDT`;
            
            // Обновление балансов в казне
            document.getElementById('treasuryIncome').textContent = `${this.utils.formatNumber(stats.availableInterest, 2)} USDT`;
            document.getElementById('treasuryTax').textContent = `${this.utils.formatNumber(stats.availableReferral, 2)} USDT`;
            document.getElementById('treasuryDeposit').textContent = `${this.utils.formatNumber(stats.activeDeposits, 2)} USDT`;
            
            // Активация кнопок вывода
            const withdrawIncomeBtn = document.getElementById('withdrawIncomeBtn');
            const withdrawTaxBtn = document.getElementById('withdrawTaxBtn');
            
            if (withdrawIncomeBtn) {
                withdrawIncomeBtn.disabled = parseFloat(stats.availableInterest) <= 0;
            }
            if (withdrawTaxBtn) {
                withdrawTaxBtn.disabled = parseFloat(stats.availableReferral) <= 0;
            }
            
            // Обновление сводки в разделах
            document.getElementById('summaryTotal').textContent = `${this.utils.formatNumber(stats.totalDeposits, 2)} USDT`;
            document.getElementById('summaryActive').textContent = `${this.utils.formatNumber(stats.activeDeposits, 2)} USDT`;
            document.getElementById('summaryAccumulated').textContent = `${this.utils.formatNumber(parseFloat(stats.availableInterest) + parseFloat(stats.availableReferral), 2)} USDT`;
            document.getElementById('summaryAvailable').textContent = `${this.utils.formatNumber(stats.availableInterest, 2)} USDT`;
            
        } catch (error) {
            console.error('Update stats error:', error);
        }
    }


    renderTariffs() {
        const container = document.getElementById('tariffsGrid');
        if (!container) return;
        
        container.innerHTML = this.tariffs.map(tariff => `
            <div class="tariff-card ${tariff.premium ? 'premium' : ''}">
                <div class="tariff-header">
                    <div class="tariff-name">${tariff.name}</div>
                    ${tariff.premium ? '<div class="tariff-badge">ПРЕМИУМ</div>' : ''}
                </div>
                <div class="tariff-body">
                    <div class="tariff-percent">${tariff.dailyPercent}%</div>
                    <div class="tariff-period">в день • ${tariff.duration} дней</div>
                    
                    <ul class="tariff-features">
                        <li><i class="fas fa-check"></i> Минимальная сумма: 10 USDT</li>
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
        
        // Добавление событий для кнопок подробнее
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tariffId = e.currentTarget.dataset.tariffDetails;
                this.showTariffDetails(tariffId);
            });
        });
    }

    renderLevels() {
        const container = document.getElementById('levelsBody');
        if (!container) return;
        
        container.innerHTML = this.levels.map(level => `
            <tr>
                <td><strong>${level.level}</strong></td>
                <td><span class="text-gold font-bold">${level.percentage}%</span></td>
                <td>${this.utils.formatNumber(level.turnover)} USDT</td>
                <td>от ${level.deposit} USDT</td>
                <td>0</td>
                <td>0 USDT</td>
                <td>
                    <span class="level-bonus bonus-inactive">
                        <i class="fas fa-times"></i> Неактивен
                    </span>
                </td>
            </tr>
        `).join('');
    }

    showWalletModal() {
        this.showModal('walletModal');
    }


    showInvestModal(tariffId) {
        this.selectedTariff = this.tariffs[tariffId];
        
        // Обновление информации о тарифе
        document.getElementById('investTitle').textContent = `Инвестиция в ${this.selectedTariff.name}`;
        
        const preview = document.getElementById('tariffPreview');
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
                    <span class="stat-value">${this.selectedTariff.dailyPercent * this.selectedTariff.duration}%</span>
                </div>
                <div class="preview-stat">
                    <span class="stat-label">Минимальная сумма:</span>
                    <span class="stat-value">10 USDT</span>
                </div>
            </div>
        `;
        
        // Обновление доступного баланса
        this.updateAvailableBalance();
        
        // Обновление сводки
        this.updateInvestmentSummary();
        
        this.showModal('investModal');
    }

    updateAvailableBalance() {
        const balanceElement = document.getElementById('availableBalance');
        if (this.web3.isConnected) {
            this.web3.getUSDTBalance().then(balance => {
                balanceElement.textContent = `${this.utils.formatNumber(balance, 2)} USDT`;
            });
        } else {
            balanceElement.textContent = '0 USDT';
        }
    }

    updateInvestmentSummary() {
        const amount = parseFloat(document.getElementById('investAmount').value) || 10;
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
        document.getElementById('summaryEndDate').textContent = endDate.toLocaleDateString('ru-RU');
    }


    async processInvestment() {
        try {
            if (!this.web3.isConnected) {
                this.utils.showNotification('Сначала подключите кошелек', 'error');
                this.showWalletModal();
                return;
            }
            
            const amount = parseFloat(document.getElementById('investAmount').value);
            const referrer = document.getElementById('referrerAddress').value.trim();
            
            if (amount < 10) {
                this.utils.showNotification('Минимальная сумма 10 USDT', 'error');
                return;
            }
            
            if (referrer && !this.utils.isValidAddress(referrer)) {
                this.utils.showNotification('Неверный адрес реферера', 'error');
                return;
            }
            
            this.utils.showNotification('Отправка транзакции...', 'info');
            
            await this.web3.invest(
                amount,
                this.selectedTariff.id,
                referrer || '0x0000000000000000000000000000000000000000'
            );
            
            this.utils.showNotification('Инвестиция успешно завершена!', 'success');
            this.hideModal('investModal');
            
            // Обновление данных
            await this.updateUserInfo();
            await this.loadDeposits();
            
        } catch (error) {
            console.error('Investment error:', error);
            this.utils.showNotification('Ошибка: ' + error.message, 'error');
        }
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
        
        const refLink = `${window.location.origin}?ref=${this.web3.account}`;
        
        // Обновление ссылки
        document.getElementById('refLinkInput').value = refLink;
        document.getElementById('referralLink').value = refLink;
        
        // Генерация QR кода
        const qrContainer = document.getElementById('referralQr');
        if (qrContainer) {
            qrContainer.innerHTML = '';
            this.utils.generateQRCode('referralQr', refLink);
        }
    }

    async copyReferralLink() {
        const refLink = document.getElementById('referralLink').value;
        await this.utils.copyToClipboard(refLink);
        this.utils.showNotification('Ссылка скопирована в буфер обмена!', 'success');
    }

    async withdrawIncome() {
        try {
            if (!this.web3.isConnected) {
                this.utils.showNotification('Сначала подключите кошелек', 'error');
                return;
            }
            
            this.utils.showNotification('Вывод дохода...', 'info');
            
            // Здесь будет вызов метода контракта для вывода процентов
            // await this.web3.withdrawInterest(depositId);
            
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
            
            // Здесь будет вызов метода контракта для вывода реферальных
            // await this.web3.withdrawReferral();
            
            this.utils.showNotification('Налоги успешно выведены!', 'success');
            await this.updateStats();
            
        } catch (error) {
            console.error('Withdraw tax error:', error);
            this.utils.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    async checkDeposits() {
        try {
            if (!this.web3.isConnected) {
                this.utils.showNotification('Сначала подключите кошелек', 'error');
                return;
            }
            
            this.utils.showNotification('Проверка завершения депозитов...', 'info');
            
            // Здесь будет вызов метода контракта
            // await this.web3.checkAndFinishDeposits();
            
            this.utils.showNotification('Проверка завершена!', 'success');
            await this.loadDeposits();
            await this.updateStats();
            
        } catch (error) {
            console.error('Check deposits error:', error);
            this.utils.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    async loadDeposits() {
        try {
            if (!this.web3.isConnected) return;
            
            // Здесь будет загрузка депозитов из контракта
            // const deposits = await this.web3.getUserDeposits();
            
            // Временные данные для демонстрации
            const deposits = [];
            
            const container = document.getElementById('depositsGrid');
            const emptyState = document.getElementById('emptyDeposits');
            
            if (deposits.length === 0) {
                container.innerHTML = '';
                emptyState.classList.remove('hidden');
                document.getElementById('depositCount').textContent = '0';
                return;
            }
            
            emptyState.classList.add('hidden');
            document.getElementById('depositCount').textContent = deposits.length;
            
            // Рендеринг депозитов
            container.innerHTML = deposits.map((deposit, index) => {
                const tariff = this.tariffs[deposit.tariffId];
                const daysLeft = Math.max(0, tariff.duration - Math.floor((Date.now()/1000 - deposit.startTime) / 86400));
                const progress = ((tariff.duration - daysLeft) / tariff.duration) * 100;
                
                return `
                    <div class="deposit-card">
                        <div class="deposit-header">
                            <h4 class="deposit-name">${tariff.name}</h4>
                            <span class="deposit-status">Активный</span>
                        </div>
                        
                        <div class="deposit-stats">
                            <div class="deposit-stat">
                                <span class="stat-label">Инвестировано</span>
                                <span class="stat-value">${this.utils.formatNumber(this.web3.web3.utils.fromWei(deposit.amount, 'ether'), 2)} USDT</span>
                            </div>
                            <div class="deposit-stat">
                                <span class="stat-label">Доходность</span>
                                <span class="stat-value">${tariff.dailyPercent}% в день</span>
                            </div>
                            <div class="deposit-stat">
                                <span class="stat-label">Накоплено</span>
                                <span class="stat-value profit">0.00 USDT</span>
                            </div>
                            <div class="deposit-stat">

                                <span class="stat-label">Дней осталось</span>
                                <span class="stat-value">${daysLeft}</span>
                            </div>
                        </div>
                        
                        <div class="deposit-progress">
                            <div class="progress-info">
                                <span class="time-left">${tariff.duration - daysLeft} из ${tariff.duration} дней</span>
                                <span>${Math.round(progress)}%</span>
                            </div>
                            <div class="progress-container">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                        
                        <div class="deposit-actions">
                            <button class="action-btn withdraw-btn" data-deposit-id="${index}">
                                <i class="fas fa-download"></i>
                                Вывести доход
                            </button>
                            <button class="action-btn details-btn" data-deposit-details="${index}">
                                <i class="fas fa-info-circle"></i>
                                Подробнее
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Load deposits error:', error);
        }
    }

    showTab(tabName) {
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
        const titles = {
            dashboard: 'Панель мэра',
            districts: 'Мои районы',
            treasury: 'Городская казна',
            tax: 'Налоговая служба',
            rankings: 'Рейтинг мэров'
        };
        
        const subtitles = {
            dashboard: 'Управляйте вашим виртуальным мегаполисом',
            districts: 'Отслеживайте ваши текущие инвестиции',
            treasury: 'Управляйте вашими финансами и выводите средства',
            tax: 'Статистика по реферальным уровням и налоговым сборам',
            rankings: 'Соревнуйтесь с другими мэрами за первое место'
        };
        
        document.getElementById('pageTitle').textContent = titles[tabName] || 'CryptoLand';
        document.getElementById('pageSubtitle').textContent = subtitles[tabName] || '';
        
        this.currentTab = tabName;
        
        // Загрузка данных для таба
        switch (tabName) {
            case 'dashboard':
                this.renderTariffs();
                break;
            case 'districts':
                this.loadDeposits();
                break;
            case 'tax':
                this.updateReferralLink();
                break;
        }
    }

    showModal(modalId) {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById(modalId).style.display = 'block';
        
        // Анимация появления
        setTimeout(() => {
            document.getElementById(modalId).style.opacity = '1';
            document.getElementById(modalId).style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }


    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.opacity = '0';
            modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
            
            setTimeout(() => {
                modal.style.display = 'none';
                document.getElementById('modalOverlay').style.display = 'none';
            }, 300);
        }
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.hideModal(modal.id);
        });
    }

    updateUI() {
        // Обновление различных элементов интерфейса
        const now = new Date();
        const timeElement = document.querySelector('.current-time');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('ru-RU');
        }
    }

    showTariffDetails(tariffId) {
        const tariff = this.tariffs[tariffId];
        if (!tariff) return;
        
        this.utils.showNotification(`
            <strong>${tariff.name}</strong><br>
            Доходность: ${tariff.dailyPercent}% в день<br>
            Срок: ${tariff.duration} дней<br>
            ${tariff.description}
        `, 'info');
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CryptoLandApp();
    
    // Автообновление данных каждые 30 секунд
    setInterval(() => {
        if (window.app && window.app.web3 && window.app.web3.isConnected) {
            window.app.updateStats();
        }
    }, 30000);
    
    // Обновление времени
    setInterval(() => {
        window.app.updateUI();
    }, 1000);
});
