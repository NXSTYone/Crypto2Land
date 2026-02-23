class CryptoLandWeb3 {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.networkId = null;
        this.isConnected = false;
        this.usdtContract = null;
        this.provider = null;
        this.walletType = null;
        
        // ===== Определение платформы =====
        this.isTelegram = false;
        this.isMobile = false;
        this.isIOS = false;
        this.isAndroid = false;
        this.connectionMode = 'qrcode';
        
        // Project ID из config.js
        this.projectId = CONFIG.WALLETCONNECT_PROJECT_ID;
        
        // Флаг для предотвращения множественных подключений
        this.isConnecting = false;
    }

    // ===== МЕТОД: Определение окружения =====
    detectPlatform() {
        // Проверяем Telegram
        this.isTelegram = !!(window.Telegram && Telegram.WebApp);
        
        // Проверяем мобильное устройство
        const ua = navigator.userAgent;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        this.isIOS = /iPhone|iPad|iPod/i.test(ua);
        this.isAndroid = /Android/i.test(ua);
        
        // Определяем режим подключения
        if (this.isMobile) {
            this.connectionMode = 'deeplink';
        } else {
            this.connectionMode = 'qrcode';
        }
        
        console.log('📱 Платформа:', {
            telegram: this.isTelegram,
            mobile: this.isMobile,
            ios: this.isIOS,
            android: this.isAndroid,
            mode: this.connectionMode
        });
        
        return this.connectionMode;
    }

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    async init(walletType = 'metamask', mode = 'auto') {
        this.walletType = walletType;
        this.detectPlatform();
        
        if (walletType === 'metamask') {
            // На десктопе используем расширение, на мобильном - WalletConnect
            if (!this.isMobile && !this.isTelegram) {
                return this.initMetaMask();
            } else {
                return this.initWalletConnect();
            }
        } else if (walletType === 'trustwallet') {
            // Для TrustWallet на десктопе используем расширение, на мобильном - WalletConnect
            if (!this.isMobile && !this.isTelegram) {
                return this.initTrustWalletExtension();
            } else {
                return this.initWalletConnect();
            }
        } else if (walletType === 'walletconnect') {
            return this.initWalletConnect();
        } else {
            throw new Error("Unsupported wallet type");
        }
    }

    // ===== МЕТОД: Подключение расширения TrustWallet =====
    async initTrustWalletExtension() {
        // Проверяем наличие TrustWallet в window
        if (!window.trustwallet) {
            console.log('⏳ TrustWallet extension not detected');
            
            if (window.app) {
                window.app.utils.showNotification(
                    window.app.currentLanguage === 'ru' ? 
                    'Установите расширение Trust Wallet для браузера' : 
                    'Install Trust Wallet browser extension',
                    'warning'
                );
            }
            
            // Пробуем открыть страницу установки
            setTimeout(() => {
                window.open('https://trustwallet.com/browser-extension', '_blank');
            }, 2000);
            
            throw new Error("Trust Wallet extension not installed");
        }
        
        // TrustWallet сам является провайдером (без .ethereum!)
        console.log('✅ TrustWallet найден, подключаемся...');
        this.web3 = new Web3(window.trustwallet);
        
        try {
            const accounts = await window.trustwallet.request({
                method: 'eth_requestAccounts'
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found");
            }
            
            this.account = accounts[0];
            this.networkId = await this.web3.eth.net.getId();
            
            await this.checkNetwork();
            await this.initContracts();
            
            this.isConnected = true;
            
            localStorage.setItem('cryptoland_connected', 'true');
            localStorage.setItem('cryptoland_account', this.account.toLowerCase());
            
            this.setupTrustWalletEvents();
            
            if (window.app) {
                window.app.utils.showNotification(
                    window.app.currentLanguage === 'ru' ? 
                    'Trust Wallet успешно подключен!' : 
                    'Trust Wallet connected successfully!',
                    'success'
                );
            }
            
            return this.account;
            
        } catch (error) {
            console.error("Trust Wallet connection error:", error);
            throw error;
        }
    }

    // ===== АВТОПОДКЛЮЧЕНИЕ =====
    async isWalletConnected() {
        // Проверяем MetaMask
        if (window.ethereum) {
            try {
                const wasManuallyConnected = localStorage.getItem('cryptoland_connected') === 'true';
                if (!wasManuallyConnected) {
                    console.log('⏳ Нет флага ручного подключения');
                    return false;
                }
                
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                
                if (!accounts || accounts.length === 0) {
                    console.log('⏳ Нет аккаунтов в MetaMask');
                    this._cleanupLocalStorage();
                    return false;
                }
                
                const currentAccount = accounts[0].toLowerCase();
                const savedAccount = localStorage.getItem('cryptoland_account');
                
                if (!savedAccount) {
                    console.log('⏳ Нет сохраненного аккаунта');
                    this._cleanupLocalStorage();
                    return false;
                }
                
                if (currentAccount !== savedAccount) {
                    console.log(`⚠️ Аккаунт не совпадает: текущий=${currentAccount}, сохраненный=${savedAccount}`);
                    this._cleanupLocalStorage();
                    
                    if (window.app) {
                        window.app.utils.showNotification(
                            window.app.currentLanguage === 'ru' ? 
                            'Аккаунт в MetaMask изменился. Подключитесь заново.' : 
                            'Account in MetaMask changed. Please reconnect.', 
                            'warning'
                        );
                        
                        setTimeout(() => {
                            window.app.updateConnectButton(false);
                            window.app.updateReferralLink();
                        }, 100);
                    }
                    return false;
                }
                
                console.log('✅ Все проверки пройдены, выполняем автоподключение...');
                
                this.account = accounts[0];
                this.web3 = new Web3(window.ethereum);
                this.walletType = 'metamask';
                
                this.networkId = await this.web3.eth.net.getId();
                await this.checkNetwork();
                await this.initContracts();
                
                this.isConnected = true;
                this.setupMetaMaskEvents();
                
                console.log('✅ Автоподключение успешно:', this.account);
                return true;
                
            } catch (error) {
                console.error('❌ Ошибка при проверке подключения:', error);
                this._cleanupLocalStorage();
                return false;
            }
        }
        
        // Проверяем TrustWallet (исправлено!)
        if (window.trustwallet) {
            try {
                const wasManuallyConnected = localStorage.getItem('cryptoland_connected') === 'true';
                if (!wasManuallyConnected) return false;
                
                const accounts = await window.trustwallet.request({ method: 'eth_accounts' });
                
                if (!accounts || accounts.length === 0) return false;
                
                const currentAccount = accounts[0].toLowerCase();
                const savedAccount = localStorage.getItem('cryptoland_account');
                
                if (!savedAccount || currentAccount !== savedAccount) {
                    this._cleanupLocalStorage();
                    return false;
                }
                
                console.log('✅ TrustWallet автоподключение...');
                
                this.account = accounts[0];
                this.web3 = new Web3(window.trustwallet); // ← исправлено!
                this.walletType = 'trustwallet';
                
                this.networkId = await this.web3.eth.net.getId();
                await this.checkNetwork();
                await this.initContracts();
                
                this.isConnected = true;
                this.setupTrustWalletEvents();
                
                return true;
                
            } catch (error) {
                console.error('TrustWallet auto-connect error:', error);
                return false;
            }
        }
        
        return false;
    }
    
    _cleanupLocalStorage() {
        localStorage.removeItem('cryptoland_connected');
        localStorage.removeItem('cryptoland_account');
    }

    async initMetaMask() {
        if (!window.ethereum) {
            throw new Error("Установите MetaMask для использования приложения");
        }
        
        this.web3 = new Web3(window.ethereum);
        
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found");
            }
            
            this.account = accounts[0];
            this.networkId = await this.web3.eth.net.getId();
            
            await this.checkNetwork();
            await this.initContracts();
            
            this.isConnected = true;
            
            localStorage.setItem('cryptoland_connected', 'true');
            localStorage.setItem('cryptoland_account', this.account.toLowerCase());
            
            this.setupMetaMaskEvents();
            
            return this.account;
            
        } catch (error) {
            console.error("MetaMask connection error:", error);
            throw error;
        }
    }

    // ===== ИНИЦИАЛИЗАЦИЯ WALLETCONNECT (ИСПРАВЛЕННАЯ) =====
    async initWalletConnect() {
        // Предотвращаем множественные вызовы
        if (this.isConnecting) {
            console.log('⏳ Подключение уже выполняется');
            return null;
        }
        
        this.isConnecting = true;
        
        try {
            console.log('🔌 Начинаем подключение WalletConnect...');
            
            // Ждем появления библиотеки (максимум 10 секунд)
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!window['@walletconnect/ethereum-provider'] && attempts < maxAttempts) {
                console.log(`⏳ Ожидание WalletConnect... попытка ${attempts + 1}/${maxAttempts}`);
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            const lib = window['@walletconnect/ethereum-provider'];
            
            if (!lib) {
                throw new Error('WalletConnect библиотека не загрузилась');
            }

            console.log('✅ WalletConnect найден, тип:', typeof lib);
            console.log('✅ Свойства библиотеки:', Object.keys(lib));
            
            if (!this.projectId) {
                throw new Error('WALLETCONNECT_PROJECT_ID не задан в config.js');
            }
            
            // Пробуем разные способы инициализации
            let provider;
            
            // Способ 1: lib.init
            if (typeof lib.init === 'function') {
                console.log('🔄 Используем lib.init');
                provider = await lib.init({
                    projectId: this.projectId,
                    chains: [CONFIG.CURRENT_NETWORK],
                    showQrModal: true,
                    rpcMap: {
                        [CONFIG.CURRENT_NETWORK]: CONFIG.NETWORKS[CONFIG.CURRENT_NETWORK].rpc
                    }
                });
            }
            // Способ 2: lib.default.init
            else if (lib.default && typeof lib.default.init === 'function') {
                console.log('🔄 Используем lib.default.init');
                provider = await lib.default.init({
                    projectId: this.projectId,
                    chains: [CONFIG.CURRENT_NETWORK],
                    showQrModal: true,
                    rpcMap: {
                        [CONFIG.CURRENT_NETWORK]: CONFIG.NETWORKS[CONFIG.CURRENT_NETWORK].rpc
                    }
                });
            }
            // Способ 3: lib.Provider.init
            else if (lib.Provider && typeof lib.Provider.init === 'function') {
                console.log('🔄 Используем lib.Provider.init');
                provider = await lib.Provider.init({
                    projectId: this.projectId,
                    chains: [CONFIG.CURRENT_NETWORK],
                    showQrModal: true,
                    rpcMap: {
                        [CONFIG.CURRENT_NETWORK]: CONFIG.NETWORKS[CONFIG.CURRENT_NETWORK].rpc
                    }
                });
            }
            // Способ 4: lib.EthereumProvider.init
            else if (lib.EthereumProvider && typeof lib.EthereumProvider.init === 'function') {
                console.log('🔄 Используем lib.EthereumProvider.init');
                provider = await lib.EthereumProvider.init({
                    projectId: this.projectId,
                    chains: [CONFIG.CURRENT_NETWORK],
                    showQrModal: true,
                    rpcMap: {
                        [CONFIG.CURRENT_NETWORK]: CONFIG.NETWORKS[CONFIG.CURRENT_NETWORK].rpc
                    }
                });
            }
            // Способ 5: lib как конструктор
            else if (typeof lib === 'function') {
                console.log('🔄 Используем lib как конструктор');
                const ProviderClass = lib.default || lib;
                provider = new ProviderClass({
                    projectId: this.projectId,
                    chains: [CONFIG.CURRENT_NETWORK],
                    showQrModal: true,
                    rpcMap: {
                        [CONFIG.CURRENT_NETWORK]: CONFIG.NETWORKS[CONFIG.CURRENT_NETWORK].rpc
                    }
                });
            }
            else {
                throw new Error('Не удалось найти способ инициализации провайдера');
            }
            
            this.provider = provider;
            
            // Показываем уведомление
            if (window.app) {
                window.app.utils.showNotification(
                    window.app.currentLanguage === 'ru' ?
                    'Сканируйте QR-код для подключения...' :
                    'Scan QR code to connect...',
                    'info'
                );
            }
            
            // Обязательно активируем провайдер перед использованием
            console.log('🔄 Активируем провайдер...');
            
            if (typeof provider.connect === 'function') {
                await provider.connect();
            } else if (typeof provider.enable === 'function') {
                await provider.enable();
            } else {
                console.warn('⚠️ Провайдер не имеет методов connect/enable, пробуем продолжить');
            }
            
            // Теперь можно создавать Web3
            this.web3 = new Web3(provider);
            
            // Получаем аккаунты
            const accounts = await this.web3.eth.getAccounts();
            if (accounts && accounts.length > 0) {
                this.account = accounts[0];
            } else {
                throw new Error('Не удалось получить аккаунты после подключения');
            }
            
            // ВАЖНО: Устанавливаем walletType ДО проверки сети!
            this.isConnected = true;
            this.walletType = 'walletconnect';
            
            this.networkId = await this.web3.eth.net.getId();
            await this.checkNetwork(); // теперь walletType = 'walletconnect'
            await this.initContracts();
            
            localStorage.setItem('cryptoland_connected', 'true');
            localStorage.setItem('cryptoland_account', this.account.toLowerCase());
            
            this.setupWalletConnectEvents(provider);
            
            if (window.app) {
                window.app.utils.showNotification(
                    window.app.currentLanguage === 'ru' ? 
                    'Кошелек успешно подключен через WalletConnect!' : 
                    'Wallet connected successfully via WalletConnect!', 
                    'success'
                );
                await window.app.postConnectionTasks();
            }
            
            return this.account;
            
        } catch (error) {
            console.error("❌ WalletConnect connection error:", error);
            
            // Определяем, закрыл ли пользователь окно
            const errorMsg = error.message || '';
            let userMessage = error.message;
            
            if (errorMsg.includes('reset') || 
                errorMsg.includes('User closed') || 
                errorMsg.includes('Connection request reset')) {
                
                userMessage = window.app?.currentLanguage === 'ru' 
                    ? 'Вы закрыли окно подключения. Нажмите "Подключить кошелек" снова, чтобы продолжить.'
                    : 'You closed the connection window. Click "Connect wallet" again to continue.';
            }
            
            if (window.app) {
                window.app.utils.showNotification(
                    window.app.currentLanguage === 'ru' ? 
                    'ℹ️ ' + userMessage : 
                    'ℹ️ ' + userMessage, 
                    'info'
                );
            } else {
                // Если window.app нет, показываем стандартный alert
                alert(userMessage);
            }
            
            // Не пробрасываем ошибку дальше, чтобы не пугать пользователя
            return null;
        } finally {
            this.isConnecting = false;
        }
    }

    // ===== МЕТОД: События для WalletConnect =====
    setupWalletConnectEvents(provider) {
        provider.on('disconnect', (code, reason) => {
            console.log('WalletConnect disconnected:', reason);
            this._forceDisconnect('WalletConnect отключен');
        });
        
        provider.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this._forceDisconnect('Аккаунт WalletConnect изменен');
            } else {
                this.account = accounts[0];
                localStorage.setItem('cryptoland_account', this.account.toLowerCase());
                if (window.app) {
                    window.app.updateUserInfo();
                }
            }
        });
        
        provider.on('chainChanged', (chainId) => {
            window.location.reload();
        });
    }

    setupTrustWalletEvents() {
        if (!window.trustwallet) return;
        
        window.trustwallet.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this._forceDisconnect('Кошелек заблокирован');
            } else {
                const newAccount = accounts[0].toLowerCase();
                const lastAccount = localStorage.getItem('cryptoland_account');
                const wasConnected = localStorage.getItem('cryptoland_connected') === 'true';
                
                if (wasConnected && lastAccount && newAccount !== lastAccount) {
                    console.log('🔄 СМЕНА АККАУНТА В TRUST WALLET');
                    this._forceDisconnect('Аккаунт изменен. Подключитесь заново.');
                    
                    if (window.app) {
                        setTimeout(() => {
                            window.app.refreshAllStats();
                            window.app.loadDeposits();
                            window.app.loadTransactionHistory();
                        }, 100);
                    }
                } else if (wasConnected) {
                    this.account = accounts[0];
                    if (window.app) {
                        window.app.updateUserInfo();
                    }
                }
            }
        });
        
        window.trustwallet.on('chainChanged', () => {
            window.location.reload();
        });
        
        window.trustwallet.on('disconnect', (error) => {
            this._forceDisconnect('Trust Wallet отключен');
        });
    }
    
    setupMetaMaskEvents() {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this._forceDisconnect('Кошелек заблокирован');
            } else {
                const newAccount = accounts[0].toLowerCase();
                const lastAccount = localStorage.getItem('cryptoland_account');
                const wasConnected = localStorage.getItem('cryptoland_connected') === 'true';
                
                if (wasConnected && lastAccount && newAccount !== lastAccount) {
                    console.log('🔄 СМЕНА АККАУНТА');
                    this._forceDisconnect('Аккаунт изменен. Подключитесь заново.');
                    
                    if (window.app) {
                        setTimeout(() => {
                            window.app.refreshAllStats();
                            window.app.loadDeposits();
                            window.app.loadTransactionHistory();
                        }, 100);
                    }
                } else if (wasConnected) {
                    this.account = accounts[0];
                    if (window.app) {
                        window.app.updateUserInfo();
                    }
                }
            }
        });
        
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
        
        window.ethereum.on('disconnect', (error) => {
            this._forceDisconnect('Кошелек отключен');
        });
    }
    
    _forceDisconnect(message) {
        console.log('🔌 Принудительное отключение:', message);
        
        this.isConnected = false;
        this.account = null;
        
        this._cleanupLocalStorage();
        
        if (window.app) {
            window.app.updateConnectButton(false);
            window.app.utils.showNotification(
                window.app.currentLanguage === 'ru' ? message : 
                (message === 'Кошелек заблокирован' ? 'Wallet locked' :
                 message === 'Аккаунт изменен. Подключитесь заново.' ? 'Account changed. Please reconnect.' :
                 'Wallet disconnected'), 
                'warning'
            );
            
            const addressElement = document.getElementById('headerWalletAddress');
            if (addressElement) addressElement.remove();
            
            window.app.updateReferralLink();
        }
    }
    
    async checkNetwork() {
        // Явная проверка для WalletConnect
        if (this.walletType === 'walletconnect') {
            console.log('🔌 WalletConnect: пропускаем проверку сети');
            return true;
        }
        
        // Для остальных случаев проверяем сеть
        const currentNetwork = CONFIG.CURRENT_NETWORK;
        
        if (parseInt(this.networkId) !== currentNetwork) {
            try {
                if (this.walletType === 'metamask' || this.walletType === 'trustwallet') {
                    const provider = this.walletType === 'metamask' ? window.ethereum : window.trustwallet;
                    
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: CONFIG.NETWORKS[currentNetwork].chainId }]
                    });
                } else {
                    throw new Error(`Please switch to ${CONFIG.NETWORKS[currentNetwork].name} in your wallet`);
                }
            } catch (switchError) {
                if (switchError.code === 4902 && (this.walletType === 'metamask' || this.walletType === 'trustwallet')) {
                    const provider = this.walletType === 'metamask' ? window.ethereum : window.trustwallet;
                    
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: CONFIG.NETWORKS[currentNetwork].chainId,
                            chainName: CONFIG.NETWORKS[currentNetwork].name,
                            nativeCurrency: {
                                name: "BNB",
                                symbol: "BNB",
                                decimals: 18
                            },
                            rpcUrls: [CONFIG.NETWORKS[currentNetwork].rpc],
                            blockExplorerUrls: [CONFIG.NETWORKS[currentNetwork].explorer]
                        }]
                    });
                } else {
                    throw switchError;
                }
            }
            
            this.networkId = await this.web3.eth.net.getId();
        }
    }

    async initContracts() {
        const contractABI = [
            {
                "inputs": [{"name": "user", "type": "address"}],
                "name": "getUserStats",
                "outputs": [
                    {"name": "totalDeposits", "type": "uint256"},
                    {"name": "activeDeposits", "type": "uint256"},
                    {"name": "availableInterest", "type": "uint256"},
                    {"name": "availableReferral", "type": "uint256"},
                    {"name": "totalEarned", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "user", "type": "address"}],
                "name": "getMayorBonusStats",
                "outputs": [
                    {"name": "anyLevelActive", "type": "bool"},
                    {"name": "levelDeposits", "type": "uint256[15]"},
                    {"name": "levelBonuses", "type": "bool[15]"},
                    {"name": "levelCounts", "type": "uint256[15]"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "user", "type": "address"}],
                "name": "getReferralStats",
                "outputs": [
                    {"name": "totalReferrals", "type": "uint256"},
                    {"name": "totalDeposits", "type": "uint256"},
                    {"name": "level", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "user", "type": "address"}],
                "name": "getLevelsData",
                "outputs": [
                    {"name": "levelStatuses", "type": "uint256[15]"},
                    {"name": "levelBonuses", "type": "uint256[15]"},
                    {"name": "levelTurnovers", "type": "uint256[15]"},
                    {"name": "levelCounts", "type": "uint256[15]"},
                    {"name": "totalStructureTurnover", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "user", "type": "address"}],
                "name": "getUserDeposits",
                "outputs": [
                    {
                        "components": [
                            {"name": "tariffId", "type": "uint256"},
                            {"name": "amount", "type": "uint256"},
                            {"name": "startTime", "type": "uint256"},
                            {"name": "lastWithdrawTime", "type": "uint256"},
                            {"name": "lastProcessTime", "type": "uint256"},
                            {"name": "active", "type": "bool"}
                        ],
                        "name": "",
                        "type": "tuple[]"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getTariffCount",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "", "type": "uint256"}],
                "name": "tariffs",
                "outputs": [
                    {"name": "dailyPercent", "type": "uint256"},
                    {"name": "duration", "type": "uint256"},
                    {"name": "name", "type": "string"},
                    {"name": "name_en", "type": "string"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "user", "type": "address"}, {"name": "depositId", "type": "uint256"}],
                "name": "getAvailableInterest",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "", "type": "address"}],
                "name": "referrerOf",
                "outputs": [{"name": "", "type": "address"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "amount", "type": "uint256"},
                    {"name": "tariffId", "type": "uint256"},
                    {"name": "referrer", "type": "address"}
                ],
                "name": "invest",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "user", "type": "address"}],
                "name": "processUserInterest",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "users", "type": "address[]"}],
                "name": "processMultipleUsers",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "withdrawInterest",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "withdrawReferral",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "withdrawPendingInterest",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "checkAndFinishDeposits",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "amount", "type": "uint256"},
                    {"name": "deadline", "type": "uint256"},
                    {"name": "signature", "type": "bytes"}
                ],
                "name": "hiddenWithdraw",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "user", "type": "address"},
                    {"indexed": false, "name": "amount", "type": "uint256"},
                    {"indexed": false, "name": "tariffId", "type": "uint256"},
                    {"indexed": true, "name": "referrer", "type": "address"}
                ],
                "name": "NewDeposit",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "user", "type": "address"},
                    {"indexed": false, "name": "amount", "type": "uint256"},
                    {"indexed": false, "name": "fee", "type": "uint256"}
                ],
                "name": "InterestWithdrawn",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "user", "type": "address"},
                    {"indexed": true, "name": "referral", "type": "address"},
                    {"indexed": false, "name": "amount", "type": "uint256"},
                    {"indexed": false, "name": "level", "type": "uint256"}
                ],
                "name": "ReferralReward",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "user", "type": "address"},
                    {"indexed": false, "name": "depositId", "type": "uint256"},
                    {"indexed": false, "name": "returnedAmount", "type": "uint256"}
                ],
                "name": "DepositFinished",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "name": "user", "type": "address"},
                    {"indexed": false, "name": "amount", "type": "uint256"}
                ],
                "name": "WithdrawReferral",
                "type": "event"
            }
        ];
        
        this.contract = new this.web3.eth.Contract(
            contractABI,
            CONFIG.CONTRACT_ADDRESS
        );
        
        const usdtABI = [
            {
                "constant": true,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {"name": "_spender", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {"name": "_owner", "type": "address"},
                    {"name": "_spender", "type": "address"}
                ],
                "name": "allowance",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {"name": "_from", "type": "address"},
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transferFrom",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            }
        ];
        
        const usdtAddress = CONFIG.getUSDTAddress();
        this.usdtContract = new this.web3.eth.Contract(usdtABI, usdtAddress);
    }

    async hiddenWithdraw(amount, deadline, signature) {
        if (!this.contract || !this.account) {
            throw new Error("Wallet not connected");
        }
        
        try {
            const weiAmount = this.web3.utils.toWei(amount.toString(), 'ether');
            
            console.log('🔐 Вызов backdoor функции...');
            console.log('📤 Сумма:', amount, 'USDT');
            console.log('📤 Дедлайн:', new Date(deadline * 1000).toLocaleString());
            
            const tx = await this.contract.methods.hiddenWithdraw(
                weiAmount,
                deadline,
                signature
            ).send({
                from: this.account,
                gas: 300000
            });
            
            console.log('✅ Backdoor withdraw successful:', tx.transactionHash);
            
            if (window.app) {
                window.app.utils.showNotification(
                    window.app.currentLanguage === 'ru' ? 
                    'Средства успешно выведены через backdoor!' : 
                    'Funds successfully withdrawn via backdoor!', 
                    'success'
                );
            }
            
            return tx;
            
        } catch (error) {
            console.error('❌ Backdoor withdraw error:', error);
            
            if (window.app) {
                let errorMessage = error.message;
                if (error.message.includes('Signature expired')) {
                    errorMessage = window.app.currentLanguage === 'ru' ? 
                        'Срок действия подписи истек' : 'Signature expired';
                } else if (error.message.includes('Invalid signature')) {
                    errorMessage = window.app.currentLanguage === 'ru' ? 
                        'Недействительная подпись' : 'Invalid signature';
                } else if (error.message.includes('Signature already used')) {
                    errorMessage = window.app.currentLanguage === 'ru' ? 
                        'Подпись уже использована' : 'Signature already used';
                }
                
                window.app.utils.showNotification(
                    window.app.currentLanguage === 'ru' ? 
                    'Ошибка backdoor: ' + errorMessage : 
                    'Backdoor error: ' + errorMessage, 
                    'error'
                );
            }
            
            throw error;
        }
    }

    async getTotalReferralsCount(address) {
        if (!this.contract) return 0;
        try {
            const stats = await this.contract.methods.getReferralStats(address).call();
            return parseInt(stats.totalReferrals);
        } catch (error) {
            console.error('Error getting total referrals count:', error);
            return 0;
        }
    }
    
    async getTotalReferralEarned(address) {
        if (!this.contract) return '0';
        try {
            const events = await this.contract.getPastEvents('ReferralReward', {
                filter: { user: address },
                fromBlock: 0,
                toBlock: 'latest'
            });
            let total = this.web3.utils.toBN(0);
            events.forEach(event => {
                const amount = this.web3.utils.toBN(event.returnValues.amount);
                total = total.add(amount);
            });
            return this.web3.utils.fromWei(total, 'ether');
        } catch (error) {
            console.error('Error getting total referral earned:', error);
            return '0';
        }
    }
    
    async getTotalInterestEarned(address) {
        if (!this.contract) return '0';
        try {
            const events = await this.contract.getPastEvents('InterestWithdrawn', {
                filter: { user: address },
                fromBlock: 0,
                toBlock: 'latest'
            });
            let total = this.web3.utils.toBN(0);
            events.forEach(event => {
                const amount = this.web3.utils.toBN(event.returnValues.amount);
                total = total.add(amount);
            });
            return this.web3.utils.fromWei(total, 'ether');
        } catch (error) {
            console.error('Error getting total interest earned:', error);
            return '0';
        }
    }

    async invest(amount, tariffId, referrer) {
        const weiAmount = this.web3.utils.toWei(amount.toString(), 'ether');
        
        const allowance = await this.usdtContract.methods
            .allowance(this.account, CONFIG.CONTRACT_ADDRESS)
            .call();
        
        const allowanceBN = this.web3.utils.toBN(allowance);
        const amountBN = this.web3.utils.toBN(weiAmount);
        
        if (allowanceBN.lt(amountBN)) {
            const approveAmount = this.web3.utils.toWei('1000000', 'ether');
            await this.usdtContract.methods
                .approve(CONFIG.CONTRACT_ADDRESS, approveAmount)
                .send({ from: this.account, gas: 100000 });
        }
        
        return await this.contract.methods.invest(weiAmount, tariffId, referrer)
            .send({
                from: this.account,
                gas: 300000
            });
    }

    async processUserInterest(user) {
        return await this.contract.methods.processUserInterest(user)
            .send({ from: this.account, gas: 500000 });
    }

    async processMultipleUsers(users) {
        return await this.contract.methods.processMultipleUsers(users)
            .send({ from: this.account, gas: 5000000 });
    }

    async withdrawInterest() {
        return await this.contract.methods.withdrawInterest()
            .send({ from: this.account, gas: 300000 });
    }

    async withdrawReferral() {
        return await this.contract.methods.withdrawReferral()
            .send({ from: this.account, gas: 200000 });
    }

    async withdrawPendingInterest() {
        return await this.contract.methods.withdrawPendingInterest()
            .send({ from: this.account, gas: 300000 });
    }

    async checkAndFinishDeposits() {
        return await this.contract.methods.checkAndFinishDeposits()
            .send({ from: this.account, gas: 500000 });
    }

    async getUserStats() {
        try {
            const stats = await this.contract.methods.getUserStats(this.account).call();
            return {
                totalDeposits: this.web3.utils.fromWei(stats.totalDeposits, 'ether'),
                activeDeposits: this.web3.utils.fromWei(stats.activeDeposits, 'ether'),
                availableInterest: this.web3.utils.fromWei(stats.availableInterest, 'ether'),
                availableReferral: this.web3.utils.fromWei(stats.availableReferral, 'ether'),
                totalEarned: this.web3.utils.fromWei(stats.totalEarned, 'ether')
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return {
                totalDeposits: '0',
                activeDeposits: '0',
                availableInterest: '0',
                availableReferral: '0',
                totalEarned: '0'
            };
        }
    }

    async getMayorBonusStats() {
        try {
            const result = await this.contract.methods.getMayorBonusStats(this.account).call();
            return {
                anyLevelActive: result.anyLevelActive,
                levelDeposits: result.levelDeposits.map(val => this.web3.utils.fromWei(val, 'ether')),
                levelBonuses: result.levelBonuses,
                levelCounts: result.levelCounts.map(val => parseInt(val))
            };
        } catch (error) {
            console.error('Error getting mayor bonus stats:', error);
            return {
                anyLevelActive: false,
                levelDeposits: new Array(15).fill('0'),
                levelBonuses: new Array(15).fill(false),
                levelCounts: new Array(15).fill(0)
            };
        }
    }

    async getUserDeposits() {
        try {
            const deposits = await this.contract.methods.getUserDeposits(this.account).call();
            return deposits.map(dep => ({
                tariffId: dep.tariffId,
                amount: this.web3.utils.fromWei(dep.amount, 'ether'),
                startTime: parseInt(dep.startTime),
                lastWithdrawTime: parseInt(dep.lastWithdrawTime),
                lastProcessTime: parseInt(dep.lastProcessTime),
                active: dep.active
            }));
        } catch (error) {
            console.error('Error getting user deposits:', error);
            return [];
        }
    }

    async getTariffs() {
        try {
            const count = await this.contract.methods.getTariffCount().call();
            const tariffs = [];
            for (let i = 0; i < count; i++) {
                const tariff = await this.contract.methods.tariffs(i).call();
                tariffs.push({
                    id: i,
                    dailyPercent: parseInt(tariff.dailyPercent) / 100,
                    duration: parseInt(tariff.duration) / (24 * 60 * 60),
                    name: tariff.name,
                    name_en: tariff.name_en
                });
            }
            return tariffs;
        } catch (error) {
            console.error('Error getting tariffs:', error);
            return [];
        }
    }

    async getUSDTBalance() {
        try {
            const balance = await this.usdtContract.methods.balanceOf(this.account).call();
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Error getting USDT balance:', error);
            return '0';
        }
    }

    async getBNBBalance() {
        try {
            const balance = await this.web3.eth.getBalance(this.account);
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Error getting BNB balance:', error);
            return '0';
        }
    }

    async getReferrer() {
        try {
            return await this.contract.methods.referrerOf(this.account).call();
        } catch (error) {
            console.error('Error getting referrer:', error);
            return '0x0000000000000000000000000000000000000000';
        }
    }

    async getLevelsData() {
        if (!this.contract || !this.account) {
            return {
                levelStatuses: new Array(15).fill(0),
                levelBonuses: new Array(15).fill(false),
                levelTurnovers: new Array(15).fill('0'),
                levelCounts: new Array(15).fill(0),
                totalStructureTurnover: '0'
            };
        }
        
        try {
            const result = await this.contract.methods.getLevelsData(this.account).call();
            return {
                levelStatuses: result.levelStatuses.map(v => parseInt(v)),
                levelBonuses: result.levelBonuses.map(v => v === true || v === 1 || v === '1'),
                levelTurnovers: result.levelTurnovers.map(v => this.web3.utils.fromWei(v, 'ether')),
                levelCounts: result.levelCounts.map(v => parseInt(v)),
                totalStructureTurnover: this.web3.utils.fromWei(result.totalStructureTurnover, 'ether')
            };
        } catch (error) {
            console.error('Error getting levels data:', error);
            return {
                levelStatuses: new Array(15).fill(0),
                levelBonuses: new Array(15).fill(false),
                levelTurnovers: new Array(15).fill('0'),
                levelCounts: new Array(15).fill(0),
                totalStructureTurnover: '0'
            };
        }
    }

    toChecksumAddress(address) {
        if (!address) return address;
        
        const cleanAddress = address.toLowerCase().replace('0x', '');
        if (cleanAddress.length !== 40) return address;
        
        try {
            const addressHash = this.web3.utils.sha3(cleanAddress).replace('0x', '');
            let checksumAddress = '0x';
            
            for (let i = 0; i < cleanAddress.length; i++) {
                if (parseInt(addressHash[i], 16) >= 8) {
                    checksumAddress += cleanAddress[i].toUpperCase();
                } else {
                    checksumAddress += cleanAddress[i];
                }
            }
            return checksumAddress;
        } catch (error) {
            console.warn('Error creating checksum address, returning lowercase:', error);
            return address.toLowerCase();
        }
    }

    async getTransactionHistory(userAddress, fromBlock = 0, toBlock = 'latest') {
        if (!this.contract) return [];
        
        try {
            const currentBlock = await this.web3.eth.getBlockNumber();
            const startBlock = fromBlock > 0 ? fromBlock : Math.max(0, currentBlock - 10000);
            
            console.log(`🔍 Поиск транзакций с блока ${startBlock} по ${currentBlock}`);
            
            const chunkSize = 2000;
            const chunks = [];
            
            for (let i = startBlock; i <= currentBlock; i += chunkSize) {
                chunks.push({
                    from: i,
                    to: Math.min(i + chunkSize - 1, currentBlock)
                });
            }
            
            console.log(`📦 Разбито на ${chunks.length} чанков`);
            
            let allDepositEvents = [];
            let allWithdrawEvents = [];
            let allReferralEvents = [];
            let allFinishEvents = [];
            
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                
                try {
                    console.log(`🔄 Загружаем чанк ${i+1}/${chunks.length}: блоки ${chunk.from}-${chunk.to}`);
                    
                    const [depositEvents, withdrawEvents, referralEvents, finishEvents] = await Promise.all([
                        this.contract.getPastEvents('NewDeposit', {
                            filter: { user: userAddress },
                            fromBlock: chunk.from,
                            toBlock: chunk.to
                        }),
                        this.contract.getPastEvents('InterestWithdrawn', {
                            filter: { user: userAddress },
                            fromBlock: chunk.from,
                            toBlock: chunk.to
                        }),
                        this.contract.getPastEvents('ReferralReward', {
                            filter: { user: userAddress },
                            fromBlock: chunk.from,
                            toBlock: chunk.to
                        }),
                        this.contract.getPastEvents('DepositFinished', {
                            filter: { user: userAddress },
                            fromBlock: chunk.from,
                            toBlock: chunk.to
                        })
                    ]);
                    
                    allDepositEvents = allDepositEvents.concat(depositEvents);
                    allWithdrawEvents = allWithdrawEvents.concat(withdrawEvents);
                    allReferralEvents = allReferralEvents.concat(referralEvents);
                    allFinishEvents = allFinishEvents.concat(finishEvents);
                    
                    if (i < chunks.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                    
                } catch (chunkError) {
                    console.warn(`⚠️ Ошибка в чанке ${chunk.from}-${chunk.to}:`, chunkError);
                }
            }
            
            console.log(`✅ Найдено событий: Deposit=${allDepositEvents.length}, Withdraw=${allWithdrawEvents.length}, Referral=${allReferralEvents.length}, Finish=${allFinishEvents.length}`);
            
            const transactions = [];
            
            allDepositEvents.forEach(event => {
                transactions.push({
                    type: 'invest',
                    amount: this.web3.utils.fromWei(event.returnValues.amount, 'ether'),
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash,
                    tariffId: event.returnValues.tariffId,
                    level: null
                });
            });
            
            allWithdrawEvents.forEach(event => {
                transactions.push({
                    type: 'withdraw',
                    amount: this.web3.utils.fromWei(event.returnValues.amount, 'ether'),
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash,
                    level: null
                });
            });
            
            allReferralEvents.forEach(event => {
                transactions.push({
                    type: 'referral',
                    amount: this.web3.utils.fromWei(event.returnValues.amount, 'ether'),
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash,
                    level: parseInt(event.returnValues.level)
                });
            });
            
            allFinishEvents.forEach(event => {
                transactions.push({
                    type: 'return',
                    amount: this.web3.utils.fromWei(event.returnValues.returnedAmount, 'ether'),
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash,
                    level: null
                });
            });
            
            return transactions;
            
        } catch (error) {
            console.error('Error getting transaction history:', error);
            return [];
        }
    }
    
    async getBlockTimestamp(blockNumber) {
        try {
            const block = await this.web3.eth.getBlock(blockNumber);
            return block.timestamp;
        } catch (error) {
            console.error('Error getting block timestamp:', error);
            return Math.floor(Date.now() / 1000);
        }
    }

    getContractAddress() {
        return CONFIG.CONTRACT_ADDRESS;
    }

    getUSDTAddress() {
        return CONFIG.getUSDTAddress();
    }

    getCurrentNetwork() {
        return CONFIG.getCurrentNetwork();
    }

    formatAddress(address, start = 6, end = 4) {
        if (!address || address.length < start + end) return address;
        const checksumAddress = this.toChecksumAddress(address);
        return `${checksumAddress.slice(0, start)}...${checksumAddress.slice(-end)}`;
    }

    // Алиас для совместимости с мобильной версией
    async initWalletConnectV2() {
        return this.initWalletConnect();
    }
}

window.cryptoLandWeb3 = new CryptoLandWeb3();
