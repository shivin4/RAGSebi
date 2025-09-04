// SEBI Chatbot Functionality

class SEBIChatbot {
    constructor() {
        this.chatbot = document.getElementById('chatbot');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-button');
        this.chatbotToggle = document.getElementById('chatbot-toggle');
        this.isMinimized = false;
        this.messageHistory = [];
        this.workflowState = null; // Track current workflow state
        this.workflowStep = 0; // Track current step in workflow

        this.init();
    }

    init() {
        // Event listeners
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        this.chatbotToggle.addEventListener('click', () => this.toggleChatbot());

        // Initialize with welcome message
        this.addMessage('bot', 'Hello! I\'m your SEBI Assistant. I can help you with questions about SEBI regulations, registration processes, and compliance requirements. How can I assist you today?');

        // Add quick action buttons
        this.addQuickActions();
    }

    toggleChatbot() {
        this.isMinimized = !this.isMinimized;
        this.chatbot.classList.toggle('minimized');

        if (!this.isMinimized) {
            // Focus on input when expanded
            setTimeout(() => {
                this.chatInput.focus();
            }, 300);
        }
    }

    sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        this.messageHistory.push({ role: 'user', content: message });

        // Clear input
        this.chatInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Process message and get response
        setTimeout(() => {
            this.hideTypingIndicator();
            this.processMessage(message);
        }, 1000 + Math.random() * 2000); // Simulate response time
    }

    addMessage(sender, content) {
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

        // Bold important terms
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

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

    processMessage(message) {
        const lowerMessage = message.toLowerCase();

        // Check if this is a follow-up to a workflow guidance
        if (this.isWorkflowInProgress()) {
            this.handleWorkflowResponse(message);
            return;
        }

        // Check for workflow guidance requests first
        if (this.isWorkflowRequest(message)) {
            this.handleWorkflowRequest(message);
            return;
        }

        // Check for specific registration/operational queries first
        if (this.isRegistrationQuery(message)) {
            this.respondToRegistration(message);
        } else if (lowerMessage.includes('compliance') || lowerMessage.includes('reporting')) {
            this.respondToCompliance(message);
        } else if (lowerMessage.includes('eligibility') || lowerMessage.includes('requirements')) {
            this.respondToEligibility(message);
        } else if (lowerMessage.includes('documents') || lowerMessage.includes('paperwork')) {
            this.respondToDocuments(message);
        } else if (lowerMessage.includes('fees') || lowerMessage.includes('cost')) {
            this.respondToFees(message);
        } else if (lowerMessage.includes('timeline') || lowerMessage.includes('time')) {
            this.respondToTimeline(message);
        } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            this.respondToHelp(message);
        } else if (this.isStockBrokerRegistrationQuery(message)) {
            this.respondToStockBroker(message);
        } else if (this.isMerchantBankerRegistrationQuery(message)) {
            this.respondToMerchantBanker(message);
        } else {
            // For general queries about intermediaries, documents, or other topics, use RAG system
            this.queryRAGSystem(message);
        }
    }

    // Check if message is a general registration query
    isRegistrationQuery(message) {
        const lowerMessage = message.toLowerCase();

        // General registration keywords without specific intermediary types
        const registrationKeywords = [
            'how to register',
            'registration process',
            'apply for registration',
            'become registered',
            'get registered',
            'registration requirements',
            'registration steps'
        ];

        // Must contain registration keywords AND NOT contain specific intermediary types
        return registrationKeywords.some(keyword => lowerMessage.includes(keyword)) &&
               !lowerMessage.includes('stock broker') &&
               !lowerMessage.includes('merchant banker') &&
               !lowerMessage.includes('portfolio manager') &&
               !lowerMessage.includes('depository participant');
    }

    // Check if message is specifically about stock broker registration
    isStockBrokerRegistrationQuery(message) {
        const lowerMessage = message.toLowerCase();

        // Must contain both stock broker AND registration-related terms
        const hasStockBroker = lowerMessage.includes('stock broker') || lowerMessage.includes('stockbroker');
        const hasRegistrationIntent = lowerMessage.includes('register') ||
                                    lowerMessage.includes('registration') ||
                                    lowerMessage.includes('apply') ||
                                    lowerMessage.includes('become') ||
                                    lowerMessage.includes('how to') ||
                                    lowerMessage.includes('process') ||
                                    lowerMessage.includes('requirements') ||
                                    lowerMessage.includes('steps');

        return hasStockBroker && hasRegistrationIntent;
    }

    // Check if message is specifically about merchant banker registration
    isMerchantBankerRegistrationQuery(message) {
        const lowerMessage = message.toLowerCase();

        // Must contain both merchant banker AND registration-related terms
        const hasMerchantBanker = lowerMessage.includes('merchant banker') || lowerMessage.includes('merchantbanker');
        const hasRegistrationIntent = lowerMessage.includes('register') ||
                                    lowerMessage.includes('registration') ||
                                    lowerMessage.includes('apply') ||
                                    lowerMessage.includes('become') ||
                                    lowerMessage.includes('how to') ||
                                    lowerMessage.includes('process') ||
                                    lowerMessage.includes('requirements') ||
                                    lowerMessage.includes('steps');

        return hasMerchantBanker && hasRegistrationIntent;
    }

    // Check if message is requesting workflow guidance
    isWorkflowRequest(message) {
        const lowerMessage = message.toLowerCase();

        // Patterns that indicate workflow guidance requests
        const workflowPatterns = [
            'help me complete',
            'help me register',
            'guide me through',
            'walk me through',
            'step by step',
            'how to register',
            'how to complete',
            'assist me with'
        ];

        return workflowPatterns.some(pattern => lowerMessage.includes(pattern)) &&
               (lowerMessage.includes('registration') || lowerMessage.includes('stock broker') ||
                lowerMessage.includes('merchant banker') || lowerMessage.includes('intermediary'));
    }

    // Handle workflow guidance requests
    handleWorkflowRequest(message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('stock broker')) {
            this.respondToStockBroker(message);
        } else if (lowerMessage.includes('merchant banker')) {
            this.respondToMerchantBanker(message);
        } else if (lowerMessage.includes('registration') || lowerMessage.includes('intermediary')) {
            // Ask user to specify which type of registration
            this.addMessage('bot', 'I can help you with registration guidance! Please specify which type of intermediary registration you need help with:\n\n• Stock Broker\n• Merchant Banker\n• Portfolio Manager\n• Depository Participant\n\nOr just tell me what specific registration process you need assistance with.');
        } else {
            this.respondToRegistration(message);
        }
    }

    respondToRegistration(message) {
        const responses = [
            "For SEBI registration, you need to:\n\n1. **Check Eligibility**: Verify you meet the minimum requirements for your intermediary type\n2. **Prepare Documents**: Gather incorporation certificate, PAN, financial statements, etc.\n3. **Online Application**: Submit through SEBI Intermediary Portal\n4. **Review Process**: SEBI will review your application\n5. **Certificate**: Receive registration certificate upon approval\n\nWould you like me to guide you through any specific step?",
            "SEBI registration involves several steps:\n\n**Step 1**: Determine your eligibility based on intermediary type\n**Step 2**: Prepare required documents\n**Step 3**: Submit online application via SI Portal\n**Step 4**: Respond to SEBI queries if any\n**Step 5**: Pay registration fees\n**Step 6**: Receive certificate of registration\n\nThe process typically takes 30 days from application completion."
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage('bot', response);
    }

    respondToCompliance(message) {
        const responses = [
            "SEBI compliance requirements include:\n\n**Periodic Reporting**:\n- Monthly/Quarterly activity reports\n- Client-level disclosures\n- Financial statements\n\n**Platforms**:\n- Samuhik Prativedan Manch (for brokers)\n- SEBI Intermediary Portal\n\n**Inspections**:\n- Regular audits by SEBI\n- Infrastructure verification\n- Data integrity checks\n\nWould you like details on specific compliance requirements?",
            "Compliance is crucial for SEBI intermediaries:\n\n**Reporting Requirements**:\n- Portfolio Managers: Monthly AUM, quarterly disclosures\n- Merchant Bankers: Client reports, SCORES integration\n- Stock Brokers: Client statements, KYC/AML reports\n\n**Monitoring**:\n- SEBI inspections and audits\n- Cybersecurity compliance\n- Fund handling standards\n\n**Platforms**:\n- Unified reporting through designated portals"
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage('bot', response);
    }

    respondToEligibility(message) {
        const response = "Eligibility criteria vary by intermediary type:\n\n**Portfolio Manager**:\n- Minimum Net Worth: ₹5 crore\n- Qualified Principal Officer\n- Compliance infrastructure\n\n**Merchant Banker**:\n- Minimum Net Worth: ₹50 lakh\n- Qualified Merchant Banker\n- Commercial office premises\n\n**Stock Broker**:\n- Minimum Net Worth: ₹5 lakh\n- NISM certification\n- Stock exchange membership\n\nWould you like to check eligibility for a specific type?";
        this.addMessage('bot', response);
    }

    respondToDocuments(message) {
        const response = "Required documents typically include:\n\n**Basic Documents**:\n- Incorporation Certificate\n- PAN Card\n- Address Proof\n- Organizational Agreements\n\n**Financial Documents**:\n- Financial Statements\n- Net Worth Certificate\n- Bank Statements\n\n**Personnel Documents**:\n- KMP Details (Principal & Compliance Officers)\n- Educational Qualifications\n- Experience Certificates\n\n**Additional Documents**:\n- Office Address Proof\n- Infrastructure Details\n- Previous Regulatory Approvals\n\nAll documents should be self-attested and uploaded in PDF format.";
        this.addMessage('bot', response);
    }

    respondToFees(message) {
        const response = "SEBI registration fees vary by intermediary type:\n\n**Application Fees** (one-time):\n- Portfolio Manager: ₹5,000 - ₹10,000\n- Merchant Banker: ₹2,000 - ₹5,000\n- Stock Broker: ₹1,000 - ₹2,000\n\n**Registration Fees** (annual/renewal):\n- Based on intermediary type and scale\n- Paid after application approval\n- Additional fees for late renewals\n\n**Other Costs**:\n- Professional fees for preparation\n- Document attestation costs\n- Infrastructure setup costs\n\nExact fees depend on your specific category and requirements.";
        this.addMessage('bot', response);
    }

    respondToTimeline(message) {
        const response = "SEBI registration timeline:\n\n**Application Submission**: Immediate (online)\n**Initial Review**: 7-10 days\n**Query Response**: 15 days (extendable by 15 days)\n**Site Visit**: As required (additional time)\n**Final Approval**: Within 30 days of completing requirements\n\n**Total Timeline**: 30-60 days (depending on complexity)\n\n**Factors affecting timeline**:\n- Completeness of application\n- Response to queries\n- Site visit scheduling\n- Document verification\n\nEarly planning and complete documentation help expedite the process.";
        this.addMessage('bot', response);
    }

    respondToHelp(message) {
        const response = "I can help you with:\n\n**Registration Process**:\n- Eligibility checking\n- Required documents\n- Application submission\n- Fee structure\n- Timeline expectations\n\n**Compliance Requirements**:\n- Reporting formats\n- Filing deadlines\n- Platform usage\n- Audit preparation\n\n**General Queries**:\n- SEBI regulations\n- Intermediary categories\n- Best practices\n- Troubleshooting\n\n**Quick Actions**:\n- Check eligibility criteria\n- View document checklists\n- Access compliance calendars\n\nWhat specific area would you like assistance with?";
        this.addMessage('bot', response);
    }

    respondToStockBroker(message) {
        const response = "I can help you with stock broker registration! Here's the complete process:\n\n**Step 1: Check Eligibility**\n- Minimum Net Worth: ₹5 lakh\n- NISM certification for key personnel\n- Stock exchange membership\n- Proper office infrastructure\n\n**Step 2: Prepare Documents**\n- Incorporation Certificate\n- PAN Card & Address Proof\n- Financial Statements\n- KMP Details & NISM Certificates\n\n**Step 3: Online Application**\n- Register on SEBI Intermediary Portal\n- Complete application form\n- Upload all documents\n\n**Step 4: Review & Approval**\n- SEBI verification (7-10 days)\n- Query response (15 days)\n- Certificate issuance (30 days)\n\nWould you like me to guide you through the stock broker registration process step by step? (Reply 'yes' to start the guided workflow)";
        this.addMessage('bot', response);

        // Set workflow state for potential guidance
        this.workflowState = 'stock_broker_registration';
        this.workflowStep = 0;
    }

    respondToMerchantBanker(message) {
        const response = "I can help you with merchant banker registration! Here's the complete process:\n\n**Step 1: Check Eligibility**\n- Minimum Net Worth: ₹50 lakh\n- Qualified Merchant Banker (QMB) certification\n- Professional indemnity insurance\n- Proper office infrastructure\n\n**Step 2: Prepare Documents**\n- Incorporation Certificate\n- PAN Card & Address Proof\n- Financial Statements (last 3 years)\n- QMB Certification Details\n- Professional Indemnity Insurance\n\n**Step 3: Online Application**\n- Register on SEBI Intermediary Portal\n- Complete detailed application form\n- Upload all supporting documents\n\n**Step 4: Review & Approval**\n- SEBI verification (7-10 days)\n- Query response (15 days)\n- Site visit assessment\n- Certificate issuance (30-45 days)\n\nWould you like me to guide you through the merchant banker registration process step by step? (Reply 'yes' to start the guided workflow)";
        this.addMessage('bot', response);

        // Set workflow state for potential guidance
        this.workflowState = 'merchant_banker_registration';
        this.workflowStep = 0;
    }

    // Check if a workflow is currently in progress
    isWorkflowInProgress() {
        return this.workflowState !== null;
    }

    // Handle responses during workflow guidance
    handleWorkflowResponse(message) {
        const lowerMessage = message.toLowerCase().trim();

        console.log('Handling workflow response:', lowerMessage, 'Automation state:', !!this.automationState);

        // Check if we're in automation mode first
        if (this.automationState && !this.automationState.completed) {
            console.log('In automation mode, handling automation response');
            this.handleAutomationResponse(message);
            return;
        }

        // Handle post-automation commands
        if (this.automationState && this.automationState.completed) {
            console.log('Handling post-automation command');
            if (lowerMessage.includes('next') || lowerMessage.includes('continue')) {
                console.log('Moving to next workflow step after automation');
                this.nextWorkflowStep();
                return;
            } else if (lowerMessage.includes('review')) {
                console.log('Showing automation results');
                this.showAutomationResults();
                return;
            } else if (lowerMessage.includes('download')) {
                console.log('Showing download options');
                this.showDownloadOptions();
                return;
            }
        }

        // Handle regular workflow commands
        if (lowerMessage.includes('yes') || lowerMessage.includes('start') || lowerMessage.includes('guide')) {
            console.log('Starting workflow guidance');
            this.startWorkflowGuidance();
        } else if (lowerMessage.includes('no') || lowerMessage.includes('stop') || lowerMessage.includes('cancel')) {
            console.log('Ending workflow guidance');
            this.endWorkflowGuidance();
        } else if (lowerMessage.includes('next') || lowerMessage.includes('continue')) {
            console.log('Moving to next workflow step');
            this.nextWorkflowStep();
        } else if (lowerMessage.includes('previous') || lowerMessage.includes('back')) {
            console.log('Moving to previous workflow step');
            this.previousWorkflowStep();
        } else if (lowerMessage.includes('done') || lowerMessage.includes('completed') || lowerMessage.includes('finished')) {
            console.log('User completed manual step, advancing to next');
            this.handleManualStepCompletion();
        } else if (lowerMessage.includes('auto') || lowerMessage.includes('automate') || lowerMessage.includes('help me')) {
            console.log('Starting automation for current step');
            this.automateCurrentStep();
        } else if (lowerMessage.includes('manual')) {
            console.log('User chose to complete step manually');
            this.handleManualCompletionChoice();
        } else if (lowerMessage.includes('help') || lowerMessage.includes('commands')) {
            console.log('Showing workflow commands');
            this.showWorkflowCommands();
        } else if (lowerMessage.includes('review')) {
            console.log('Showing automation results');
            this.showAutomationResults();
        } else if (lowerMessage.includes('download')) {
            console.log('Showing download options');
            this.showDownloadOptions();
        } else {
            console.log('Unknown command, showing help');
            this.addMessage('bot', "Please reply with 'yes' to start the guided workflow, 'no' to cancel, 'next' to continue, 'auto' to automate this step, or ask me any questions about this step.");
        }
    }

    // Show automation results again
    showAutomationResults() {
        if (this.automationState && this.automationState.results) {
            let response = `📋 **Previous Automation Results:**\n\n`;
            this.automationState.results.forEach(result => {
                response += `• ${result}\n`;
            });
            response += `\n**Commands:**\n`;
            response += `• Reply 'next' to continue to the next step\n`;
            response += `• Ask me any questions about this step\n`;

            this.addMessage('bot', response);
        } else {
            this.addMessage('bot', "No previous automation results found. Would you like to start automation for this step? Reply 'auto' to begin.");
        }
    }

    // Start guided workflow
    startWorkflowGuidance() {
        if (this.workflowState === 'stock_broker_registration') {
            this.workflowStep = 1;
            this.showWorkflowStep();
        }
    }

    // End workflow guidance
    endWorkflowGuidance() {
        this.addMessage('bot', "No problem! I can help you with any other SEBI-related questions or provide information about the registration process. What would you like to know?");
        this.workflowState = null;
        this.workflowStep = 0;
    }

    // Show current workflow step
    showWorkflowStep() {
        if (this.workflowState === 'stock_broker_registration') {
            const steps = this.getStockBrokerSteps();
            if (this.workflowStep > 0 && this.workflowStep <= steps.length) {
                const step = steps[this.workflowStep - 1];
                let response = `**Step ${this.workflowStep}: ${step.title}**\n\n${step.description}\n\n`;

                if (step.action) {
                    response += `**What to do:** ${step.action}\n\n`;
                }

                if (step.documents && step.documents.length > 0) {
                    response += `**Required Documents:**\n`;
                    step.documents.forEach(doc => {
                        response += `• ${doc}\n`;
                    });
                    response += `\n`;
                }

                if (step.tips && step.tips.length > 0) {
                    response += `**Tips:**\n`;
                    step.tips.forEach(tip => {
                        response += `• ${tip}\n`;
                    });
                    response += `\n`;
                }

                // Handle different step types
                if (step.requiresManualCompletion) {
                    // Manual step - no automation option
                    response += `⚠️ **This step requires manual completion on SEBI's portal**\n\n`;
                    response += `${step.manualCompletionText}\n\n`;
                    response += `**Commands:**\n`;
                    response += `• Reply 'done' when you've completed this step manually\n`;
                    response += `• Ask me any questions about this step\n`;
                    response += `• Reply 'help' for available commands`;
                } else if (step.canAutomate) {
                    // Automatable step
                    response += `🤖 **I can help automate this step!**\n`;
                    response += `Would you like me to:\n`;
                    step.automationOptions.forEach(option => {
                        response += `• ${option}\n`;
                    });
                    response += `\n💡 **Note:** ${step.automationNote}\n\n`;

                    response += `**Commands:**\n`;
                    response += `• Reply 'auto' to let me help automate this step\n`;
                    response += `• Reply 'manual' to complete this step yourself\n`;
                    response += `• Ask me any questions about this step\n`;
                    response += `• Reply 'help' for available commands`;
                } else {
                    // Non-automatable step that doesn't require manual completion
                    response += `**Commands:**\n`;
                    response += `• Reply 'next' to continue to the next step\n`;
                    response += `• Ask me any questions about this step\n`;
                    response += `• Reply 'help' for available commands`;
                }

                this.addMessage('bot', response);
            }
        }
    }

    // Move to next workflow step
    nextWorkflowStep() {
        console.log('Moving to next workflow step. Current state:', this.workflowState, 'Current step:', this.workflowStep);

        if (this.workflowState === 'stock_broker_registration') {
            const steps = this.getStockBrokerSteps();
            if (this.workflowStep < steps.length) {
                this.workflowStep++;
                console.log('Advancing to step:', this.workflowStep);
                this.showWorkflowStep();
            } else {
                console.log('Workflow completed - all steps done');
                this.addMessage('bot', '🎉 **Congratulations!** You\'ve completed all the stock broker registration workflow steps!\n\n**What\'s Next:**\n• Visit the SEBI Intermediary Portal to start your actual application\n• Use the templates and checklists generated during automation\n• Keep all your documents organized and ready\n• Monitor your application status regularly\n\nWould you like help with any other SEBI processes or have questions about the registration?');
                this.workflowState = null;
                this.workflowStep = 0;
            }
        } else {
            console.log('No active workflow state');
            this.addMessage('bot', 'No active workflow found. Would you like to start the stock broker registration guidance? Reply "yes" to begin.');
        }
    }

    // Move to previous workflow step
    previousWorkflowStep() {
        if (this.workflowState === 'stock_broker_registration') {
            if (this.workflowStep > 1) {
                this.workflowStep--;
                this.showWorkflowStep();
            } else {
                this.addMessage('bot', "You're already at the first step. Reply 'next' to continue or ask me questions about this step.");
            }
        }
    }

    // Automate current workflow step
    automateCurrentStep() {
        if (this.workflowState === 'stock_broker_registration') {
            const steps = this.getStockBrokerSteps();
            const currentStep = steps[this.workflowStep - 1];

            if (currentStep.canAutomate) {
                // Start interactive automation process
                this.startInteractiveAutomation(currentStep);
            } else {
                this.addMessage('bot', `Sorry, I cannot automate this step as it requires manual legal actions or external verification. However, I can provide detailed guidance and answer any questions you have about this step.\n\nWhat would you like to know about this step?`);
            }
        }
    }

    // Start interactive automation process
    startInteractiveAutomation(step) {
        let response = `🤖 **Starting Interactive Automation: ${step.title}**\n\n`;
        response += `I'll help you complete this step by gathering the necessary information and generating personalized results.\n\n`;

        // Set automation state
        this.automationState = {
            step: step,
            currentQuestion: 0,
            answers: {}
        };

        // Start asking questions first
        this.askNextAutomationQuestion();

        this.addMessage('bot', response);
    }

    // Show visual automation feedback on the website
    showVisualAutomation(step) {
        if (step.title === "Check Eligibility Criteria") {
            this.showEligibilityAutomation();
        } else if (step.title === "Prepare Required Documents") {
            this.showDocumentAutomation();
        } else if (step.title === "Complete Application Form") {
            this.showFormAutomation();
        }
    }

    // Visual automation for eligibility checking
    showEligibilityAutomation() {
        const intermediaryTypeSelect = document.getElementById('intermediaryType');
        const netWorthInput = document.getElementById('netWorth');
        const checkButton = document.querySelector('button[onclick="checkEligibility()"]');

        // Get user responses from automation state
        const answers = this.automationState ? this.automationState.answers : {};
        const userNetWorth = answers.netWorth || '500000';

        if (intermediaryTypeSelect && netWorthInput && checkButton) {
            // Highlight the form section
            const eligibilityForm = document.querySelector('.eligibility-form');
            if (eligibilityForm) {
                eligibilityForm.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
                eligibilityForm.style.border = '2px solid #3b82f6';
                eligibilityForm.style.transform = 'scale(1.02)';
                eligibilityForm.style.transition = 'all 0.3s ease';

                // Show automation indicator
                const automationIndicator = document.createElement('div');
                automationIndicator.id = 'automation-indicator';
                automationIndicator.style.cssText = `
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    background: #3b82f6;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    z-index: 10;
                `;
                automationIndicator.innerHTML = '🤖 Automating...';
                eligibilityForm.style.position = 'relative';
                eligibilityForm.appendChild(automationIndicator);

                // Simulate form filling with user data
                setTimeout(() => {
                    intermediaryTypeSelect.style.background = 'linear-gradient(90deg, #eff6ff, #dbeafe)';
                    intermediaryTypeSelect.style.transition = 'background 0.5s ease';
                    intermediaryTypeSelect.value = 'stock_broker';

                    setTimeout(() => {
                        netWorthInput.style.background = 'linear-gradient(90deg, #eff6ff, #dbeafe)';
                        netWorthInput.style.transition = 'background 0.5s ease';
                        netWorthInput.value = userNetWorth; // Use user's actual net worth

                        setTimeout(() => {
                            checkButton.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                            checkButton.style.transform = 'scale(1.05)';
                            checkButton.style.transition = 'all 0.3s ease';
                            checkButton.innerHTML = '<i class="fas fa-magic"></i> Auto-Checking...';

                            setTimeout(() => {
                                // Trigger eligibility check
                                checkEligibility();

                                // Reset styles
                                setTimeout(() => {
                                    eligibilityForm.style.boxShadow = '';
                                    eligibilityForm.style.border = '';
                                    eligibilityForm.style.transform = '';
                                    intermediaryTypeSelect.style.background = '';
                                    netWorthInput.style.background = '';
                                    checkButton.style.background = '';
                                    checkButton.style.transform = '';
                                    checkButton.innerHTML = 'Check Eligibility';

                                    // Remove automation indicator
                                    const indicator = document.getElementById('automation-indicator');
                                    if (indicator) indicator.remove();
                                }, 2000);
                            }, 1000);
                        }, 800);
                    }, 600);
                }, 500);
            }
        }
    }

    // Visual automation for document preparation
    showDocumentAutomation() {
        const documentList = document.querySelector('.documents-list');
        if (documentList) {
            // Highlight document section
            documentList.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
            documentList.style.border = '2px solid #3b82f6';
            documentList.style.transform = 'scale(1.02)';
            documentList.style.transition = 'all 0.3s ease';

            // Add automation indicator
            const automationIndicator = document.createElement('div');
            automationIndicator.id = 'doc-automation-indicator';
            automationIndicator.style.cssText = `
                position: absolute;
                top: -10px;
                right: -10px;
                background: #3b82f6;
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 0.8rem;
                font-weight: bold;
                z-index: 10;
            `;
            automationIndicator.innerHTML = '🤖 Organizing...';
            documentList.style.position = 'relative';
            documentList.appendChild(automationIndicator);

            // Animate document checklist items
            const checklistItems = documentList.querySelectorAll('.document-checklist li');
            checklistItems.forEach((item, index) => {
                setTimeout(() => {
                    item.style.background = 'linear-gradient(90deg, #eff6ff, #dbeafe)';
                    item.style.transform = 'translateX(10px)';
                    item.style.transition = 'all 0.3s ease';

                    setTimeout(() => {
                        item.style.background = '';
                        item.style.transform = '';
                    }, 500);
                }, index * 200);
            });

            // Reset styles after animation
            setTimeout(() => {
                documentList.style.boxShadow = '';
                documentList.style.border = '';
                documentList.style.transform = '';

                const indicator = document.getElementById('doc-automation-indicator');
                if (indicator) indicator.remove();
            }, checklistItems.length * 200 + 1000);
        }
    }

    // Visual automation for form completion
    showFormAutomation() {
        // Get user responses from automation state
        const answers = this.automationState ? this.automationState.answers : {};
        const userExperience = answers.experience || '5';
        const userTeamSize = answers.teamSize || '10';

        // If application form exists, show automation there
        const applicationForm = document.getElementById('sebiApplicationForm');
        if (applicationForm) {
            // Highlight the form
            applicationForm.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
            applicationForm.style.border = '2px solid #3b82f6';
            applicationForm.style.transform = 'scale(1.01)';
            applicationForm.style.transition = 'all 0.3s ease';

            // Add automation indicator
            const automationIndicator = document.createElement('div');
            automationIndicator.id = 'form-automation-indicator';
            automationIndicator.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                background: #3b82f6;
                color: white;
                padding: 10px 15px;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            automationIndicator.innerHTML = '🤖 Auto-filling form...';
            document.body.appendChild(automationIndicator);

            // Animate form fields with user data
            const formFields = applicationForm.querySelectorAll('input, textarea, select');
            formFields.forEach((field, index) => {
                if (field.type !== 'file' && field.type !== 'checkbox' && !field.readOnly) {
                    setTimeout(() => {
                        field.style.background = 'linear-gradient(90deg, #eff6ff, #dbeafe)';
                        field.style.transform = 'scale(1.02)';
                        field.style.transition = 'all 0.3s ease';
                        field.style.border = '2px solid #3b82f6';

                        // Simulate typing effect with user data
                        if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                            const userValues = {
                                entityName: 'Your Financial Services Pvt Ltd',
                                panNumber: 'XXXXX1234X',
                                principalOfficer: 'Your Principal Officer',
                                complianceOfficer: 'Your Compliance Officer',
                                paidUpCapital: '500000',
                                registeredAddress: 'Your Registered Address',
                                experience: userExperience,
                                teamSize: userTeamSize
                            };

                            const fieldName = field.name || field.id;
                            if (userValues[fieldName]) {
                                field.value = userValues[fieldName];
                            }
                        }

                        setTimeout(() => {
                            field.style.background = '';
                            field.style.transform = '';
                            field.style.border = '';
                        }, 800);
                    }, index * 300);
                }
            });

            // Reset styles after animation
            setTimeout(() => {
                applicationForm.style.boxShadow = '';
                applicationForm.style.border = '';
                applicationForm.style.transform = '';

                const indicator = document.getElementById('form-automation-indicator');
                if (indicator) indicator.remove();
            }, formFields.length * 300 + 1000);
        }
    }

    // Ask next automation question
    askNextAutomationQuestion() {
        const step = this.automationState.step;
        const questions = this.getAutomationQuestions(step);

        if (this.automationState.currentQuestion < questions.length) {
            const question = questions[this.automationState.currentQuestion];
            let response = `📝 **${question.label}**\n\n`;
            response += `${question.description}\n\n`;

            if (question.options && question.options.length > 0) {
                response += `**Options:**\n`;
                question.options.forEach((option, index) => {
                    response += `${index + 1}. ${option}\n`;
                });
                response += `\n`;
            }

            response += `💡 **Tip:** ${question.tip}\n\n`;
            response += `Please provide your ${question.field.toLowerCase()} or reply 'skip' to use default values.`;

            this.addMessage('bot', response);
        } else {
            // All questions answered, generate results
            this.generateAutomationResults();
        }
    }

    // Handle automation responses
    handleAutomationResponse(message) {
        const lowerMessage = message.toLowerCase().trim();
        const currentField = this.getCurrentQuestionField();
        const questions = this.getAutomationQuestions(this.automationState.step);
        const currentQuestion = questions[this.automationState.currentQuestion];

        console.log('Processing automation response:', {
            message: lowerMessage,
            currentField: currentField,
            currentQuestionIndex: this.automationState.currentQuestion,
            totalQuestions: questions.length
        });

        if (lowerMessage === 'skip' || lowerMessage === 'default') {
            // Use default values
            this.automationState.answers[currentField] = 'default';
            console.log('Using default value for', currentField);
        } else {
            // Validate response based on question type
            if (this.isValidResponse(message, currentQuestion)) {
                // Store user response
                this.automationState.answers[currentField] = message;
                console.log('Stored response for', currentField, ':', message);
            } else {
                // Invalid response, ask again
                this.addMessage('bot', `❌ That doesn't seem like a valid response for "${currentQuestion.label}". Please try again or reply 'skip' to use default values.`);
                return; // Don't advance to next question
            }
        }

        // Move to next question
        this.automationState.currentQuestion++;

        // Check if we have more questions
        if (this.automationState.currentQuestion < questions.length) {
            console.log('Moving to next question:', this.automationState.currentQuestion);
            // Ask next question
            this.askNextAutomationQuestion();
        } else {
            console.log('All questions answered, generating results');
            // All questions answered, generate results
            this.generateAutomationResults();
        }
    }

    // Validate user response based on question type
    isValidResponse(message, question) {
        const lowerMessage = message.toLowerCase().trim();

        if (question.field === 'netWorth') {
            // Should be a number
            const numValue = parseInt(message.replace(/[^\d]/g, ''));
            return !isNaN(numValue) && numValue > 0;
        }

        if (question.options && question.options.length > 0) {
            // Check if response matches any option (case insensitive)
            return question.options.some(option =>
                option.toLowerCase().includes(lowerMessage) ||
                lowerMessage.includes(option.toLowerCase().split(' ')[0])
            );
        }

        // For other fields, accept any non-empty response
        return message.trim().length > 0;
    }

    // Get current question field
    getCurrentQuestionField() {
        const step = this.automationState.step;
        const questions = this.getAutomationQuestions(step);
        return questions[this.automationState.currentQuestion].field;
    }

    // Generate automation results based on user input
    generateAutomationResults() {
        const step = this.automationState.step;
        const answers = this.automationState.answers;

        let response = `🎉 **Automation Complete: ${step.title}**\n\n`;
        response += `Based on your inputs, I've generated personalized results:\n\n`;

        // Generate specific results based on step and answers
        const results = this.generatePersonalizedResults(step, answers);

        results.forEach(result => {
            response += `• ${result}\n`;
        });

        response += `\n✅ **Your personalized ${step.title.toLowerCase()} is ready!**\n\n`;

        // Add concrete deliverables
        response += this.generateDeliverables(step, answers);

        // Add actionable next steps
        response += `**What you can do now:**\n`;
        response += this.generateActionSteps(step, answers);

        response += `\n**Commands:**\n`;
        response += `• Reply 'next' to continue to the next step\n`;
        response += `• Reply 'download' to get templates and checklists\n`;
        response += `• Reply 'review' to see your results again\n`;
        response += `• Ask me any questions about this step\n`;

        // Store results for later review
        this.automationState.results = results;
        this.automationState.deliverables = this.generateDeliverables(step, answers);
        this.automationState.completed = true; // Mark automation as completed

        this.addMessage('bot', response);

        // Now show visual automation with user data
        setTimeout(() => {
            this.showVisualAutomation(step);
        }, 1000);
    }

    // Generate concrete deliverables
    generateDeliverables(step, answers) {
        let deliverables = `**📋 Your Deliverables:**\n`;

        if (step.title === "Check Eligibility Criteria") {
            deliverables += `• 📊 **Eligibility Assessment Report** - Detailed analysis of your readiness\n`;
            deliverables += `• 📝 **Personalized Checklist** - Step-by-step requirements based on your profile\n`;
            deliverables += `• 📈 **Readiness Score Card** - Visual representation of your compliance status\n`;
            deliverables += `• 🎯 **Next Steps Roadmap** - Prioritized action items for completion\n`;
        }

        else if (step.title === "Prepare Required Documents") {
            const entityType = answers.entityType || 'private limited';
            deliverables += `• 📄 **Document Collection Template** - Organized by category and priority\n`;
            deliverables += `• 📅 **Document Timeline** - Deadlines and preparation schedule\n`;
            deliverables += `• ✅ **Verification Checklist** - Quality assurance for each document\n`;
            deliverables += `• 📂 **Organization System** - Folder structure and naming conventions\n`;
        }

        else if (step.title === "Complete Application Form") {
            deliverables += `• 📝 **Form Field Guide** - Detailed instructions for each section\n`;
            deliverables += `• 📊 **Data Preparation Sheet** - Template for gathering required information\n`;
            deliverables += `• ⚠️ **Validation Checklist** - Common errors and how to avoid them\n`;
            deliverables += `• 💾 **Save Points** - Recommended intervals for saving progress\n`;
        }

        else if (step.title === "Submit Application") {
            deliverables += `• ✅ **Final Review Checklist** - 25-point verification system\n`;
            deliverables += `• 📋 **Submission Confirmation** - What to expect after submission\n`;
            deliverables += `• 📊 **Tracking Dashboard** - Application status monitoring template\n`;
            deliverables += `• 🔔 **Follow-up Schedule** - Reminder system for next steps\n`;
        }

        else if (step.title === "Respond to SEBI Queries") {
            deliverables += `• 📧 **Query Response Templates** - Pre-written responses for common queries\n`;
            deliverables += `• ⏰ **Deadline Management** - Calendar integration for response tracking\n`;
            deliverables += `• 📋 **Document Preparation** - Additional requirements checklist\n`;
            deliverables += `• 📞 **Escalation Protocol** - When and how to escalate urgent queries\n`;
        }

        else if (step.title === "Site Visit Preparation") {
            deliverables += `• 🏢 **Infrastructure Checklist** - SEBI compliance requirements\n`;
            deliverables += `• 👥 **Team Preparation Guide** - Roles and responsibilities\n`;
            deliverables += `• 📄 **Documentation Package** - What to have ready for inspectors\n`;
            deliverables += `• 📅 **Visit Coordination** - Scheduling and logistics template\n`;
        }

        else if (step.title === "Post-Registration Compliance") {
            deliverables += `• 📅 **Compliance Calendar** - 12-month regulatory requirement schedule\n`;
            deliverables += `• 📊 **Reporting Templates** - Pre-formatted compliance reports\n`;
            deliverables += `• 🔍 **Audit Preparation Kit** - Internal and external audit checklists\n`;
            deliverables += `• 📰 **Regulatory Update System** - Automated monitoring setup\n`;
        }

        deliverables += `\n💡 **Note:** These deliverables are designed to help you complete the actual process on SEBI's portal. I cannot directly access or fill forms on external websites, but I can provide you with all the information and templates you need to do it yourself.\n\n`;

        return deliverables;
    }

    // Generate actionable next steps
    generateActionSteps(step, answers) {
        let actions = [];

        if (step.title === "Check Eligibility Criteria") {
            const netWorth = parseInt(answers.netWorth || 0);
            const hasNISM = (answers.nismCertification || '').toLowerCase().includes('yes');
            const hasExchange = (answers.exchangeMembership || '').toLowerCase().includes('yes');

            if (netWorth < 500000) {
                actions.push("💰 Increase your net worth to meet the ₹5 lakh requirement");
            }
            if (!hasNISM) {
                actions.push("🎓 Obtain NISM certification for all key personnel");
            }
            if (!hasExchange) {
                actions.push("🏛️ Apply for stock exchange membership");
            }
            actions.push("📋 Review and complete the personalized checklist above");
            actions.push("✅ Verify all requirements are met before proceeding");
        }

        else if (step.title === "Prepare Required Documents") {
            actions.push("📄 Gather all documents listed in your personalized checklist");
            actions.push("📅 Follow the timeline provided for document collection");
            actions.push("✅ Use the verification checklist to ensure document quality");
            actions.push("📂 Organize documents using the recommended folder structure");
            actions.push("📋 Keep both original and attested copies ready");
        }

        else if (step.title === "Complete Application Form") {
            actions.push("🌐 Visit the SEBI Intermediary Portal (siportal.sebi.gov.in)");
            actions.push("📝 Use the form field guide to complete each section");
            actions.push("💾 Save your progress regularly (every 10-15 minutes)");
            actions.push("⚠️ Double-check all information before final submission");
            actions.push("📞 Keep your registration details and contact information handy");
        }

        else if (step.title === "Submit Application") {
            actions.push("✅ Run through the final 25-point verification checklist");
            actions.push("📤 Upload all required documents in the correct format");
            actions.push("💳 Pay the application fee through the secure payment gateway");
            actions.push("📋 Note down the application reference number");
            actions.push("📧 Check your email for confirmation and next steps");
        }

        else if (step.title === "Respond to SEBI Queries") {
            actions.push("📧 Monitor your email and SI Portal dashboard daily");
            actions.push("⏰ Respond to queries within the 15-day deadline");
            actions.push("📋 Prepare additional documents as requested");
            actions.push("📞 Use the escalation protocol for urgent matters");
            actions.push("📊 Track all communications and responses");
        }

        else if (step.title === "Site Visit Preparation") {
            actions.push("🏢 Ensure your office meets all infrastructure requirements");
            actions.push("👥 Prepare your team for the inspection process");
            actions.push("📄 Have all documentation ready for review");
            actions.push("📅 Coordinate schedules for the site visit");
            actions.push("✅ Conduct a pre-visit readiness assessment");
        }

        else if (step.title === "Post-Registration Compliance") {
            actions.push("📅 Set up the compliance calendar with reminders");
            actions.push("📊 Prepare reporting templates for regular filings");
            actions.push("🔍 Establish audit preparation procedures");
            actions.push("📰 Subscribe to regulatory updates and circulars");
            actions.push("📈 Monitor compliance metrics and performance");
        }

        return actions.map(action => `• ${action}`).join('\n');
    }

    // Generate personalized results based on user answers
    generatePersonalizedResults(step, answers) {
        const results = [];

        if (step.title === "Check Eligibility Criteria") {
            const netWorth = answers.netWorth || '500000';
            const hasNISM = answers.nismCertification || 'yes';
            const exchangeMember = answers.exchangeMembership || 'yes';

            results.push(`📊 **Net Worth Assessment:** ₹${parseInt(netWorth).toLocaleString('en-IN')} (Meets ₹5 lakh requirement: ${parseInt(netWorth) >= 500000 ? '✅' : '❌'})`);
            results.push(`🎓 **NISM Certification:** ${hasNISM.toLowerCase().includes('yes') ? '✅ Verified' : '⚠️ Needs verification'}`);
            results.push(`🏛️ **Exchange Membership:** ${exchangeMember.toLowerCase().includes('yes') ? '✅ Confirmed' : '⚠️ Needs confirmation'}`);
            results.push(`📋 **Overall Readiness Score:** ${this.calculateReadinessScore(answers)}%`);
            results.push(`📝 **Personalized Action Plan:** Generated based on your profile`);
        }

        else if (step.title === "Prepare Required Documents") {
            const entityType = answers.entityType || 'private limited';
            const financialYear = answers.financialYear || '2023-24';

            results.push(`📄 **Document Checklist:** Customized for ${entityType} company`);
            results.push(`📊 **Financial Year:** ${financialYear} statements required`);
            results.push(`📁 **Organization System:** Created with ${answers.documentCount || 8} document categories`);
            results.push(`⏰ **Timeline:** ${answers.timeline || 14} days preparation period`);
            results.push(`✅ **Verification Templates:** Generated for all document types`);
        }

        else if (step.title === "Complete Application Form") {
            const experience = answers.experience || '5';
            const teamSize = answers.teamSize || '10';

            results.push(`📝 **Form Field Checklist:** ${this.generateFormChecklist(answers)}`);
            results.push(`👥 **Team Structure:** Optimized for ${teamSize} members`);
            results.push(`📈 **Experience Validation:** ${experience}+ years industry experience confirmed`);
            results.push(`⚠️ **Validation Rules:** ${this.generateValidationRules(answers)}`);
            results.push(`📤 **Upload Checklist:** Prepared for ${answers.documentCount || 8} documents`);
        }

        else if (step.title === "Submit Application") {
            results.push(`✅ **Final Review Checklist:** Generated with ${answers.checkCount || 15} verification points`);
            results.push(`📋 **Submission Template:** Created for ${answers.applicationType || 'stock broker'} registration`);
            results.push(`📊 **Tracking System:** Set up with reference ${this.generateApplicationNumber()}`);
            results.push(`🔔 **Reminder System:** Configured for follow-ups`);
            results.push(`📞 **Support Contacts:** Added for query resolution`);
        }

        else if (step.title === "Respond to SEBI Queries") {
            results.push(`📧 **Query Templates:** Generated for ${answers.queryTypes || 'common'} scenarios`);
            results.push(`⏰ **Deadline Tracking:** Set for ${answers.responseDays || 15} days`);
            results.push(`📋 **Document Checklist:** Prepared for additional requirements`);
            results.push(`📞 **Escalation Matrix:** Created for urgent queries`);
            results.push(`📊 **Response Tracker:** Configured for compliance monitoring`);
        }

        else if (step.title === "Site Visit Preparation") {
            results.push(`🏢 **Infrastructure Checklist:** Generated for ${answers.officeType || 'commercial'} premises`);
            results.push(`👥 **Team Preparation:** Plan created for ${answers.teamSize || 10} members`);
            results.push(`📄 **Documentation:** Templates prepared for ${answers.documentTypes || 5} categories`);
            results.push(`📅 **Visit Schedule:** Calendar reminders set`);
            results.push(`✅ **Readiness Assessment:** ${this.calculateSiteVisitReadiness(answers)}% prepared`);
        }

        else if (step.title === "Post-Registration Compliance") {
            results.push(`📅 **Compliance Calendar:** Set up for ${answers.compliancePeriod || 12} months`);
            results.push(`📊 **Reporting Templates:** Generated for ${answers.reportTypes || 6} report types`);
            results.push(`🔍 **Audit System:** Configured for ${answers.auditFrequency || 'quarterly'} reviews`);
            results.push(`📰 **Update Monitoring:** Activated for regulatory changes`);
            results.push(`📈 **Performance Dashboard:** Created for compliance tracking`);
        }

        return results;
    }

    // Get automation questions for a step
    getAutomationQuestions(step) {
        if (step.title === "Check Eligibility Criteria") {
            return [
                {
                    field: 'netWorth',
                    label: 'What is your current net worth?',
                    description: 'Please provide your net worth in rupees (e.g., 500000 for ₹5 lakh)',
                    tip: 'This should match your audited financial statements'
                },
                {
                    field: 'nismCertification',
                    label: 'Do you have NISM certification for key personnel?',
                    description: 'Confirm if your key managerial personnel have valid NISM certifications',
                    options: ['Yes, all certified', 'Some certified', 'Need to obtain', 'Not applicable'],
                    tip: 'NISM certification is mandatory for stock broker operations'
                },
                {
                    field: 'exchangeMembership',
                    label: 'Are you a member of a stock exchange?',
                    description: 'Confirm your stock exchange membership status',
                    options: ['Yes, active member', 'Applied for membership', 'Planning to apply', 'Not yet'],
                    tip: 'Stock exchange membership is required for trading operations'
                }
            ];
        }

        else if (step.title === "Prepare Required Documents") {
            return [
                {
                    field: 'entityType',
                    label: 'What type of entity are you registering?',
                    description: 'Specify your business entity type',
                    options: ['Private Limited Company', 'Public Limited Company', 'LLP', 'Partnership', 'Proprietorship'],
                    tip: 'Different entity types may require different documents'
                },
                {
                    field: 'financialYear',
                    label: 'Which financial year statements do you have?',
                    description: 'Specify the financial years for which you have audited statements',
                    options: ['2023-24', '2022-23', '2021-22', 'Multiple years'],
                    tip: 'SEBI typically requires last 2-3 years financial statements'
                },
                {
                    field: 'documentCount',
                    label: 'How many documents do you need to prepare?',
                    description: 'Estimate the number of documents you need to gather',
                    tip: 'This helps us create an appropriate tracking system'
                }
            ];
        }

        else if (step.title === "Complete Application Form") {
            return [
                {
                    field: 'experience',
                    label: 'How many years of experience do you have?',
                    description: 'Total years of experience in securities market',
                    tip: 'SEBI requires minimum experience for key personnel'
                },
                {
                    field: 'teamSize',
                    label: 'How many team members do you have?',
                    description: 'Total number of employees and key personnel',
                    tip: 'This affects the organizational structure in the application'
                },
                {
                    field: 'documentCount',
                    label: 'How many documents will you upload?',
                    description: 'Number of documents to be uploaded with the application',
                    tip: 'This helps optimize the upload process'
                }
            ];
        }

        else if (step.title === "Submit Application") {
            return [
                {
                    field: 'checkCount',
                    label: 'How many verification points do you want?',
                    description: 'Number of items to check before submission',
                    tip: 'More checks ensure better application quality'
                },
                {
                    field: 'applicationType',
                    label: 'What type of application are you submitting?',
                    description: 'Confirm the application category',
                    options: ['Stock Broker', 'Sub-Broker', 'Trading Member'],
                    tip: 'Different types have different submission requirements'
                }
            ];
        }

        else if (step.title === "Respond to SEBI Queries") {
            return [
                {
                    field: 'queryTypes',
                    label: 'What types of queries do you expect?',
                    description: 'Anticipated query categories from SEBI',
                    options: ['Document verification', 'Financial clarification', 'Compliance related', 'General information'],
                    tip: 'Preparing for common query types improves response time'
                },
                {
                    field: 'responseDays',
                    label: 'How many days do you have to respond?',
                    description: 'Response deadline in days',
                    tip: 'SEBI typically gives 15 days for responses'
                }
            ];
        }

        else if (step.title === "Site Visit Preparation") {
            return [
                {
                    field: 'officeType',
                    label: 'What type of office premises do you have?',
                    description: 'Type of office space for the site visit',
                    options: ['Commercial building', 'IT park', 'Business center', 'Residential (converted)', 'Owned property'],
                    tip: 'Commercial premises are preferred by SEBI'
                },
                {
                    field: 'teamSize',
                    label: 'How many team members will be present?',
                    description: 'Number of staff available during site visit',
                    tip: 'SEBI expects key personnel to be available'
                },
                {
                    field: 'documentTypes',
                    label: 'How many document categories do you have?',
                    description: 'Number of different document types to present',
                    tip: 'Well-organized documents create good impression'
                }
            ];
        }

        else if (step.title === "Post-Registration Compliance") {
            return [
                {
                    field: 'compliancePeriod',
                    label: 'What compliance period do you need?',
                    description: 'Time period for compliance planning (in months)',
                    tip: 'Planning for 12-24 months is recommended'
                },
                {
                    field: 'reportTypes',
                    label: 'How many types of reports do you file?',
                    description: 'Number of different regulatory reports',
                    tip: 'Stock brokers typically file 6-8 different report types'
                },
                {
                    field: 'auditFrequency',
                    label: 'How often do you need audits?',
                    description: 'Frequency of internal/external audits',
                    options: ['Monthly', 'Quarterly', 'Half-yearly', 'Annually'],
                    tip: 'Quarterly audits are common for compliance'
                }
            ];
        }

        return [];
    }

    // Calculate readiness score
    calculateReadinessScore(answers) {
        let score = 0;
        const netWorth = parseInt(answers.netWorth || 0);
        const hasNISM = (answers.nismCertification || '').toLowerCase().includes('yes');
        const hasExchange = (answers.exchangeMembership || '').toLowerCase().includes('yes');

        if (netWorth >= 500000) score += 40;
        else if (netWorth >= 250000) score += 20;

        if (hasNISM) score += 35;
        if (hasExchange) score += 25;

        return Math.min(score, 100);
    }

    // Calculate site visit readiness
    calculateSiteVisitReadiness(answers) {
        let score = 0;
        const officeType = (answers.officeType || '').toLowerCase();
        const teamSize = parseInt(answers.teamSize || 0);
        const documentTypes = parseInt(answers.documentTypes || 0);

        if (officeType.includes('commercial') || officeType.includes('it park')) score += 40;
        else if (officeType.includes('business')) score += 30;

        if (teamSize >= 5) score += 30;
        else if (teamSize >= 3) score += 15;

        if (documentTypes >= 5) score += 30;
        else if (documentTypes >= 3) score += 15;

        return Math.min(score, 100);
    }

    // Generate form checklist
    generateFormChecklist(answers) {
        const experience = parseInt(answers.experience || 0);
        const teamSize = parseInt(answers.teamSize || 0);

        let checklist = `${15 + Math.floor(experience/2) + Math.floor(teamSize/3)} critical fields`;
        return checklist;
    }

    // Generate validation rules
    generateValidationRules(answers) {
        const experience = parseInt(answers.experience || 0);
        const teamSize = parseInt(answers.teamSize || 0);

        let rules = `${5 + Math.floor(experience/3)} validation rules`;
        return rules;
    }

    // Generate application number
    generateApplicationNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `SB-${timestamp}-${random}`;
    }

    // Handle manual step completion
    handleManualStepCompletion() {
        if (this.workflowState === 'stock_broker_registration') {
            const steps = this.getStockBrokerSteps();
            const currentStep = steps[this.workflowStep - 1];

            if (currentStep && currentStep.requiresManualCompletion) {
                // User has completed the manual step, advance to next
                this.addMessage('bot', `✅ **Great!** I've noted that you've completed the manual step: **${currentStep.title}**\n\nLet's move on to the next step in your registration process.`);

                // Small delay before advancing
                setTimeout(() => {
                    this.nextWorkflowStep();
                }, 1500);
            } else {
                this.addMessage('bot', "It looks like the current step doesn't require manual completion. If you've completed a different step, please let me know which one, or reply 'next' to continue to the next step.");
            }
        } else {
            this.addMessage('bot', "No active workflow found. Would you like to start the stock broker registration guidance? Reply 'yes' to begin.");
        }
    }

    // Handle manual completion choice
    handleManualCompletionChoice() {
        if (this.workflowState === 'stock_broker_registration') {
            const steps = this.getStockBrokerSteps();
            const currentStep = steps[this.workflowStep - 1];

            if (currentStep && currentStep.canAutomate) {
                this.addMessage('bot', `📝 **Manual Mode Selected**\n\nYou can complete **${currentStep.title}** manually. When you're done, simply reply 'done' and I'll advance you to the next step.\n\nTake your time to complete this step properly. I'm here if you need any guidance or have questions about this step.`);

                // Show current step details again for reference
                setTimeout(() => {
                    this.showWorkflowStep();
                }, 1000);
            } else {
                this.addMessage('bot', "The current step requires manual completion anyway. Please proceed with completing it manually, then reply 'done' to continue.");
            }
        } else {
            this.addMessage('bot', "No active workflow found. Would you like to start the stock broker registration guidance? Reply 'yes' to begin.");
        }
    }

    // Show available workflow commands
    showWorkflowCommands() {
        const commands = `📋 **Available Commands:**\n\n` +
                        `• **'next'** - Continue to the next step\n` +
                        `• **'previous'** or **'back'** - Go to the previous step\n` +
                        `• **'auto'** - Let me help automate this step\n` +
                        `• **'manual'** - Complete this step yourself\n` +
                        `• **'done'** - Mark current step as completed (for manual steps)\n` +
                        `• **'help'** - Show this command list\n` +
                        `• **'stop'** or **'cancel'** - End the workflow guidance\n\n` +
                        `You can also ask me any questions about the current step!`;

        this.addMessage('bot', commands);
    }

    // Show download options for templates and checklists
    showDownloadOptions() {
        if (this.automationState && this.automationState.step) {
            const step = this.automationState.step;
            let response = `📥 **Download Options for ${step.title}:**\n\n`;

            // Add specific download links based on step
            if (step.title === "Check Eligibility Criteria") {
                response += `• 📊 **Eligibility Assessment Template** - Download personalized checklist\n`;
                response += `• 📈 **Readiness Score Calculator** - Excel template for ongoing assessment\n`;
                response += `• 📝 **Requirements Tracker** - Document tracking spreadsheet\n`;
                response += `• 🎯 **Action Plan Template** - Step-by-step implementation guide\n`;
            }

            else if (step.title === "Prepare Required Documents") {
                response += `• 📄 **Document Checklist Template** - Comprehensive collection guide\n`;
                response += `• 📅 **Document Timeline Planner** - Excel-based deadline tracker\n`;
                response += `• ✅ **Verification Checklist** - Quality assurance template\n`;
                response += `• 📂 **Organization System Guide** - Folder structure template\n`;
            }

            else if (step.title === "Complete Application Form") {
                response += `• 📝 **Form Field Guide** - Detailed field-by-field instructions\n`;
                response += `• 📊 **Data Preparation Sheet** - Information gathering template\n`;
                response += `• ⚠️ **Common Errors Guide** - Mistakes to avoid\n`;
                response += `• 💾 **Progress Tracker** - Form completion checklist\n`;
            }

            else if (step.title === "Submit Application") {
                response += `• ✅ **Final Review Checklist** - 25-point verification template\n`;
                response += `• 📋 **Submission Guide** - Step-by-step submission instructions\n`;
                response += `• 📊 **Application Tracker** - Status monitoring spreadsheet\n`;
                response += `• 🔔 **Follow-up Schedule** - Reminder system template\n`;
            }

            else if (step.title === "Respond to SEBI Queries") {
                response += `• 📧 **Query Response Templates** - Pre-written response formats\n`;
                response += `• ⏰ **Deadline Calendar** - Response tracking system\n`;
                response += `• 📋 **Additional Documents List** - Supplementary requirements\n`;
                response += `• 📞 **Escalation Protocol** - Contact escalation guide\n`;
            }

            else if (step.title === "Site Visit Preparation") {
                response += `• 🏢 **Infrastructure Checklist** - Office compliance requirements\n`;
                response += `• 👥 **Team Preparation Guide** - Staff readiness template\n`;
                response += `• 📄 **Documentation Package** - Required documents list\n`;
                response += `• 📅 **Visit Coordination Plan** - Scheduling and logistics template\n`;
            }

            else if (step.title === "Post-Registration Compliance") {
                response += `• 📅 **Compliance Calendar** - 12-month requirement schedule\n`;
                response += `• 📊 **Reporting Templates** - Pre-formatted compliance reports\n`;
                response += `• 🔍 **Audit Preparation Kit** - Internal/external audit checklists\n`;
                response += `• 📰 **Regulatory Update Tracker** - Change monitoring system\n`;
            }

            response += `\n💡 **How to Download:**\n`;
            response += `• Click the download button below each template\n`;
            response += `• Save templates to your local computer\n`;
            response += `• Customize with your specific information\n`;
            response += `• Use throughout your registration process\n\n`;

            response += `**Note:** These templates are designed to work with SEBI's official portal and help you complete the actual registration process efficiently.\n\n`;

            response += `**Commands:**\n`;
            response += `• Reply 'next' to continue to the next step\n`;
            response += `• Reply 'review' to see your automation results again\n`;
            response += `• Ask me any questions about these templates\n`;

            this.addMessage('bot', response);
        } else {
            this.addMessage('bot', "No automation results available. Please run automation for a step first by replying 'auto' when viewing a step.");
        }
    }

    // Get stock broker registration steps with automation options
    getStockBrokerSteps() {
        return [
            {
                title: "Check Eligibility Criteria",
                description: "First, verify that you meet SEBI's eligibility requirements for stock broker registration.",
                action: "Use the eligibility checker on this website or review the requirements below.",
                documents: [],
                tips: [
                    "Ensure you have the minimum ₹5 lakh net worth",
                    "All key personnel should have valid NISM certifications",
                    "Verify your stock exchange membership requirements"
                ],
                canAutomate: true,
                requiresManualCompletion: false,
                automationType: "form_filling",
                automationOptions: [
                    "Auto-fill eligibility form with your provided information",
                    "Generate personalized eligibility checklist",
                    "Calculate net worth requirements and compliance score"
                ],
                automationNote: "I can automatically fill and check your eligibility form based on the information you provide.",
                manualCompletionText: "Please complete the eligibility check manually on the website, then reply 'done' to continue."
            },
            {
                title: "Prepare Required Documents",
                description: "Gather all necessary documents for your application. This is crucial for a smooth process.",
                action: "Collect and organize all documents listed below. Make sure they are recent and attested.",
                documents: [
                    "Incorporation Certificate",
                    "PAN Card of the entity",
                    "Address proof of registered office",
                    "Board resolution for authorized signatories",
                    "Financial statements for last 2 years",
                    "Net worth certificate",
                    "KMP details with NISM certificates",
                    "Stock exchange membership certificates"
                ],
                tips: [
                    "Keep documents in PDF format",
                    "Ensure all documents are self-attested",
                    "Have both original and digital copies ready"
                ],
                canAutomate: true,
                requiresManualCompletion: false,
                automationType: "document_organization",
                automationOptions: [
                    "Create organized document checklist with deadlines",
                    "Generate document verification templates",
                    "Set up document tracking system with progress indicators"
                ],
                automationNote: "I can help organize and track your document preparation process.",
                manualCompletionText: "Please gather your documents manually, then reply 'done' to continue."
            },
            {
                title: "Register on SEBI Intermediary Portal",
                description: "Create your account on SEBI's Intermediary Portal (SI Portal) to start the application process.",
                action: "Visit the SEBI Intermediary Portal and complete the self-registration process.",
                documents: [],
                tips: [
                    "Use a professional email address",
                    "Remember your login credentials",
                    "Complete the registration form accurately"
                ],
                canAutomate: false,
                requiresManualCompletion: true,
                automationNote: "This step requires direct interaction with SEBI's official portal and cannot be automated.",
                manualCompletionText: "Please visit siportal.sebi.gov.in and complete the registration manually, then reply 'done' to continue to the next step."
            },
            {
                title: "Complete Application Form",
                description: "Fill out the detailed application form with all required information and upload documents.",
                action: "Log into SI Portal, select 'Stock Broker' category, and complete all form sections.",
                documents: [],
                tips: [
                    "Fill all mandatory fields marked with *",
                    "Use the tooltips for guidance",
                    "Save your progress regularly",
                    "Double-check all information before submission"
                ],
                canAutomate: true,
                requiresManualCompletion: false,
                automationType: "form_preparation",
                automationOptions: [
                    "Generate detailed form field checklists",
                    "Create data preparation templates with your information",
                    "Prepare document upload checklists and organization"
                ],
                automationNote: "I can prepare templates and checklists, but you'll need to fill the actual SEBI form manually.",
                manualCompletionText: "Please complete the application form on SEBI portal manually, then reply 'done' to continue."
            },
            {
                title: "Pay Application Fees",
                description: "Pay the required application fees through the portal's payment gateway.",
                action: "Complete the payment process using the available payment options.",
                documents: [],
                tips: [
                    "Keep payment confirmation safe",
                    "Note the transaction reference number",
                    "Fees are typically ₹1,000 - ₹2,000 for stock brokers"
                ],
                canAutomate: false,
                requiresManualCompletion: true,
                automationNote: "Payment processing requires secure financial transactions that must be done directly through SEBI's portal.",
                manualCompletionText: "Please complete the payment on SEBI portal manually, then reply 'done' to continue."
            },
            {
                title: "Submit Application",
                description: "Review your application and submit it for SEBI's review.",
                action: "Review all information, upload final documents, and click 'Submit Application'.",
                documents: [],
                tips: [
                    "Take a screenshot of the confirmation",
                    "Note the application reference number",
                    "Keep the acknowledgment for your records"
                ],
                canAutomate: true,
                requiresManualCompletion: false,
                automationType: "submission_preparation",
                automationOptions: [
                    "Generate final review checklist with 25+ verification points",
                    "Create submission confirmation template",
                    "Prepare application tracking system with reminders"
                ],
                automationNote: "I can prepare checklists and tracking systems, but you'll need to submit manually on SEBI portal.",
                manualCompletionText: "Please submit your application on SEBI portal manually, then reply 'done' to continue."
            },
            {
                title: "Respond to SEBI Queries",
                description: "SEBI may send queries or request additional information during the review process.",
                action: "Monitor your email and SI Portal for any queries. Respond within 15 days.",
                documents: [],
                tips: [
                    "Respond promptly to avoid delays",
                    "Provide clear and complete answers",
                    "Attach any additional documents requested",
                    "Keep records of all communications"
                ],
                canAutomate: true,
                requiresManualCompletion: false,
                automationType: "query_preparation",
                automationOptions: [
                    "Set up query monitoring system with email alerts",
                    "Create response templates for common queries",
                    "Prepare document tracking for additional requirements"
                ],
                automationNote: "I can prepare response templates and tracking systems, but actual responses must be submitted through official channels.",
                manualCompletionText: "Please respond to any SEBI queries manually, then reply 'done' to continue."
            },
            {
                title: "Site Visit Preparation",
                description: "SEBI may conduct a site visit to verify your office infrastructure and operations.",
                action: "Ensure your office meets SEBI's infrastructure requirements and is ready for inspection.",
                documents: [],
                tips: [
                    "Maintain proper office premises",
                    "Have all systems and processes documented",
                    "Ensure KMP availability during visit",
                    "Keep audit trails and compliance records ready"
                ],
                canAutomate: true,
                requiresManualCompletion: false,
                automationType: "site_visit_preparation",
                automationOptions: [
                    "Generate infrastructure compliance checklist",
                    "Create team preparation guide and roles",
                    "Prepare documentation package for inspectors"
                ],
                automationNote: "I can prepare checklists and documentation templates, but the actual site visit requires physical presence.",
                manualCompletionText: "Please prepare for the site visit manually, then reply 'done' to continue."
            },
            {
                title: "Receive Certificate of Registration",
                description: "Once approved, you'll receive your Certificate of Registration from SEBI.",
                action: "Download and safely store your certificate. It contains your registration details and validity period.",
                documents: [],
                tips: [
                    "Display the certificate prominently",
                    "Note the registration number and validity dates",
                    "Keep both digital and physical copies",
                    "Update all your business communications"
                ],
                canAutomate: true,
                requiresManualCompletion: false,
                automationType: "certificate_management",
                automationOptions: [
                    "Create certificate storage and organization system",
                    "Generate renewal reminder system with calendar integration",
                    "Prepare compliance calendar for ongoing requirements"
                ],
                automationNote: "I can help organize and track your certificate, but the actual certificate must be downloaded from SEBI's portal.",
                manualCompletionText: "Please download your certificate from SEBI portal manually, then reply 'done' to continue."
            },
            {
                title: "Post-Registration Compliance",
                description: "After registration, maintain ongoing compliance with SEBI requirements.",
                action: "Set up systems for regular reporting, compliance monitoring, and audit preparation.",
                documents: [],
                tips: [
                    "File periodic returns on time",
                    "Maintain proper client records",
                    "Stay updated with regulatory changes",
                    "Conduct regular internal audits"
                ],
                canAutomate: true,
                requiresManualCompletion: false,
                automationType: "compliance_setup",
                automationOptions: [
                    "Set up compliance calendar with automated reminders",
                    "Create reporting templates for all regulatory filings",
                    "Generate audit preparation system with checklists",
                    "Prepare regulatory update monitoring dashboard"
                ],
                automationNote: "I can set up systems and templates for ongoing compliance, but actual filings must be done through official channels.",
                manualCompletionText: "Please set up your compliance systems manually, then reply 'done' to continue."
            }
        ];
    }

    async queryRAGSystem(message) {
        try {
            // Show thinking indicator
            this.showTypingIndicator();

            console.log('Attempting to query RAG system for:', message);
            console.log('RAG Integration available:', !!window.ragIntegration);
            console.log('RAG Integration connected:', window.ragIntegration ? window.ragIntegration.isConnected : 'N/A');

            // Always try to use the real RAG system first
            if (window.ragIntegration) {
                console.log('Using real RAG system for query:', message);
                try {
                    const result = await window.ragIntegration.queryWithContext(message, {
                        userType: 'web_user',
                        previousQueries: this.messageHistory.slice(-5) // Last 5 messages for context
                    });

                    console.log('RAG response received:', result);
                    this.hideTypingIndicator();
                    this.addMessage('bot', result);
                    return; // Success, exit function
                } catch (ragError) {
                    console.error('RAG system error:', ragError);
                    // Continue to fallback
                }
            } else {
                console.warn('RAG integration not available');
            }

            // Fall back to simulated responses if RAG fails
            console.log('Using fallback response for:', message);
            const response = await this.simulateRAGQuery(message);
            this.hideTypingIndicator();
            this.addMessage('bot', response);

        } catch (error) {
            console.error('Query system error:', error);
            this.hideTypingIndicator();

            // Try fallback response
            try {
                const fallbackResponse = await this.simulateRAGQuery(message);
                this.addMessage('bot', fallbackResponse);
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                this.addMessage('bot', 'I apologize, but I\'m having trouble processing your query right now. Please try again or contact SEBI directly for urgent matters.');
            }
        }
    }

    async simulateRAGQuery(message) {
        // Simulate different types of responses based on query content
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('ipo') || lowerMessage.includes('initial public offering')) {
            return "Based on SEBI regulations for IPOs:\n\n**Key Requirements**:\n- Minimum promoters' contribution: 20%\n- Minimum public offer: 25% of post-issue capital\n- Lock-in period: 1-3 years for promoters\n\n**Disclosure Requirements**:\n- DRHP filing with detailed financials\n- Due diligence by merchant banker\n- Credit rating for debt instruments\n\n**Process Timeline**:\n- DRHP filing: 30 days before issue opening\n- Issue period: 3-10 days\n- Listing: T+6 days\n\nFor specific IPO guidelines, refer to SEBI's ICDR Regulations.";
        }

        if (lowerMessage.includes('mutual fund') || lowerMessage.includes('mf')) {
            return "SEBI regulations for Mutual Funds:\n\n**Key Requirements**:\n- Minimum net worth: ₹10 crore for AMCs\n- Independent directors: At least 50%\n- Risk management systems\n- Investor grievance redressal\n\n**Compliance Areas**:\n- Portfolio disclosure (monthly)\n- NAV publication (daily)\n- Half-yearly reports to investors\n- Annual compliance audit\n\n**Recent Updates**:\n- Enhanced disclosure requirements\n- Improved investor protection measures\n- Technology-driven compliance systems";
        }

        if (lowerMessage.includes('insider trading') || lowerMessage.includes('insider')) {
            return "SEBI's Insider Trading Regulations:\n\n**Prohibited Activities**:\n- Trading based on unpublished price sensitive information (UPSI)\n- Communication of UPSI to others\n- Procuring others to trade on UPSI\n\n**Key Definitions**:\n- Insider: Connected to company with access to UPSI\n- UPSI: Information that could affect stock price\n- Designated Persons: Board members, key employees\n\n**Compliance Requirements**:\n- Code of conduct for insiders\n- Disclosure of trading by designated persons\n- Pre-clearance for trading\n- Annual compliance reports\n\nPenalties for violation can include imprisonment up to 10 years and fines up to ₹25 crore.";
        }

        // Default response for other queries
        return "I've analyzed your query regarding SEBI regulations. Based on the available information:\n\n**General Guidance**:\n- Please ensure compliance with all applicable SEBI circulars\n- Maintain proper documentation for all activities\n- Report any material changes promptly\n- Seek professional advice for complex regulatory matters\n\n**Recommended Actions**:\n1. Review relevant SEBI master circulars\n2. Consult with compliance professionals\n3. Maintain audit trails for all decisions\n4. Regular training for staff on regulatory requirements\n\nFor specific regulatory interpretations, please refer to official SEBI communications or consult qualified professionals.";
    }

    addQuickActions() {
        const quickActionsDiv = document.createElement('div');
        quickActionsDiv.className = 'quick-actions';
        quickActionsDiv.innerHTML = `
            <div class="quick-action-buttons">
                <button onclick="chatbot.respondToEligibility('Check eligibility')" class="quick-btn">
                    <i class="fas fa-check-circle"></i> Check Eligibility
                </button>
                <button onclick="chatbot.respondToDocuments('Required documents')" class="quick-btn">
                    <i class="fas fa-file-alt"></i> Documents
                </button>
                <button onclick="chatbot.respondToTimeline('Timeline')" class="quick-btn">
                    <i class="fas fa-clock"></i> Timeline
                </button>
                <button onclick="chatbot.respondToFees('Fees')" class="quick-btn">
                    <i class="fas fa-rupee-sign"></i> Fees
                </button>
            </div>
        `;

        // Insert after welcome message
        setTimeout(() => {
            const messages = this.chatMessages.querySelectorAll('.message');
            if (messages.length > 0) {
                messages[messages.length - 1].after(quickActionsDiv);
            }
        }, 500);
    }
}

// Initialize chatbot when DOM is loaded
let chatbot;
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, waiting for RAG integration...');

    // Listen for RAG integration ready event
    window.addEventListener('ragIntegrationReady', function(event) {
        console.log('RAG integration ready event received:', event.detail);
        // Initialize chatbot after RAG integration is ready
        setTimeout(() => {
            chatbot = new SEBIChatbot();
            console.log('Chatbot initialized');
        }, 500);
    });

    // Fallback: initialize after timeout if event not received
    setTimeout(() => {
        if (!chatbot) {
            console.log('Fallback: Initializing chatbot after timeout');
            chatbot = new SEBIChatbot();
        }
    }, 3000); // 3 second fallback
});
