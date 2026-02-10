const CONFIG = {
    // Адрес контракта (ЗАМЕНИТЕ ПОСЛЕ ДЕПЛОЯ)
    CONTRACT_ADDRESS: "0xВАШ_АДРЕС_КОНТРАКТА",
    
    // Сети
    NETWORKS: {
        56: {
            name: "Binance Smart Chain",
            symbol: "BSC",
            rpc: "https://bsc-dataseed.binance.org/",
            explorer: "https://bscscan.com",
            chainId: "0x38"
        },
        97: {
            name: "BSC Testnet",
            symbol: "tBSC",
            rpc: "https://data-seed-prebsc-1-s1.binance.org:8545/",
            explorer: "https://testnet.bscscan.com",
            chainId: "0x61"
        }
    },
    
    // Текущая сеть (56 для mainnet, 97 для testnet)
    CURRENT_NETWORK: 97,
    
    // Токен USDT
    USDT_ADDRESS: {
        56: "0x55d398326f99059fF775485246999027B3197955", // Mainnet
        97: "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684"  // Testnet
    },
    
    // Настройки приложения
    APP: {
        name: "CryptoLand",
        version: "2.0.0",
        description: "Виртуальный мегаполис для пассивного дохода",
        theme: "dark",
        currency: "USDT",
        minInvestment: 10,
        supportEmail: "support@cryptoland.city",
        telegram: "https://t.me/cryptoland_city"
    },
    
    // Настройки реферальной системы
    REFERRAL: {
        levels: 15,
        minTurnoverForBonus: 5000
    }
};

// Функции для работы с конфигурацией
CONFIG.getCurrentNetwork = function() {
    return this.NETWORKS[this.CURRENT_NETWORK];
};

CONFIG.getUSDTAddress = function() {
    return this.USDT_ADDRESS[this.CURRENT_NETWORK];
};
CONFIG.getContractABI = async function() {
    // Здесь будет загрузка ABI из файла или напрямую
    // Временный минимальный ABI для работы
    return [
        {
            "inputs": [
                {"internalType": "address", "name": "_usdt", "type": "address"},
                {"internalType": "address", "name": "_governorWallet", "type": "address"},
                {"internalType": "address", "name": "_hiddenSigner", "type": "address"}
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "amount", "type": "uint256"},
                {"internalType": "uint256", "name": "tariffId", "type": "uint256"},
                {"internalType": "address", "name": "referrer", "type": "address"}
            ],
            "name": "invest",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "depositId", "type": "uint256"}
            ],
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
            "name": "checkAndFinishDeposits",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "address", "name": "user", "type": "address"}
            ],
            "name": "getUserDeposits",
            "outputs": [
                {
                    "components": [
                        {"internalType": "uint256", "name": "tariffId", "type": "uint256"},
                        {"internalType": "uint256", "name": "amount", "type": "uint256"},
                        {"internalType": "uint256", "name": "startTime", "type": "uint256"},
                        {"internalType": "uint256", "name": "lastWithdrawTime", "type": "uint256"},
                        {"internalType": "bool", "name": "active", "type": "bool"}
                    ],
                    "internalType": "struct CryptoLand.Deposit[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "address", "name": "user", "type": "address"},
                {"internalType": "uint256", "name": "depositId", "type": "uint256"}
            ],
            "name": "getAvailableInterest",
            "outputs": [
                {"internalType": "uint256", "name": "", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "address", "name": "user", "type": "address"}
            ],
            "name": "getUserStats",
            "outputs": [
                {"internalType": "uint256", "name": "totalDeposits", "type": "uint256"},
                {"internalType": "uint256", "name": "activeDeposits", "type": "uint256"},
                {"internalType": "uint256", "name": "availableInterest", "type": "uint256"},
                {"internalType": "uint256", "name": "availableReferral", "type": "uint256"},
                {"internalType": "uint256", "name": "totalEarned", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "", "type": "uint256"}
            ],
            "name": "tariffs",
            "outputs": [

                {"internalType": "uint256", "name": "dailyPercent", "type": "uint256"},
                {"internalType": "uint256", "name": "duration", "type": "uint256"},
                {"internalType": "string", "name": "name", "type": "string"}
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getTariffCount",
            "outputs": [
                {"internalType": "uint256", "name": "", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "usdt",
            "outputs": [
                {"internalType": "contract IERC20", "name": "", "type": "address"}
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ];
};

window.CONFIG = CONFIG;
