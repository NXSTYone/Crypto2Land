const CONFIG = {
    CONTRACT_ADDRESS: "0xВАШ_АДРЕС_КОНТРАКТА",
    
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
    
    CURRENT_NETWORK: 97,
    
    USDT_ADDRESS: {
        56: "0x55d398326f99059fF775485246999027B3197955",
        97: "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684"
    },
    
    // СОЦИАЛЬНЫЕ ССЫЛКИ
    SOCIAL: {
        TELEGRAM_SUPPORT: "https://t.me/CRYPTOLAND_SUPPORT",
        TELEGRAM_CHANNEL: "https://t.me/CRYPTOLAND_CHANNEL",
        TELEGRAM_GOVERNOR: "https://t.me/CRYPTOLAND_GOVERNOR_BOT"
    },
    
    // ФРАЗЫ МЭРА (10 ШТУК)
    MAYOR_PHRASES: [
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
    ],
    
    APP: {
        name: "CryptoLand",
        version: "2.0",
        description: "Виртуальный крипто-мегаполис",
        currency: "USDT",
        minInvestment: 10,
    },
    
    REFERRAL: {
        levels: 15,
        minTurnoverForBonus: 5000
    },
    
    LOGO: {
        useCustomLogo: true,
        logoPath: "assets/logo.png",
        fallbackIcon: "fas fa-city"
    },
    
    // НАСТРОЙКИ АВАТАРА
    AVATAR: {
        defaultAvatar: "assets/avatar-default.png",
        fallbackIcon: "fas fa-user-tie"
    }
};

CONFIG.getCurrentNetwork = function() {
    return this.NETWORKS[this.CURRENT_NETWORK];
};

CONFIG.getUSDTAddress = function() {
    return this.USDT_ADDRESS[this.CURRENT_NETWORK];
};

window.CONFIG = CONFIG;
