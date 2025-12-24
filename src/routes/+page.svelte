<script>
    import { goto } from '$app/navigation';

    let password = '';

    function handlePasswordLogin() {
        // validate password
        if (password.length > 0) {
            // TODO: send request to BE and validate the password
            goto('/home?role=user');
        } else {
            alert(`Password is incorrect`);
        }
    }

    function handleGuestLogin() {
        goto('/home?role=guest');
    }

</script>

<main>
<h1 class="welcome">Welcome to SenyaWeb</h1>
<div class="access-card">
    <div class=password-card>
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
            <button class="user-login-button" on:click={handlePasswordLogin}>
                Login
            </button>
        </div>
        <div class="guest-action">
            <button class="guest-login-button" on:click={handleGuestLogin}>
                Continue without Password
            </button>
        </div>
    </div>
</div>

</main>

<style>
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
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