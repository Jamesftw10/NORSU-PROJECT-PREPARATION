

const loginHTML = `
  <div class="header">
            <div class="norsu-logo">
                <!-- Replace with actual NORSU logo URL -->
                <img src="https://upload.wikimedia.org/wikipedia/en/6/67/Negros_Oriental_State_University.png" alt="NORSU Logo">
            </div>
            <h1>NORSU Login</h1>
            <p>Negros Oriental State University</p>
        </div>

        <form>
            <div class="form-group">
                <label for="text">Learn Reference Number</label>
                <div class="logo-input-container">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-monitor-cog-icon lucide-monitor-cog"><path d="M12 17v4"/><path d="m14.305 7.53.923-.382"/><path d="m15.228 4.852-.923-.383"/><path d="m16.852 3.228-.383-.924"/><path d="m16.852 8.772-.383.923"/><path d="m19.148 3.228.383-.924"/><path d="m19.53 9.696-.382-.924"/><path d="m20.772 4.852.924-.383"/><path d="m20.772 7.148.924.383"/><path d="M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="M8 21h8"/><circle cx="18" cy="6" r="3"/></svg>
                <input 
                    
                    type="text" 
                    id="text" 
                    name="text" 
                    placeholder="Learn Reference Number" 
                    required
                >
                </div>
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <div class="logo-input-container">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock-icon lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input 
                    
                    type="password" 
                    id="password" 
                    name="password" 
                    placeholder="Enter your password" 
                    required
                >
                </div>
            </div>

            <div class="remember-forgot">
                <div class="checkbox">
                    <input type="checkbox" id="remember" name="remember">
                    <label for="remember">Remember me</label>
                </div>
                <a href="#forgot-password">Forgot password?</a>
            </div>

            <button type="submit" class="login-btn">Login</button>

            <div class="signup-link">
                Don't have an account? <a href="">Sign up here</a>
            </div>
        </form>
        `;

document.querySelector('.login-container').innerHTML = loginHTML;





