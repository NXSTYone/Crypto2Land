class CryptoLandApp {
    constructor() {
        this.web3 = window.cryptoLandWeb3;
        this.utils = window.utils;
        this.currentTab = 'dashboard';
        this.selectedTariff = null;
        this.selectedWallet = 'metamask';
        this.currentLanguage = CONFIG.LANGUAGE.default || 'ru';
        this.userDeposits = [];
        this.tariffs = [];
        
        // Фразы мэра из конфига
        this.mayorPhrases = CONFIG.MAYOR_PHRASES;
        
        this.init();
    }

    async init() {
        // Прелоадер
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
        this.initLanguage();
        
        // Загрузка тарифов из контракта
        await this.loadTariffsFromContract();
        
        // ===== ДОБАВЛЕНО: ПРОВЕРКА НА TELEGRAM MINI APP =====
        if (this.isTelegramMiniApp()) {
            console.log("✅ Приложение запущено в Telegram Mini App");
            // Показываем уведомление через 2 секунды
            setTimeout(() => {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 
                    'Для подключения в Telegram используйте WalletConnect' : 
                    'To connect in Telegram, use WalletConnect', 
                    'info'
                );
            }, 2000);
        }
        // ===== КОНЕЦ ДОБАВЛЕНИЯ =====
        
        // АВТОПОДКЛЮЧЕНИЕ УДАЛЕНО - кнопка всегда в состоянии "ПОДКЛЮЧИТЬ"
        // this.checkConnection() - удалено
    }

    /**
     * @dev Проверка, запущено ли приложение в Telegram Mini App
     */
    isTelegramMiniApp() {
        return window.Telegram && Telegram.WebApp && Telegram.WebApp.initData !== '';
    }

    async loadTariffsFromContract() {
        try {
            // Пробуем загрузить тарифы из контракта
            if (this.web3 && this.web3.isConnected) {
                const contractTariffs = await this.web3.getTariffs();
                if (contractTariffs && contractTariffs.length > 0) {
                    this.tariffs = contractTariffs;
                    console.log("✅ Тарифы загружены из контракта:", this.tariffs);
                    this.renderTariffs();
                    return;
                }
            }
            
            // Если не удалось загрузить из контракта, используем локальные
            console.log("⚠️ Используем локальные тарифы");
            this.useLocalTariffs();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки тарифов из контракта:', error);
            // В случае ошибки используем локальные тарифы
            this.useLocalTariffs();
        }
    }

    /**
     * Использование локальных тарифов (запасной вариант)
     */
    useLocalTariffs() {
        this.tariffs = [
            { id: 0, name: "Спальный район", name_en: "Residential District", dailyPercent: 0.5, duration: 3 },
            { id: 1, name: "Жилой квартал", name_en: "Housing Complex", dailyPercent: 0.6, duration: 5 },
            { id: 2, name: "Новый микрорайон", name_en: "New Neighborhood", dailyPercent: 0.7, duration: 7 },
            { id: 3, name: "Деловой центр", name_en: "Business Center", dailyPercent: 0.85, duration: 10 },
            { id: 4, name: "Бизнес-кластер", name_en: "Business Cluster", dailyPercent: 1.0, duration: 15 },
            { id: 5, name: "Элитный квартал", name_en: "Elite Quarter", dailyPercent: 1.2, duration: 20 },
            { id: 6, name: "Мегаполис", name_en: "Megapolis", dailyPercent: 1.5, duration: 30 }
        ];
        this.renderTariffs();
        console.log("📋 Локальные тарифы загружены");
    }

    // ===== ЯЗЫК =====
    initLanguage() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.switchLanguage(lang);
            });
        });
        
        const savedLang = localStorage.getItem('cryptoland_language') || this.currentLanguage;
        this.switchLanguage(savedLang);
    }

    switchLanguage(lang) {
        if (!CONFIG.LANGUAGE.available.includes(lang)) return;
        
        this.currentLanguage = lang;
        localStorage.setItem('cryptoland_language', lang);
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.updateAllText();
        this.renderTariffs();
        
        // Обновляем текст кнопки при смене языка (если подключен)
        if (this.web3 && this.web3.isConnected) {
            this.updateConnectButton(true);
        } else {
            this.updateConnectButton(false);
        }
    }

    updateAllText() {
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];
        
        document.getElementById('connectBtnText').textContent = t.connect_btn;
        document.getElementById('logoDescription').textContent = t.logo_description;
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = t[key];
                } else if (el.tagName === 'OPTION') {
                    el.textContent = t[key];
                } else {
                    el.innerHTML = t[key];
                }
            }
        });
        
        document.querySelectorAll('select option[data-i18n]').forEach(option => {
            const key = option.dataset.i18n;
            if (t[key]) option.textContent = t[key];
        });
        
        if (this.selectedTariff) {
            const investTitle = document.getElementById('investTitle');
            if (investTitle) {
                const tariffName = this.currentLanguage === 'ru' ? this.selectedTariff.name : this.selectedTariff.name_en;
                investTitle.textContent = `${t.invest_title} ${tariffName}`;
            }
        }
    }

    /**
     * @dev Обновление текста и стиля кнопки подключения
     */
    updateConnectButton(isConnected) {
        const connectBtn = document.getElementById('headerConnectBtn');
        const connectBtnText = document.getElementById('connectBtnText');
        const connectBtnIcon = connectBtn ? connectBtn.querySelector('i') : null;
        
        if (!connectBtn || !connectBtnText) return;
        
        if (isConnected) {
            // Подключен - зеленый цвет, текст "ПОДКЛЮЧЕН"
            connectBtnText.textContent = this.currentLanguage === 'ru' ? 'ПОДКЛЮЧЕН' : 'CONNECTED';
            connectBtn.classList.add('connected');
            if (connectBtnIcon) {
                connectBtnIcon.className = 'fas fa-check-circle';
            }
        } else {
            // Не подключен - золотой цвет, текст "ПОДКЛЮЧИТЬ"
            connectBtnText.textContent = this.currentLanguage === 'ru' ? 'ПОДКЛЮЧИТЬ' : 'CONNECT';
            connectBtn.classList.remove('connected');
            if (connectBtnIcon) {
                connectBtnIcon.className = 'fas fa-plug';
            }
        }
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

        // Кнопка вывода реферальных
        const withdrawReferralBtn = document.getElementById('withdrawReferralBtn');
        if (withdrawReferralBtn) {
            withdrawReferralBtn.addEventListener('click', async () => {
                await this.withdrawReferral();
            });
        }

        // Кнопка проверки депозитов
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
        const phrases = this.mayorPhrases[this.currentLanguage] || this.mayorPhrases.ru;
        const randomIndex = Math.floor(Math.random() * phrases.length);
        const phrase = phrases[randomIndex];
        
        const now = new Date();
        const dateStr = now.toLocaleDateString(this.currentLanguage === 'ru' ? 'ru-RU' : 'en-US', {
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

    // Функция checkConnection() ПОЛНОСТЬЮ УДАЛЕНА

    // ============ ИСПРАВЛЕННАЯ ФУНКЦИЯ CONNECTWALLET ============
    async connectWallet() {
        try {
            this.hideModal('walletModal');
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Подключение кошелька...' : 'Connecting wallet...', 
                'info'
            );
            
            // ✅ ПЕРЕДАЕМ ВЫБРАННЫЙ ТИП КОШЕЛЬКА В web3.init()
            await this.web3.init(this.selectedWallet);
            
            await this.updateUserInfo();
            await this.loadDeposits();
            
            // Обновляем кнопку на "ПОДКЛЮЧЕН"
            this.updateConnectButton(true);
            
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Кошелек успешно подключен!' : 'Wallet connected successfully!', 
                'success'
            );
            this.updateReferralLink();
            
        } catch (error) {
            console.error('Connection error:', error);
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Ошибка подключения: ' + error.message : 'Connection error: ' + error.message, 
                'error'
            );
            // При ошибке кнопка должна быть "ПОДКЛЮЧИТЬ"
            this.updateConnectButton(false);
        }
    }

    async updateUserInfo() {
        if (!this.web3 || !this.web3.isConnected) return;
        
        try {
            const usdtBalance = await this.web3.getUSDTBalance();
            const stats = await this.web3.getUserStats();
            
            // Обновление шапки
            document.getElementById('headerWalletBalance').textContent = this.utils.formatNumber(usdtBalance, 2);
            
            // Обновление статистики на панели мэра
            document.getElementById('statPopulation').textContent = stats.totalDeposits > 0 ? 'Активно' : '0';
            document.getElementById('statTotal').textContent = this.utils.formatNumber(stats.totalDeposits, 2) + ' USDT';
            document.getElementById('statTaxes').textContent = this.utils.formatNumber(stats.availableReferral, 2) + ' USDT';
            document.getElementById('statIncome').textContent = this.utils.formatNumber(stats.availableInterest, 2) + ' USDT';
            
            // Обновление городской казны
            document.getElementById('treasuryIncome').textContent = this.utils.formatNumber(stats.availableInterest, 2) + ' USDT';
            document.getElementById('treasuryTax').textContent = this.utils.formatNumber(stats.availableReferral, 2) + ' USDT';
            document.getElementById('treasuryDeposit').textContent = this.utils.formatNumber(stats.activeDeposits, 2) + ' USDT';
            
            // Обновление сводки в Моих районах
            document.getElementById('summaryTotal').textContent = this.utils.formatNumber(stats.totalDeposits, 2) + ' USDT';
            document.getElementById('summaryActive').textContent = this.utils.formatNumber(stats.activeDeposits, 2) + ' USDT';
            document.getElementById('summaryAccumulated').textContent = this.utils.formatNumber(stats.totalEarned, 2) + ' USDT';
            document.getElementById('summaryAvailable').textContent = this.utils.formatNumber(
                parseFloat(stats.availableInterest) + parseFloat(stats.availableReferral), 2
            ) + ' USDT';
            
            // Обновление налоговой
            document.getElementById('totalReferrals').textContent = '0'; // TODO: добавить в контракт
            document.getElementById('totalTaxes').textContent = this.utils.formatNumber(stats.availableReferral, 2) + ' USDT';
            document.getElementById('totalTurnover').textContent = this.utils.formatNumber(stats.totalDeposits, 2) + ' USDT';
            document.getElementById('mayorBonus').textContent = parseFloat(stats.availableReferral) > 0 ? 'Активен' : 'Неактивен';
            
            // Активация кнопок вывода
            document.getElementById('withdrawIncomeBtn').disabled = parseFloat(stats.availableInterest) <= 0;
            document.getElementById('withdrawTaxBtn').disabled = parseFloat(stats.availableReferral) <= 0;
            
        } catch (error) {
            console.error('Update error:', error);
        }
    }

    renderTariffs() {
        const container = document.getElementById('tariffsGrid');
        if (!container) {
            console.error("❌ Контейнер tariffsGrid не найден");
            return;
        }
        
        if (!this.tariffs || this.tariffs.length === 0) {
            console.warn("⚠️ Нет тарифов для отображения");
            container.innerHTML = '<div class="no-tariffs" style="text-align: center; padding: 40px; color: var(--text-muted);">Тарифы временно недоступны</div>';
            return;
        }
        
        console.log("📊 Рендерим тарифы:", this.tariffs);
        
        container.innerHTML = this.tariffs.map(tariff => {
            const name = this.currentLanguage === 'ru' ? tariff.name : tariff.name_en;
            const isPremium = tariff.id >= 3; // Первые 3 не премиум
            
            return `
                <div class="tariff-card ${isPremium ? 'premium' : ''}" data-tariff="${tariff.id}">
                    <div class="tariff-header">
                        <div class="tariff-name">${name}</div>
                        ${isPremium ? '<div class="tariff-badge">VIP</div>' : ''}
                    </div>
                    <div class="tariff-body">
                        <div class="tariff-percent">${tariff.dailyPercent}%</div>
                        <div class="tariff-period">${CONFIG.TRANSLATIONS[this.currentLanguage].tariff_daily_rate} • ${tariff.duration} ${CONFIG.TRANSLATIONS[this.currentLanguage].tariff_days}</div>
                        <ul class="tariff-features">
                            <li><i class="fas fa-check-circle"></i> ${CONFIG.TRANSLATIONS[this.currentLanguage].tariff_min}</li>
                            <li><i class="fas fa-check-circle"></i> ${CONFIG.TRANSLATIONS[this.currentLanguage].tariff_daily}</li>
                            <li><i class="fas fa-check-circle"></i> ${CONFIG.TRANSLATIONS[this.currentLanguage].tariff_fee}</li>
                        </ul>
                        <div class="tariff-actions">
                            <button class="tariff-btn primary-btn" data-tariff-id="${tariff.id}">
                                <i class="fas fa-coins"></i>
                                ${CONFIG.TRANSLATIONS[this.currentLanguage].tariff_invest}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
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
        
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];
        const percentages = [7, 5, 3, 2.5, 2, 1.8, 1.5, 1.3, 1.1, 1, 0.9, 0.8, 0.7, 0.6, 0.5];
        const turnovers = [0, 500, 1000, 2000, 3000, 5000, 7000, 10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000];
        const deposits = [10, 50, 50, 100, 100, 250, 250, 500, 500, 750, 750, 1250, 1250, 2000, 2500];
        
        container.innerHTML = percentages.map((percent, index) => `
            <tr>
                <td><span class="level-badge">${index + 1}</span></td>
                <td><span class="profit-percent">${percent}%</span></td>
                <td>${this.utils.formatNumber(turnovers[index])} USDT</td>
                <td>${t.personal_deposit === 'Личный депозит' ? 'от' : 'from'} ${deposits[index]} USDT</td>
                <td>0</td>
                <td>0 USDT</td>
                <td><span class="bonus-inactive">${t.bonus_inactive}</span></td>
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
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];
        const tariffName = this.currentLanguage === 'ru' ? this.selectedTariff.name : this.selectedTariff.name_en;
        
        document.getElementById('investTitle').textContent = `${t.invest_title} ${tariffName}`;
        
        const preview = document.getElementById('tariffPreview');
        preview.innerHTML = `
            <div class="preview-header">
                <h4>${tariffName}</h4>
                ${tariffId >= 3 ? '<span class="preview-badge">VIP</span>' : ''}
            </div>
            <div class="preview-stats">
                <div class="preview-stat">
                    <span>${t.percent || 'Доходность'}:</span>
                    <span class="highlight">${this.selectedTariff.dailyPercent}% ${t.tariff_daily_rate || 'в день'}</span>
                </div>
                <div class="preview-stat">
                    <span>${t.tariff_days === 'дней' ? 'Срок' : 'Term'}:</span>
                    <span>${this.selectedTariff.duration} ${t.tariff_days}</span>
                </div>
                <div class="preview-stat">
                    <span>${t.total_income || 'Общий доход'}:</span>
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
        document.getElementById('summaryEndDate').textContent = endDate.toLocaleDateString(this.currentLanguage === 'ru' ? 'ru-RU' : 'en-US');
    }

    async processInvestment() {
        if (!this.web3 || !this.web3.isConnected) {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Подключите кошелек' : 'Connect wallet', 
                'error'
            );
            this.showWalletModal();
            return;
        }
        
        const amount = parseFloat(document.getElementById('investAmount')?.value);
        if (amount < 10) {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Минимальная сумма 10 USDT' : 'Minimum amount 10 USDT', 
                'error'
            );
            return;
        }
        
        const referrerInput = document.getElementById('referrerAddress')?.value || '';
        let referrerAddress = '0x0000000000000000000000000000000000000000';
        
        if (referrerInput && this.utils.isValidAddress(referrerInput)) {
            referrerAddress = referrerInput;
        }
        
        try {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Инвестирование...' : 'Investing...', 
                'info'
            );
            
            const result = await this.web3.invest(amount, this.selectedTariff.id, referrerAddress);
            
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Инвестиция успешна!' : 'Investment successful!', 
                'success'
            );
            
            this.hideModal('investModal');
            await this.updateUserInfo();
            await this.loadDeposits();
            
        } catch (error) {
            console.error('Investment error:', error);
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Ошибка транзакции: ' + error.message : 'Transaction error: ' + error.message, 
                'error'
            );
        }
    }

    updateReferralLink() {
        const refInput = document.getElementById('refLinkInput');
        if (!refInput) return;
        
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            refInput.value = this.currentLanguage === 'ru' ? 'Подключите кошелек' : 'Connect wallet';
            return;
        }
        
        const refLink = `${window.location.origin}?ref=${this.web3.account}`;
        refInput.value = refLink;
    }

    async copyReferralLink() {
        const refInput = document.getElementById('refLinkInput');
        if (!refInput) return;
        
        const refLink = refInput.value;
        if (refLink === (this.currentLanguage === 'ru' ? 'Подключите кошелек' : 'Connect wallet')) {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Сначала подключите кошелек' : 'Connect wallet first', 
                'error'
            );
            return;
        }
        
        await this.utils.copyToClipboard(refLink);
        this.utils.showNotification(
            this.currentLanguage === 'ru' ? 'Ссылка скопирована!' : 'Link copied!', 
            'success'
        );
    }

    async withdrawIncome() {
        if (!this.web3 || !this.web3.isConnected) {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Подключите кошелек' : 'Connect wallet', 
                'error'
            );
            return;
        }
        
        try {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Вывод процентов...' : 'Withdrawing interest...', 
                'info'
            );
            
            // Выводим все проценты через withdrawPendingInterest
            await this.web3.withdrawPendingInterest();
            
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Проценты успешно выведены!' : 'Interest withdrawn successfully!', 
                'success'
            );
            
            await this.updateUserInfo();
            
        } catch (error) {
            console.error('Withdraw error:', error);
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Ошибка вывода: ' + error.message : 'Withdraw error: ' + error.message, 
                'error'
            );
        }
    }

    async withdrawTax() {
        if (!this.web3 || !this.web3.isConnected) {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Подключите кошелек' : 'Connect wallet', 
                'error'
            );
            return;
        }
        
        try {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Вывод реферальных...' : 'Withdrawing referral rewards...', 
                'info'
            );
            
            await this.web3.withdrawReferral();
            
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Реферальные успешно выведены!' : 'Referral rewards withdrawn successfully!', 
                'success'
            );
            
            await this.updateUserInfo();
            
        } catch (error) {
            console.error('Referral withdraw error:', error);
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Ошибка вывода: ' + error.message : 'Withdraw error: ' + error.message, 
                'error'
            );
        }
    }

    async checkDeposits() {
        if (!this.web3 || !this.web3.isConnected) {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Подключите кошелек' : 'Connect wallet', 
                'error'
            );
            return;
        }
        
        try {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Проверка завершенных депозитов...' : 'Checking completed deposits...', 
                'info'
            );
            
            const result = await this.web3.checkAndFinishDeposits();
            
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Завершенные депозиты обработаны!' : 'Completed deposits processed!', 
                'success'
            );
            
            await this.updateUserInfo();
            await this.loadDeposits();
            
        } catch (error) {
            console.error('Check deposits error:', error);
            if (error.message.includes('No finished deposits')) {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 'Нет завершенных депозитов' : 'No completed deposits', 
                    'warning'
                );
            } else {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 'Ошибка проверки: ' + error.message : 'Check error: ' + error.message, 
                    'error'
                );
            }
        }
    }

    async loadDeposits() {
        const container = document.getElementById('depositsGrid');
        const emptyState = document.getElementById('emptyDeposits');
        const navBadge = document.getElementById('navDepositCount');
        
        if (!container || !emptyState) return;
        
        if (!this.web3 || !this.web3.isConnected) {
            emptyState.classList.remove('hidden');
            container.innerHTML = '';
            return;
        }
        
        try {
            const deposits = await this.web3.getUserDeposits();
            this.userDeposits = deposits;
            
            const activeCount = deposits.filter(d => d.active).length;
            if (navBadge) navBadge.textContent = activeCount;
            
            if (deposits.length === 0) {
                emptyState.classList.remove('hidden');
                container.innerHTML = '';
                return;
            }
            
            emptyState.classList.add('hidden');
            
            const t = CONFIG.TRANSLATIONS[this.currentLanguage];
            
            container.innerHTML = deposits.map((dep, index) => {
                const tariff = this.tariffs[dep.tariffId] || this.tariffs[0];
                const tariffName = this.currentLanguage === 'ru' ? tariff.name : tariff.name_en;
                const dailyPercent = tariff.dailyPercent;
                const dailyIncome = (parseFloat(dep.amount) * dailyPercent) / 100;
                const startDate = new Date(dep.startTime * 1000);
                const endDate = new Date((dep.startTime + tariff.duration * 24 * 60 * 60) * 1000);
                const now = new Date();
                const progress = Math.min(100, ((now - startDate) / (endDate - startDate)) * 100);
                
                return `
                    <div class="deposit-card" data-deposit-id="${index}">
                        <div class="deposit-header">
                            <div class="deposit-name">${tariffName}</div>
                            <div class="deposit-status ${!dep.active ? 'finished' : ''}">
                                ${dep.active ? t.filter_active : t.filter_finished}
                            </div>
                        </div>
                        <div class="deposit-stats-grid">
                            <div class="deposit-stat">
                                <span class="stat-label">${t.amount}</span>
                                <span class="stat-number">${this.utils.formatNumber(dep.amount)} USDT</span>
                            </div>
                            <div class="deposit-stat">
                                <span class="stat-label">${t.daily_income}</span>
                                <span class="stat-number profit">${this.utils.formatNumber(dailyIncome)} USDT</span>
                            </div>
                            <div class="deposit-stat">
                                <span class="stat-label">${t.start_date || 'Начало'}</span>
                                <span class="stat-number">${startDate.toLocaleDateString()}</span>
                            </div>
                            <div class="deposit-stat">
                                <span class="stat-label">${t.end_date}</span>
                                <span class="stat-number">${endDate.toLocaleDateString()}</span>
                            </div>
                        </div>
                        ${dep.active ? `
                            <div class="deposit-progress">
                                <div class="progress-header">
                                    <span>${t.progress || 'Прогресс'}</span>
                                    <span>${progress.toFixed(0)}%</span>
                                </div>
                                <div class="progress-track">
                                    <div class="progress-fill" style="width: ${progress}%"></div>
                                </div>
                            </div>
                            <div class="deposit-actions">
                                <button class="deposit-btn withdraw" data-deposit-id="${index}">
                                    <i class="fas fa-download"></i>
                                    ${t.withdraw_income || 'Вывести'}
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
            
            // Добавляем обработчики для кнопок вывода
            document.querySelectorAll('.deposit-btn.withdraw').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const depositId = e.currentTarget.dataset.depositId;
                    await this.withdrawFromDeposit(depositId);
                });
            });
            
        } catch (error) {
            console.error('Error loading deposits:', error);
            emptyState.classList.remove('hidden');
            container.innerHTML = '';
        }
    }

    async withdrawFromDeposit(depositId) {
        if (!this.web3 || !this.web3.isConnected) {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Подключите кошелек' : 'Connect wallet', 
                'error'
            );
            return;
        }
        
        try {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Вывод процентов...' : 'Withdrawing interest...', 
                'info'
            );
            
            await this.web3.withdrawInterest(depositId);
            
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Проценты успешно выведены!' : 'Interest withdrawn successfully!', 
                'success'
            );
            
            await this.updateUserInfo();
            await this.loadDeposits();
            
        } catch (error) {
            console.error('Withdraw error:', error);
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Ошибка вывода: ' + error.message : 'Withdraw error: ' + error.message, 
                'error'
            );
        }
    }

    filterDeposits(filter) {
        if (!this.userDeposits || this.userDeposits.length === 0) return;
        
        const cards = document.querySelectorAll('.deposit-card');
        cards.forEach((card, index) => {
            const deposit = this.userDeposits[index];
            if (!deposit) return;
            
            if (filter === 'all') {
                card.style.display = 'block';
            } else if (filter === 'active' && deposit.active) {
                card.style.display = 'block';
            } else if (filter === 'finished' && !deposit.active) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    async loadRankings(type) {
        // Заглушка для рейтинга
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
