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
    let geminiModels = [];
    let openRouterModels = []; // Array of objects {id, name, pricing}
    let selectedProvider = "gemini"; // 'gemini' | 'openrouter'
    let selectedModel = "";
    let credits = null; // Account credits info

    // UI References
    let chatContainer;

    // =========================================================================
    // LIFECYCLE HOOKS
    // =========================================================================

    onMount(async () => {
        // Fetch available models and credits
        try {
            const [gemRes, orRes, credRes] = await Promise.all([
                fetch(`${PUBLIC_BACKEND_URL}/bingo/gem_models`),
                fetch(`${PUBLIC_BACKEND_URL}/bingo/or_models`),
                fetch(`${PUBLIC_BACKEND_URL}/bingo/credits`),
            ]);

            if (gemRes.ok) {
                const data = await gemRes.json();
                geminiModels = data.models || [];
            }

            if (orRes.ok) {
                const data = await orRes.json();
                openRouterModels = data.models || [];
            }

            if (credRes.ok) {
                const data = await credRes.json();
                console.log(credRes);
                // API returns { data: { usage: ..., limit: ..., ... } }
                if (data.data) {
                    credits = data.data;
                }
            }

            // Set default model based on default provider
            updateSelectedModel();
        } catch (e) {
            console.error("Failed to fetch data", e);
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

    function updateSelectedModel() {
        if (selectedProvider === "gemini") {
            selectedModel = geminiModels.length > 0 ? geminiModels[0] : "";
        } else {
            selectedModel =
                openRouterModels.length > 0 ? openRouterModels[0].id : "";
        }
    }

    // Helper to get current OpenRouter model object
    $: currentORModel = openRouterModels.find((m) => m.id === selectedModel);

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
            const res = await fetch(`${PUBLIC_BACKEND_URL}/bingo/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: text,
                    model: selectedModel,
                    provider: selectedProvider,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                // 4. Add AI response
                messages = [
                    ...messages,
                    { sender: "ai", text: data.message, timestamp: new Date() },
                ];
            } else {
                console.error("Failed to send message");
                messages = [
                    ...messages,
                    {
                        sender: "ai",
                        text: "Sorry, I encountered an error.",
                        timestamp: new Date(),
                    },
                ];
            }
        } catch (e) {
            console.error("Error sending message", e);
            messages = [
                ...messages,
                {
                    sender: "ai",
                    text: "Sorry, I couldn't reach the server.",
                    timestamp: new Date(),
                },
            ];
        } finally {
            isLoading = false;
            // Scroll to bottom to read the answer
            await tick();
            scrollToBottom();
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
<div class="chat-layout">
    <header class="chat-header">
        <div class="header-left">
            <h2>Bingo AI</h2>
            {#if credits}
                <div class="credits-display">
                    <span class="label">Usage:</span> ${Number(
                        credits.total_usage,
                    ).toFixed(2)}
                    {#if credits.total_credits}
                        <span class="divider">/</span>
                        <span class="label">Limit:</span>
                        ${Number(credits.total_credits).toFixed(2)}
                        <span class="remaining"
                            >(${(
                                credits.total_credits - credits.total_usage
                            ).toFixed(2)} left)</span
                        >
                    {/if}
                </div>
            {/if}

            <div class="model-selectors-group">
                <div class="model-selectors">
                    <!-- Provider Selector -->
                    <select
                        bind:value={selectedProvider}
                        on:change={updateSelectedModel}
                        class="model-select provider-select"
                    >
                        <option value="gemini">Google Gemini</option>
                        <option value="openrouter">OpenRouter</option>
                    </select>

                    <!-- Model Selector -->
                    <select bind:value={selectedModel} class="model-select">
                        {#if selectedProvider === "gemini"}
                            {#each geminiModels as model}
                                <option value={model}
                                    >{model.replace("models/", "")}</option
                                >
                            {/each}
                        {:else}
                            {#each openRouterModels as model}
                                <option value={model.id}>{model.name}</option>
                            {/each}
                        {/if}
                    </select>
                </div>
                {#if selectedProvider === "openrouter" && currentORModel && currentORModel.pricing}
                    <div class="pricing-info">
                        <span class="price-tag"
                            >Input: ${currentORModel.pricing.prompt}</span
                        >
                        <span class="price-tag"
                            >Output: ${currentORModel.pricing.completion}</span
                        >
                    </div>
                {/if}
            </div>
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

    .chat-layout {
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
        background-color: white;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        flex: 1;
        flex-wrap: wrap; /* Allow wrapping on small screens */
    }

    .header-left h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        white-space: nowrap;
        margin-right: 1rem;
    }

    .credits-display {
        font-size: 0.8rem;
        color: #4b5563;
        background-color: #f3f4f6;
        padding: 0.25rem 0.6rem;
        border-radius: 1rem;
        border: 1px solid #e5e7eb;
        display: flex;
        gap: 0.3rem;
        align-items: center;
        white-space: nowrap;
    }

    .credits-display .label {
        font-weight: 500;
        color: #6b7280;
    }

    .credits-display .remaining {
        color: #10b981; /* Green for remaining */
        font-weight: 600;
    }

    .model-selectors-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
        max-width: 500px;
    }

    .model-selectors {
        display: flex;
        gap: 0.5rem;
        width: 100%;
    }

    .model-select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        background-color: white;
        cursor: pointer;
        flex: 1;
        min-width: 0; /* Allow flex shrinking */
    }

    .provider-select {
        flex: 0 0 140px; /* Fixed width for provider */
    }

    .pricing-info {
        display: flex;
        gap: 0.8rem;
        font-size: 0.75rem;
        color: #6b7280;
        padding-left: 0.2rem;
    }

    .price-tag {
        background-color: #eff6ff;
        color: #1d4ed8;
        padding: 0.1rem 0.4rem;
        border-radius: 0.25rem;
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
