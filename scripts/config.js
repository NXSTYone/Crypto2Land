const CONFIG = {
    // Адрес контракта (ЗАМЕНИТЕ ПОСЛЕ ДЕПЛОЯ)
    CONTRACT_ADDRESS: "0xВАШ_АДРЕС_КОНТРАКТА",
    
    // СЕТИ
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
        56: "0x55d398326f99059fF775485246999027B3197955",
        97: "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684"
    },
    
    // СОЦИАЛЬНЫЕ ССЫЛКИ (КОНФИГУРИРУЕМЫЕ)
    SOCIAL: {
        TELEGRAM_SUPPORT: "https://t.me/CRYPTOLAND_SUPPORT", // ЗАМЕНИТЕ НА ВАШУ ССЫЛКУ
        TELEGRAM_CHANNEL: "https://t.me/CRYPTOLAND_CHANNEL", // ЗАМЕНИТЕ НА ВАШУ ССЫЛКУ
    },
    
    // Настройки приложения
    APP: {
        name: "CryptoLand",
        version: "2.0",
        description: "Виртуальный крипто-мегаполис",
        currency: "USDT",
        minInvestment: 10,
    },
    
    // Реферальная система
    REFERRAL: {
        levels: 15,
        minTurnoverForBonus: 5000
    },
    
    // ЛОГОТИП (настройки)
    LOGO: {
        useCustomLogo: true,           // true - использовать assets/logo.png, false - использовать иконку
        logoPath: "assets/logo.png",   // путь к логотипу
        fallbackIcon: "fas fa-city"    // иконка-заглушка
    }
};

CONFIG.getCurrentNetwork = function() {
    return this.NETWORKS[this.CURRENT_NETWORK];
};

CONFIG.getUSDTAddress = function() {
    return this.USDT_ADDRESS[this.CURRENT_NETWORK];
};

CONFIG.getContractABI = async function() {
    // Здесь будет ABI контракта
    return [];
};

window.CONFIG = CONFIG;