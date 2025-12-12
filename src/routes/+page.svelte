<script>

let password = ''

function handlePasswordLogin() {
    if (password.length > 0){
        alert(`Logging in with password`)
    }
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
    <div class="guess-card">

    </div>
</div>

</main>

<style>

</style>