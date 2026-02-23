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
        
        this.connectionMode = 'desktop';
        
        this.totalReferralsCount = 0;
        this.totalReferralEarned = '0';
        this.totalInterestEarned = '0';
        this.levelDeposits = new Array(15).fill('0');
        this.levelBonuses = new Array(15).fill(false);
        this.levelCounts = new Array(15).fill(0);
        this.levelStatuses = new Array(15).fill(0);
        this.levelTurnovers = new Array(15).fill('0');
        this.totalStructureTurnover = '0';
        
        this.mayorPhrases = CONFIG.MAYOR_PHRASES;
        
        // Флаги для предотвращения множественных вызовов
        this.reconnecting = false;
        
        this.init();
    }

    async init() {
        const savedLang = localStorage.getItem('cryptoland_language');
        if (savedLang && CONFIG.LANGUAGE.available.includes(savedLang)) {
            this.currentLanguage = savedLang;
        }
        
        try {
            const wasConnected = await this.web3.isWalletConnected();
            if (wasConnected) {
                console.log('✅ Восстановлено подключение кошелька:', this.web3.account);
                this.updateConnectButton(true);
                await this.refreshAllStats();
                await this.loadDeposits();
                await this.loadTransactionHistoryFromDB();
                await this.loadReferrerInfo();
                await this.updateHeaderBalance();
                this.updateReferralLink();
            } else {
                console.log('⏳ Автоподключение не выполнено, ждем ручного подключения');
                this.updateConnectButton(false);
                this.updateReferralLink();
            }
        } catch (error) {
            console.error('Ошибка при восстановлении подключения:', error);
            this.updateConnectButton(false);
        }

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
        
        // Добавляем обработчики возврата из приложения (только для мобильных)
        this.setupVisibilityHandlers();
        
        const urlParams = new URLSearchParams(window.location.search);
        let referrer = urlParams.get('ref');
        
        if (!referrer && this.isTelegramMiniApp() && window.Telegram?.WebApp?.initData) {
            try {
                const tgInitData = window.Telegram.WebApp.initData;
                const tgParams = new URLSearchParams(tgInitData);
                const startParam = tgParams.get('start_param');
                if (startParam && startParam.startsWith('ref_')) {
                    referrer = '0x' + startParam.replace('ref_', '');
                }
            } catch (e) {
                console.warn('Error parsing Telegram init data:', e);
            }
        }
        
        if (referrer && this.utils.isValidAddress(referrer)) {
            this.pendingReferrer = referrer;
            localStorage.setItem('pendingReferrer', referrer);
            
            setTimeout(() => {
                this.showReferrerConfirmation(referrer);
            }, 2000);
        }
        
        await this.loadTariffsFromContract();
        
        if (this.isTelegramMiniApp()) {
            console.log("✅ Приложение запущено в Telegram Mini App");
            setTimeout(() => {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 
                    'Для подключения в Telegram используйте кнопки ниже' : 
                    'To connect in Telegram, use the buttons below', 
                    'info'
                );
            }, 2000);
        }
    }

    // ===== НОВЫЙ МЕТОД: Обработка возврата из приложения =====
    setupVisibilityHandlers() {
        // Только для мобильных и Telegram
        if (this.isMobile || this.isTelegram) {
            console.log('📱 Установлены обработчики возврата из приложения');
            
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    console.log('👁️ Страница стала видимой');
                    this.checkConnectionAfterReturn();
                }
            });

            window.addEventListener('pageshow', (event) => {
                if (event.persisted) {
                    console.log('📄 Страница восстановлена из кэша');
                    this.checkConnectionAfterReturn();
                }
            });
        }
    }

    async checkConnectionAfterReturn() {
        if (this.reconnecting) return;
        this.reconnecting = true;
        
        try {
            // Проверяем, был ли кошелек подключен до ухода
            if (localStorage.getItem('cryptoland_connected') === 'true' && !this.web3?.isConnected) {
                console.log('🔄 Восстанавливаем подключение...');
                
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 
                    'Восстанавливаем подключение...' : 
                    'Restoring connection...',
                    'info',
                    3000
                );
                
                // Пробуем несколько раз с интервалом
                for (let i = 0; i < 5; i++) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    try {
                        if (this.web3?.web3) {
                            const accounts = await this.web3.web3.eth.getAccounts();
                            if (accounts && accounts.length > 0) {
                                this.web3.account = accounts[0];
                                this.web3.isConnected = true;
                                this.updateConnectButton(true);
                                await this.refreshAllStats();
                                await this.updateHeaderBalance();
                                
                                this.utils.showNotification(
                                    this.currentLanguage === 'ru' ? 
                                    'Подключение восстановлено!' : 
                                    'Connection restored!',
                                    'success'
                                );
                                console.log('✅ Подключение восстановлено');
                                break;
                            }
                        }
                    } catch (e) {
                        console.log(`Попытка ${i+1} восстановления не удалась:`, e.message);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при восстановлении:', error);
        } finally {
            // Сбрасываем флаг через 3 секунды
            setTimeout(() => {
                this.reconnecting = false;
            }, 3000);
        }
    }

    detectPlatformAndMode() {
        const isTelegram = !!(window.Telegram && Telegram.WebApp);
        const ua = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

        if (isTelegram) {
            this.connectionMode = 'telegram';
        } else if (isMobile) {
            this.connectionMode = 'mobile';
        } else {
            this.connectionMode = 'desktop';
        }

        console.log('📱 Режим подключения:', this.connectionMode);
        return this.connectionMode;
    }

    showWalletModal() {
        this.detectPlatformAndMode();
        const modalBody = document.getElementById('walletModalBody');
        const modalTitle = document.getElementById('walletModalTitle');
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];

        if (!modalBody) return;

        let html = '';

        if (this.connectionMode === 'desktop') {
            modalTitle.textContent = t.connect_wallet;
            html = `
                <div class="wallet-options">
                    <div class="wallet-option selected" data-wallet="metamask" data-platform="desktop">
                        <div class="wallet-icon">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask">
                        </div>
                        <div class="wallet-info">
                            <h4>MetaMask</h4>
                            <p>${t.metamask_desc}</p>
                        </div>
                        <div class="wallet-check">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                    <div class="wallet-option" data-wallet="trustwallet" data-platform="desktop">
                        <div class="wallet-icon">
                            <img src="https://trustwallet.com/assets/images/media/assets/TWT.png" alt="Trust Wallet">
                        </div>
                        <div class="wallet-info">
                            <h4>Trust Wallet</h4>
                            <p>${t.trust_desc_desktop || t.trust_desc}</p>
                        </div>
                        <div class="wallet-check">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                    <div class="wallet-option" data-wallet="walletconnect" data-platform="desktop">
                        <div class="wallet-icon">
                            <i class="fas fa-qrcode"></i>
                        </div>
                        <div class="wallet-info">
                            <h4>WalletConnect</h4>
                            <p>${t.walletconnect_desc}</p>
                        </div>
                        <div class="wallet-check">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                </div>

                <div class="wallet-instructions">
                    <h4><i class="fas fa-info-circle"></i> ${t.instructions}</h4>
                    <ol>
                        <li>${t.instruction_1}</li>
                        <li>${t.instruction_2}</li>
                        <li>${t.instruction_3}</li>
                        <li>${t.instruction_4}</li>
                    </ol>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-btn secondary" id="cancelWallet"><span>${t.cancel}</span></button>
                    <button class="modal-btn primary" id="connectWallet">
                        <i class="fas fa-plug"></i>
                        <span>${t.connect}</span>
                    </button>
                </div>
            `;
        } else {
            modalTitle.textContent = t.choose_wallet;
            html = `
                <div class="wallet-options mobile-wallet-options">
                    <div class="wallet-option" data-wallet="metamask" data-platform="mobile">
                        <div class="wallet-icon">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask">
                        </div>
                        <div class="wallet-info">
                            <h4>MetaMask</h4>
                            <p>${t.connect_via_app_desc}</p>
                        </div>
                        <div class="wallet-check">
                            <i class="fas fa-external-link-alt"></i>
                        </div>
                    </div>
                    <div class="wallet-option" data-wallet="trustwallet" data-platform="mobile">
                        <div class="wallet-icon">
                            <img src="https://trustwallet.com/assets/images/media/assets/TWT.png" alt="Trust Wallet">
                        </div>
                        <div class="wallet-info">
                            <h4>Trust Wallet</h4>
                            <p>${t.connect_via_app_desc}</p>
                        </div>
                        <div class="wallet-check">
                            <i class="fas fa-external-link-alt"></i>
                        </div>
                    </div>
                    <div class="wallet-option" data-wallet="walletconnect" data-platform="mobile" data-mode="qrcode">
                        <div class="wallet-icon">
                            <i class="fas fa-qrcode"></i>
                        </div>
                        <div class="wallet-info">
                            <h4>WalletConnect</h4>
                            <p>${t.connect_qr_desc}</p>
                        </div>
                        <div class="wallet-check">
                            <i class="fas fa-qrcode"></i>
                        </div>
                    </div>
                </div>
                
                <div class="wallet-instructions" style="margin-top: 20px;">
                    <h4><i class="fas fa-info-circle"></i> ${t.instructions}</h4>
                    <ol>
                        <li>${t.instruction_1}</li>
                        <li>${t.instruction_2}</li>
                        <li>${t.instruction_3}</li>
                        <li>${t.instruction_4}</li>
                    </ol>
                </div>
                
                <div class="deep-link-notification">
                    <i class="fas fa-rocket"></i>
                    <p>${this.currentLanguage === 'ru' ? 
                        'Нажмите на MetaMask или Trust Wallet, чтобы открыть приложение' : 
                        'Tap MetaMask or Trust Wallet to open the app'}</p>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-btn secondary" id="cancelWallet"><span>${t.cancel}</span></button>
                </div>
            `;
        }

        modalBody.innerHTML = html;
        this.attachWalletEventListeners();
        this.showModal('walletModal');
    }

    attachWalletEventListeners() {
        document.querySelectorAll('.wallet-option').forEach(option => {
            option.addEventListener('click', async (e) => {
                const wallet = option.dataset.wallet;
                const platform = option.dataset.platform;
                const mode = option.dataset.mode;
                
                if (platform === 'desktop') {
                    // Десктоп: выбираем кошелек
                    document.querySelectorAll('.wallet-option').forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    this.selectedWallet = wallet;
                } else {
                    // Мобильные и Telegram: сразу WalletConnect
                    this.hideModal('walletModal');
                    
                    this.utils.showNotification(
                        this.currentLanguage === 'ru' ?
                        'Подключение через WalletConnect...' :
                        'Connecting via WalletConnect...',
                        'info'
                    );
                    
                    await this.web3.initWalletConnect();
                }
            });
        });

        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', async () => {
                await this.connectWalletDesktop();
            });
        }

        const cancelBtn = document.getElementById('cancelWallet');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideModal('walletModal'));
        }
    }

    // Метод openMobileAppDirectly полностью удалён

    async connectWalletDesktop() {
        try {
            this.hideModal('walletModal');
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Подключение кошелька...' : 'Connecting wallet...',
                'info'
            );

            if (this.selectedWallet === 'metamask') {
                await this.web3.init('metamask');
                await this.postConnectionTasks();
            } else if (this.selectedWallet === 'trustwallet') {
                try {
                    await this.web3.init('trustwallet');
                    await this.postConnectionTasks();
                    
                    this.utils.showNotification(
                        this.currentLanguage === 'ru' ?
                        'Trust Wallet успешно подключен через расширение!' :
                        'Trust Wallet connected successfully via extension!',
                        'success'
                    );
                } catch (error) {
                    console.error('TrustWallet extension error:', error);
                    
                    this.utils.showNotification(
                        this.currentLanguage === 'ru' ?
                        'Расширение Trust Wallet не найдено. Хотите использовать QR-код?' :
                        'Trust Wallet extension not found. Want to use QR code?',
                        'warning',
                        8000
                    );
                    
                    setTimeout(() => {
                        if (confirm(this.currentLanguage === 'ru' ? 
                            'Переключиться на подключение по QR-коду?' : 
                            'Switch to QR code connection?')) {
                            this.web3.init('walletconnect');
                        }
                    }, 1000);
                }
            } else if (this.selectedWallet === 'walletconnect') {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ?
                    'Генерация QR-кода для подключения...' :
                    'Generating QR code for connection...',
                    'info'
                );
                
                await this.web3.init('walletconnect');
            }

        } catch (error) {
            this.handleConnectionError(error);
        }
    }

    async initMobileConnection(walletType, mode = 'qrcode') {
        this.hideModal('walletModal');
        
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];
        const walletNames = {
            metamask: 'MetaMask',
            trustwallet: 'Trust Wallet',
            walletconnect: 'WalletConnect'
        };
        
        this.utils.showNotification(
            this.currentLanguage === 'ru' ? 
            `Подключение через ${walletNames[walletType]}...` : 
            `Connecting with ${walletNames[walletType]}...`,
            'info'
        );

        try {
            await this.web3.initWalletConnect();

        } catch (error) {
            console.error('Mobile connection error:', error);
            
            if (error.message.includes('open wallet app') || error.message.includes('Failed to open')) {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ?
                    `Установите приложение ${walletNames[walletType]} для продолжения` :
                    `Please install ${walletNames[walletType]} app to continue`,
                    'warning',
                    8000
                );
            } else {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 'Ошибка подключения: ' + error.message : 'Connection error: ' + error.message,
                    'error'
                );
            }
        }
    }

    async postConnectionTasks() {
        await this.refreshAllStats();
        await this.loadDeposits();
        await this.loadTransactionHistoryFromDB();
        await this.loadReferrerInfo();
        this.updateConnectButton(true);
        await this.updateHeaderBalance();
        this.updateReferralLink();
        this.utils.showNotification(
            this.currentLanguage === 'ru' ? 'Кошелек успешно подключен!' : 'Wallet connected successfully!',
            'success'
        );
    }

    handleConnectionError(error) {
        console.error('Connection error:', error);
        this.utils.showNotification(
            this.currentLanguage === 'ru' ? 'Ошибка подключения: ' + error.message : 'Connection error: ' + error.message,
            'error'
        );
        this.updateConnectButton(false);
    }

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
            const stats = await this.web3.getUserStats();
            this.totalInterestEarned = stats.totalEarned;
            
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
            this.levelStatuses = new Array(15).fill(0);
            this.levelTurnovers = new Array(15).fill('0');
            this.totalStructureTurnover = '0';
            return;
        }
        
        try {
            const levelsData = await this.web3.getLevelsData();
            if (levelsData) {
                this.levelStatuses = levelsData.levelStatuses || new Array(15).fill(0);
                this.levelBonuses = levelsData.levelBonuses || new Array(15).fill(false);
                this.levelTurnovers = levelsData.levelTurnovers || new Array(15).fill('0');
                this.levelCounts = levelsData.levelCounts || new Array(15).fill(0);
                this.totalStructureTurnover = levelsData.totalStructureTurnover || '0';
                
                console.log('✅ Статистика уровней загружена:', {
                    statuses: this.levelStatuses,
                    bonuses: this.levelBonuses
                });
            }
        } catch (error) {
            console.error('Error loading level stats:', error);
        }
    }
    
    async refreshAllStats() {
        if (this.web3 && this.web3.account) {
            const savedAccount = localStorage.getItem('cryptoland_account');
            if (savedAccount && this.web3.account.toLowerCase() !== savedAccount) {
                console.log('⚠️ Несовпадение аккаунтов в refreshAllStats, сбрасываем');
                this.web3._forceDisconnect('Аккаунт изменен');
                return;
            }
        }
        
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            this.totalReferralsCount = 0;
            this.totalReferralEarned = '0';
            this.totalInterestEarned = '0';
            this.levelDeposits = new Array(15).fill('0');
            this.levelBonuses = new Array(15).fill(false);
            this.levelCounts = new Array(15).fill(0);
            this.levelStatuses = new Array(15).fill(0);
            this.levelTurnovers = new Array(15).fill('0');
            this.totalStructureTurnover = '0';
            
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
        
        this.updateHeaderBalance();
        this.updateHeaderAddress();
    }

    async updateHeaderBalance() {
        const balanceElement = document.getElementById('headerWalletBalance');
        if (!balanceElement) return;
        
        if (this.web3 && this.web3.isConnected && this.web3.account) {
            try {
                const balance = await this.web3.getUSDTBalance();
                balanceElement.textContent = this.utils.formatNumber(balance, 2);
            } catch (error) {
                console.error('Error updating header balance:', error);
                balanceElement.textContent = '0.00';
            }
        } else {
            balanceElement.textContent = '0.00';
        }
    }

    updateHeaderAddress() {
        const headerRight = document.querySelector('.header-right');
        if (!headerRight) return;
        
        const oldAddress = document.getElementById('headerWalletAddress');
        if (oldAddress) oldAddress.remove();
        
        if (this.web3 && this.web3.isConnected && this.web3.account) {
            const addressElement = document.createElement('div');
            addressElement.id = 'headerWalletAddress';
            addressElement.className = 'wallet-header-address';
            addressElement.innerHTML = `<i class="fas fa-wallet"></i> ${this.web3.formatAddress(this.web3.account, 6, 4)}`;
            
            const container = document.querySelector('.wallet-header-container');
            if (container) {
                container.after(addressElement);
            }
        }
    }

    forceUpdateMayorBonus() {
        const mayorBonusElement = document.getElementById('mayorBonus');
        if (!mayorBonusElement) return;

        const langBtn = document.querySelector('.lang-btn.active');
        const isEnglish = langBtn ? langBtn.dataset.lang === 'en' : false;

        const anyLevelActive = this.levelBonuses && this.levelBonuses.some(bonus => bonus === true);

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

    updateTaxPageStats(stats) {
        document.getElementById('totalReferrals').textContent = this.totalReferralsCount.toString();
        document.getElementById('totalTaxes').textContent = this.utils.formatNumber(stats.availableReferral, 2) + ' USDT';
        document.getElementById('totalTurnover').textContent = this.utils.formatNumber(this.totalReferralEarned, 2) + ' USDT';
        this.forceUpdateMayorBonus();
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
        this.forceUpdateMayorBonus();
        
        if (this.currentTab === 'districts' && this.userDeposits.length > 0) {
            this.loadDeposits();
        }
        
        if (this.currentTab === 'treasury') {
            this.renderTransactions();
        }
        
        if (this.web3 && this.web3.isConnected) {
            this.updateConnectButton(true);
            setTimeout(() => {
                this.refreshAllStats();
            }, 100);
        } else {
            this.updateConnectButton(false);
        }
    }

    initLanguage() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.switchLanguage(lang);
            });
        });
        
        const savedLang = localStorage.getItem('cryptoland_language') || this.currentLanguage;
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.dataset.lang === savedLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.updateAllText();
        this.renderTariffs();
        
        setTimeout(() => {
            this.forceUpdateMayorBonus();
        }, 500);
    }

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
        
        if (this.web3 && this.web3.isConnected && this.web3.account) {
            const hasReferrer = await this.checkIfHasReferrer();
            if (hasReferrer) {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 
                    'У вас уже есть реферер! Вы не можете сменить его.' : 
                    'You already have a referrer! You cannot change it.', 
                    'warning'
                );
                this.pendingReferrer = null;
                localStorage.removeItem('pendingReferrer');
                this.hideReferrerModal();
                return;
            }
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
        localStorage.removeItem('pendingReferrer');
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
        localStorage.removeItem('pendingReferrer');
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
        
        const rankingSearchInput = document.querySelector('.ranking-search-input');
        if (rankingSearchInput) {
            rankingSearchInput.placeholder = t.search_placeholder;
        }
        
        if (this.selectedTariff) {
            const investTitle = document.getElementById('investTitle');
            if (investTitle) {
                const tariffName = this.currentLanguage === 'ru' ? this.selectedTariff.name : this.selectedTariff.name_en;
                investTitle.textContent = `${t.invest_title} ${tariffName}`;
            }
        }
        
        const turnoverBlock = document.getElementById('totalStructureTurnover');
        if (turnoverBlock) {
            turnoverBlock.innerHTML = `
                <div class="turnover-block">
                    <span class="turnover-label">${t.total_structure_turnover}:</span>
                    <span class="turnover-value">${this.utils.formatNumber(this.totalStructureTurnover)} USDT</span>
                    <span class="turnover-desc">${t.total_structure_turnover_desc}</span>
                </div>
            `;
        }
        
        this.renderLevels();
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
            this.updateHeaderAddress();
        } else {
            connectBtnText.textContent = this.currentLanguage === 'ru' ? 'ПОДКЛЮЧИТЬ' : 'CONNECT';
            connectBtn.classList.remove('connected');
            if (connectBtnIcon) {
                connectBtnIcon.className = 'fas fa-plug';
            }
            const addressElement = document.getElementById('headerWalletAddress');
            if (addressElement) addressElement.remove();
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
                await this.showReferralLinksModal();
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

    // ===== НОВЫЙ МЕТОД: Загрузка истории из БД =====
    async loadTransactionHistoryFromDB(page = 1, limit = 50) {
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            this.transactions = [];
            this.filteredTransactions = [];
            this.renderTransactions();
            return;
        }
        
        try {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Загрузка истории транзакций...' : 'Loading transaction history...', 
                'info'
            );
            
            const serverUrl = CONFIG.SERVER_URL || 'http://localhost:3000';
            const response = await fetch(`${serverUrl}/api/transactions/${this.web3.account}?page=${page}&limit=${limit}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            const data = await response.json();
            
            this.transactions = data.transactions || [];
            this.filteredTransactions = [...this.transactions];
            
            console.log(`✅ Загружено ${this.transactions.length} транзакций из БД`);
            this.renderTransactions();
            
            if (this.transactions.length > 0) {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 
                    `Загружено ${this.transactions.length} транзакций` : 
                    `Loaded ${this.transactions.length} transactions`, 
                    'success'
                );
            }
            
        } catch (error) {
            console.error('Error loading transaction history from DB:', error);
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 
                'История транзакций временно недоступна' : 
                'Transaction history temporarily unavailable', 
                'warning'
            );
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
                    case 'today': if (tx.timestamp < today) return false; break;
                    case 'week': if (tx.timestamp < weekAgo) return false; break;
                    case 'month': if (tx.timestamp < monthAgo) return false; break;
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
        
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];
        
        if (this.filteredTransactions.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        ${t.no_transactions || 'Нет операций для отображения'}
                    </td>
                </tr>
            `;
            return;
        }
        
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
                    if (tx.level) {
                        levelHtml = `<span class="level-badge-small" style="margin-left: 8px; background: rgba(255,215,0,0.2); color: var(--accent-gold); padding: 2px 6px; border-radius: 12px; font-size: 10px;">ур.${tx.level}</span>`;
                    }
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
        
        const turnoverBlock = document.getElementById('totalStructureTurnover');
        if (turnoverBlock) {
            turnoverBlock.innerHTML = `
                <div class="turnover-block">
                    <span class="turnover-label">${t.total_structure_turnover}:</span>
                    <span class="turnover-value">${this.utils.formatNumber(this.totalStructureTurnover)} USDT</span>
                    <span class="turnover-desc">${t.total_structure_turnover_desc}</span>
                </div>
            `;
        }
        
        container.innerHTML = percentages.map((percent, index) => {
            const level = index + 1;
            const isOpen = this.levelStatuses && this.levelStatuses[index] === 1;
            const hasBonus = this.levelBonuses && this.levelBonuses[index] === true;
            const userTurnover = parseFloat(this.levelTurnovers?.[index] || '0');
            const requiredTurnover = turnovers[index];
            const referralCount = this.levelCounts?.[index] || 0;
            
            let bonusStatusText = t.bonus_inactive;
            let bonusStatusClass = 'bonus-inactive';
            
            if (hasBonus) {
                bonusStatusText = '✅ ' + (t.bonus_active || 'Активен (+1%)');
                bonusStatusClass = 'bonus-active';
            } else if (userTurnover >= 5000 && requiredTurnover > 0) {
                bonusStatusText = '⚠️ условия выполнены';
                bonusStatusClass = 'bonus-pending';
            } else if (userTurnover > 0) {
                const needMore = (5000 - userTurnover).toFixed(2);
                bonusStatusText = `⏳ нужно ${needMore} USDT`;
                bonusStatusClass = 'bonus-pending';
            }
            
            const levelBadgeClass = isOpen ? 'level-badge level-open' : 'level-badge';
            
            return `
                <tr>
                    <td><span class="${levelBadgeClass}">${level}</span></td>
                    <td><span class="profit-percent">${percent}%</span></td>
                    <td>${this.utils.formatNumber(turnovers[index])} USDT</td>
                    <td>${t.personal_deposit === 'Личный депозит' ? 'от' : 'from'} ${deposits[index]} USDT</td>
                    <td><strong style="color: var(--accent-gold);">${referralCount}</strong></td>
                    <td>${this.utils.formatNumber(userTurnover)} USDT</td>
                    <td><span class="${bonusStatusClass}">${bonusStatusText}</span></td>
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
        if (tabName === 'rankings') this.loadRankings();
        if (tabName === 'treasury' && this.web3 && this.web3.isConnected) this.loadTransactionHistoryFromDB();
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
        
        try {
            const balance = await this.web3.getUSDTBalance();
            if (parseFloat(balance) < amount) {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 
                    `Недостаточно USDT. Баланс: ${balance}` : 
                    `Insufficient USDT. Balance: ${balance}`, 
                    'error'
                );
                console.error('❌ Недостаточно USDT:', balance, 'нужно:', amount);
                return;
            }
            console.log('✅ Баланс USDT достаточен:', balance);
        } catch (balanceError) {
            console.error('❌ Ошибка при проверке баланса:', balanceError);
        }
        
        try {
            const networkId = await this.web3.web3.eth.net.getId();
            const expectedNetwork = CONFIG.CURRENT_NETWORK;
            if (parseInt(networkId) !== expectedNetwork) {
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 
                    `Неверная сеть. Текущая: ${networkId}, ожидается: ${expectedNetwork}` : 
                    `Wrong network. Current: ${networkId}, expected: ${expectedNetwork}`, 
                    'error'
                );
                return;
            }
            console.log('✅ Сеть правильная:', networkId);
        } catch (networkError) {
            console.error('❌ Ошибка при проверке сети:', networkError);
        }
        
        const referrerInput = document.getElementById('referrerAddress')?.value || '';
        const confirmedReferrer = localStorage.getItem('confirmedReferrer');
        const pendingReferrer = localStorage.getItem('pendingReferrer');
        
        let referrerAddress = '0x0000000000000000000000000000000000000000';
        
        try {
            const existingReferrer = await this.web3.getReferrer();
            if (existingReferrer !== '0x0000000000000000000000000000000000000000') {
                console.log('ℹ️ У вас уже есть реферер в контракте:', existingReferrer);
                referrerAddress = existingReferrer;
            } else {
                if (referrerInput && this.utils.isValidAddress(referrerInput)) {
                    if (referrerInput.toLowerCase() === this.web3.account.toLowerCase()) {
                        this.utils.showNotification(
                            this.currentLanguage === 'ru' ? 'Нельзя указать себя как пригласителя' : 'You cannot refer yourself', 
                            'warning'
                        );
                        return;
                    }
                    referrerAddress = referrerInput;
                    console.log('📝 Используем реферера из поля ввода:', referrerAddress);
                } else if (confirmedReferrer && this.utils.isValidAddress(confirmedReferrer)) {
                    if (confirmedReferrer.toLowerCase() !== this.web3.account.toLowerCase()) {
                        referrerAddress = confirmedReferrer;
                        console.log('🔗 Используем подтвержденного реферера из ссылки:', referrerAddress);
                    }
                } else if (pendingReferrer && this.utils.isValidAddress(pendingReferrer)) {
                    if (pendingReferrer.toLowerCase() !== this.web3.account.toLowerCase()) {
                        referrerAddress = pendingReferrer;
                        console.log('🔗 Используем ожидающего реферера из ссылки:', referrerAddress);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Не удалось проверить существующего реферера:', error);
        }
        
        localStorage.removeItem('confirmedReferrer');
        localStorage.removeItem('pendingReferrer');
        
        try {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Инвестирование...' : 'Investing...', 
                'info'
            );
            
            try {
                const weiAmount = this.web3.web3.utils.toWei(amount.toString(), 'ether');
                const usdtContract = this.web3.usdtContract;
                const account = this.web3.account;
                
                const allowance = await usdtContract.methods
                    .allowance(account, CONFIG.CONTRACT_ADDRESS)
                    .call();
                
                const allowanceBN = this.web3.web3.utils.toBN(allowance);
                const amountBN = this.web3.web3.utils.toBN(weiAmount);
                
                console.log('📊 Текущий allowance:', this.web3.web3.utils.fromWei(allowance, 'ether'), 'USDT');
                console.log('📊 Требуется:', amount, 'USDT');
                
                if (allowanceBN.lt(amountBN)) {
                    console.log('📝 Allowance слишком мал, делаем approve');
                    this.utils.showNotification(
                        this.currentLanguage === 'ru' ? 'Обновляем approve...' : 'Updating approve...', 
                        'info'
                    );
                    
                    const approveAmount = this.web3.web3.utils.toWei('1000000', 'ether');
                    const approveTx = await usdtContract.methods
                        .approve(CONFIG.CONTRACT_ADDRESS, approveAmount)
                        .send({ from: account, gas: 100000 });
                    
                    console.log('✅ Approve обновлен, tx:', approveTx.transactionHash);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    console.log('✅ Allowance достаточен');
                }
            } catch (approveError) {
                console.error('❌ Ошибка при approve:', approveError);
                this.utils.showNotification(
                    this.currentLanguage === 'ru' ? 'Ошибка при approve: ' + approveError.message : 'Approve error: ' + approveError.message, 
                    'error'
                );
                return;
            }
            
            console.log('📤 Отправляем инвестицию с реферером:', referrerAddress);
            console.log('📤 Сумма:', amount, 'USDT');
            console.log('📤 Тариф ID:', this.selectedTariff.id);
            
            const result = await this.web3.invest(amount, this.selectedTariff.id, referrerAddress);
            console.log('✅ Транзакция успешна:', result.transactionHash);
            
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Инвестиция успешна!' : 'Investment successful!', 
                'success'
            );
            
            this.hideModal('investModal');
            
            await this.refreshAllStats();
            await this.loadDeposits();
            await this.loadTransactionHistoryFromDB();
            await this.loadReferrerInfo();
            
        } catch (error) {
            console.error('❌ Investment error:', error);
            let errorMessage = error.message;
            let userMessage = '';
            
            if (error.message.includes('revert')) {
                if (error.message.includes('MIN_INVESTMENT')) {
                    userMessage = this.currentLanguage === 'ru' ? 'Минимальная сумма инвестиции 10 USDT' : 'Minimum investment is 10 USDT';
                } else if (error.message.includes('referrer already set')) {
                    userMessage = this.currentLanguage === 'ru' ? 'У вас уже есть пригласитель' : 'Referrer already set';
                } else if (error.message.includes('cannot refer yourself')) {
                    userMessage = this.currentLanguage === 'ru' ? 'Нельзя указать себя как пригласителя' : 'Cannot refer yourself';
                } else if (error.message.includes('transfer amount exceeds balance')) {
                    userMessage = this.currentLanguage === 'ru' ? 'Недостаточно USDT на балансе' : 'Insufficient USDT balance';
                } else if (error.message.includes('allowance')) {
                    userMessage = this.currentLanguage === 'ru' ? 'Не одобрен контракт (проблема с approve)' : 'Allowance issue';
                } else if (error.message.includes('execution reverted')) {
                    userMessage = this.currentLanguage === 'ru' ? 'Ошибка выполнения контракта. Проверьте баланс и повторите.' : 'Contract execution error. Check balance and try again.';
                } else {
                    userMessage = this.currentLanguage === 'ru' ? 'Ошибка контракта. Проверьте консоль для деталей.' : 'Contract error. Check console for details.';
                }
            } else if (error.message.includes('User denied')) {
                userMessage = this.currentLanguage === 'ru' ? 'Транзакция отклонена пользователем' : 'Transaction denied by user';
            } else {
                userMessage = this.currentLanguage === 'ru' ? 'Ошибка транзакции: ' + error.message : 'Transaction error: ' + error.message;
            }
            
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Ошибка: ' + userMessage : 'Error: ' + userMessage, 
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
        
        const webLink = CONFIG.getWebLink(this.web3.account);
        refInput.value = webLink;
    }

    async showReferralLinksModal() {
        if (!this.web3 || !this.web3.isConnected || !this.web3.account) {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Сначала подключите кошелек' : 'Connect wallet first', 
                'error'
            );
            return;
        }
        
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];
        const account = this.web3.account;
        const isTelegram = this.isTelegramMiniApp();
        
        const webLink = CONFIG.getWebLink(account);
        const telegramLink = CONFIG.getTelegramMiniAppLink(account);
        const isTelegramAvailable = telegramLink && CONFIG.TELEGRAM_MINIAPP.ENABLED;
        
        const botChangeNote = this.currentLanguage === 'ru' 
            ? (CONFIG.TELEGRAM_MINIAPP.BOT_CHANGE_NOTE || t.bot_change_note)
            : (CONFIG.TELEGRAM_MINIAPP.BOT_CHANGE_NOTE_EN || t.bot_change_note);
        
        let modal = document.getElementById('referralLinksModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'referralLinksModal';
            modal.className = 'modal modal-referral-links';
            modal.innerHTML = `
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-share-alt"></i>
                        <span data-i18n="referral_links_title">${t.referral_links_title}</span>
                    </h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="referral-links-list">
                        <div class="referral-link-card">
                            <div class="link-icon">
                                <i class="fas fa-globe"></i>
                            </div>
                            <div class="link-content">
                                <div class="link-header">
                                    <h4 data-i18n="web_link">${t.web_link}</h4>
                                    <span class="link-badge">${t.universal}</span>
                                </div>
                                <p class="link-desc" data-i18n="web_link_desc">${t.web_link_desc}</p>
                                <div class="link-copy-wrapper">
                                    <input type="text" class="link-input" id="webLinkInput" readonly value="${webLink}">
                                    <button class="link-copy-btn" data-type="web">
                                        <i class="fas fa-copy"></i>
                                        <span>${t.copy_link}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        ${isTelegramAvailable ? `
                        <div class="referral-link-card telegram-card">
                            <div class="link-icon">
                                <i class="fab fa-telegram-plane"></i>
                            </div>
                            <div class="link-content">
                                <div class="link-header">
                                    <h4 data-i18n="telegram_link">${t.telegram_link}</h4>
                                    <span class="link-badge premium">⭐ ${t.recommended}</span>
                                </div>
                                <p class="link-desc" data-i18n="telegram_link_desc">${t.telegram_link_desc}</p>
                                <div class="link-copy-wrapper">
                                    <input type="text" class="link-input" id="telegramLinkInput" readonly value="${telegramLink}">
                                    <button class="link-copy-btn premium-btn" data-type="telegram">
                                        <i class="fas fa-copy"></i>
                                        <span>${t.copy_link}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        <div class="referral-link-note">
                            <i class="fas fa-info-circle"></i>
                            <p>${botChangeNote}</p>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="modal-btn primary" id="closeReferralLinksModal">
                            <i class="fas fa-check"></i>
                            <span data-i18n="close">${t.close}</span>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelectorAll('.link-copy-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const type = e.currentTarget.dataset.type;
                    const input = type === 'web' 
                        ? document.getElementById('webLinkInput') 
                        : document.getElementById('telegramLinkInput');
                    
                    if (input) {
                        await this.utils.copyToClipboard(input.value);
                        const originalText = btn.innerHTML;
                        const copiedText = this.currentLanguage === 'ru' ? 'Скопировано!' : 'Copied!';
                        btn.innerHTML = `<i class="fas fa-check"></i> <span>${copiedText}</span>`;
                        btn.classList.add('copied');
                        setTimeout(() => {
                            btn.innerHTML = originalText;
                            btn.classList.remove('copied');
                        }, 2000);
                        
                        this.utils.showNotification(
                            this.currentLanguage === 'ru' ? 'Ссылка скопирована!' : 'Link copied!', 
                            'success'
                        );
                    }
                });
            });
            
            modal.querySelector('.modal-close').addEventListener('click', () => {
                this.hideModal('referralLinksModal');
            });
            
            document.getElementById('closeReferralLinksModal').addEventListener('click', () => {
                this.hideModal('referralLinksModal');
            });
        } else {
            const webInput = document.getElementById('webLinkInput');
            if (webInput) webInput.value = webLink;
            
            const telegramInput = document.getElementById('telegramLinkInput');
            if (telegramInput && isTelegramAvailable) {
                telegramInput.value = telegramLink;
            } else if (telegramInput && !isTelegramAvailable) {
                const telegramCard = document.querySelector('.referral-link-card.telegram-card');
                if (telegramCard) telegramCard.style.display = 'none';
            }
            
            const noteElement = modal.querySelector('.referral-link-note p');
            if (noteElement) {
                noteElement.textContent = botChangeNote;
            }
            
            const universalBadge = modal.querySelector('.referral-link-card:first-child .link-badge');
            if (universalBadge) {
                universalBadge.textContent = t.universal;
            }
            
            const recommendedBadge = modal.querySelector('.referral-link-card.telegram-card .link-badge');
            if (recommendedBadge) {
                recommendedBadge.innerHTML = `⭐ ${t.recommended}`;
            }
            
            const copyButtons = modal.querySelectorAll('.link-copy-btn span');
            copyButtons.forEach(btn => {
                btn.textContent = t.copy_link;
            });
            
            const closeBtn = document.getElementById('closeReferralLinksModal');
            if (closeBtn) {
                closeBtn.querySelector('span').textContent = t.close;
            }
            
            const modalHeader = modal.querySelector('.modal-header h3 span');
            if (modalHeader) {
                modalHeader.textContent = t.referral_links_title;
            }
        }
        
        this.showModal('referralLinksModal');
    }

    async copyReferralLink() {
        await this.showReferralLinksModal();
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
            await this.loadTransactionHistoryFromDB();
            
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
            await this.loadTransactionHistoryFromDB();
            
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
        
        if (!this.userDeposits || this.userDeposits.length === 0) {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'У вас нет активных депозитов' : 'You have no active deposits', 
                'warning'
            );
            return;
        }

        this.showDepositsStatusModal();
    }

    showDepositsStatusModal() {
        const t = CONFIG.TRANSLATIONS[this.currentLanguage];
        
        const activeDeposits = this.userDeposits.filter(d => d.active);
        
        if (activeDeposits.length === 0) {
            this.utils.showNotification(
                this.currentLanguage === 'ru' ? 'Нет активных депозитов' : 'No active deposits', 
                'info'
            );
            return;
        }
        
        let depositsHtml = '';
        let totalAmount = 0;
        const now = new Date();
        
        activeDeposits.forEach((dep, index) => {
            const tariff = this.tariffs[dep.tariffId] || this.tariffs[0];
            const tariffName = this.currentLanguage === 'ru' ? tariff.name : tariff.name_en;
            
            const startDate = new Date(dep.startTime * 1000);
            const endDate = new Date((dep.startTime + tariff.duration * 24 * 60 * 60) * 1000);
            
            totalAmount += parseFloat(dep.amount);
            
            const timeLeft = endDate - now;
            const timeLeftText = this.formatTimeLeft(timeLeft, t);
            
            const totalDuration = endDate - startDate;
            const elapsed = now - startDate;
            const progress = Math.min(100, (elapsed / totalDuration) * 100);
            
            depositsHtml += `
                <div class="deposit-status-item">
                    <div class="status-header">
                        <div class="status-name">
                            <i class="fas fa-building"></i>
                            ${tariffName}
                        </div>
                        <div class="status-amount">${this.utils.formatNumber(dep.amount)} USDT</div>
                    </div>
                    
                    <div class="status-info-grid">
                        <div class="status-info-item">
                            <span class="info-label">📅 ${t.start_date}:</span>
                            <span class="info-value">${startDate.toLocaleDateString()}</span>
                        </div>
                        <div class="status-info-item">
                            <span class="info-label">⏰ ${t.end_date}:</span>
                            <span class="info-value">${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString().slice(0,5)}</span>
                        </div>
                    </div>
                    
                    <div class="status-progress">
                        <div class="progress-header">
                            <span><i class="fas fa-chart-line"></i> ${t.progress || 'Прогресс'}</span>
                            <span>${progress.toFixed(0)}%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="status-footer">
                        <div class="status-timeleft">
                            <i class="fas fa-hourglass-half"></i>
                            <span>${t.time_left}:</span>
                            <strong>${timeLeftText}</strong>
                        </div>
                        <div class="status-badge active">
                            <i class="fas fa-check-circle"></i>
                            ${t.active}
                        </div>
                    </div>
                </div>
            `;
        });
        
        const summaryHtml = `
            <div class="deposits-status-summary" style="margin-bottom: 20px; padding: 15px; background: linear-gradient(145deg, rgba(255,215,0,0.1), rgba(0,0,0,0.2)); border-radius: 15px; border: 1px solid var(--border-gold);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <span style="color: var(--text-muted); font-size: 14px;">${t.total_active}:</span>
                        <span style="font-size: 24px; font-weight: 700; color: var(--accent-gold); margin-left: 10px;">${activeDeposits.length}</span>
                    </div>
                    <div>
                        <span style="color: var(--text-muted); font-size: 14px;">${t.total_amount}:</span>
                        <span style="font-size: 24px; font-weight: 700; color: var(--accent-gold); margin-left: 10px;">${this.utils.formatNumber(totalAmount)} USDT</span>
                    </div>
                </div>
            </div>
        `;
        
        let modal = document.getElementById('depositsStatusModal');
        
        if (modal) {
            modal.remove();
        }
        
        modal = document.createElement('div');
        modal.id = 'depositsStatusModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-header">
                <h3>
                    <i class="fas fa-clock"></i>
                    <span>${t.deposits_status || 'Статус депозитов'}</span>
                </h3>
                <button class="modal-close" id="closeDepositsStatusModal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${summaryHtml}
                <div class="deposits-status-list" id="depositsStatusList"></div>
                
                <div class="modal-actions" style="margin-top: 25px;">
                    <button class="modal-btn primary" id="closeDepositsStatusBtn">
                        <i class="fas fa-check"></i>
                        ${t.ok || 'OK'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const closeBtn = document.getElementById('closeDepositsStatusBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideModal('depositsStatusModal');
            });
        }
        
        const closeIcon = document.getElementById('closeDepositsStatusModal');
        if (closeIcon) {
            closeIcon.addEventListener('click', () => {
                this.hideModal('depositsStatusModal');
            });
        }
        
        const listContainer = document.getElementById('depositsStatusList');
        if (listContainer) {
            listContainer.innerHTML = depositsHtml;
        }
        
        this.showModal('depositsStatusModal');
    }

    formatTimeLeft(milliseconds, t) {
        if (milliseconds <= 0) return t.waiting_return || 'Ожидает возврата';
        
        const seconds = Math.floor(milliseconds / 1000);
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) {
            return `${days} ${t.days} ${hours} ${t.hours}`;
        } else if (hours > 0) {
            return `${hours} ${t.hours} ${minutes} ${t.minutes}`;
        } else if (minutes > 0) {
            return `${minutes} ${t.minutes}`;
        } else {
            return t.less_than_hour || 'менее часа';
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
                                <button class="deposit-btn collect" data-deposit-id="${index}">
                                    <i class="fas fa-coins"></i>
                                    ${t.collect_income || 'Собрать доход'}
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
            
            document.querySelectorAll('.deposit-btn.collect').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.showTab('treasury');
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
            await this.loadTransactionHistoryFromDB();
            
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
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                
                const anyModalOpen = Array.from(document.querySelectorAll('.modal')).some(m => 
                    m.style.display === 'block' || m.classList.contains('show')
                );
                
                if (!anyModalOpen) {
                    const overlay = document.getElementById('modalOverlay');
                    if (overlay) overlay.style.display = 'none';
                }
            }, 300);
        }
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
        const overlay = document.getElementById('modalOverlay');
        if (overlay) overlay.style.display = 'none';
    }
}

window.app = null;

document.addEventListener('DOMContentLoaded', () => {
    window.app = new CryptoLandApp();
});
