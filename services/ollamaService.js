import axios from 'axios';

/**
 * Service to interact with the local Ollama LLM runtime.
 * Provides resilient timeout handling, error isolation, and graceful fallbacks.
 */
class OllamaService {
    constructor() {
        this.baseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
        this.model = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
        this.timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS, 10) || 30000;
    }

    /**
     * Check if the Ollama service is reachable and list downloaded models.
     */
    async checkHealth() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`, {
                timeout: 4000
            });
            const models = response.data?.models || [];
            const isTargetLoaded = models.some(m => m.name === this.model || m.name.startsWith(this.model + ':'));
            return {
                isOnline: true,
                models: models.map(m => m.name),
                targetModelAvailable: isTargetLoaded,
                currentModel: this.model,
                baseUrl: this.baseUrl
            };
        } catch (error) {
            return {
                isOnline: false,
                error: error.message,
                models: [],
                targetModelAvailable: false,
                currentModel: this.model,
                baseUrl: this.baseUrl
            };
        }
    }

    /**
     * Send chat messages to Ollama and receive complete generated response.
     * @param {Array<{role: string, content: string}>} messages
     * @param {Object} options
     * @returns {Promise<{content: string, model: string, durationMs: number}>}
     */
    async chat(messages, options = {}) {
        const startTime = Date.now();
        const modelToUse = options.model || this.model;
        const temperature = options.temperature !== undefined ? options.temperature : 0.4;

        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat`,
                {
                    model: modelToUse,
                    messages,
                    stream: false,
                    options: {
                        temperature,
                        num_predict: options.maxTokens || 600,
                    }
                },
                {
                    timeout: this.timeoutMs,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            const durationMs = Date.now() - startTime;

            if (!response.data || !response.data.message || typeof response.data.message.content !== 'string') {
                throw new Error('Malformed or empty response payload from Ollama');
            }

            return {
                success: true,
                content: response.data.message.content.trim(),
                model: response.data.model || modelToUse,
                durationMs
            };
        } catch (error) {
            const durationMs = Date.now() - startTime;
            let errorType = 'UNKNOWN';
            let safeMessage = 'Local AI service is currently unavailable.';

            if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
                errorType = 'CONNECTION_REFUSED';
                safeMessage = 'Ollama service is not running locally on port 11434.';
            } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                errorType = 'TIMEOUT';
                safeMessage = `AI generation timed out after ${this.timeoutMs}ms.`;
            } else if (error.response?.status === 404) {
                errorType = 'MODEL_NOT_FOUND';
                safeMessage = `Model '${modelToUse}' is not pulled in Ollama yet.`;
            }

            return {
                success: false,
                errorType,
                safeMessage,
                rawError: error.message,
                durationMs,
                content: null
            };
        }
    }
}

export const ollamaService = new OllamaService();
export default ollamaService;
