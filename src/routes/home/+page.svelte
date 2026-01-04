<script>
    import { page } from "$app/stores";

    $: role = $page.url.searchParams.get("role") || "Guest";
</script>

<div class="home-container">
    <h1>Welcome Home</h1>

    <div class="card">
        <p class="greeting">Hello, <span class="role">{role}</span>!</p>
        <p class="info">This is a simple barebones home screen.</p>
    </div>
</div>

<style>
    .home-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    h1 {
        font-size: 2rem;
        color: #111827;
        margin: 0;
    }

    .card {
        background: white;
        padding: 2rem;
        border-radius: 0.75rem;
        box-shadow:
            0 1px 3px 0 rgba(0, 0, 0, 0.1),
            0 1px 2px 0 rgba(0, 0, 0, 0.06);
    }

    .greeting {
        font-size: 1.25rem;
        color: #374151;
        margin: 0 0 1rem 0;
    }

    .role {
        font-weight: 600;
        color: #2563eb;
    }

    .info {
        color: #6b7280;
        margin: 0;
    }
</style>
