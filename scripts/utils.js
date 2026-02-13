class CryptoLandUtils {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
    }

    formatNumber(num, decimals = 2) {
        if (isNaN(num) || num === null || num === undefined) return '0.00';
        const number = typeof num === 'string' ? parseFloat(num) : num;
        return number.toLocaleString('ru-RU', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    formatAddress(address, start = 6, end = 4) {
        if (!address || address.length < start + end) return '';
        return `${address.slice(0, start)}...${address.slice(-end)}`;
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }

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
        this.notifications.push(notificationId);
        
        if (this.notifications.length > this.maxNotifications) {
            const oldId = this.notifications.shift();
            this.removeNotification(oldId);
        }
        
        setTimeout(() => {
            this.removeNotification(notificationId);
        }, duration);
        
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
    }

    removeNotification(notificationId) {
        const notification = document.getElementById(`notification-${notificationId}`);
        if (notification) {
            notification.classList.add('hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                const index = this.notifications.indexOf(notificationId);
                if (index > -1) this.notifications.splice(index, 1);
            }, 300);
        }
    }

    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    calculateProgress(current, total) {
        if (total <= 0) return 0;
        return Math.min(100, (current / total) * 100);
    }
}

window.utils = new CryptoLandUtils();