<script>
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { auth, logout } from "../stores/auth.js";
    import { onMount } from "svelte";
    import { setupAuthGuard } from "$lib/guards.js";

    // Setup navigation guard to prevent unauthorized access
    setupAuthGuard(auth);

    // Initial check for direct access (e.g. typing URL)
    onMount(() => {
        if (!$auth.isAuthenticated && $page.url.pathname !== "/") {
            goto("/");
        }
    });

    async function handleLogout() {
        // Mock backend call placeholder
        console.log("Logging out...");
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay

        logout(); // clear store
        goto("/"); // Redirect to login
    }
</script>

<div class="app-container">
    <nav class="top-bar">
        <div class="logo">
            <a href="/home">SenyaWeb</a>
        </div>
        <div class="links">
            <!-- Basic navigation links -->
            <a
                href="/bingo"
                class:active={$page.url.pathname.startsWith("/bingo")}>Bingo</a
            >
            <a
                href="/news"
                class:active={$page.url.pathname.startsWith("/news")}>News</a
            >
            <a
                href="/notes"
                class:active={$page.url.pathname.startsWith("/notes")}>Notes</a
            >
            <button class="logout-btn" on:click={handleLogout}>Logout</button>
        </div>
    </nav>

    <div class="content">
        <slot />
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Helvetica, Arial, sans-serif;
        background-color: #f3f4f6;
    }

    .app-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    .top-bar {
        background-color: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .logo a {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1f2937;
        text-decoration: none;
    }

    .links {
        display: flex;
        gap: 1.5rem;
    }

    .links a {
        color: #4b5563;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.95rem;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        transition:
            color 0.15s ease-in-out,
            background-color 0.15s ease-in-out;
    }

    .links a:hover {
        color: #1f2937;
        background-color: #f3f4f6;
    }

    .links a.active {
        color: #2563eb;
        background-color: #eff6ff;
    }

    .logout-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #4b5563;
        font-weight: 500;
        font-size: 0.95rem;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        transition:
            color 0.15s ease-in-out,
            background-color 0.15s ease-in-out;
        font-family: inherit;
    }

    .logout-btn:hover {
        color: #ef4444; /* Red color for logout hover */
        background-color: #fef2f2;
    }

    .content {
        flex: 1;
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
    }
</style>
