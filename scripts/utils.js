class CryptoLandUtils {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
    }

    // Форматирование чисел
    formatNumber(num, decimals = 2) {
        if (isNaN(num) || num === null || num === undefined) {
            return '0.00';
        }
        
        const number = typeof num === 'string' ? parseFloat(num) : num;
        
        if (number === 0) {
            return '0.' + '0'.repeat(decimals);
        }
        
        return number.toLocaleString('ru-RU', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    // Форматирование адреса
    formatAddress(address, start = 6, end = 4) {
        if (!address || address.length < start + end) {
            return '';
        }
        return `${address.slice(0, start)}...${address.slice(-end)}`;
    }

    // Форматирование времени
    formatTime(seconds) {
        if (!seconds || seconds <= 0) {
            return '0м';
        }
        
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) {
            return `${days}д ${hours}ч`;
        } else if (hours > 0) {
            return `${hours}ч ${minutes}м`;
        } else {
            return `${minutes}м`;
        }
    }

    // Форматирование даты
    formatDate(timestamp, withTime = true) {
        if (!timestamp) return '-';
        
        const date = new Date(timestamp * 1000);
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };
        
        if (withTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return date.toLocaleString('ru-RU', options);
    }

    // Расчет дохода
    calculateProfit(amount, percent, days) {
        const dailyProfit = (amount * percent) / 100;
        return dailyProfit * days;
    }


    // Копирование в буфер обмена
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback для старых браузеров
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (fallbackErr) {
                console.error('Copy failed:', fallbackErr);
                return false;
            }
        }
    }

    // Генерация QR кода
    generateQRCode(elementId, text, options = {}) {
        const defaultOptions = {
            width: 200,
            height: 200,
            colorDark: "#FBBF24",
            colorLight: "#1A1F3C",
            correctLevel: QRCode.CorrectLevel.H
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            QRCode.toCanvas(
                document.getElementById(elementId),
                text,
                mergedOptions,
                function(error) {
                    if (error) {
                        console.error('QR Code generation error:', error);
                        this.showNotification('Ошибка генерации QR-кода', 'error');
                    }
                }
            );
        } catch (error) {
            console.error('QR Code error:', error);
        }
    }

    // Показать уведомление
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;
        
        const notificationId = Date.now();
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = `notification-${notificationId}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="utils.removeNotification('${notificationId}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Удаляем старые уведомления
        this.notifications.push(notificationId);
        if (this.notifications.length > this.maxNotifications) {
            const oldId = this.notifications.shift();
            this.removeNotification(oldId);
        }
        
        // Автоматическое удаление
        setTimeout(() => {
            this.removeNotification(notificationId);
        }, duration);
        
        // Анимация
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
    }


    // Удалить уведомление
    removeNotification(notificationId) {
        const notification = document.getElementById(`notification-${notificationId}`);
        if (notification) {
            notification.classList.add('hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                // Удаляем из массива
                const index = this.notifications.indexOf(notificationId);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }
    }

    // Валидация адреса
    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    // Форматирование процентов
    formatPercent(value) {
        return `${this.formatNumber(value)}%`;
    }

    // Округление
    round(value, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    // Генерация случайного цвета
    generateColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }

    // Форматирование суммы с валютой
    formatCurrency(amount, currency = 'USDT') {
        return `${this.formatNumber(amount)} ${currency}`;
    }

    // Расчет прогресса
    calculateProgress(current, total) {
        if (total <= 0) return 0;
        return Math.min(100, (current / total) * 100);
    }

    // Очистка HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Проверка мобильного устройства
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Получение параметров URL
    getUrlParams() {
        const params = {};
        window.location.search.substr(1).split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        return params;
    }

    // Проверка реферальной ссылки
    getReferrerFromUrl() {
        const params = this.getUrlParams();
        return params.ref || null;
    }

    // Анимация скролла
    smoothScrollTo(elementId, offset = 100) {
        const element = document.getElementById(elementId);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - offset,
                behavior: 'smooth'
            });
        }
    }

    // Задержка
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Форматирование больших чисел
    formatLargeNumber(num) {
        if (num >= 1000000) {
            return this.formatNumber(num / 1000000, 2) + 'M';
        } else if (num >= 1000) {
            return this.formatNumber(num / 1000, 1) + 'K';
        }
        return this.formatNumber(num, 0);
    }

    // Получение иконки для типа транзакции
    getTransactionIcon(type) {
        const icons = {
            invest: 'fas fa-coins',
            withdraw: 'fas fa-download',
            referral: 'fas fa-users',
            deposit: 'fas fa-piggy-bank',
            bonus: 'fas fa-gift'
        };
        return icons[type] || 'fas fa-exchange-alt';
    }

    // Получение цвета для типа транзакции
    getTransactionColor(type) {
        const colors = {
            invest: 'var(--accent-blue)',
            withdraw: 'var(--accent-green)',
            referral: 'var(--accent-purple)',
            deposit: 'var(--accent-gold)',
            bonus: 'var(--accent-gold)'
        };
        return colors[type] || 'var(--text-secondary)';
    }
}

// Глобальный экземпляр
window.utils = new CryptoLandUtils();
