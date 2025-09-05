// SCORES Chatbot and Portal Functionality

class SCORESChatbot {
    constructor() {
        this.chatbot = document.getElementById('chatbot');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-button');
        this.chatbotToggle = document.getElementById('chatbot-toggle');
        this.fileUploadArea = document.getElementById('file-upload-area');
        this.fileInput = document.getElementById('file-input');
        this.uploadZone = document.getElementById('upload-zone');
        this.uploadedFiles = document.getElementById('uploaded-files');
        this.quickActions = document.getElementById('quick-actions');
        
        this.isMinimized = false;
        this.messageHistory = [];
        this.workflowState = null;
        this.workflowData = {};
        this.uploadedFilesList = [];
        this.currentSession = null;

        this.init();
    }

    init() {
        // Event listeners
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.chatbotToggle.addEventListener('click', () => this.toggleChatbot());

        // File upload events
        this.setupFileUpload();

        // Initialize with welcome message
        this.addMessage('bot', '👋 Hello! I\'m your SEBI SCORES Assistant. I can help you with:\n\n• **Register** for SCORES portal\n• **Lodge complaints** against intermediaries\n• **Track complaint** status\n• **Answer questions** about SEBI regulations\n\nHow can I assist you today?');

        // Show quick actions
        this.showQuickActions();
    }

    setupFileUpload() {
        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Drag and drop
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('drag-over');
        });

        this.uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('drag-over');
        });

        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('drag-over');
            this.handleFileSelection(e.dataTransfer.files);
        });

        // Click to upload
        this.uploadZone.addEventListener('click', () => {
            this.fileInput.click();
        });
    }

    toggleChatbot() {
        this.isMinimized = !this.isMinimized;
        this.chatbot.classList.toggle('minimized');

        // Update toggle icon
        const icon = this.chatbotToggle.querySelector('i');
        icon.className = this.isMinimized ? 'fas fa-plus' : 'fas fa-minus';

        if (!this.isMinimized) {
            setTimeout(() => {
                this.chatInput.focus();
            }, 300);
        }
    }

    sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.messageHistory.push({ role: 'user', content: message });
        this.chatInput.value = '';

        this.showTypingIndicator();
        
        // Process message
        setTimeout(() => {
            this.hideTypingIndicator();
            this.processMessage(message);
        }, 1000 + Math.random() * 2000);
    }

    addMessage(sender, content, options = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'bot' ?
            '<i class="fas fa-robot"></i>' :
            '<i class="fas fa-user"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatMessage(content);

        // Add buttons if provided
        if (options.buttons && Array.isArray(options.buttons)) {
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'message-buttons';
            buttonsDiv.style.marginTop = '10px';

            options.buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.textContent = button.text;
                btn.className = 'quick-btn';
                btn.style.margin = '5px 5px 0 0';
                btn.onclick = button.action;
                buttonsDiv.appendChild(btn);
            });

            contentDiv.appendChild(buttonsDiv);
        }

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Convert URLs to links
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        // Convert line breaks to <br>
        content = content.replace(/\n/g, '<br>');
        
        // Bold formatting
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Bullet points
        content = content.replace(/^• (.+)/gm, '• $1');

        return content;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';

        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showQuickActions() {
        this.quickActions.style.display = 'flex';
    }

    hideQuickActions() {
        this.quickActions.style.display = 'none';
    }

    processMessage(message) {
        const lowerMessage = message.toLowerCase();

        // Handle workflow continuation
        if (this.workflowState) {
            this.handleWorkflowResponse(message);
            return;
        }

        // Check for specific actions
        if (lowerMessage.includes('register') || lowerMessage.includes('new user')) {
            this.startRegistrationWorkflow();
        } else if (lowerMessage.includes('lodge') || lowerMessage.includes('complaint') || lowerMessage.includes('file complaint')) {
            this.startComplaintWorkflow();
        } else if (lowerMessage.includes('track') || lowerMessage.includes('status')) {
            this.startTrackingWorkflow();
        } else if (lowerMessage.includes('escalate')) {
            this.startEscalationWorkflow();
        } else if (lowerMessage.includes('close')) {
            this.startCloseWorkflow();
        } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            this.showHelp();
        } else {
            // Forward to RAG system for SEBI regulation queries
            this.queryRAGSystem(message);
        }
    }

    handleWorkflowResponse(message) {
        switch (this.workflowState) {
            case 'registration':
                this.handleRegistrationStep(message);
                break;
            case 'complaint':
                this.handleComplaintStep(message);
                break;
            case 'tracking':
                this.handleTrackingStep(message);
                break;
            case 'escalation':
                this.handleEscalationStep(message);
                break;
            case 'closure':
                this.handleClosureStep(message);
                break;
            default:
                this.processMessage(message);
        }
    }

    // Registration Workflow
    startRegistrationWorkflow() {
        this.workflowState = 'registration';
        this.workflowData = { step: 1 };
        
        this.addMessage('bot', '📝 **New User Registration**\n\nI\'ll help you register for the SCORES portal. Please provide your **full name** as it appears on your PAN card.');
    }

    handleRegistrationStep(message) {
        switch (this.workflowData.step) {
            case 1: // Name
                this.workflowData.name = message.trim();
                this.workflowData.step = 2;
                this.addMessage('bot', `Thank you, ${this.workflowData.name}!\n\nNow, please provide your **PAN number** (10 characters).`);
                break;
                
            case 2: // PAN
                const pan = message.trim().toUpperCase();
                if (pan.length !== 10) {
                    this.addMessage('bot', '❌ PAN number should be exactly 10 characters. Please provide a valid PAN number.');
                    return;
                }
                this.workflowData.pan = pan;
                this.workflowData.step = 3;
                this.addMessage('bot', 'Great! Now please provide your **email address**.');
                break;
                
            case 3: // Email
                const email = message.trim();
                if (!this.validateEmail(email)) {
                    this.addMessage('bot', '❌ Please provide a valid email address.');
                    return;
                }
                this.workflowData.email = email;
                this.workflowData.step = 4;
                this.addMessage('bot', 'Perfect! Now please provide your **mobile number** (10 digits).');
                break;
                
            case 4: // Mobile
                const mobile = message.trim().replace(/\D/g, '');
                if (mobile.length !== 10) {
                    this.addMessage('bot', '❌ Mobile number should be exactly 10 digits. Please provide a valid mobile number.');
                    return;
                }
                this.workflowData.mobile = mobile;
                this.workflowData.step = 5;
                this.addMessage('bot', 'Great! Finally, please provide your **date of birth** in DD/MM/YYYY format.');
                break;
                
            case 5: // DOB
                const dob = message.trim();
                if (!this.validateDate(dob)) {
                    this.addMessage('bot', '❌ Please provide date of birth in DD/MM/YYYY format.');
                    return;
                }
                this.workflowData.dob = dob;
                this.submitRegistration();
                break;
        }
    }

    async submitRegistration() {
        try {
            this.addMessage('bot', '⏳ Processing your registration...');
            
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.workflowData)
            });

            const result = await response.json();

            if (result.success) {
                this.addMessage('bot', `✅ **Registration Successful!**\n\n**Your SCORES Credentials:**\n• **User ID:** ${result.user_id}\n• **Password:** ${result.password}\n\n⚠️ **Important:** Please save these credentials safely. You'll need them to lodge complaints and track status.\n\nWould you like to lodge a complaint now?`, {
                    buttons: [
                        { text: 'Lodge Complaint', action: () => this.startComplaintWorkflow() },
                        { text: 'Not Now', action: () => this.resetWorkflow() }
                    ]
                });
                this.currentSession = { user_id: result.user_id, password: result.password };
            } else {
                this.addMessage('bot', `❌ **Registration Failed**\n\n${result.error || 'Please try again later.'}`);
            }
        } catch (error) {
            this.addMessage('bot', '❌ **Registration Failed**\n\nUnable to connect to server. Please try again later.');
        }

        this.resetWorkflow();
    }

    // Complaint Workflow
    startComplaintWorkflow() {
        if (!this.currentSession) {
            this.addMessage('bot', '🔐 **Authentication Required**\n\nTo lodge a complaint, please provide your SCORES credentials.\n\nPlease enter your **User ID**:');
            this.workflowState = 'complaint';
            this.workflowData = { step: 'auth_user' };
            return;
        }

        this.workflowState = 'complaint';
        this.workflowData = { step: 1, ...this.currentSession };
        
        this.addMessage('bot', '📋 **Lodge New Complaint**\n\nPlease select the type of entity your complaint is against:', {
            buttons: [
                { text: 'Stock Broker', action: () => this.setEntityType('Stock Broker') },
                { text: 'Mutual Fund', action: () => this.setEntityType('Mutual Fund') },
                { text: 'Listed Company', action: () => this.setEntityType('Listed Company') },
                { text: 'Depository', action: () => this.setEntityType('Depository') },
                { text: 'Portfolio Manager', action: () => this.setEntityType('Portfolio Manager') },
                { text: 'Investment Advisor', action: () => this.setEntityType('Investment Advisor') }
            ]
        });
    }

    handleComplaintStep(message) {
        switch (this.workflowData.step) {
            case 'auth_user':
                this.workflowData.user_id = message.trim();
                this.workflowData.step = 'auth_password';
                this.addMessage('bot', 'Now please enter your **Password**:');
                break;
                
            case 'auth_password':
                this.workflowData.password = message.trim();
                this.workflowData.step = 1;
                this.currentSession = { 
                    user_id: this.workflowData.user_id, 
                    password: this.workflowData.password 
                };
                this.addMessage('bot', '✅ Authentication successful!\n\nPlease select the type of entity your complaint is against:', {
                    buttons: [
                        { text: 'Stock Broker', action: () => this.setEntityType('Stock Broker') },
                        { text: 'Mutual Fund', action: () => this.setEntityType('Mutual Fund') },
                        { text: 'Listed Company', action: () => this.setEntityType('Listed Company') },
                        { text: 'Depository', action: () => this.setEntityType('Depository') },
                        { text: 'Portfolio Manager', action: () => this.setEntityType('Portfolio Manager') },
                        { text: 'Investment Advisor', action: () => this.setEntityType('Investment Advisor') }
                    ]
                });
                break;
                
            case 2: // Category
                this.workflowData.category = message.trim();
                this.workflowData.step = 3;
                this.addMessage('bot', 'Please provide a **detailed description** of your complaint. Include relevant dates, amounts, and any specific issues you faced.');
                break;
                
            case 3: // Description
                this.workflowData.description = message.trim();
                this.addMessage('bot', '📎 **Document Upload (Optional)**\n\nYou can upload supporting documents (max 10 files, 20MB each). Do you have any documents to upload?', {
                    buttons: [
                        { text: 'Upload Files', action: () => this.showFileUpload() },
                        { text: 'Skip Upload', action: () => this.submitComplaint() }
                    ]
                });
                break;
        }
    }

    setEntityType(entityType) {
        this.workflowData.entity_type = entityType;
        this.workflowData.step = 2;
        
        const categories = this.getComplaintCategories(entityType);
        this.addMessage('bot', `Great! You selected **${entityType}**.\n\nNow please specify the category of your complaint. Type one of the following:\n\n${categories.map(cat => `• ${cat}`).join('\n')}`);
    }

    getComplaintCategories(entityType) {
        const categoryMap = {
            'Stock Broker': ['Trading Issues', 'Margin Problems', 'Settlement Delays', 'Unauthorized Trading', 'Account Access'],
            'Mutual Fund': ['NAV Issues', 'Redemption Delays', 'Mis-selling', 'Performance Issues', 'Documentation'],
            'Listed Company': ['Non-disclosure', 'Dividend Issues', 'Corporate Governance', 'Rights Issues', 'IPO Related'],
            'Depository': ['Demat Account Issues', 'Transfer Problems', 'Holding Discrepancies', 'Service Issues'],
            'Portfolio Manager': ['Performance Issues', 'Unauthorized Transactions', 'Fee Disputes', 'Reporting Issues'],
            'Investment Advisor': ['Wrong Advice', 'Conflict of Interest', 'Fee Issues', 'Disclosure Problems']
        };
        
        return categoryMap[entityType] || ['General Complaint'];
    }

    showFileUpload() {
        this.fileUploadArea.style.display = 'block';
        this.addMessage('bot', '📎 **File Upload Area Opened**\n\nYou can now drag & drop files or click the upload area below. When finished, type "**done**" to proceed.');
        this.workflowData.awaitingFiles = true;
    }

    async submitComplaint() {
        try {
            this.addMessage('bot', '⏳ Submitting your complaint...');

            const formData = new FormData();
            formData.append('user_id', this.workflowData.user_id);
            formData.append('password', this.workflowData.password);
            formData.append('entity_type', this.workflowData.entity_type);
            formData.append('category', this.workflowData.category);
            formData.append('description', this.workflowData.description);

            // Add files
            this.uploadedFilesList.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('/api/lodge', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.addMessage('bot', `✅ **Complaint Lodged Successfully!**\n\n**Complaint ID:** ${result.complaint_id}\n\n📝 **Next Steps:**\n• You'll receive acknowledgment within 7 days\n• Entity has 21 days to respond\n• You can track status anytime\n\nWould you like to track this complaint now?`, {
                    buttons: [
                        { text: 'Track Complaint', action: () => this.startTrackingWorkflow(result.complaint_id) },
                        { text: 'Done', action: () => this.resetWorkflow() }
                    ]
                });
            } else {
                this.addMessage('bot', `❌ **Complaint Submission Failed**\n\n${result.error || 'Please try again later.'}`);
            }
        } catch (error) {
            this.addMessage('bot', '❌ **Complaint Submission Failed**\n\nUnable to connect to server. Please try again later.');
        }

        this.resetWorkflow();
        this.clearUploadedFiles();
    }

    // File Upload Functions
    handleFileSelection(files) {
        if (this.uploadedFilesList.length + files.length > 10) {
            alert('Maximum 10 files allowed');
            return;
        }

        Array.from(files).forEach(file => {
            if (file.size > 20 * 1024 * 1024) { // 20MB
                alert(`File too large: ${file.name}. Maximum 20MB per file.`);
                return;
            }

            if (!this.isValidFileType(file)) {
                alert(`File type not supported: ${file.name}`);
                return;
            }

            this.uploadedFilesList.push(file);
            this.displayUploadedFile(file);
        });
    }

    isValidFileType(file) {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain'
        ];
        
        return allowedTypes.includes(file.type);
    }

    displayUploadedFile(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileSize = (file.size / 1024).toFixed(1) + ' KB';
        if (file.size > 1024 * 1024) {
            fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        }

        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${fileSize}</span>
            <button class="remove-file" onclick="scoresBot.removeFile('${file.name}')">×</button>
        `;

        this.uploadedFiles.appendChild(fileItem);
    }

    removeFile(fileName) {
        this.uploadedFilesList = this.uploadedFilesList.filter(file => file.name !== fileName);
        
        // Remove from UI
        const fileItems = this.uploadedFiles.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            if (item.querySelector('.file-name').textContent === fileName) {
                item.remove();
            }
        });
    }

    clearUploadedFiles() {
        this.uploadedFilesList = [];
        this.uploadedFiles.innerHTML = '';
    }

    // Tracking Workflow
    startTrackingWorkflow(complaintId = null) {
        this.workflowState = 'tracking';
        this.workflowData = { step: 1 };

        if (complaintId) {
            this.workflowData.complaint_id = complaintId;
            this.workflowData.step = 2;
        }

        if (!this.currentSession && !complaintId) {
            this.addMessage('bot', '🔍 **Track Complaint Status**\n\nPlease provide your **User ID**:');
            this.workflowData.step = 'auth_user';
        } else if (!complaintId) {
            this.addMessage('bot', '🔍 **Track Complaint Status**\n\nPlease provide your **Complaint ID**:');
        } else {
            this.addMessage('bot', `🔍 **Tracking Complaint ${complaintId}**\n\nPlease provide your **User ID**:`);
        }
    }

    handleTrackingStep(message) {
        switch (this.workflowData.step) {
            case 'auth_user':
                this.workflowData.user_id = message.trim();
                this.workflowData.step = 'auth_password';
                this.addMessage('bot', 'Please provide your **Password**:');
                break;
                
            case 'auth_password':
                this.workflowData.password = message.trim();
                if (!this.workflowData.complaint_id) {
                    this.workflowData.step = 1;
                    this.addMessage('bot', 'Authentication successful! Now please provide your **Complaint ID**:');
                } else {
                    this.trackComplaint();
                }
                break;
                
            case 1: // Complaint ID
                this.workflowData.complaint_id = message.trim();
                this.trackComplaint();
                break;
                
            case 2: // With current session
                this.workflowData.user_id = this.currentSession.user_id;
                this.workflowData.password = this.currentSession.password;
                this.trackComplaint();
                break;
        }
    }

    async trackComplaint() {
        try {
            this.addMessage('bot', '⏳ Fetching complaint status...');

            const response = await fetch('/api/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    complaint_id: this.workflowData.complaint_id,
                    user_id: this.workflowData.user_id,
                    password: this.workflowData.password
                })
            });

            const result = await response.json();

            if (result.success) {
                const complaint = result.complaint;
                const statusEmoji = this.getStatusEmoji(complaint.status);
                
                let message = `📊 **Complaint Status Report**\n\n`;
                message += `**Complaint ID:** ${complaint.complaint_id}\n`;
                message += `**Status:** ${statusEmoji} ${this.getStatusText(complaint.status)}\n`;
                message += `**Entity Type:** ${complaint.entity_type}\n`;
                message += `**Category:** ${complaint.category}\n`;
                message += `**Submitted:** ${new Date(complaint.created_at).toLocaleDateString()}\n`;
                message += `**Days Elapsed:** ${complaint.days_elapsed}\n\n`;

                if (complaint.reminders && complaint.reminders.length > 0) {
                    message += `⚠️ **Important Reminders:**\n`;
                    complaint.reminders.forEach(reminder => {
                        message += `• ${reminder}\n`;
                    });
                    message += '\n';
                }

                const actions = this.getAvailableActions(complaint);
                if (actions.length > 0) {
                    this.addMessage('bot', message + '**Available Actions:**', {
                        buttons: actions
                    });
                } else {
                    this.addMessage('bot', message);
                }
            } else {
                this.addMessage('bot', `❌ **Tracking Failed**\n\n${result.error || 'Complaint not found or access denied.'}`);
            }
        } catch (error) {
            this.addMessage('bot', '❌ **Tracking Failed**\n\nUnable to connect to server. Please try again later.');
        }

        this.resetWorkflow();
    }

    getStatusEmoji(status) {
        const emojiMap = {
            'submitted': '📝',
            'under_review': '👀',
            'escalated_l2': '⬆️',
            'escalated_sebi': '🏛️',
            'resolved': '✅',
            'closed': '✅'
        };
        return emojiMap[status] || '📋';
    }

    getStatusText(status) {
        const textMap = {
            'submitted': 'Submitted',
            'under_review': 'Under Review',
            'escalated_l2': 'Escalated to Level 2',
            'escalated_sebi': 'Escalated to SEBI Officer',
            'resolved': 'Resolved',
            'closed': 'Closed'
        };
        return textMap[status] || 'Unknown';
    }

    getAvailableActions(complaint) {
        const actions = [];

        if (complaint.days_elapsed >= 15 && ['submitted', 'under_review'].includes(complaint.status)) {
            actions.push({
                text: 'Escalate Complaint',
                action: () => this.startEscalationWorkflow(complaint.complaint_id)
            });
        }

        if (!['resolved', 'closed'].includes(complaint.status)) {
            actions.push({
                text: 'Close Complaint',
                action: () => this.startCloseWorkflow(complaint.complaint_id)
            });
        }

        return actions;
    }

    // RAG System Integration
    async queryRAGSystem(question) {
        try {
            this.addMessage('bot', '🔍 Searching SEBI knowledge base...');

            const response = await fetch('/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question })
            });

            const result = await response.json();

            if (result.success) {
                let message = result.answer;
                
                if (result.sources && result.sources.length > 0) {
                    message += '\n\n📚 **Sources:**\n';
                    result.sources.slice(0, 3).forEach((source, index) => {
                        message += `${index + 1}. ${source.doc_type || 'SEBI Document'} (${source.year || 'N/A'})\n`;
                    });
                }

                this.addMessage('bot', message);
            } else {
                this.addMessage('bot', '❌ **Knowledge Search Failed**\n\nI couldn\'t find relevant information in the SEBI knowledge base. Please try rephrasing your question or contact SEBI directly.\n\n📞 **SEBI Helpline:** 022-26449000\n📧 **Email:** scores@sebi.gov.in');
            }
        } catch (error) {
            this.addMessage('bot', '❌ **Service Unavailable**\n\nThe SEBI knowledge system is currently unavailable. Please try again later or contact SEBI directly.\n\n📞 **SEBI Helpline:** 022-26449000');
        }
    }

    // Utility Functions
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validateDate(date) {
        const re = /^\d{2}\/\d{2}\/\d{4}$/;
        return re.test(date);
    }

    resetWorkflow() {
        this.workflowState = null;
        this.workflowData = {};
        this.showQuickActions();
        this.fileUploadArea.style.display = 'none';
    }

    showHelp() {
        this.addMessage('bot', '🆘 **SEBI SCORES Assistant Help**\n\n**I can help you with:**\n\n🔹 **Register** - Create new SCORES account\n🔹 **Lodge Complaint** - File complaint against intermediaries\n🔹 **Track Status** - Check complaint progress\n🔹 **Escalate** - Move complaint to higher level\n🔹 **Close Complaint** - Close resolved complaints\n🔹 **SEBI Queries** - Answer regulatory questions\n\n**Quick Tips:**\n• Use the quick action buttons below\n• Upload supporting documents when lodging complaints\n• Save your User ID and Password safely\n• Track complaints regularly for updates\n\n**Need Human Help?**\n📞 **SEBI Helpline:** 022-26449000/40\n📧 **Email:** scores@sebi.gov.in\n🌐 **Website:** www.sebi.gov.in');
    }
}

// Quick Action Functions (called from HTML)
function quickAction(action) {
    switch (action) {
        case 'register':
            scoresBot.startRegistrationWorkflow();
            break;
        case 'lodge':
            scoresBot.startComplaintWorkflow();
            break;
        case 'track':
            scoresBot.startTrackingWorkflow();
            break;
        case 'escalate':
            scoresBot.startEscalationWorkflow();
            break;
        case 'close':
            scoresBot.startCloseWorkflow();
            break;
    }
}

// File Upload Functions
function toggleFileUpload() {
    const fileArea = document.getElementById('file-upload-area');
    fileArea.style.display = fileArea.style.display === 'none' ? 'block' : 'none';
}

function closeFileUpload() {
    document.getElementById('file-upload-area').style.display = 'none';
    if (scoresBot.workflowData.awaitingFiles) {
        scoresBot.addMessage('bot', '📎 **File upload closed.** Type "**submit**" to proceed with your complaint or "**upload**" to reopen file upload.');
    }
}

// Modal Functions (for main page buttons)
function startRegistration() {
    // Scroll to chatbot and start registration
    document.getElementById('chatbot').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
        if (scoresBot.isMinimized) {
            scoresBot.toggleChatbot();
        }
        scoresBot.startRegistrationWorkflow();
    }, 500);
}

function startComplaint() {
    document.getElementById('chatbot').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
        if (scoresBot.isMinimized) {
            scoresBot.toggleChatbot();
        }
        scoresBot.startComplaintWorkflow();
    }, 500);
}

function trackComplaint() {
    document.getElementById('chatbot').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
        if (scoresBot.isMinimized) {
            scoresBot.toggleChatbot();
        }
        scoresBot.startTrackingWorkflow();
    }, 500);
}

// Modal functionality (if needed for forms)
function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

// Initialize chatbot when DOM is loaded
let scoresBot;
document.addEventListener('DOMContentLoaded', function() {
    scoresBot = new SCORESChatbot();
    
    // Close modal when clicking outside
    document.getElementById('modal-overlay')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
});
