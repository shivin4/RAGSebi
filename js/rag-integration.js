// RAG System Integration for SEBI Chatbot

class RAGIntegration {
    constructor() {
        this.apiEndpoint = '/api/query'; // Flask API endpoint
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    // Initialize connection to RAG system
    async initialize() {
        try {
            // Test connection to the backend
            const response = await this.testConnection();
            if (response.success) {
                this.isConnected = true;
                console.log('RAG system connected successfully');
                return true;
            } else {
                console.warn('RAG system connection failed, using fallback mode');
                return false;
            }
        } catch (error) {
            console.error('Failed to initialize RAG system:', error);
            return false;
        }
    }

    // Test connection to backend
    async testConnection() {
        try {
            const response = await fetch('/api/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, data };
            } else {
                return { success: false, error: 'Backend not responding' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Query the RAG system
    async queryRAG(question, context = {}) {
        try {
            console.log('Attempting to query RAG system:', question);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: question,
                    context: context,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('RAG API error:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('RAG response received:', data);

            if (data.success) {
                return {
                    answer: data.answer,
                    sources: data.sources || [],
                    confidence: data.confidence || 0,
                    processing_time: data.processing_time || 0
                };
            } else {
                console.warn('RAG query failed:', data.error);
                throw new Error(data.error || 'Query failed');
            }

        } catch (error) {
            console.error('RAG query error:', error);

            // If RAG system is not available, don't retry - just fall back
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.log('RAG system not available, using fallback');
                this.isConnected = false;
            }

            throw error;
        }
    }

    // Get system statistics
    async getSystemStats() {
        try {
            const response = await fetch('/api/stats', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                throw new Error('Failed to fetch system stats');
            }
        } catch (error) {
            console.error('Error fetching system stats:', error);
            return null;
        }
    }

    // Format RAG response for chatbot
    formatRAGResponse(ragResult) {
        let formattedResponse = ragResult.answer;

        // Add source information if available
        if (ragResult.sources && ragResult.sources.length > 0) {
            formattedResponse += '\n\n**Sources:**\n';
            ragResult.sources.slice(0, 3).forEach((source, index) => {
                formattedResponse += `${index + 1}. ${source.doc_type || 'Document'} (${source.year || 'N/A'})\n`;
            });
        }

        // Add processing time if available
        if (ragResult.processing_time) {
            formattedResponse += `\n\n*Response time: ${ragResult.processing_time.toFixed(2)}s*`;
        }

        return formattedResponse;
    }

    // Enhanced query with context
    async queryWithContext(question, userContext = {}) {
        const context = {
            user_type: userContext.userType || 'general',
            query_type: this.classifyQuery(question),
            previous_queries: userContext.previousQueries || [],
            session_id: userContext.sessionId || this.generateSessionId()
        };

        try {
            const result = await this.queryRAG(question, context);
            return this.formatRAGResponse(result);
        } catch (error) {
            // Fallback to predefined responses
            return this.getFallbackResponse(question);
        }
    }

    // Classify query type for better context
    classifyQuery(question) {
        const lowerQuestion = question.toLowerCase();

        if (lowerQuestion.includes('registration') || lowerQuestion.includes('apply') || lowerQuestion.includes('license')) {
            return 'registration';
        } else if (lowerQuestion.includes('compliance') || lowerQuestion.includes('reporting') || lowerQuestion.includes('filing')) {
            return 'compliance';
        } else if (lowerQuestion.includes('eligibility') || lowerQuestion.includes('requirements') || lowerQuestion.includes('criteria')) {
            return 'eligibility';
        } else if (lowerQuestion.includes('fees') || lowerQuestion.includes('cost') || lowerQuestion.includes('payment')) {
            return 'fees';
        } else if (lowerQuestion.includes('timeline') || lowerQuestion.includes('time') || lowerQuestion.includes('duration')) {
            return 'timeline';
        } else if (lowerQuestion.includes('ipo') || lowerQuestion.includes('public offering')) {
            return 'ipo';
        } else if (lowerQuestion.includes('mutual fund') || lowerQuestion.includes('mf')) {
            return 'mutual_fund';
        } else if (lowerQuestion.includes('insider') || lowerQuestion.includes('trading')) {
            return 'insider_trading';
        } else {
            return 'general';
        }
    }

    // Generate session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Fallback responses when RAG is unavailable
    getFallbackResponse(question) {
        const lowerQuestion = question.toLowerCase();

        if (lowerQuestion.includes('ipo')) {
            return "For IPO-related queries, please refer to SEBI's ICDR (Issue of Capital and Disclosure Requirements) Regulations, 2018. Key requirements include minimum promoters' contribution, disclosure standards, and pricing guidelines. For specific advice, consult a SEBI-registered merchant banker.";
        }

        if (lowerQuestion.includes('mutual fund')) {
            return "SEBI regulates mutual funds through SEBI (Mutual Funds) Regulations, 1996. Asset Management Companies (AMCs) must maintain minimum net worth, independent directors, and comply with investment restrictions. For detailed requirements, refer to the latest SEBI circulars.";
        }

        if (lowerQuestion.includes('insider trading')) {
            return "SEBI's Insider Trading Regulations prohibit trading based on unpublished price-sensitive information. Designated persons must follow pre-clearance requirements and disclose their holdings. Violations can result in severe penalties including imprisonment.";
        }

        return "I apologize, but I'm currently unable to access detailed regulatory information. Please check the official SEBI website (www.sebi.gov.in) for the most up-to-date regulations and guidelines, or consult with a qualified regulatory professional for specific advice.";
    }

    // Log query for analytics
    logQuery(question, response, success = true) {
        const logData = {
            timestamp: new Date().toISOString(),
            question: question,
            response_length: response.length,
            success: success,
            user_agent: navigator.userAgent,
            session_id: this.generateSessionId()
        };

        // Send to analytics endpoint (if available)
        try {
            fetch('/api/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            }).catch(error => {
                console.warn('Failed to log query:', error);
            });
        } catch (error) {
            // Silently fail if logging is not available
        }
    }
}

// Global RAG integration instance
let ragIntegration;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing RAG integration...');
    ragIntegration = new RAGIntegration();

    // Try to initialize RAG system
    const connected = await ragIntegration.initialize();

    if (connected) {
        console.log('✅ RAG system integration ready');
        window.ragIntegration = ragIntegration; // Make it globally available
    } else {
        console.log('⚠️ Using fallback mode - RAG system not available');
        window.ragIntegration = ragIntegration; // Still make it available for fallback
    }

    // Dispatch custom event to signal RAG integration is ready
    window.dispatchEvent(new CustomEvent('ragIntegrationReady', {
        detail: { connected: connected }
    }));
});

// Export for use in other modules
window.RAGIntegration = RAGIntegration;
