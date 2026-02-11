class CryptoLandWeb3 {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.networkId = null;
        this.isConnected = false;
        this.usdtContract = null;
    }

    async init() {
        if (window.ethereum) {
            this.web3 = new Web3(window.ethereum);
            await this.connect();
            return true;
        } else if (window.web3) {
            this.web3 = new Web3(window.web3.currentProvider);
            await this.connect();
            return true;
        } else {
            throw new Error("Установите MetaMask или Trust Wallet для использования приложения");
        }
    }

    async connect() {
        try {
            // Запрос доступа к аккаунтам
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            this.account = accounts[0];
            this.networkId = await this.web3.eth.net.getId();
            
            // Проверка сети
            await this.checkNetwork();
            
            // Инициализация контрактов
            await this.initContracts();
            
            this.isConnected = true;
            
            // События изменения
            this.setupEventListeners();
            
            return this.account;
            
        } catch (error) {
            console.error("Connection error:", error);
            throw error;
        }
    }

    async checkNetwork() {
        const currentNetwork = CONFIG.CURRENT_NETWORK;
        
        if (parseInt(this.networkId) !== currentNetwork) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: CONFIG.NETWORKS[currentNetwork].chainId }]
                });
            } catch (switchError) {
                // Если сеть не добавлена
                if (switchError.code === 4902) {
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
            
            // Обновление networkId после переключения
            this.networkId = await this.web3.eth.net.getId();
        }
    }


    async initContracts() {
        // Получение ABI
        const contractABI = await CONFIG.getContractABI();
        
        // Инициализация контракта CryptoLand
        this.contract = new this.web3.eth.Contract(
            contractABI,
            CONFIG.CONTRACT_ADDRESS
        );
        
        // Инициализация контракта USDT
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
                "outputs": [{"name": "success", "type": "bool"}],
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {"name": "_spender", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "success", "type": "bool"}],
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
                "outputs": [{"name": "success", "type": "bool"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {"name": "_owner", "type": "address"},
                    {"name": "_spender", "type": "address"}
                ],
                "name": "allowance",
                "outputs": [{"name": "remaining", "type": "uint256"}],
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

    setupEventListeners() {
        // Изменение аккаунта
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                // Пользователь отключил кошелек
                this.isConnected = false;
                this.account = null;
                window.location.reload();
            } else {
                this.account = accounts[0];
                if (window.app) {
                    window.app.updateUserInfo();
                }
            }
        });
        
        // Изменение сети
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
        
        // Отключение кошелька
        window.ethereum.on('disconnect', (error) => {
            console.log('Wallet disconnected:', error);
            this.isConnected = false;
            this.account = null;
            window.location.reload();
        });
    }


    // Основные функции контракта
    async invest(amount, tariffId, referrer) {
        const weiAmount = this.web3.utils.toWei(amount.toString(), 'ether');
        
        // Проверка allowance
        const allowance = await this.usdtContract.methods
            .allowance(this.account, CONFIG.CONTRACT_ADDRESS)
            .call();
        
        const allowanceBN = this.web3.utils.toBN(allowance);
        const amountBN = this.web3.utils.toBN(weiAmount);
        
        if (allowanceBN.lt(amountBN)) {
            // Нужно аппрувить
            const approveAmount = this.web3.utils.toWei('1000000', 'ether'); // Большое количество для аппрува
            await this.usdtContract.methods
                .approve(CONFIG.CONTRACT_ADDRESS, approveAmount)
                .send({ from: this.account });
        }
        
        // Инвестирование
        return await this.contract.methods.invest(weiAmount, tariffId, referrer)
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

    async checkAndFinishDeposits() {
        return await this.contract.methods.checkAndFinishDeposits()
            .send({
                from: this.account,
                gas: 300000
            });
    }

    // View функции
    async getUserDeposits() {
        return await this.contract.methods.getUserDeposits(this.account).call();
    }

    async getAvailableInterest(depositId) {
        return await this.contract.methods.getAvailableInterest(this.account, depositId).call();
    }

    async getUserStats() {
        try {
            const stats = await this.contract.methods.getUserStats(this.account).call();
            return {
                totalDeposits: this.web3.utils.fromWei(stats[0], 'ether'),
                activeDeposits: this.web3.utils.fromWei(stats[1], 'ether'),
                availableInterest: this.web3.utils.fromWei(stats[2], 'ether'),
                availableReferral: this.web3.utils.fromWei(stats[3], 'ether'),
                totalEarned: this.web3.utils.fromWei(stats[4], 'ether')
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

    async getTariffs() {
        try {
            const count = await this.contract.methods.getTariffCount().call();
            const tariffs = [];
            
            for (let i = 0; i < count; i++) {
                const tariff = await this.contract.methods.tariffs(i).call();
                tariffs.push({
                    id: i,
                    dailyPercent: tariff.dailyPercent / 100, // Конвертация из базисных пунктов
                    duration: tariff.duration / (24 * 60 * 60), // Конвертация из секунд в дни
                    name: tariff.name
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
            const decimals = await this.usdtContract.methods.decimals().call();
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

    // Вспомогательные функции
    async waitForTransaction(txHash) {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(async () => {
                try {
                    const receipt = await this.web3.eth.getTransactionReceipt(txHash);
                    if (receipt) {
                        clearInterval(checkInterval);
                        resolve(receipt);
                    }
                } catch (error) {
                    clearInterval(checkInterval);
                    reject(error);
                }
            }, 1000);
        });
    }

    async estimateGas(method, params = [], from = this.account) {
        try {
            const gas = await method(...params).estimateGas({ from });
            return Math.floor(gas * 1.2); // Добавляем 20% на всякий случай
        } catch (error) {
            console.error('Gas estimation error:', error);
            return 300000; // Возвращаем дефолтное значение
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
}

// Глобальный экземпляр
window.cryptoLandWeb3 = new CryptoLandWeb3();
