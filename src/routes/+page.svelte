<script>

let password = ''

function handlePasswordLogin() {
    // validate password
    if (password.length > 0){
        // TODO: send request to BE and validate the passwrod
        alert(`Logging in with password`)
    }
    else {
        alert(`Password is incorrect`)
    }
}

function handleGuestLogin() {
    alert(`Logged in as Guest`)
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

</style>