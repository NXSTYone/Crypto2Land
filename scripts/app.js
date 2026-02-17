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
        this.transactions = [];
        this.filteredTransactions = [];
        this.rankingData = [];
        this.rankingType = 'tax';
        this.rankingPage = 1;
        this.rankingSearch = '';
        this.pendingReferrer = null;
        
        // Статистика
        this.totalReferralsCount = 0;
        this.totalReferralEarned = '0';
        this.totalInterestEarned = '0';
        this.levelDeposits = new Array(15).fill('0');
        this.levelBonuses = new Array(15).fill(false);
        this.levelCounts = new Array(15).fill(0);
        
        // Фразы мэра
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
        
        // Обработка реферальной ссылки
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('ref');
        
        if (referrer && this.utils.isValidAddress(referrer)) {
            this.pendingReferrer = referrer;
            setTimeout(() => {
                this.showReferrerConfirmation(referrer);
            }, 1500);
        }
        
        // Загрузка тарифов
        await this.loadTariffsFromContract();
        
        // Проверка на Telegram Mini App
        if (this.isTelegramMiniApp()) {
            console.log("✅ Приложение запущено в Telegram Mini App");
            setTimeout(() => {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 
                    'Для подключения в Telegram используйте WalletConnect' : 
                    'To connect in Telegram, use WalletConnect', 
                    'info'
                );
            }, 2000);
        }
    }

    // ===== ЗАГРУЗКА ВСЕЙ СТАТИСТИКИ =====
    
    async loadReferralStats() {
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            this.totalReferralsCount = 0;
            this.totalReferralEarned = '0';
            return;
        }
        
        try {
            const [totalCount, totalEarned] = await Promise.all([
                this.web3.getTotalReferralsCount(this.web3.account),
                this.web3.getTotalReferralEarned(this.web3.account)
            ]);
            
            this.totalReferralsCount = totalCount;
            this.totalReferralEarned = totalEarned;
            
            console.log('✅ Статистика рефералов загружена:', {
                totalCount,
                totalEarned
            });
            
        } catch (error) {
            console.error('Error loading referral stats:', error);
        }
    }
    
    async loadInterestStats() {
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            this.totalInterestEarned = '0';
            return;
        }
        
        try {
            this.totalInterestEarned = await this.web3.getTotalInterestEarned(this.web3.account);
            console.log('✅ Статистика процентов загружена:', this.totalInterestEarned);
        } catch (error) {
            console.error('Error loading interest stats:', error);
        }
    }
    
    async loadLevelStats() {
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            this.levelDeposits = new Array(15).fill('0');
            this.levelBonuses = new Array(15).fill(false);
            this.levelCounts = new Array(15).fill(0);
            return;
        }
        
        try {
            const mayorStats = await this.web3.getMayorBonusStats();
            this.levelDeposits = mayorStats.levelDeposits;
            this.levelBonuses = mayorStats.levelBonuses;
            this.levelCounts = mayorStats.levelCounts;
            console.log('✅ Статистика уровней загружена:', this.levelCounts);
        } catch (error) {
            console.error('Error loading level stats:', error);
        }
    }
    
    async refreshAllStats() {
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            this.totalReferralsCount = 0;
            this.totalReferralEarned = '0';
            this.totalInterestEarned = '0';
            this.levelDeposits = new Array(15).fill('0');
            this.levelBonuses = new Array(15).fill(false);
            this.levelCounts = new Array(15).fill(0);
            
            this.updateDashboardStats({
                totalDeposits: '0',
                activeDeposits: '0',
                availableInterest: '0',
                availableReferral: '0',
                totalEarned: '0'
            });
            return;
        }
        
        try {
            await Promise.all([
                this.loadReferralStats(),
                this.loadInterestStats(),
                this.loadLevelStats()
            ]);
            
            const stats = await this.web3.getUserStats();
            
            this.updateDashboardStats(stats);
            this.updateTaxPageStats(stats);
            this.renderLevels();
            
        } catch (error) {
            console.error('Error refreshing all stats:', error);
        }
    }

    // ===== ОБНОВЛЕНИЕ UI =====

    updateDashboardStats(stats) {
        document.getElementById('statPopulation').textContent = this.totalReferralsCount.toString();
        
        const totalAvailable = parseFloat(stats.availableInterest) + parseFloat(stats.availableReferral);
        document.getElementById('statTotal').textContent = this.utils.formatNumber(totalAvailable, 2) + ' USDT';
        
        document.getElementById('statTaxes').textContent = this.utils.formatNumber(this.totalReferralEarned, 2) + ' USDT';
        document.getElementById('statIncome').textContent = this.utils.formatNumber(this.totalInterestEarned, 2) + ' USDT';
        
        document.getElementById('treasuryIncome').textContent = this.utils.formatNumber(stats.availableInterest, 2) + ' USDT';
        document.getElementById('treasuryTax').textContent = this.utils.formatNumber(stats.availableReferral, 2) + ' USDT';
        document.getElementById('treasuryDeposit').textContent = this.utils.formatNumber(stats.activeDeposits, 2) + ' USDT';
        
        document.getElementById('summaryTotal').textContent = this.utils.formatNumber(stats.totalDeposits, 2) + ' USDT';
        document.getElementById('summaryActive').textContent = this.utils.formatNumber(stats.activeDeposits, 2) + ' USDT';
        document.getElementById('summaryAccumulated').textContent = this.utils.formatNumber(this.totalInterestEarned, 2) + ' USDT';
        document.getElementById('summaryAvailable').textContent = this.utils.formatNumber(parseFloat(stats.availableInterest), 2) + ' USDT';
        
        document.getElementById('withdrawIncomeBtn').disabled = parseFloat(stats.availableInterest) <= 0;
        document.getElementById('withdrawTaxBtn').disabled = parseFloat(stats.availableReferral) <= 0;
        
        const activeDepositsCount = this.userDeposits.filter(d => d.active).length;
        document.getElementById('navDepositCount').textContent = activeDepositsCount;
    }

    // ===== НОВАЯ ФУНКЦИЯ ДЛЯ ПРИНУДИТЕЛЬНОГО ОБНОВЛЕНИЯ БЕЙДЖА =====
    forceUpdateMayorBonus() {
        const mayorBonusElement = document.getElementById('mayorBonus');
        if (!mayorBonusElement) return;

        // Смотрим на активную кнопку языка ПРЯМО СЕЙЧАС
        const langBtn = document.querySelector('.lang-btn.active');
        const isEnglish = langBtn ? langBtn.dataset.lang === 'en' : false;

        // Проверяем, активен ли бонус
        const anyLevelActive = this.levelBonuses && this.levelBonuses.some(bonus => bonus === true);

        // Устанавливаем текст напрямую
        if (anyLevelActive) {
            mayorBonusElement.textContent = isEnglish ? 'Active' : 'Активен';
            mayorBonusElement.classList.add('bonus-active');
            mayorBonusElement.classList.remove('bonus-inactive', 'bonus-pending');
        } else {
            mayorBonusElement.textContent = isEnglish ? 'Inactive' : 'Неактивен';
            mayorBonusElement.classList.add('bonus-inactive');
            mayorBonusElement.classList.remove('bonus-active', 'bonus-pending');
        }
    }

    // ===== ИСПРАВЛЕННАЯ ФУНКЦИЯ =====
    updateTaxPageStats(stats) {
        // Всего жителей - общее количество рефералов
        document.getElementById('totalReferrals').textContent = this.totalReferralsCount.toString();
        
        // Налоговые сборы - доступно к выводу
        document.getElementById('totalTaxes').textContent = this.utils.formatNumber(stats.availableReferral, 2) + ' USDT';
        
        // Общий оборот - всего получено реферальных за все время
        document.getElementById('totalTurnover').textContent = this.utils.formatNumber(this.totalReferralEarned, 2) + ' USDT';
        
        // Бонус мэра - используем новую функцию
        this.forceUpdateMayorBonus();
    }

    // ===== ИСПРАВЛЕННАЯ ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ ЯЗЫКА =====
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
        
        // ПРИНУДИТЕЛЬНО ОБНОВЛЯЕМ БЕЙДЖ
        this.forceUpdateMayorBonus();
        
        if (this.web3 && this.web3.isConnected) {
            this.updateConnectButton(true);
            setTimeout(() => {
                this.refreshAllStats();
            }, 100);
        } else {
            this.updateConnectButton(false);
        }
    }

    // ===== ИСПРАВЛЕННАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ЯЗЫКА =====
    initLanguage() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.switchLanguage(lang);
            });
        });
        
        const savedLang = localStorage.getItem('cryptoland_language') || this.currentLanguage;
        
        // Устанавливаем начальный язык
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.dataset.lang === savedLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.currentLanguage = savedLang;
        
        // Принудительно обновляем бейдж после инициализации
        setTimeout(() => {
            this.forceUpdateMayorBonus();
        }, 500);
    }

    // ===== ОСТАЛЬНЫЕ ФУНКЦИИ БЕЗ ИЗМЕНЕНИЙ =====
    
    // ===== ФУНКЦИИ ДЛЯ РЕФЕРАЛЬНОЙ ССЫЛКИ =====
    
    async checkIfHasReferrer() {
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) return false;
        
        try {
            const referrer = await this.web3.getReferrer();
            return referrer !== '0x0000000000000000000000000000000000000000';
        } catch (error) {
            console.error('Error checking referrer:', error);
            return false;
        }
    }
    
    showReferrerConfirmation(referrerAddress) {
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];
        const shortAddress = this.web3.formatAddress(referrerAddress);
        
        let modal = document.getElementById('referrerConfirmModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'referrerConfirmModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-user-tag"></i>
                        <span data-i18n="referrer_confirm_title">Подтверждение реферала</span>
                    </h3>
                    <button class="modal-close" id="closeReferrerModalBtn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="referrer-confirm-content" style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; color: var(--accent-gold); margin-bottom: 20px;">
                            <i class="fas fa-question-circle"></i>
                        </div>
                        <p style="font-size: 16px; margin-bottom: 15px;" data-i18n="referrer_confirm_text">
                            Вы перешли по реферальной ссылке от пользователя:
                        </p>
                        <p style="font-size: 18px; font-weight: 700; background: rgba(255,215,0,0.1); padding: 10px; border-radius: 10px; margin-bottom: 20px;" id="referrerAddressDisplay"></p>
                        <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 25px;" data-i18n="referrer_confirm_note">
                            Если вы подтвердите, при первой инвестиции этот пользователь станет вашим реферером.<br>
                            Реферер будет получать процент от ваших доходов.
                        </p>
                        <div class="modal-actions" style="justify-content: center;">
                            <button class="modal-btn secondary" id="declineReferrerBtn">
                                <i class="fas fa-times"></i>
                                <span data-i18n="referrer_decline">Нет, не хочу</span>
                            </button>
                            <button class="modal-btn primary" id="acceptReferrerBtn">
                                <i class="fas fa-check"></i>
                                <span data-i18n="referrer_accept">Да, подтвердить</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            document.getElementById('acceptReferrerBtn').addEventListener('click', () => this.acceptReferrer());
            document.getElementById('declineReferrerBtn').addEventListener('click', () => this.declineReferrer());
            document.getElementById('closeReferrerModalBtn').addEventListener('click', () => this.hideReferrerModal());
        }
        
        const addressDisplay = document.getElementById('referrerAddressDisplay');
        if (addressDisplay) {
            addressDisplay.textContent = shortAddress;
        }
        
        document.getElementById('modalOverlay').style.display = 'block';
        modal.style.display = 'block';
    }
    
    hideReferrerModal() {
        const modal = document.getElementById('referrerConfirmModal');
        if (modal) modal.style.display = 'none';
        document.getElementById('modalOverlay').style.display = 'none';
    }
    
    async acceptReferrer() {
        if (!this.pendingReferrer) {
            this.hideReferrerModal();
            return;
        }
        
        const hasReferrer = await this.checkIfHasReferrer();
        
        if (hasReferrer) {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 
                'У вас уже есть реферер! Вы не можете сменить его.' : 
                'You already have a referrer! You cannot change it.', 
                'warning'
            );
            this.pendingReferrer = null;
            this.hideReferrerModal();
            return;
        }
        
        localStorage.setItem('confirmedReferrer', this.pendingReferrer);
        
        this.utils.showNotification(
            this.currentLanguage === 'ru' ? 
            'Реферер подтвержден! Он будет применен при первой инвестиции.' : 
            'Referrer confirmed! It will be applied on first investment.', 
            'success'
        );
        console.log('✅ Реферер подтвержден:', this.pendingReferrer);
        
        this.pendingReferrer = null;
        this.hideReferrerModal();
    }
    
    declineReferrer() {
        this.utils.showNotification(
            this.currentLanguage === 'ru' ? 
            'Вы отказались от этой реферальной ссылки.' : 
            'You declined this referral link.', 
            'info'
        );
        console.log('❌ Отказ от реферера:', this.pendingReferrer);
        this.pendingReferrer = null;
        this.hideReferrerModal();
    }

    isTelegramMiniApp() {
        return window.Telegram && Telegram.WebApp && Telegram.WebApp.initData !== '';
    }

    async loadTariffsFromContract() {
        try {
            if (this.web3 && this.web3.isConnected) {
                const contractTariffs = await this.web3.getTariffs();
                if (contractTariffs && contractTariffs.length > 0) {
                    this.tariffs = contractTariffs;
                    console.log("✅ Тарифы загружены из контракта:", this.tariffs);
                    this.renderTariffs();
                    return;
                }
            }
            
            console.log("⚠️ Используем локальные тарифы");
            this.useLocalTariffs();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки тарифов из контракта:', error);
            this.useLocalTariffs();
        }
    }

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

    updateConnectButton(isConnected) {
        const connectBtn = document.getElementById('headerConnectBtn');
        const connectBtnText = document.getElementById('connectBtnText');
        const connectBtnIcon = connectBtn ? connectBtn.querySelector('i') : null;
        
        if (!connectBtn || !connectBtnText) return;
        
        if (isConnected) {
            connectBtnText.textContent = this.currentLanguage === 'ru' ? 'ПОДКЛЮЧЕН' : 'CONNECTED';
            connectBtn.classList.add('connected');
            if (connectBtnIcon) {
                connectBtnIcon.className = 'fas fa-check-circle';
            }
        } else {
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
        document.querySelectorAll('.nav-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tabName = item.dataset.tab;
                this.showTab(tabName);
            });
        });

        const avatarContainer = document.getElementById('mayorAvatarContainer');
        if (avatarContainer) {
            avatarContainer.addEventListener('click', () => {
                this.showRandomMayorPhrase();
            });
        }

        const closeMayorModal = document.getElementById('closeMayorModal');
        if (closeMayorModal) {
            closeMayorModal.addEventListener('click', () => {
                this.hideModal('mayorPhrasesModal');
            });
        }

        const newPhraseBtn = document.getElementById('newPhraseBtn');
        if (newPhraseBtn) {
            newPhraseBtn.addEventListener('click', () => {
                this.showRandomMayorPhrase();
            });
        }

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

        const connectBtn = document.getElementById('headerConnectBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                this.showWalletModal();
            });
        }

        document.querySelectorAll('.wallet-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.wallet-option').forEach(opt => 
                    opt.classList.remove('selected')
                );
                option.classList.add('selected');
                this.selectedWallet = option.dataset.wallet;
            });
        });

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

        const copyRefLink = document.getElementById('copyRefLink');
        if (copyRefLink) {
            copyRefLink.addEventListener('click', async () => {
                await this.copyReferralLink();
            });
        }

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

        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-pill').forEach(p => 
                    p.classList.remove('active')
                );
                pill.classList.add('active');
                this.filterDeposits(pill.dataset.filter);
            });
        });

        const refreshDeposits = document.getElementById('refreshDeposits');
        if (refreshDeposits) {
            refreshDeposits.addEventListener('click', async () => {
                await this.loadDeposits();
            });
        }

        // Обработчики для рейтинга
        document.querySelectorAll('.ranking-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.ranking-type-btn').forEach(b => 
                    b.classList.remove('active')
                );
                btn.classList.add('active');
                this.rankingType = btn.dataset.type;
                this.rankingPage = 1;
                this.loadRankings();
            });
        });

        const rankingPeriodFilter = document.getElementById('rankingPeriodFilter');
        if (rankingPeriodFilter) {
            rankingPeriodFilter.addEventListener('change', () => {
                this.rankingPage = 1;
                this.loadRankings();
            });
        }

        const rankingSearch = document.querySelector('.ranking-search-input');
        if (rankingSearch) {
            rankingSearch.addEventListener('input', (e) => {
                this.rankingSearch = e.target.value.toLowerCase();
                this.rankingPage = 1;
                this.loadRankings();
            });
        }

        // Обработчики для истории
        const dateFilter = document.getElementById('transactionDateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterTransactions());
        }

        const typeFilter = document.getElementById('transactionTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterTransactions());
        }

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

    async connectWallet() {
        try {
            this.hideModal('walletModal');
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Подключение кошелька...' : 'Connecting wallet...', 
                'info'
            );
            
            await this.web3.init(this.selectedWallet);
            
            await this.refreshAllStats();
            await this.loadDeposits();
            await this.loadTransactionHistory();
            await this.loadReferrerInfo();
            
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
            this.updateConnectButton(false);
        }
    }

    async loadTransactionHistory() {
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            this.transactions = [];
            this.filteredTransactions = [];
            this.renderTransactions();
            return;
        }
        
        try {
            const currentBlock = await this.web3.web3.eth.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 50000);
            
            const events = await this.web3.getTransactionHistory(this.web3.account, fromBlock);
            
            const transactionsWithTime = [];
            for (const tx of events) {
                const timestamp = await this.web3.getBlockTimestamp(tx.blockNumber);
                transactionsWithTime.push({
                    ...tx,
                    timestamp
                });
            }
            
            this.transactions = transactionsWithTime.sort((a, b) => b.timestamp - a.timestamp);
            this.filteredTransactions = [...this.transactions];
            
            console.log(`✅ Загружено ${this.transactions.length} транзакций`);
            this.renderTransactions();
            
        } catch (error) {
            console.error('Error loading transaction history:', error);
            this.transactions = [];
            this.filteredTransactions = [];
            this.renderTransactions();
        }
    }
    
    filterTransactions() {
        const dateFilter = document.getElementById('transactionDateFilter').value;
        const typeFilter = document.getElementById('transactionTypeFilter').value;
        const searchValue = document.querySelector('.ranking-search-input')?.value?.toLowerCase() || '';
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
        const weekAgo = today - 7 * 86400;
        const monthAgo = today - 30 * 86400;
        
        this.filteredTransactions = this.transactions.filter(tx => {
            if (dateFilter !== 'all') {
                switch(dateFilter) {
                    case 'today':
                        if (tx.timestamp < today) return false;
                        break;
                    case 'week':
                        if (tx.timestamp < weekAgo) return false;
                        break;
                    case 'month':
                        if (tx.timestamp < monthAgo) return false;
                        break;
                }
            }
            
            if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
            
            if (searchValue) {
                const hash = tx.transactionHash?.toLowerCase() || '';
                if (!hash.includes(searchValue)) return false;
            }
            
            return true;
        });
        
        this.renderTransactions();
    }
    
    renderTransactions() {
        const container = document.getElementById('transactionsBody');
        if (!container) return;
        
        if (this.filteredTransactions.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        Нет операций для отображения
                    </td>
                </tr>
            `;
            return;
        }
        
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];
        
        container.innerHTML = this.filteredTransactions.map(tx => {
            let typeIcon = '';
            let typeText = '';
            let amountClass = 'positive';
            let levelHtml = '';
            
            switch(tx.type) {
                case 'invest':
                    typeIcon = 'fas fa-coins';
                    typeText = t.type_invest;
                    amountClass = 'negative';
                    break;
                case 'withdraw':
                    typeIcon = 'fas fa-download';
                    typeText = t.type_withdraw;
                    amountClass = 'positive';
                    break;
                case 'referral':
                    typeIcon = 'fas fa-users';
                    typeText = t.type_referral;
                    amountClass = 'positive';
                    levelHtml = `<span class="level-badge-small" style="margin-left: 8px; background: rgba(255,215,0,0.2); color: var(--accent-gold); padding: 2px 6px; border-radius: 12px; font-size: 10px;">ур.${tx.level}</span>`;
                    break;
                case 'return':
                    typeIcon = 'fas fa-undo-alt';
                    typeText = t.type_return;
                    amountClass = 'positive';
                    break;
            }
            
            const date = new Date(tx.timestamp * 1000);
            const formattedDate = date.toLocaleDateString(this.currentLanguage === 'ru' ? 'ru-RU' : 'en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <tr class="transaction-row">
                    <td>
                        <div class="transaction-type ${tx.type}">
                            <i class="${typeIcon}"></i>
                            <span>${typeText}</span>
                            ${levelHtml}
                        </div>
                    </td>
                    <td class="transaction-amount ${amountClass}">
                        ${tx.type === 'invest' ? '-' : '+'} ${this.utils.formatNumber(tx.amount, 2)} USDT
                    </td>
                    <td>${formattedDate}</td>
                    <td><span class="transaction-status completed">${t.status_completed}</span></td>
                    <td class="transaction-hash">
                        <a href="${CONFIG.NETWORKS[CONFIG.CURRENT_NETWORK].explorer}/tx/${tx.transactionHash}" target="_blank" style="color: var(--text-muted); text-decoration: none;">
                            ${tx.transactionHash.slice(0, 10)}...
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async loadRankings() {
        const serverUrl = CONFIG.SERVER_URL || 'http://localhost:3000';
        const limit = 100;
        
        try {
            let orderBy = 'total_taxes DESC';
            if (this.rankingType === 'population') orderBy = 'referral_count DESC';
            if (this.rankingType === 'total') orderBy = 'total_income DESC';
            
            let url = `${serverUrl}/api/ranking?page=${this.rankingPage}&limit=${limit}&orderBy=${orderBy}`;
            if (this.rankingSearch) {
                url += `&search=${encodeURIComponent(this.rankingSearch)}`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            this.rankingData = data.users || [];
            this.renderRankings(data);
            
        } catch (error) {
            console.error('Error loading rankings:', error);
            this.showEmptyRankings();
        }
    }
    
    renderRankings(data) {
        const users = data.users || [];
        const totalPages = data.totalPages || 1;
        const currentPage = data.currentPage || 1;
        
        if (users.length > 0) {
            document.getElementById('podiumName1').textContent = this.web3.formatAddress(users[0].address);
            document.getElementById('podiumValue1').textContent = this.utils.formatNumber(users[0].total_taxes, 2) + ' USDT';
        }
        if (users.length > 1) {
            document.getElementById('podiumName2').textContent = this.web3.formatAddress(users[1].address);
            document.getElementById('podiumValue2').textContent = this.utils.formatNumber(users[1].total_taxes, 2) + ' USDT';
        }
        if (users.length > 2) {
            document.getElementById('podiumName3').textContent = this.web3.formatAddress(users[2].address);
            document.getElementById('podiumValue3').textContent = this.utils.formatNumber(users[2].total_taxes, 2) + ' USDT';
        }
        
        const tbody = document.getElementById('rankingBody');
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];
        
        tbody.innerHTML = users.map((user, index) => {
            const place = (currentPage - 1) * 100 + index + 1;
            return `
                <tr>
                    <td>#${place}</td>
                    <td>${this.web3.formatAddress(user.address)}</td>
                    <td>${this.utils.formatNumber(user.total_taxes, 2)} USDT</td>
                    <td>${user.referral_count}</td>
                    <td>${this.utils.formatNumber(user.total_income, 2)} USDT</td>
                    <td>CryptoLand</td>
                </tr>
            `;
        }).join('');
        
        this.renderPagination(totalPages, currentPage);
        
        if (this.web3 && this.web3.account) {
            this.loadUserRank();
        }
    }
    
    renderPagination(totalPages, currentPage) {
        const container = document.querySelector('.transactions-pagination');
        if (!container) return;
        
        let html = '';
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="app.changeRankingPage(${currentPage - 1})">‹</button>`;
        
        if (start > 1) {
            html += `<button class="pagination-btn" onclick="app.changeRankingPage(1)">1</button>`;
            if (start > 2) html += `<span class="pagination-dots">...</span>`;
        }
        
        for (let i = start; i <= end; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="app.changeRankingPage(${i})">${i}</button>`;
        }
        
        if (end < totalPages) {
            if (end < totalPages - 1) html += `<span class="pagination-dots">...</span>`;
            html += `<button class="pagination-btn" onclick="app.changeRankingPage(${totalPages})">${totalPages}</button>`;
        }
        
        html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="app.changeRankingPage(${currentPage + 1})">›</button>`;
        
        container.innerHTML = html;
    }
    
    async changeRankingPage(page) {
        this.rankingPage = page;
        await this.loadRankings();
    }
    
    async loadUserRank() {
        try {
            const serverUrl = CONFIG.SERVER_URL || 'http://localhost:3000';
            const response = await fetch(`${serverUrl}/api/rank/${this.web3.account}?type=${this.rankingType}`);
            const data = await response.json();
            
            document.getElementById('userRank').textContent = `#${data.rank}`;
            
            if (data.nextRankDiff) {
                document.getElementById('nextRankDiff').textContent = this.utils.formatNumber(data.nextRankDiff, 2) + ' USDT';
            }
            
            if (data.userStats) {
                document.getElementById('userTaxes').textContent = this.utils.formatNumber(data.userStats.total_taxes, 2) + ' USDT';
                document.getElementById('userPopulation').textContent = data.userStats.referral_count;
                document.getElementById('userTotal').textContent = this.utils.formatNumber(data.userStats.total_income, 2) + ' USDT';
            }
            
        } catch (error) {
            console.error('Error loading user rank:', error);
        }
    }
    
    showEmptyRankings() {
        document.getElementById('podiumName1').textContent = '—';
        document.getElementById('podiumValue1').textContent = '—';
        document.getElementById('podiumName2').textContent = '—';
        document.getElementById('podiumValue2').textContent = '—';
        document.getElementById('podiumName3').textContent = '—';
        document.getElementById('podiumValue3').textContent = '—';
        
        document.getElementById('userRank').textContent = '—';
        document.getElementById('userTaxes').textContent = '—';
        document.getElementById('userPopulation').textContent = '—';
        document.getElementById('userTotal').textContent = '—';
        document.getElementById('nextRankDiff').textContent = '—';
        
        const tbody = document.getElementById('rankingBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    Рейтинг временно недоступен
                </td>
            </tr>
        `;
    }

    async updateUserInfo() {
        await this.refreshAllStats();
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
        
        container.innerHTML = this.tariffs.map(tariff => {
            const name = this.currentLanguage === 'ru' ? tariff.name : tariff.name_en;
            const isPremium = tariff.id >= 3;
            
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

    async renderLevels() {
        const container = document.getElementById('levelsBody');
        if (!container) return;
        
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];
        const percentages = [7, 5, 3, 2.5, 2, 1.8, 1.5, 1.3, 1.1, 1, 0.9, 0.8, 0.7, 0.6, 0.5];
        const turnovers = [0, 500, 1000, 2000, 3000, 5000, 7000, 10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000];
        const deposits = [10, 50, 50, 100, 100, 250, 250, 500, 500, 750, 750, 1250, 1250, 2000, 2500];
        
        container.innerHTML = percentages.map((percent, index) => {
            const level = index + 1;
            const hasBonus = this.levelBonuses[index];
            const userTurnover = parseFloat(this.levelDeposits[index] || '0');
            const requiredTurnover = turnovers[index];
            const referralCount = this.levelCounts[index] || 0;
            
            let statusText = t.bonus_inactive;
            let statusClass = 'bonus-inactive';
            
            if (hasBonus) {
                statusText = '✅ ' + (t.bonus_active || 'Активен (+1%)');
                statusClass = 'bonus-active';
            } else if (userTurnover >= requiredTurnover && requiredTurnover > 0) {
                statusText = '⚠️ условия выполнены';
                statusClass = 'bonus-pending';
            } else if (userTurnover > 0) {
                const needMore = (requiredTurnover - userTurnover).toFixed(2);
                statusText = `⏳ нужно ${needMore} USDT`;
                statusClass = 'bonus-pending';
            }
            
            return `
                <tr>
                    <td><span class="level-badge">${level}</span></td>
                    <td><span class="profit-percent">${percent}%</span></td>
                    <td>${this.utils.formatNumber(turnovers[index])} USDT</td>
                    <td>${t.personal_deposit === 'Личный депозит' ? 'от' : 'from'} ${deposits[index]} USDT</td>
                    <td><strong style="color: var(--accent-gold);">${referralCount}</strong></td>
                    <td>${this.utils.formatNumber(userTurnover)} USDT</td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                </tr>
            `;
        }).join('');
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
            this.renderLevels();
            this.loadReferrerInfo();
            
            document.querySelectorAll('.levels-nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const conditionsBtn = document.getElementById('scrollToConditions');
            if (conditionsBtn) conditionsBtn.classList.add('active');
        }
        
        if (tabName === 'districts') this.loadDeposits();
        
        if (tabName === 'rankings') {
            this.loadRankings();
        }
        
        if (tabName === 'treasury' && this.web3 && this.web3.isConnected) {
            this.loadTransactionHistory();
        }
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
        const confirmedReferrer = localStorage.getItem('confirmedReferrer');
        
        let referrerAddress = '0x0000000000000000000000000000000000000000';
        
        if (referrerInput && this.utils.isValidAddress(referrerInput)) {
            referrerAddress = referrerInput;
            console.log('📝 Используем реферера из поля ввода:', referrerAddress);
            localStorage.removeItem('confirmedReferrer');
            
        } else if (confirmedReferrer && this.utils.isValidAddress(confirmedReferrer)) {
            referrerAddress = confirmedReferrer;
            console.log('🔗 Используем подтвержденного реферера из ссылки:', referrerAddress);
            localStorage.removeItem('confirmedReferrer');
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
            
            await this.refreshAllStats();
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
            
            await this.web3.withdrawInterest();
            
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Проценты успешно выведены!' : 'Interest withdrawn successfully!', 
                'success'
            );
            
            await this.refreshAllStats();
            await this.loadTransactionHistory();
            
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
            
            await this.refreshAllStats();
            await this.loadTransactionHistory();
            
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
            
            await this.refreshAllStats();
            await this.loadDeposits();
            await this.loadTransactionHistory();
            
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
            
            await this.web3.withdrawInterest();
            
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Проценты успешно выведены!' : 'Interest withdrawn successfully!', 
                'success'
            );
            
            await this.refreshAllStats();
            await this.loadDeposits();
            await this.loadTransactionHistory();
            
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

    async loadReferrerInfo() {
        const referrerCard = document.getElementById('referrerInfoCard');
        if (!referrerCard) return;
        
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            referrerCard.style.display = 'none';
            return;
        }
        
        try {
            const referrer = await this.web3.getReferrer();
            
            if (referrer === '0x0000000000000000000000000000000000000000') {
                referrerCard.style.display = 'none';
                return;
            }
            
            referrerCard.style.display = 'block';
            
            const shortAddress = this.web3.formatAddress(referrer);
            document.getElementById('referrerAddress').textContent = shortAddress;
            document.getElementById('referrerSince').textContent = '—';
            
        } catch (error) {
            console.error('Error loading referrer info:', error);
            referrerCard.style.display = 'none';
        }
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

window.app = null;

document.addEventListener('DOMContentLoaded', () => {
    window.app = new CryptoLandApp();
});


