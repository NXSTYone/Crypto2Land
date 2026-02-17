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
    }

    async init(walletType = 'metamask') {
        this.walletType = walletType;
        
        if (walletType === 'metamask') {
            return this.initMetaMask();
        } else if (walletType === 'walletconnect' || walletType === 'trustwallet') {
            return this.initWalletConnect();
        } else {
            throw new Error("Unsupported wallet type");
        }
    }

    async initMetaMask() {
        if (window.ethereum) {
            this.web3 = new Web3(window.ethereum);
            await this.connectMetaMask();
            return true;
        } else if (window.web3) {
            this.web3 = new Web3(window.web3.currentProvider);
            await this.connectMetaMask();
            return true;
        } else {
            throw new Error("Установите MetaMask для использования приложения");
        }
    }

    async initWalletConnect() {
        try {
            if (typeof window.WalletConnectProvider === 'undefined') {
                throw new Error("Библиотека WalletConnect не загружена");
            }
            
            const WalletConnectProvider = window.WalletConnectProvider.default;
            const provider = new WalletConnectProvider({
                rpc: {
                    97: "https://data-seed-prebsc-1-s1.binance.org:8545/",
                    56: "https://bsc-dataseed.binance.org/"
                },
                chainId: CONFIG.CURRENT_NETWORK,
                qrcode: true
            });
            
            this.provider = provider;
            
            if (window.app) {
                window.app.utils.showNotification(
                    window.app.currentLanguage === 'ru' ? 
                    'Сканируйте QR-код в мобильном кошельке' : 
                    'Scan QR code with your mobile wallet', 
                    'info'
                );
            }
            
            await provider.enable();
            
            this.web3 = new Web3(provider);
            
            const accounts = await this.web3.eth.getAccounts();
            if (accounts.length === 0) {
                throw new Error("No accounts found");
            }
            this.account = accounts[0];
            
            this.networkId = await this.web3.eth.net.getId();
            
            await this.checkNetwork();
            await this.initContracts();
            
            this.isConnected = true;
            
            this.setupWalletConnectEvents(provider);
            
            return this.account;
            
        } catch (error) {
            console.error("WalletConnect connection error:", error);
            throw error;
        }
    }

    setupWalletConnectEvents(provider) {
        provider.on('disconnect', (code, reason) => {
            console.log('WalletConnect disconnected:', reason);
            this.isConnected = false;
            this.account = null;
            if (window.app) {
                window.app.updateConnectButton(false);
                window.app.utils.showNotification(
                    window.app.currentLanguage === 'ru' ? 'Кошелек отключен' : 'Wallet disconnected', 
                    'info'
                );
            }
        });
        
        provider.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.isConnected = false;
                this.account = null;
                if (window.app) {
                    window.app.updateConnectButton(false);
                }
            } else {
                const oldAccount = this.account;
                this.account = accounts[0];
                if (window.app) {
                    window.app.utils.showNotification(
                        window.app.currentLanguage === 'ru' ? 
                        `Аккаунт изменен: ${this.formatAddress(this.account)}` : 
                        `Account changed: ${this.formatAddress(this.account)}`, 
                        'info'
                    );
                    window.app.refreshAllStats();
                    
                    // Проверяем реферальную ссылку при смене аккаунта
                    const urlParams = new URLSearchParams(window.location.search);
                    const referrer = urlParams.get('ref');
                    if (referrer && referrer.toLowerCase() !== this.account.toLowerCase()) {
                        window.app.utils.showNotification(
                            window.app.currentLanguage === 'ru' ? 
                            'Реферальная ссылка не соответствует текущему аккаунту' : 
                            'Referral link does not match current account', 
                            'warning'
                        );
                    }
                }
            }
        });
        
        provider.on('chainChanged', (chainId) => {
            window.location.reload();
        });
    }
    
    setupMetaMaskEvents() {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.isConnected = false;
                this.account = null;
                if (window.app) {
                    window.app.updateConnectButton(false);
                }
            } else {
                const oldAccount = this.account;
                this.account = accounts[0];
                if (window.app) {
                    window.app.utils.showNotification(
                        window.app.currentLanguage === 'ru' ? 
                        `Аккаунт изменен: ${this.formatAddress(this.account)}` : 
                        `Account changed: ${this.formatAddress(this.account)}`, 
                        'info'
                    );
                    window.app.refreshAllStats();
                    
                    // Проверяем реферальную ссылку при смене аккаунта
                    const urlParams = new URLSearchParams(window.location.search);
                    const referrer = urlParams.get('ref');
                    if (referrer && referrer.toLowerCase() !== this.account.toLowerCase()) {
                        window.app.utils.showNotification(
                            window.app.currentLanguage === 'ru' ? 
                            'Реферальная ссылка не соответствует текущему аккаунту' : 
                            'Referral link does not match current account', 
                            'warning'
                        );
                    }
                }
            }
        });
        
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
        
        window.ethereum.on('disconnect', (error) => {
            console.log('Wallet disconnected:', error);
            this.isConnected = false;
            this.account = null;
            if (window.app) {
                window.app.updateConnectButton(false);
            }
        });
    }
    
    async connectMetaMask() {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            this.account = accounts[0];
            this.networkId = await this.web3.eth.net.getId();
            
            await this.checkNetwork();
            await this.initContracts();
            
            this.isConnected = true;
            this.setupMetaMaskEvents();
            
            return this.account;
            
        } catch (error) {
            console.error("MetaMask connection error:", error);
            throw error;
        }
    }

    // ===== НОВАЯ ФУНКЦИЯ ДЛЯ ПЕРЕКЛЮЧЕНИЯ АККАУНТА =====
    async switchToAccount(targetAccount) {
        if (!window.ethereum || this.walletType !== 'metamask') {
            console.log('Switch account only available for MetaMask');
            return false;
        }
        
        try {
            // Запрашиваем аккаунты снова
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            // Проверяем, есть ли целевой аккаунт в списке
            const targetLower = targetAccount.toLowerCase();
            const found = accounts.some(acc => acc.toLowerCase() === targetLower);
            
            if (found) {
                // В MetaMask нет прямого метода переключения, но мы можем попросить пользователя
                if (window.app) {
                    window.app.utils.showNotification(
                        window.app.currentLanguage === 'ru' ? 
                        `Пожалуйста, переключитесь на аккаунт ${this.formatAddress(targetAccount)} в MetaMask` : 
                        `Please switch to account ${this.formatAddress(targetAccount)} in MetaMask`, 
                        'warning'
                    );
                }
                return false;
            } else {
                if (window.app) {
                    window.app.utils.showNotification(
                        window.app.currentLanguage === 'ru' ? 
                        'Аккаунт не найден в MetaMask' : 
                        'Account not found in MetaMask', 
                        'error'
                    );
                }
                return false;
            }
        } catch (error) {
            console.error('Error switching account:', error);
            return false;
        }
    }

    async checkNetwork() {
        const currentNetwork = CONFIG.CURRENT_NETWORK;
        
        if (parseInt(this.networkId) !== currentNetwork) {
            try {
                if (this.walletType === 'metamask') {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: CONFIG.NETWORKS[currentNetwork].chainId }]
                    });
                } else {
                    throw new Error(`Please switch to ${CONFIG.NETWORKS[currentNetwork].name} in your wallet`);
                }
            } catch (switchError) {
                if (switchError.code === 4902 && this.walletType === 'metamask') {
                    await window.ethereum.request({
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
        // Полный ABI контракта с новыми функциями
        const contractABI = [
            // View functions
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
            // Write functions
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
            // События
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

    // ============ ИСПРАВЛЕННАЯ ФУНКЦИЯ ============
    
    /**
     * ПОЛУЧАЕТ ОБЩЕЕ КОЛИЧЕСТВО РЕФЕРАЛОВ ИЗ КОНТРАКТА (СУММА ПО УРОВНЯМ)
     */
    async getTotalReferralsCount(address) {
        if (!this.contract) return 0;
        
        try {
            // Используем функцию getReferralStats из контракта
            const stats = await this.contract.methods.getReferralStats(address).call();
            // totalReferrals - это ОБЩЕЕ количество рефералов (сумма по уровням)
            return parseInt(stats.totalReferrals);
        } catch (error) {
            console.error('Error getting total referrals count:', error);
            return 0;
        }
    }
    
    /**
     * Получает общую сумму всех полученных реферальных начислений
     */
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
    
    /**
     * Получает общую сумму всех полученных процентов
     */
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

    // ============ ОСНОВНЫЕ ФУНКЦИИ ============

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
                .send({ from: this.account });
        }
        
        return await this.contract.methods.invest(weiAmount, tariffId, referrer || '0x0000000000000000000000000000000000000000')
            .send({
                from: this.account,
                gas: 300000
            });
    }

    async processUserInterest(user) {
        return await this.contract.methods.processUserInterest(user)
            .send({
                from: this.account,
                gas: 500000
            });
    }

    async processMultipleUsers(users) {
        return await this.contract.methods.processMultipleUsers(users)
            .send({
                from: this.account,
                gas: 5000000
            });
    }

    async withdrawInterest() {
        return await this.contract.methods.withdrawInterest()
            .send({
                from: this.account,
                gas: 300000
            });
    }

    async withdrawReferral() {
        return await this.contract.methods.withdrawReferral()
            .send({
                from: this.account,
                gas: 200000
            });
    }

    async withdrawPendingInterest() {
        return await this.contract.methods.withdrawPendingInterest()
            .send({
                from: this.account,
                gas: 300000
            });
    }

    async checkAndFinishDeposits() {
        return await this.contract.methods.checkAndFinishDeposits()
            .send({
                from: this.account,
                gas: 500000
            });
    }

    // ============ VIEW ФУНКЦИИ ============

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

    // ============ ФУНКЦИИ ДЛЯ ИСТОРИИ ============
    
    async getTransactionHistory(userAddress, fromBlock = 0, toBlock = 'latest') {
        if (!this.contract) return [];
        
        try {
            const [depositEvents, withdrawEvents, referralEvents, finishEvents] = await Promise.all([
                this.contract.getPastEvents('NewDeposit', {
                    filter: { user: userAddress },
                    fromBlock,
                    toBlock
                }),
                this.contract.getPastEvents('InterestWithdrawn', {
                    filter: { user: userAddress },
                    fromBlock,
                    toBlock
                }),
                this.contract.getPastEvents('ReferralReward', {
                    filter: { user: userAddress },
                    fromBlock,
                    toBlock
                }),
                this.contract.getPastEvents('DepositFinished', {
                    filter: { user: userAddress },
                    fromBlock,
                    toBlock
                }),
                this.contract.getPastEvents('WithdrawReferral', {
                    filter: { user: userAddress },
                    fromBlock,
                    toBlock
                })
            ]);
            
            const transactions = [];
            
            depositEvents.forEach(event => {
                transactions.push({
                    type: 'invest',
                    amount: this.web3.utils.fromWei(event.returnValues.amount, 'ether'),
                    timestamp: event.blockNumber,
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash,
                    tariffId: event.returnValues.tariffId,
                    level: null
                });
            });
            
            withdrawEvents.forEach(event => {
                transactions.push({
                    type: 'withdraw',
                    amount: this.web3.utils.fromWei(event.returnValues.amount, 'ether'),
                    timestamp: event.blockNumber,
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash,
                    level: null
                });
            });
            
            referralEvents.forEach(event => {
                transactions.push({
                    type: 'referral',
                    amount: this.web3.utils.fromWei(event.returnValues.amount, 'ether'),
                    timestamp: event.blockNumber,
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash,
                    level: parseInt(event.returnValues.level)
                });
            });
            
            finishEvents.forEach(event => {
                transactions.push({
                    type: 'return',
                    amount: this.web3.utils.fromWei(event.returnValues.returnedAmount, 'ether'),
                    timestamp: event.blockNumber,
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

    // ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

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
        return `${address.slice(0, start)}...${address.slice(-end)}`;
    }
}

// Глобальный экземпляр
window.cryptoLandWeb3 = new CryptoLandWeb3();


