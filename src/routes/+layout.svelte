<script>
    import { page } from "$app/stores";
</script>

<div class="app-container">
    <nav class="top-bar">
        <div class="logo">
            <a href="/home">SenyaWeb</a>
        </div>
        <div class="links">
            <!-- Basic navigation links -->
            <a href="/home" class:active={$page.url.pathname === "/home"}
                >Home</a
            >
            <a
                href="/notes"
                class:active={$page.url.pathname.startsWith("/notes")}>Notes</a
            >
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

    .content {
        flex: 1;
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
    }
</style>
