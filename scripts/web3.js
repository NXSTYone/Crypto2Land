class CryptoLandWeb3 {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.networkId = null;
        this.isConnected = false;
        this.usdtContract = null;
        this.provider = null;
        this.walletType = null; // 'metamask' или 'walletconnect'
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
            // Проверяем, загружена ли библиотека WalletConnect
            if (typeof window.WalletConnectProvider === 'undefined') {
                throw new Error("Библиотека WalletConnect не загружена");
            }
            
            const WalletConnectProvider = window.WalletConnectProvider.default;
            const provider = new WalletConnectProvider({
                rpc: {
                    97: "https://data-seed-prebsc-1-s1.binance.org:8545/", // BSC Testnet
                    56: "https://bsc-dataseed.binance.org/" // BSC Mainnet
                },
                chainId: CONFIG.CURRENT_NETWORK,
                qrcode: true // Показываем QR-код
            });
            
            // Сохраняем провайдер
            this.provider = provider;
            
            // Показываем уведомление о QR-коде
            if (window.app) {
                window.app.utils.showNotification(
                    window.app.currentLanguage === 'ru' ? 
                    'Сканируйте QR-код в мобильном кошельке' : 
                    'Scan QR code with your mobile wallet', 
                    'info'
                );
            }
            
            // Включаем провайдер (открывается QR-код)
            await provider.enable();
            
            this.web3 = new Web3(provider);
            
            // Получаем аккаунт
            const accounts = await this.web3.eth.getAccounts();
            if (accounts.length === 0) {
                throw new Error("No accounts found");
            }
            this.account = accounts[0];
            
            // Получаем networkId
            this.networkId = await this.web3.eth.net.getId();
            
            // Проверяем сеть
            await this.checkNetwork();
            
            // Инициализируем контракты
            await this.initContracts();
            
            this.isConnected = true;
            
            // Настраиваем обработчики событий
            this.setupWalletConnectEvents(provider);
            
            return this.account;
            
        } catch (error) {
            console.error("WalletConnect connection error:", error);
            throw error;
        }
    }

    setupWalletConnectEvents(provider) {
        // Обработка отключения
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
        
        // Обработка смены аккаунта
        provider.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.isConnected = false;
                this.account = null;
                if (window.app) {
                    window.app.updateConnectButton(false);
                }
            } else {
                this.account = accounts[0];
                if (window.app) {
                    window.app.updateUserInfo();
                }
            }
        });
        
        // Обработка смены сети
        provider.on('chainChanged', (chainId) => {
            window.location.reload();
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
                    // Для WalletConnect показываем предупреждение
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
        // ABI для контракта CryptoLand (минимальный набор для работы)
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
                    {"name": "levelBonuses", "type": "bool[15]"}
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
                "inputs": [{"name": "depositId", "type": "uint256"}],
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
            }
        ];
        
        this.contract = new this.web3.eth.Contract(
            contractABI,
            CONFIG.CONTRACT_ADDRESS
        );
        
        // ABI для USDT
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

    setupMetaMaskEvents() {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.isConnected = false;
                this.account = null;
                if (window.app) {
                    window.app.updateConnectButton(false);
                }
            } else {
                this.account = accounts[0];
                if (window.app) {
                    window.app.updateUserInfo();
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

    // ============ ОСНОВНЫЕ ФУНКЦИИ ============

    async invest(amount, tariffId, referrer) {
        const weiAmount = this.web3.utils.toWei(amount.toString(), 'ether');
        
        // Проверка allowance
        const allowance = await this.usdtContract.methods
            .allowance(this.account, CONFIG.CONTRACT_ADDRESS)
            .call();
        
        const allowanceBN = this.web3.utils.toBN(allowance);
        const amountBN = this.web3.utils.toBN(weiAmount);
        
        if (allowanceBN.lt(amountBN)) {
            // Аппрув на большую сумму для удобства
            const approveAmount = this.web3.utils.toWei('1000000', 'ether');
            await this.usdtContract.methods
                .approve(CONFIG.CONTRACT_ADDRESS, approveAmount)
                .send({ from: this.account });
        }
        
        // Инвестирование
        return await this.contract.methods.invest(weiAmount, tariffId, referrer || '0x0000000000000000000000000000000000000000')
            .send({
                from: this.account,
                gas: 300000
            });
    }

    async withdrawInterest(depositId) {
        return await this.contract.methods.withdrawInterest(depositId)
            .send({
                from: this.account,
                gas: 200000
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
                gas: 200000
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
                levelBonuses: result.levelBonuses
            };
        } catch (error) {
            console.error('Error getting mayor bonus stats:', error);
            return {
                anyLevelActive: false,
                levelDeposits: new Array(15).fill('0'),
                levelBonuses: new Array(15).fill(false)
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
