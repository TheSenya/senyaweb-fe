<script>
    export let title = "Widget";
</script>

<div class="widget-container">
    <div class="widget-header">
        <h3>{title}</h3>
    </div>
    <div class="widget-content">
        <slot />
    </div>
</div>

<style>
    .widget-container {
        background-color: white;
        border-radius: 0.75rem;
        box-shadow:
            0 1px 3px 0 rgba(0, 0, 0, 0.1),
            0 1px 2px 0 rgba(0, 0, 0, 0.06);
        overflow: hidden;
        border: 1px solid #e5e7eb;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .widget-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        background-color: #f9fafb;
    }

    .widget-header h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
    }

    .widget-content {
        padding: 1.5rem;
        flex: 1;
    }
</style>
