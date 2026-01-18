<script>
    import { onMount, afterUpdate, tick } from "svelte";
    import { PUBLIC_BACKEND_URL } from "$env/static/public";
    import { marked } from "marked";

    // =========================================================================
    // STATE MANAGEMENT
    // =========================================================================

    // Array to store the chat history.
    // Structure: { sender: 'user' | 'ai', text: string, timestamp: Date }
    let messages = [];

    // The current input value from the user
    let currentMessage = "";

    // State to track if we are waiting for a response (loading state)
    let isLoading = false;

    // Model selection
    let availableModels = [];
    let selectedModel = "";

    // UI References
    let chatContainer;

    // =========================================================================
    // LIFECYCLE HOOKS
    // =========================================================================

    onMount(async () => {
        // Fetch available models
        try {
            const res = await fetch(`${PUBLIC_BACKEND_URL}/bingo/models`);
            if (res.ok) {
                const data = await res.json();
                availableModels = data.models || [];
                if (availableModels.length > 0) {
                    selectedModel = availableModels[0];
                }
            }
        } catch (e) {
            console.error("Failed to fetch models", e);
        }

        // For now, add a welcome message locally
        messages = [
            {
                sender: "ai",
                text: "Hello! I am Bingo, your AI assistant. How can I help you today?",
                timestamp: new Date(),
            },
        ];
    });

    afterUpdate(() => {
        // Default behavior: Keep chat scrolled to bottom if we are near the bottom
        // or if a new message arrived that isn't the specific "user question at top" case
        // We handle specific scrolling in sendMessage, but this ensures general visibility
        scrollToBottom();
    });

    function scrollToBottom() {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    // =========================================================================
    // FUNCTIONS
    // =========================================================================

    /**
     * 1. Validates input
     * Handles sending a message.
     * 2. Adds user message to local state
     * 3. Sends request to backend (TODO)
     * 4. Adds AI response to local state
     */
    async function sendMessage() {
        if (!currentMessage.trim()) return;

        // 1. Capture user input and clear field
        const text = currentMessage;
        currentMessage = "";

        // 2. Add User message to the list immediately (Optimistic UI)
        messages = [
            ...messages,
            { sender: "user", text, timestamp: new Date() },
        ];

        // Custom Requirement: "I want to question i asked to be at the very top"
        // Wait for DOM update, then scroll the user message to the top of the view
        await tick();
        if (chatContainer && chatContainer.lastElementChild) {
            chatContainer.lastElementChild.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }

        // 3. Set loading state
        isLoading = true;

        try {
            // =================================================================
            // BACKEND INTEGRATION POINT
            // =================================================================
            const response = await fetch(`${PUBLIC_BACKEND_URL}/bingo/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, model: selectedModel }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            // 4. Add AI response to the list
            messages = [
                ...messages,
                {
                    sender: "ai",
                    text: data.message,
                    timestamp: new Date(),
                },
            ];

            // Scroll to bottom after AI response to show the answer
            await tick();
            scrollToBottom();
        } catch (error) {
            console.error("Failed to send message:", error);
            // Handle error (e.g., show a toast notification or an error message in chat)
            messages = [
                ...messages,
                {
                    sender: "system",
                    text: "Error: Could not connect to Bingo.",
                    timestamp: new Date(),
                },
            ];
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle "Enter" key press in the input field
     */
    function handleKeydown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
</script>

<!-- 
    =========================================================================
    TEMPLATE STRUCTURE
    =========================================================================
-->
<div class="chat-container">
    <header class="chat-header">
        <h1>Takls me</h1>
        <p>Your personal assistant</p>

        <div class="model-selector">
            <select
                bind:value={selectedModel}
                disabled={availableModels.length === 0}
            >
                {#each availableModels as model}
                    <option value={model}>{model.replace("models/", "")}</option
                    >
                {/each}
            </select>
        </div>
    </header>

    <!-- 
        Message History Area 
        - Scrolls automatically when new messages arrive (needs implementation)
        - Renders different styles for 'user' vs 'ai'
    -->
    <div class="messages-area" bind:this={chatContainer}>
        {#each messages as msg}
            <div class="message-wrapper {msg.sender}">
                <div class="message-bubble">
                    <div class="markdown-content">
                        {@html marked.parse(msg.text)}
                    </div>
                    <span class="timestamp">
                        {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
            </div>
        {/each}

        {#if isLoading}
            <div class="message-wrapper ai">
                <div class="message-bubble loading">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- 
        Input Area
        - Textarea for multi-line support
        - Send button
    -->
    <div class="input-area">
        <textarea
            bind:value={currentMessage}
            on:keydown={handleKeydown}
            placeholder="Type your message here..."
            rows="1"
        ></textarea>
        <button
            on:click={sendMessage}
            disabled={isLoading || !currentMessage.trim()}
        >
            Send
        </button>
    </div>
</div>

<style>
    /* 
     * BASIC STYLING
     * Designed to be clean and minimal. 
    */

    .chat-container {
        display: flex;
        flex-direction: column;
        height: calc(
            100vh - 9rem
        ); /* Fit screen: 100vh - (header ~3.5rem + padding 4rem + slack) */
        max-width: 800px;
        margin: 0 auto; /* Centered */
        background-color: white;
        border-left: 1px solid #e5e7eb;
        border-right: 1px solid #e5e7eb;
    }

    .chat-header {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        background-color: #f9fafb;
        text-align: center;
    }

    .chat-header h1 {
        margin: 0;
        font-size: 1.25rem;
        color: #111827;
    }

    .chat-header p {
        margin: 0;
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
    }

    .model-selector select {
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        border: 1px solid #d1d5db;
        font-size: 0.875rem;
        color: #374151;
        background-color: white;
    }

    .messages-area {
        flex: 1; /* Takes available space */
        overflow-y: auto; /* Scrollable */
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background-color: #fff;
    }

    /* Message Bubbles */
    .message-wrapper {
        display: flex;
        width: 100%;
    }

    .message-wrapper.user {
        justify-content: flex-end; /* User messages on the right */
    }

    .message-wrapper.ai {
        justify-content: flex-start; /* AI messages on the left */
    }

    .message-wrapper.system {
        justify-content: center;
    }

    .message-bubble {
        max-width: 70%;
        padding: 0.75rem 1rem;
        border-radius: 1rem;
        position: relative;
        word-wrap: break-word;
    }

    .message-wrapper.user .message-bubble {
        background-color: #2563eb;
        color: white;
        border-bottom-right-radius: 0.25rem;
    }

    .message-wrapper.ai .message-bubble {
        background-color: #f3f4f6;
        color: #1f2937;
        border-bottom-left-radius: 0.25rem;
    }

    .message-wrapper.system .message-bubble {
        background-color: #fee2e2;
        color: #991b1b;
        font-size: 0.875rem;
    }

    .timestamp {
        display: block;
        font-size: 0.7rem;
        margin-top: 0.25rem;
        opacity: 0.7;
        text-align: right;
    }

    /* Input Area */
    .input-area {
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 0.5rem;
        background-color: #fff;
    }

    textarea {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        resize: none; /* Disable manual resize */
        font-family: inherit;
    }

    textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    button {
        padding: 0 1.5rem;
        background-color: #2563eb;
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    button:hover:not(:disabled) {
        background-color: #1d4ed8;
    }

    button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
    }

    /* Typing Indicator Animation */
    .typing-indicator {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0;
    }

    .typing-indicator span {
        display: block;
        width: 0.5rem;
        height: 0.5rem;
        background-color: #6b7280;
        border-radius: 50%;
        animation: typing 1.4s infinite both;
    }

    .typing-indicator span:nth-child(1) {
        animation-delay: 0s;
    }

    .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes typing {
        0%,
        100% {
            opacity: 0.4;
            transform: scale(0.8);
        }
        50% {
            opacity: 1;
            transform: scale(1.2);
        }
    }

    /* Markdown Styles */
    .markdown-content :global(p) {
        margin: 0 0 0.5rem 0;
    }

    .markdown-content :global(p:last-child) {
        margin-bottom: 0;
    }

    .markdown-content :global(pre) {
        background-color: #1f2937;
        color: #f3f4f6;
        padding: 0.75rem;
        border-radius: 0.375rem;
        overflow-x: auto;
        margin: 0.5rem 0;
        font-family: monospace;
    }

    .markdown-content :global(code) {
        background-color: rgba(0, 0, 0, 0.1);
        padding: 0.1rem 0.3rem;
        border-radius: 0.2rem;
        font-family: monospace;
        font-size: 0.9em;
    }

    /* Inverse styles for user bubbles (blue background) */
    .message-wrapper.user .markdown-content :global(code) {
        background-color: rgba(255, 255, 255, 0.2);
    }

    .message-wrapper.user .markdown-content :global(pre) {
        background-color: rgba(0, 0, 0, 0.2);
    }
</style>
