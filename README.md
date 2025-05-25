# HuggingFace AutoCreate + Billing Monitor Userscript

This Tampermonkey/Violentmonkey/Greasemonkey userscript helps automate creating new HuggingFace accounts and monitors your billing usage minutes on [huggingface.co](https://huggingface.co).

---

## Features

- Adds a handy **"Auto Create HF Account"** button on all HuggingFace pages.
- Clicking the button logs out your current account (if any), then opens the signup page in an embedded iframe on the current page so you can complete the captcha manually.
- Saves and restores two specific textarea inputs on the page to localStorage.
- Periodically checks your billing usage every 10–15 seconds.
- If your usage time approaches the 5-minute limit (above 4 minutes), prompts you to generate a new account automatically.

---

## Installation

1. **Install a userscript manager** in your browser if you haven't already. Recommended options:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox only)

2. Click on this link [Install](https://github.com/madonchik123/HF-AutoCreate/raw/refs/heads/main/HF%20AutoCreate%20+%20Billing%20Monitor-1.1.user.js)

2.1 Click on this link if you want automatic captcha solver (Needs to be setup (TogetherAI,Cloudinary)) [Link](https://github.com/madonchik123/HF-AutoCreate/raw/refs/heads/main/HF-AutoCaptcha.js)

3. Your userscript manager should detect the script and prompt you to install it. Confirm the installation.

4. Visit any page on `https://huggingface.co/*`. You should see the **"Auto Create HF Account"** button appear at the top-left corner.

---

## Usage

- Click the button to start the logout + join flow.
- Complete captcha in the embedded iframe.
- After closing the iframe, the script attempts to create an account and refresh the page.
- The script will monitor your billing usage and prompt you to generate a new account when near the usage limit.

---

## Notes

- The script requires you to be logged in initially to perform logout and billing checks.
- For cross-origin requests and cookie handling, make sure your userscript manager settings allow the script to run on `huggingface.co`.
- This is a personal automation tool — please use responsibly and avoid spamming or abusing HuggingFace services.

---

## License

MIT License

---

Feel free to open issues or contribute enhancements!
