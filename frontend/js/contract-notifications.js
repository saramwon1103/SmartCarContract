// Notification system for contract workflow
class ContractNotificationManager {
    constructor() {
        this.notifications = [];
        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.loadNotifications();
    }

    createNotificationContainer() {
        if (document.getElementById('notification-container')) return;

        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        `;
        document.body.appendChild(container);
    }

    showNotification(type, title, message, duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444', 
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        notification.style.cssText = `
            background: white;
            border: 1px solid #e5e7eb;
            border-left: 4px solid ${colors[type] || colors.info};
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease-out;
            cursor: pointer;
            transition: transform 0.2s;
        `;

        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 4px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${title}</h4>
                    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.4;">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: #9ca3af;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 12px;
                    font-size: 16px;
                ">&times;</button>
            </div>
        `;

        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateY(-2px)';
        });

        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateY(0)';
        });

        const container = document.getElementById('notification-container');
        container.appendChild(notification);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease-in';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }

        return notification;
    }

    async loadNotifications() {
        const currentUser = AuthManager.getCurrentUser();
        if (!currentUser || currentUser.Role !== 'Owner') return;

        try {
            const response = await fetch(`http://localhost:3000/api/owners/${currentUser.UserId}/pending-contracts`);
            if (!response.ok) return;

            const data = await response.json();
            const pendingContracts = data.contracts || [];

            if (pendingContracts.length > 0) {
                this.showNotification(
                    'info',
                    '🔔 Pending Contract Confirmation',
                    `You have ${pendingContracts.length} contract${pendingContracts.length > 1 ? 's' : ''} waiting for your confirmation.`,
                    8000
                );
            }

        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    notifyContractConfirmed(contractId) {
        this.showNotification(
            'success',
            '✅ Contract Confirmed',
            `Contract ${contractId} has been confirmed successfully. Waiting for user payment.`,
            6000
        );
    }

    notifyPaymentReceived(contractId, amount) {
        this.showNotification(
            'success',
            '💰 Payment Received',
            `Payment of $${amount} received for contract ${contractId}. Contract is now completed.`,
            6000
        );
    }

    notifyTransactionFailed(message) {
        this.showNotification(
            'error',
            '❌ Transaction Failed',
            message || 'The transaction could not be completed. Please try again.',
            8000
        );
    }
}

// Add animation styles
if (!document.getElementById('notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(styles);
}

// Initialize notification manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.contractNotificationManager = new ContractNotificationManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContractNotificationManager;
}