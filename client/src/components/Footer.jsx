function Footer() {

    return (

        <nav className="footer navbar">
            <div className="navbar-brand">
                <p className="navbar-item has-text-white">© 2025 Sober Sync. All rights reserved.</p>
            </div>
            <div className="navbar-end">
                {/* TODO: add links to terms, privacy policy, cookie settings */}
                <div className="navbar-item has-text-white">Terms of Service</div>
                <div className="navbar-item has-text-white">Privacy Policy</div>
                <div className="navbar-item has-text-white">Cookies</div>
            </div>
        </nav>
    );
}

export default Footer;