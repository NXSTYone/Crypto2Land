class CryptoLandApp {
    constructor() {
        this.web3 = window.cryptoLandWeb3;
        this.utils = window.utils;
        this.currentTab = 'dashboard';
        this.selectedTariff = null;
        this.selectedWallet = 'metamask';
        
        // Фразы мэра из конфига
        this.mayorPhrases = CONFIG.MAYOR_PHRASES || [
            "Развивайте свой город, и жители будут благодарны!",
            "Каждая инвестиция делает мегаполис сильнее.",
            "Вместе мы построим лучший крипто-город!",
            "Рефералы — это не просто жители, это ваша команда.",
            "Золотой район ждет своего мэра!",
            "Пассивный доход — ключ к финансовой свободе.",
            "Чем выше уровень, тем больше возможности.",
            "Ваш город — ваши правила!",
            "Инвестируйте с умом, развивайтесь с нами.",
            "Сегодняшние вложения — завтрашний успех!"
        ];
        
        this.tariffs = [
            { id: 0, name: "Спальный район", dailyPercent: 0.5, duration: 3, premium: false, icon: "🏘" },
            { id: 1, name: "Жилой квартал", dailyPercent: 0.6, duration: 5, premium: false, icon: "🏢" },
            { id: 2, name: "Новый микрорайон", dailyPercent: 0.7, duration: 7, premium: false, icon: "🏙" },
            { id: 3, name: "Деловой центр", dailyPercent: 0.85, duration: 10, premium: true, icon: "🏛" },
            { id: 4, name: "Бизнес-кластер", dailyPercent: 1.0, duration: 15, premium: true, icon: "🏬" },
            { id: 5, name: "Элитный квартал", dailyPercent: 1.2, duration: 20, premium: true, icon: "🏰" },
            { id: 6, name: "Мегаполис", dailyPercent: 1.5, duration: 30, premium: true, icon: "🌆" }
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
        
        this.init();
    }


    async init() {
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.classList.add('hiding');
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 600);
            }
        }, 1500);

        this.setupLogo();
        this.setupAvatar();
        this.setSocialLinks();
        this.initEvents();
        this.renderTariffs();
        this.renderLevels();
        await this.checkConnection();
    }

    setupLogo() {
        const logoImage = document.getElementById('logoImage');
        const logoFallback = document.getElementById('logoFallback');
        const preloaderLogo = document.getElementById('preloaderLogo');
        const preloaderFallback = document.getElementById('preloaderLogoFallback');
        
        if (CONFIG.LOGO?.useCustomLogo) {
            const img = new Image();
            img.src = CONFIG.LOGO.logoPath;
            img.onload = () => {
                if (logoImage) {
                    logoImage.style.display = 'block';
                    logoImage.src = CONFIG.LOGO.logoPath;
                }
                if (logoFallback) logoFallback.style.display = 'none';
                if (preloaderLogo) {
                    preloaderLogo.style.display = 'block';
                    preloaderLogo.src = CONFIG.LOGO.logoPath;
                }
                if (preloaderFallback) preloaderFallback.style.display = 'none';
            };
            img.onerror = () => {
                if (logoImage) logoImage.style.display = 'none';
                if (logoFallback) logoFallback.style.display = 'flex';
                if (preloaderLogo) preloaderLogo.style.display = 'none';
                if (preloaderFallback) preloaderFallback.style.display = 'flex';
            };
        } else {
            if (logoImage) logoImage.style.display = 'none';
            if (logoFallback) logoFallback.style.display = 'flex';
            if (preloaderLogo) preloaderLogo.style.display = 'none';
            if (preloaderFallback) preloaderFallback.style.display = 'flex';
        }
    }

    setupAvatar() {
        const avatarImage = document.getElementById('avatarImage');
        const avatarFallback = document.getElementById('avatarFallback');
        const modalAvatar = document.getElementById('modalAvatarImage');
        
        if (CONFIG.AVATAR?.defaultAvatar) {
            const img = new Image();
            img.src = CONFIG.AVATAR.defaultAvatar;
            img.onload = () => {
                if (avatarImage) {
                    avatarImage.style.display = 'block';
                    avatarImage.src = CONFIG.AVATAR.defaultAvatar;
                }
                if (avatarFallback) avatarFallback.style.display = 'none';
                if (modalAvatar) modalAvatar.src = CONFIG.AVATAR.defaultAvatar;
            };
            img.onerror = () => {
                if (avatarImage) avatarImage.style.display = 'none';
                if (avatarFallback) avatarFallback.style.display = 'flex';
                if (modalAvatar) modalAvatar.src = '';
            };
        }
    }

    setSocialLinks() {
        const supportLink = document.getElementById('telegramSupportLink');
        const channelLink = document.getElementById('telegramChannelLink');
        const governorLink = document.getElementById('telegramGovernorLink');
        
        if (supportLink) supportLink.href = CONFIG.SOCIAL.TELEGRAM_SUPPORT;
        if (channelLink) channelLink.href = CONFIG.SOCIAL.TELEGRAM_CHANNEL;
        if (governorLink) governorLink.href = CONFIG.SOCIAL.TELEGRAM_GOVERNOR;
    }

    initEvents() {
        // Вертикальная навигация
        document.querySelectorAll('.nav-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tabName = item.dataset.tab;
                this.showTab(tabName);
            });
        });


        // Аватар мэра
        const avatarContainer = document.getElementById('mayorAvatarContainer');
        if (avatarContainer) {
            avatarContainer.addEventListener('click', () => {
                this.showRandomMayorPhrase();
            });
        }

        // Закрыть модалку фраз
        const closeMayorModal = document.getElementById('closeMayorModal');
        if (closeMayorModal) {
            closeMayorModal.addEventListener('click', () => {
                this.hideModal('mayorPhrasesModal');
            });
        }

        // Новая фраза
        const newPhraseBtn = document.getElementById('newPhraseBtn');
        if (newPhraseBtn) {
            newPhraseBtn.addEventListener('click', () => {
                this.showRandomMayorPhrase();
            });
        }

        // Навигация по таблице уровней
        const scrollToConditions = document.getElementById('scrollToConditions');
        if (scrollToConditions) {
            scrollToConditions.addEventListener('click', () => {
                document.getElementById('conditionsHeader')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                document.querySelectorAll('.levels-nav-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                scrollToConditions.classList.add('active');
            });
        }

        const scrollToStats = document.getElementById('scrollToStats');
        if (scrollToStats) {
            scrollToStats.addEventListener('click', () => {
                document.getElementById('statsHeader')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                document.querySelectorAll('.levels-nav-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                scrollToStats.classList.add('active');
            });
        }

        // Подключение кошелька
        const connectBtn = document.getElementById('headerConnectBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                this.showWalletModal();
            });
        }

        // Опции кошельков
        document.querySelectorAll('.wallet-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.wallet-option').forEach(opt => 
                    opt.classList.remove('selected')
                );
                option.classList.add('selected');
                this.selectedWallet = option.dataset.wallet;
            });
        });

        // Кнопки в модалке кошелька
        const connectWallet = document.getElementById('connectWallet');
        if (connectWallet) {
            connectWallet.addEventListener('click', async () => {
                await this.connectWallet();
            });
        }

        const cancelWallet = document.getElementById('cancelWallet');
        if (cancelWallet) {
            cancelWallet.addEventListener('click', () => {
                this.hideModal('walletModal');
            });
        }

        // Инвестирование
        const confirmInvest = document.getElementById('confirmInvest');
        if (confirmInvest) {
            confirmInvest.addEventListener('click', async () => {
                await this.processInvestment();
            });
        }

        const cancelInvest = document.getElementById('cancelInvest');
        if (cancelInvest) {
            cancelInvest.addEventListener('click', () => {
                this.hideModal('investModal');
            });
        }

        const investAmount = document.getElementById('investAmount');
        if (investAmount) {
            investAmount.addEventListener('input', (e) => {
                this.updateInvestmentSummary();
            });
        }


        // Реферальная ссылка
        const copyRefLink = document.getElementById('copyRefLink');
        if (copyRefLink) {
            copyRefLink.addEventListener('click', async () => {
                await this.copyReferralLink();
            });
        }

        // Вывод средств
        const withdrawIncome = document.getElementById('withdrawIncomeBtn');
        if (withdrawIncome) {
            withdrawIncome.addEventListener('click', async () => {
                await this.withdrawIncome();
            });
        }

        const withdrawTax = document.getElementById('withdrawTaxBtn');
        if (withdrawTax) {
            withdrawTax.addEventListener('click', async () => {
                await this.withdrawTax();
            });
        }

        const checkDeposits = document.getElementById('checkDepositsBtn');
        if (checkDeposits) {
            checkDeposits.addEventListener('click', async () => {
                await this.checkDeposits();
            });
        }

        // Кнопки "Начать инвестировать"
        const goToInvest = document.getElementById('goToInvest');
        if (goToInvest) {
            goToInvest.addEventListener('click', () => {
                this.showTab('dashboard');
            });
        }

        const goToInvestFromDistricts = document.getElementById('goToInvestFromDistricts');
        if (goToInvestFromDistricts) {
            goToInvestFromDistricts.addEventListener('click', () => {
                this.showTab('dashboard');
            });
        }

        // Фильтры депозитов
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-pill').forEach(p => 
                    p.classList.remove('active')
                );
                pill.classList.add('active');
                this.filterDeposits(pill.dataset.filter);
            });
        });

        // Обновление депозитов
        const refreshDeposits = document.getElementById('refreshDeposits');
        if (refreshDeposits) {
            refreshDeposits.addEventListener('click', async () => {
                await this.loadDeposits();
            });
        }

        // Фильтры рейтинга
        document.querySelectorAll('.ranking-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.ranking-type-btn').forEach(b => 
                    b.classList.remove('active')
                );
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

        // Фильтры транзакций
        const dateFilter = document.getElementById('transactionDateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filterTransactionsByDate(e.target.value);
            });
        }

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
                if (modal) this.hideModal(modal.id);
            });
        });

        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => {
                this.hideAllModals();
            });
        }
    }


    showRandomMayorPhrase() {
        const randomIndex = Math.floor(Math.random() * this.mayorPhrases.length);
        const phrase = this.mayorPhrases[randomIndex];
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const phraseElement = document.getElementById('mayorPhraseText');
        if (phraseElement) phraseElement.textContent = phrase;
        
        const dateElement = document.getElementById('mayorPhraseDate');
        if (dateElement) dateElement.textContent = dateStr;
        
        this.showModal('mayorPhrasesModal');
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
            this.utils.showNotification('Ошибка подключения', 'error');
        }
    }

    async updateUserInfo() {
        if (!this.web3 || !this.web3.isConnected) return;
        
        try {
            const balance = await this.web3.getUSDTBalance();
            document.getElementById('headerWalletBalance').textContent = this.utils.formatNumber(balance, 2);
            
            document.getElementById('statPopulation').textContent = '127';
            document.getElementById('statTotal').textContent = this.utils.formatNumber(balance * 1.5, 2) + ' USDT';
            document.getElementById('statTaxes').textContent = this.utils.formatNumber(balance * 0.3, 2) + ' USDT';
            document.getElementById('statIncome').textContent = this.utils.formatNumber(balance * 0.1, 2) + ' USDT';
            
            document.getElementById('treasuryIncome').textContent = this.utils.formatNumber(balance * 0.1, 2) + ' USDT';
            document.getElementById('treasuryTax').textContent = this.utils.formatNumber(balance * 0.3, 2) + ' USDT';
            document.getElementById('treasuryDeposit').textContent = this.utils.formatNumber(balance, 2) + ' USDT';
            
            document.getElementById('summaryTotal').textContent = this.utils.formatNumber(balance, 2) + ' USDT';
            document.getElementById('summaryActive').textContent = this.utils.formatNumber(balance * 0.8, 2) + ' USDT';
            document.getElementById('summaryAccumulated').textContent = this.utils.formatNumber(balance * 0.2, 2) + ' USDT';
            document.getElementById('summaryAvailable').textContent = this.utils.formatNumber(balance * 0.1, 2) + ' USDT';
            
            document.getElementById('totalReferrals').textContent = '127';
            document.getElementById('totalTaxes').textContent = this.utils.formatNumber(balance * 0.3, 2) + ' USDT';
            document.getElementById('totalTurnover').textContent = this.utils.formatNumber(balance * 5, 2) + ' USDT';
            
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
            <div class="tariff-card ${tariff.premium ? 'premium' : ''}" data-tariff="${tariff.id}">
                <div class="tariff-icon">${tariff.icon}</div>
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
                this.showInvestModal(parseInt(tariffId));
            });
        });
    }

    renderLevels() {
        const container = document.getElementById('levelsBody');
        if (!container) return;
        
        container.innerHTML = this.levels.map(level => `
            <tr>
                <td><span class="level-badge">${level.level}</span></td>
                <td><span class="profit-percent">${level.percentage}%</span></td>
                <td>${this.utils.formatNumber(level.turnover)} USDT</td>
                <td>от ${level.deposit} USDT</td>
                <td>0</td>
                <td>0 USDT</td>
                <td><span class="bonus-inactive">Неактивен</span></td>
            </tr>
        `).join('');
    }

    showTab(tabName) {
        document.querySelectorAll('.content-section').forEach(s => {
            s.classList.remove('active');
        });
        
        const section = document.getElementById(tabName);
        if (section) section.classList.add('active');
        
        document.querySelectorAll('.nav-menu-item').forEach(t => {
            t.classList.remove('active');
        });
        
        const menuItem = document.querySelector(`.nav-menu-item[data-tab="${tabName}"]`);
        if (menuItem) menuItem.classList.add('active');
        
        this.currentTab = tabName;
        
        if (tabName === 'tax') {
            this.updateReferralLink();
            
            document.querySelectorAll('.levels-nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const conditionsBtn = document.getElementById('scrollToConditions');
            if (conditionsBtn) conditionsBtn.classList.add('active');
        }
        if (tabName === 'districts') this.loadDeposits();
        if (tabName === 'rankings') this.loadRankings('tax');
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
        if (!balanceElement) return;
        
        if (this.web3 && this.web3.isConnected) {
            this.web3.getUSDTBalance().then(balance => {
                balanceElement.textContent = `${this.utils.formatNumber(balance, 2)} USDT`;
            }).catch(() => {
                balanceElement.textContent = '0.00 USDT';
            });
        } else {
            balanceElement.textContent = '0.00 USDT';
        }
    }

    updateInvestmentSummary() {
        const amount = parseFloat(document.getElementById('investAmount')?.value) || 10;
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
        
        const amount = parseFloat(document.getElementById('investAmount')?.value);
        if (amount < 10) {
            this.utils.showNotification('Минимальная сумма 10 USDT', 'error');
            return;
        }
        
        try {
            this.utils.showNotification('Инвестирование...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1500));
            this.utils.showNotification('Инвестиция успешна!', 'success');
            this.hideModal('investModal');
            await this.updateUserInfo();
        } catch (error) {
            this.utils.showNotification('Ошибка транзакции', 'error');
        }
    }

    updateReferralLink() {
        const refInput = document.getElementById('refLinkInput');
        if (!refInput) return;
        
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            refInput.value = 'Подключите кошелек';
            return;
        }
        
        const refLink = `${window.location.origin}?ref=${this.web3.account}`;
        refInput.value = refLink;
    }


    async copyReferralLink() {
        const refInput = document.getElementById('refLinkInput');
        if (!refInput) return;
        
        const refLink = refInput.value;
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
        const navBadge = document.getElementById('navDepositCount');
        
        if (container && emptyState) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            if (navBadge) navBadge.textContent = '0';
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
        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById(modalId);
        
        if (overlay) overlay.style.display = 'block';
        if (modal) modal.style.display = 'block';
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
        
        const overlay = document.getElementById('modalOverlay');
        if (overlay && !document.querySelector('.modal[style*="display: block"]')) {
            overlay.style.display = 'none';
        }
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        
        const overlay = document.getElementById('modalOverlay');
        if (overlay) overlay.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new CryptoLandApp();
});
