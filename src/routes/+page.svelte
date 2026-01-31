<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { login } from "../stores/auth.js";
    import { PUBLIC_BACKEND_URL } from "$env/static/public";
    import { encryptRequest, decryptResponse } from "$lib/encryption";
    import api from "$lib/api";

    let backendMessage = "Connecting...";
    let isCheckingAuth = true; // Show loading while checking auth

    onMount(async () => {
        // First, check if user is already logged in
        try {
            const authRes = await api.post("/auth/me");

            if (authRes.ok && authRes.data) {
                // User is already authenticated, redirect to home
                console.log("User already authenticated, redirecting to /home");
                goto("/home");
                return;
            }
        } catch (e) {
            // Not authenticated, that's expected - show login form
            console.log("User not authenticated, showing login form");
        }

        isCheckingAuth = false;

        // Check backend health
        try {
            const res = await fetch(`${PUBLIC_BACKEND_URL}/health`);
            if (res.ok) {
                const data = await res.json();
                backendMessage = "Connected to Backend";
            } else {
                backendMessage = "Backend connection failed";
            }
        } catch (e) {
            console.error(e);
            backendMessage = "Backend not reachable";
        }
    });

    let email = "";
    let password = "";
    let isRegistering = false;

    // Error states
    let emailError = "";
    let passwordError = "";
    let generalError = "";

    function validateEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            emailError = "Email is required";
            return false;
        } else if (!emailRegex.test(email)) {
            emailError = "Please enter a valid email address";
            return false;
        }
        emailError = "";
        return true;
    }

    function validatePassword() {
        if (!password) {
            passwordError = "Password is required";
            return false;
        } else if (password.length < 6) {
            passwordError = "Password must be at least 6 characters";
            return false;
        }
        passwordError = "";
        return true;
    }

    function validate() {
        // Run both to set errors
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        return isEmailValid && isPasswordValid;
    }

    async function handleSubmit() {
        generalError = "";

        if (!validate()) {
            generalError = "Please check your input.";
            return;
        }

        console.log("Starting login process...");
        console.log(
            "Endpoint:",
            isRegistering ? "/auth/register" : "/auth/login",
        );

        const endpoint = isRegistering ? "/auth/register" : "/auth/login";

        try {
            // 1. Encrypt the payload
            console.log("Encrypting payload...");
            const { encryptedContent, clientPrivateKey } = await encryptRequest(
                { email, password },
            );
            console.log("Payload encrypted. Sending request...");

            const res = await fetch(`${PUBLIC_BACKEND_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content: encryptedContent }),
            });

            const body = await res.json();

            // 2. Decrypt the response
            let data;
            if (body.content) {
                data = await decryptResponse(body.content, clientPrivateKey);
            } else {
                data = body;
            }

            if (res.ok) {
                if (data.success) {
                    // Fetch full user data after successful login/register
                    try {
                        const meRes = await api.post("/auth/me");
                        if (meRes.ok && meRes.data) {
                            login(meRes.data);
                        }
                    } catch (e) {
                        // Login was successful, just couldn't get full user data
                        console.warn("Couldn't fetch user data after login");
                    }
                    goto("/home");
                } else {
                    generalError = isRegistering
                        ? "Registration failed"
                        : "Login failed";
                }
            } else {
                const detail = data.detail || "";

                if (detail.includes("Email already registered")) {
                    emailError = detail;
                } else {
                    generalError =
                        detail ||
                        (isRegistering
                            ? "Registration failed"
                            : "Login failed");
                }
            }
        } catch (e: any) {
            console.error(e);
            generalError = `Connection Error: ${e.message}`;
        }
    }

    function toggleMode() {
        isRegistering = !isRegistering;
        email = "";
        password = "";
        emailError = "";
        passwordError = "";
        generalError = "";
    }
</script>

{#if isCheckingAuth}
    <!-- Loading state while checking if user is already authenticated -->
    <main>
        <div class="auth-loading">
            <div class="loading-spinner"></div>
            <p>Checking authentication...</p>
        </div>
    </main>
{:else}
    <main>
        <h1 class="welcome">Welcome to SenyaWeb</h1>
        <form class="access-card" on:submit|preventDefault={handleSubmit}>
            <h2 class="form-title">
                {isRegistering ? "Create Account" : "Login"}
            </h2>

            <div class="input-group">
                <label for="email">Email</label>
                <input
                    type="email"
                    id="email"
                    placeholder="Enter Email..."
                    bind:value={email}
                    on:blur={validateEmail}
                    on:input={() => emailError && validateEmail()}
                    class:invalid={emailError}
                />
                {#if emailError}
                    <span class="error-msg">{emailError}</span>
                {/if}
            </div>
            <div class="input-group">
                <label for="password">Password</label>
                <input
                    type="password"
                    id="password"
                    placeholder="Enter Password..."
                    bind:value={password}
                    on:blur={validatePassword}
                    on:input={() => passwordError && validatePassword()}
                    class:invalid={passwordError}
                />
                {#if passwordError}
                    <span class="error-msg">{passwordError}</span>
                {/if}
            </div>

            {#if generalError}
                <div class="general-error">{generalError}</div>
            {/if}

            <div class="action-card">
                <div class="real-user-action">
                    <button class="user-login-button" type="submit">
                        {isRegistering ? "Register" : "Login"}
                    </button>
                </div>

                <div class="toggle-action">
                    <p>
                        {isRegistering
                            ? "Already have an account?"
                            : "Need an account?"}
                        <button
                            type="button"
                            class="link-button"
                            on:click={toggleMode}
                        >
                            {isRegistering ? "Login here" : "Register here"}
                        </button>
                    </p>
                </div>

                <p class="backend-msg">
                    Backend says: {backendMessage}
                </p>
            </div>
        </form>
    </main>
{/if}

<style>
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Helvetica, Arial, sans-serif;
        background-color: #f3f4f6;
    }

    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 1rem;
    }

    .welcome {
        margin-bottom: 2rem;
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        text-align: center;
    }

    .access-card {
        width: 100%;
        max-width: 400px;
        padding: 2rem;
        background-color: white;
        border-radius: 1rem;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .form-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        text-align: center;
        color: #374151;
    }

    .input-group {
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 1rem;
        box-sizing: border-box;
        transition:
            border-color 0.15s ease-in-out,
            box-shadow 0.15s ease-in-out;
    }

    input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
    }

    .action-card {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    button {
        padding: 0.75rem;
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease-in-out;
    }

    .user-login-button {
        width: 100%;
        color: white;
        background-color: #2563eb;
    }

    .user-login-button:hover {
        background-color: #1d4ed8;
    }

    .toggle-action {
        text-align: center;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .link-button {
        background: none;
        border: none;
        color: #2563eb;
        cursor: pointer;
        padding: 0;
        font: inherit;
        text-decoration: underline;
        width: auto;
    }

    .link-button:hover {
        color: #1d4ed8;
        background: none;
    }

    .backend-msg {
        text-align: center;
        margin-top: 1rem;
        color: #6b7280;
        font-size: 0.75rem;
    }

    /* Error Styling */
    .error-msg {
        color: #ef4444;
        font-size: 0.8rem;
        margin-top: 0.25rem;
        display: block;
    }

    input.invalid {
        border-color: #ef4444;
        background-color: #fef2f2;
    }

    input.invalid:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }

    .general-error {
        margin-bottom: 1rem;
        padding: 0.75rem;
        border-radius: 0.5rem;
        background-color: #fef2f2;
        border: 1px solid #fee2e2;
        color: #b91c1c;
        text-align: center;
        font-size: 0.9rem;
    }

    /* Loading state */
    .auth-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        gap: 1rem;
        color: #6b7280;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
