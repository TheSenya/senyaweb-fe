<script>
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { login } from "../stores/auth.js";
    import { PUBLIC_BACKEND_URL } from "$env/static/public";

    let backendMessage = "Connecting...";

    onMount(async () => {
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

    let password = "";

    async function handlePasswordLogin() {
        if (!password) {
            alert("Please enter a password");
            return;
        }

        try {
            const res = await fetch(`${PUBLIC_BACKEND_URL}/auth/passcode`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ passcode: password }),
            });

            const data = await res.json();

            if (data.success) {
                login({ role: "user", username: "User" });
                goto("/home?role=user");
            } else {
                alert(`Password is incorrect`);
            }
        } catch (e) {
            console.error(e);
            alert(`Login failed: ${e.message}`);
        }
    }

    async function handleGuestLogin() {
        // Guest login doesn't need backend verification for now
        login({ role: "guest", username: "Guest" });
        goto("/home?role=guest");
    }
</script>

<main>
    <h1 class="welcome">Welcome to SenyaWeb</h1>
    <form class="access-card" on:submit|preventDefault={handlePasswordLogin}>
        <div class="password-card">
            <label for="password">Password</label>
            <input
                type="password"
                id="password"
                placeholder="Enter Password..."
                bind:value={password}
            />
        </div>
        <div class="action-card">
            <div class="real-user-action">
                <button class="user-login-button" type="submit"> Login </button>
            </div>
            <div class="guest-action">
                <button
                    class="guest-login-button"
                    type="button"
                    on:click={handleGuestLogin}
                >
                    Continue without Password
                </button>
            </div>
            <p
                style="text-align: center; margin-top: 1rem; color: #6b7280; font-size: 0.875rem;"
            >
                Backend says: {backendMessage}
            </p>
        </div>
    </form>
</main>

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

    .password-card {
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
        width: 100%;
        padding: 0.75rem;
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease-in-out;
    }

    .user-login-button {
        color: white;
        background-color: #2563eb;
    }

    .user-login-button:hover {
        background-color: #1d4ed8;
    }

    .guest-login-button {
        color: #374151;
        background-color: #f3f4f6;
    }

    .guest-login-button:hover {
        background-color: #e5e7eb;
    }
</style>
