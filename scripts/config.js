const CONFIG = {
    CONTRACT_ADDRESS: "0x57967Aa7289dB7Bedc046b6C0A91711FCC98d0A8",
    
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
        97: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
    },
    
    // ===== НОВЫЙ ПАРАМЕТР: URL СЕРВЕРА =====
    // Замените на реальный URL после развертывания сервера
    SERVER_URL: "http://localhost:3000", // Для теста локально
    // SERVER_URL: "https://api.cryptoland.com", // Для продакшена
    
    // СОЦИАЛЬНЫЕ ССЫЛКИ
    SOCIAL: {
        TELEGRAM_SUPPORT: "https://t.me/CRYPTOLAND_SUPPORT",
        TELEGRAM_CHANNEL: "https://t.me/CRYPTOLAND_CHANNEL",
        TELEGRAM_GOVERNOR: "https://t.me/CRYPTOLAND_GOVERNOR_BOT"
    },
    
    // ФРАЗЫ МЭРА (10 ШТУК)
    MAYOR_PHRASES: {
        ru: [
            "Развивайте свой город и приглашай новых жителей!",
            "Отслеживай историю операций и денежные движения в Городской казне",
            "Каждая инвестиция делает мегаполис сильнее.",
            "Вместе мы построим лучший крипто-город!",
            "Пополняй бюджет города и он принесет тебе доход с процентами!",
            "Золотой район ждет своего мэра!",
            "Стань лучшим мэром! Следи за своим рейтингом.",
            "Чем больше заполнены уровни, тем больше возможностей.",
            "Ваш город — ваши правила!",
            "Контролируй налоговые сборы с жителей города в Налоговой",
            "Чем больше доход ваших жителей,тем больше зарабатываете вы!",
            "Сегодняшние вложения — завтрашний успех!"
        ],
        en: [
            "Develop your city, and residents will be grateful!",
            "Every investment makes the metropolis stronger.",
            "Together we will build the best crypto city!",
            "Referrals are not just residents, they are your team.",
            "The golden district is waiting for its mayor!",
            "Passive income is the key to financial freedom.",
            "The higher the level, the more opportunities.",
            "Your city - your rules!",
            "Invest wisely, develop with us.",
            "Today's investments are tomorrow's success!"
        ]
    },
    
    // НАСТРОЙКИ ЯЗЫКА
    LANGUAGE: {
        default: 'ru',
        available: ['ru', 'en']
    },
    
    // ПЕРЕВОДЫ
    TRANSLATIONS: {
        ru: {
            // Шапка
            connect_btn: "ПОДКЛЮЧИТЬ",
            logo_description: "ВИРТУАЛЬНЫЙ КРИПТО-МЕГАПОЛИС",
            
            // Навигация
            nav_dashboard: "Панель мэра",
            nav_districts: "Мои районы",
            nav_treasury: "Городская казна",
            nav_tax: "Налоговая",
            nav_rankings: "Рейтинг мэров",
            nav_support: "SUPPORT",
            nav_channel: "Telegram-канал",
            nav_governor: "Губернатор",
            
            // Панель мэра
            welcome_title: "ПАНЕЛЬ УПРАВЛЕНИЯ",
            welcome_subtitle: "Выберите район для развития вашего города",
            stat_population: "Население",
            stat_treasury: "Общая казна",
            stat_taxes: "Налоговые сборы",
            stat_income: "Доход с района",
            stat_trend: "всего жителей вашего города",
            stat_available: "реферальные начисления за все время",
            stat_daily: "проценты по тарифам за все время",
            per_day: "сумма балансов доступных к выводу",
            
            // Тарифы
            tariffs_title: "Доступные районы для инвестиций",
            tariffs_subtitle: "Инвестируйте в развитие города и получайте ежедневный доход",
            tariff_min: "Мин. сумма: 10 USDT",
            tariff_daily: "Вывод процентов ежедневно",
            tariff_fee: "Комиссия 15% на вывод",
            tariff_invest: "Инвестировать",
            tariff_vip: "VIP",
            tariff_daily_rate: "ежедневно",
            tariff_days: "дней",
            
            // Инфо карточки
            info_how_title: "Как это работает?",
            info_how_1: "Инвестируйте от 10 USDT",
            info_how_2: "Ежедневный доход 0.5% - 1.5%",
            info_how_3: "Реферальные бонусы до 7%",
            info_how_4: "Вывод процентов ежедневно",
            info_how_5: "Тело депозита по окончании срока",
            
            info_strategy_title: "Стратегия развития",
            info_strategy_1: "Начинайте со Спального района",
            info_strategy_2: "Реинвестируйте доходы",
            info_strategy_3: "Привлекайте рефералов",
            info_strategy_4: "Активируйте бонус мэра",
            info_strategy_5: "Создайте пассивный доход",
            
            // Мои районы
            districts_title: "Мои районы",
            districts_subtitle: "Управление вашими инвестициями",
            filter_all: "Все районы",
            filter_active: "Активные",
            filter_finished: "Завершенные",
            refresh: "Обновить",
            invest_start: "Начать инвестировать",
            summary_total: "Всего вложено",
            summary_active: "Активные вложения",
            summary_earned: "Заработано всего",
            summary_available: "Доступно к выводу",
            empty_title: "У вас пока нет районов",
            empty_text: "Начните инвестировать в развитие мегаполиса",
            
            // Городская казна
            treasury_title: "Городская казна",
            treasury_subtitle: "Управление финансами и вывод средств",
            treasury_income: "Доход с районов",
            treasury_tax: "Налоговые сборы",
            treasury_deposit: "Стартовый бюджет",
            commission: "комиссия",
            commission_zero: "комиссия 0%",
            locked: "заблокировано",
            available: "Доступно",
            invested: "Вложения",
            withdraw_income: "Вывести доход",
            withdraw_tax: "Вывести налоги",
            check_deposits: "Проверить завершение",
            
            // История операций
            history_title: "История операций",
            period: "Период",
            type: "Тип",
            period_all: "За все время",
            period_today: "Сегодня",
            period_week: "Последние 7 дней",
            period_month: "Последние 30 дней",
            type_all: "Все операции",
            type_invest: "Инвестиции",
            type_withdraw: "Вывод доходов",
            type_referral: "Реферальные",
            type_return: "Возврат тела",
            table_type: "Тип операции",
            table_amount: "Сумма",
            table_date: "Дата и время",
            table_status: "Статус",
            table_hash: "Хэш транзакции",
            status_completed: "Завершено",
            status_pending: "В обработке",
            status_failed: "Ошибка",
            
            // Налоговая
            tax_title: "Налоговая служба",
            tax_subtitle: "Реферальная программа и налоговые отчисления",
            referral_link: "Ваша реферальная ссылка",
            referral_active: "активна",
            copy: "Копировать",
            total_residents: "Всего жителей",
            tax_collected: "Налоговые сборы",
            total_turnover: "Общий оборот",
            mayor_bonus: "Бонус мэра",
            bonus_inactive: "Неактивен",
            bonus_active: "Активен",
            your_referrer: "Ваш пригласитель",
            since: "с",
            
            // Реферальные уровни
            levels_title: "Реферальные уровни",
            levels_description: "Чем выше уровень, тем больше процент налоговых отчислений",
            conditions: "Условия",
            your_stats: "Ваша статистика",
            level: "Уровень",
            percent: "Процент",
            structure_turnover: "Оборот структуры",
            personal_deposit: "Личный депозит",
            invited: "Приглашено",
            your_turnover: "Ваш оборот",
            status: "Статус",
            
            // Рейтинг
            rankings_title: "Рейтинг мэров",
            rankings_subtitle: "Соревнуйтесь за звание лучшего мэра",
            by_tax: "По налогам",
            by_population: "По населению",
            by_income: "По доходу",
            period_all_time: "За все время",
            period_30_days: "За последние 30 дней",
            period_7_days: "За последние 7 дней",
            period_today_small: "За сегодня",
            full_ranking: "Полный рейтинг мэров",
            search_placeholder: "Поиск по адресу...",
            your_place: "Ваше место",
            to_next_place: "До следующего места",
            place: "Место",
            mayor: "Мэр",
            taxes: "Налоги",
            population: "Население",
            total_income: "Общий доход",
            city: "Город",
            
            // Модалки
            connect_wallet: "Подключить кошелек",
            cancel: "Отмена",
            connect: "Подключить",
            invest_title: "Инвестиция в",
            invest_amount: "Сумма инвестиции (USDT)",
            referrer: "Пригласитель (необязательно)",
            minimum: "Минимум",
            available_balance: "Доступно",
            investment_summary: "Сводка по инвестиции",
            amount: "Сумма",
            daily_income: "Доход в день",
            total_income: "Общий доход",
            end_date: "Окончание",
            confirm: "Подтвердить",
            instructions: "Инструкция:",
            instruction_1: "Установите расширение MetaMask или приложение Trust Wallet",
            instruction_2: "Создайте или импортируйте кошелек",
            instruction_3: "Подключите к сети Binance Smart Chain (BSC)",
            instruction_4: "Пополните баланс USDT для инвестиций",
            metamask_desc: "Наиболее популярный крипто-кошелек",
            trust_desc: "Официальный кошелек Binance",
            walletconnect_desc: "Подключение по QR-коду",
            telegram_note: "Если вы в Telegram MiniApp: используйте WalletConnect или откройте приложение в браузере",
            
            // ===== НОВЫЕ ПЕРЕВОДЫ ДЛЯ РЕФЕРАЛЬНОЙ МОДАЛКИ =====
            referrer_confirm_title: "Подтверждение реферала",
            referrer_confirm_text: "Вы перешли по реферальной ссылке от пользователя:",
            referrer_confirm_note: "Если вы подтвердите, при первой инвестиции этот пользователь станет вашим пригласителем. Пригласитель будет получать процент от ваших доходов.",
            referrer_decline: "Нет, не хочу",
            referrer_accept: "Да, подтвердить",
            
            // ===== НОВЫЕ ПЕРЕВОДЫ ДЛЯ УВЕДОМЛЕНИЙ =====
            referrer_already_exists: "У вас уже есть пригласитель! Вы не можете сменить его.",
            referrer_confirmed_success: "Пригласитель подтвержден! Он будет применен при первой инвестиции.",
            referrer_declined: "Вы отказались от этой реферальной ссылки.",
            
            // Фразы мэра
            mayor_title: "Устав CryptoLand",
            mayor_subtitle: "Правила виртуального города",
            new_phrase: "Следующий устав"
        },
        
        en: {
            // Header
            connect_btn: "CONNECT",
            logo_description: "VIRTUAL CRYPTO METROPOLIS",
            
            // Navigation
            nav_dashboard: "Mayor's Panel",
            nav_districts: "My Districts",
            nav_treasury: "City Treasury",
            nav_tax: "Tax Office",
            nav_rankings: "Mayors Ranking",
            nav_support: "SUPPORT",
            nav_channel: "Telegram Channel",
            nav_governor: "Governor",
            
            // Dashboard
            welcome_title: "CONTROL PANEL",
            welcome_subtitle: "Choose a district to develop your city",
            stat_population: "Population",
            stat_treasury: "Total Treasury",
            stat_taxes: "Tax Collection",
            stat_income: "District Income",
            stat_trend: "total residents of your city",
            stat_available: "referral accruals for all time",
            stat_daily: "interest rates for all time",
            per_day: "the sum of balances available for withdrawal",
            
            // Tariffs
            tariffs_title: "Available Districts for Investment",
            tariffs_subtitle: "Invest in city development and get daily income",
            tariff_min: "Min. amount: 10 USDT",
            tariff_daily: "Daily withdrawal of interest",
            tariff_fee: "15% withdrawal fee",
            tariff_invest: "Invest",
            tariff_vip: "VIP",
            tariff_daily_rate: "daily",
            tariff_days: "days",
            
            // Info cards
            info_how_title: "How it works?",
            info_how_1: "Invest from 10 USDT",
            info_how_2: "Daily income 0.5% - 1.5%",
            info_how_3: "Referral bonuses up to 7%",
            info_how_4: "Daily withdrawal of interest",
            info_how_5: "Deposit body at the end of the term",
            
            info_strategy_title: "Development Strategy",
            info_strategy_1: "Start with Residential District",
            info_strategy_2: "Reinvest your income",
            info_strategy_3: "Attract referrals",
            info_strategy_4: "Activate mayor's bonus",
            info_strategy_5: "Create passive income",
            
            // My Districts
            districts_title: "My Districts",
            districts_subtitle: "Manage your investments",
            filter_all: "All districts",
            filter_active: "Active",
            filter_finished: "Completed",
            refresh: "Refresh",
            invest_start: "Start investing",
            summary_total: "Total invested",
            summary_active: "Active investments",
            summary_earned: "Total earned",
            summary_available: "Available for withdrawal",
            empty_title: "You have no districts yet",
            empty_text: "Start investing in metropolis development",
            
            // Treasury
            treasury_title: "City Treasury",
            treasury_subtitle: "Finance management and withdrawals",
            treasury_income: "District Income",
            treasury_tax: "Tax Collection",
            treasury_deposit: "Startup Budget",
            commission: "fee",
            commission_zero: "0% fee",
            locked: "locked",
            available: "Available",
            invested: "Invested",
            withdraw_income: "Withdraw income",
            withdraw_tax: "Withdraw taxes",
            check_deposits: "Check completion",
            
            // Transaction History
            history_title: "Transaction History",
            period: "Period",
            type: "Type",
            period_all: "All time",
            period_today: "Today",
            period_week: "Last 7 days",
            period_month: "Last 30 days",
            type_all: "All operations",
            type_invest: "Investments",
            type_withdraw: "Withdrawals",
            type_referral: "Referrals",
            type_return: "Return of body",
            table_type: "Operation type",
            table_amount: "Amount",
            table_date: "Date and time",
            table_status: "Status",
            table_hash: "Transaction hash",
            status_completed: "Completed",
            status_pending: "Pending",
            status_failed: "Failed",
            
            // Tax Office
            tax_title: "Tax Office",
            tax_subtitle: "Referral program and tax deductions",
            referral_link: "Your referral link",
            referral_active: "active",
            copy: "Copy",
            total_residents: "Total residents",
            tax_collected: "Tax collection",
            total_turnover: "Total turnover",
            mayor_bonus: "Mayor's bonus",
            bonus_inactive: "Inactive",
            bonus_active: "Active",
            your_referrer: "Your referrer",
            since: "since",

            
            // Referral levels
            levels_title: "Referral Levels",
            levels_description: "The higher the level, the greater the percentage of tax deductions",
            conditions: "Conditions",
            your_stats: "Your statistics",
            level: "Level",
            percent: "Percent",
            structure_turnover: "Structure turnover",
            personal_deposit: "Personal deposit",
            invited: "Invited",
            your_turnover: "Your turnover",
            status: "Status",
            
            // Rankings
            rankings_title: "Mayors Ranking",
            rankings_subtitle: "Compete for the title of best mayor",
            by_tax: "By taxes",
            by_population: "By population",
            by_income: "By income",
            period_all_time: "All time",
            period_30_days: "Last 30 days",
            period_7_days: "Last 7 days",
            period_today_small: "Today",
            full_ranking: "Full mayors ranking",
            search_placeholder: "Search by address...",
            your_place: "Your place",
            to_next_place: "To next place",
            place: "Place",
            mayor: "Mayor",
            taxes: "Taxes",
            population: "Population",
            total_income: "Total income",
            city: "City",
            
            // Modals
            connect_wallet: "Connect Wallet",
            cancel: "Cancel",
            connect: "Connect",
            invest_title: "Investment in",
            invest_amount: "Investment amount (USDT)",
            referrer: "Referrer (optional)",
            minimum: "Minimum",
            available_balance: "Available",
            investment_summary: "Investment Summary",
            amount: "Amount",
            daily_income: "Daily income",
            total_income: "Total income",
            end_date: "End date",
            confirm: "Confirm",
            instructions: "Instructions:",
            instruction_1: "Install MetaMask extension or Trust Wallet app",
            instruction_2: "Create or import a wallet",
            instruction_3: "Connect to Binance Smart Chain (BSC)",
            instruction_4: "Top up USDT balance for investments",
            metamask_desc: "Most popular crypto wallet",
            trust_desc: "Official Binance wallet",
            walletconnect_desc: "QR code connection",
            telegram_note: "If you are in Telegram MiniApp: use WalletConnect or open the app in browser",
            
            // ===== NEW TRANSLATIONS FOR REFERRAL MODAL =====
            referrer_confirm_title: "Referrer confirmation",
            referrer_confirm_text: "You came through a referral link from:",
            referrer_confirm_note: "If you confirm, this user will become your referrer on first investment. The referrer will receive a percentage of your earnings.",
            referrer_decline: "No, decline",
            referrer_accept: "Yes, confirm",
            
            // ===== NEW TRANSLATIONS FOR NOTIFICATIONS =====
            referrer_already_exists: "You already have a referrer! You cannot change it.",
            referrer_confirmed_success: "Referrer confirmed! It will be applied on first investment.",
            referrer_declined: "You declined this referral link.",
            
            // Mayor phrases
            mayor_title: "Charter of CryptoLand",
            mayor_subtitle: "Rules of the virtual city",
            new_phrase: "Next charter"
        }
    },
    
    APP: {
        name: "CryptoLand",
        version: "2.0",
        description: "Virtual crypto metropolis",
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

CONFIG.getContractABI = async function() {
    return [];
};

window.CONFIG = CONFIG;










