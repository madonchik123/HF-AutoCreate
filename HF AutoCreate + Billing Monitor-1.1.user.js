// ==UserScript==
// @name         HuggingFace Auto Account Manager
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Automates logout, random account creation with captcha retry, saves/restores textarea values, and monitors billing usage on HuggingFace. Full flow in-page!
// @author       madonchik123
// @downloadURL https://github.com/madonchik123/HF-AutoCreate/raw/refs/heads/main/HF%20AutoCreate%20+%20Billing%20Monitor-1.1.user.js
// @updateURL https://github.com/madonchik123/HF-AutoCreate/raw/refs/heads/main/HF%20AutoCreate%20+%20Billing%20Monitor-1.1.user.js
// @match        https://huggingface.co/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // === HELPERS ===
    function randomString(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    function randomEmail() {
        return `${randomString(10)}@mail.ru`;
    }

    function getByXPath(xpath) {
        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    // === LOGOUT ===
    async function logoutIfLoggedIn() {
        const form = document.querySelector('form[action="/logout"]');
        if (!form) return;

        const csrfInput = form.querySelector('input[name="csrf"]');
        const csrf = csrfInput ? csrfInput.value : null;
        if (!csrf) return;

        const body = new URLSearchParams({ csrf });

        try {
            await fetch("https://huggingface.co/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                },
                body: body.toString(),
                credentials: 'include'
            });
            console.log("✅ Logged out of current account.");
        } catch (err) {
            console.error("❌ Logout failed:", err);
        }
    }

    // === ACCOUNT CREATION ===
    async function tryCreateAccount(email, username) {
        const body = new URLSearchParams({
            email,
            password: 'Shamil135!',
            username,
            fullname: 'Generated User',
            avatar: '',
            twitter: '',
            github: '',
            linkedin: '',
            homepage: '',
            details: ''
        });

        try {
            const res = await fetch("https://huggingface.co/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                },
                body: body.toString(),
                credentials: 'include'
            });

            if (res.status === 200) {
                alert(`✅ Account created: ${email} / ${username}`);
                location.reload();
                return true;
            } else {
                console.warn(`Account creation failed: ${res.status}`);
                if ([403, 405, 409].includes(res.status)) {
                    return false;
                }
                alert(`Unexpected error: ${res.status}`);
            }
        } catch (err) {
            console.error("❌ Account creation failed:", err);
            alert("❌ Fetch failed. Check console.");
        }
        return false;
    }

    // === CAPTCHA IFRAME ===
    function showIframeForCaptcha(onClose) {
        if (document.getElementById('hf-join-iframe')) return;

        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: '9999'
        });

        const iframe = document.createElement('iframe');
        iframe.id = 'hf-join-iframe';
        iframe.src = 'https://huggingface.co/join';
        Object.assign(iframe.style, {
            width: '90%',
            height: '90%',
            border: '3px solid white',
            borderRadius: '12px',
            position: 'absolute',
            top: '5%',
            left: '5%',
            zIndex: '10000',
            background: '#fff'
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '❌ Close & Retry';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '10px',
            right: '20px',
            padding: '10px',
            fontSize: '16px',
            zIndex: '10001',
            cursor: 'pointer',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
        });
        closeBtn.onclick = () => {
            document.body.removeChild(overlay);
            onClose();
        };

        overlay.appendChild(iframe);
        overlay.appendChild(closeBtn);
        document.body.appendChild(overlay);
    }

    // === BILLING MONITOR ===
    function showPromptTooltip(message, onYes, onClose) {
        // Remove any existing tooltip first
        const existing = document.getElementById('hf-tooltip-prompt');
        if (existing) existing.remove();

        // Create tooltip container
        const tooltip = document.createElement('div');
        tooltip.id = 'hf-tooltip-prompt';
        tooltip.style.position = 'fixed';
        tooltip.style.top = '10px';
        tooltip.style.right = '10px';
        tooltip.style.background = '#333';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '12px 16px';
        tooltip.style.borderRadius = '8px';
        tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        tooltip.style.zIndex = 999999;
        tooltip.style.fontFamily = 'Arial, sans-serif';
        tooltip.style.maxWidth = '280px';

        // Message
        const msg = document.createElement('div');
        msg.textContent = message;
        tooltip.appendChild(msg);

        // Buttons container
        const btns = document.createElement('div');
        btns.style.marginTop = '8px';
        btns.style.textAlign = 'right';

        // Yes button
        const yesBtn = document.createElement('button');
        yesBtn.textContent = 'Yes';
        yesBtn.style.background = '#4CAF50';
        yesBtn.style.color = '#fff';
        yesBtn.style.border = 'none';
        yesBtn.style.padding = '6px 12px';
        yesBtn.style.marginRight = '8px';
        yesBtn.style.borderRadius = '4px';
        yesBtn.style.cursor = 'pointer';
        yesBtn.onclick = () => {
            tooltip.remove();
            if (onYes) onYes();
        };
        btns.appendChild(yesBtn);

        // Close button (×)
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.background = 'transparent';
        closeBtn.style.color = '#fff';
        closeBtn.style.border = 'none';
        closeBtn.style.fontSize = '18px';
        closeBtn.style.lineHeight = '1';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => {
            tooltip.remove();
            if (onClose) onClose();
        };
        btns.appendChild(closeBtn);

        tooltip.appendChild(btns);
        document.body.appendChild(tooltip);
    }

    async function checkBillingMinutes() {
        try {
            const res = await fetch("https://huggingface.co/settings/billing", {
                method: "GET",
                headers: {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "cache-control": "max-age=0",
                    "sec-fetch-site": "same-origin",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-user": "?1",
                    "upgrade-insecure-requests": "1"
                },
                credentials: "include"
            });

            if (!res.ok) {
                console.warn("Billing fetch failed:", res.status);
                return;
            }

            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const xpath = '/html/body/div[1]/main/div/section/div[3]/div/div[1]/div[2]/div[2]/div[1]/span[2]';
            const span = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (!span) {
                console.warn("Could not find minutes span via XPath");
                return;
            }
            const rawText = span.textContent.trim();
            const match = rawText.match(/([\d.]+)\/5/);
            if (!match) {
                console.warn("Failed to parse minutes from text:", rawText);
                return;
            }
            const minutes = parseFloat(match[1]);
            console.log(`Detected minutes used: ${minutes}`);

            if (minutes > 4) {
                showPromptTooltip(
                    `Your usage is ${minutes}/5 minutes. Generate new account?`,
                    () => {
                        // User clicked Yes
                        const btn = document.querySelector('#hf-auto-account-btn');
                        if (btn) btn.click();
                    },
                    () => {
                        // User closed tooltip without confirming, optional fallback here
                        console.log('User closed the billing prompt tooltip');
                    }
                );
            }
        } catch (e) {
            console.error("Error checking billing minutes:", e);
        }
    }

    function startBillingMonitor() {
        const delay = 10000 + Math.random() * 5000;
        setTimeout(async () => {
            await checkBillingMinutes();
            startBillingMonitor();
        }, delay);
    }

    // === BUTTON CREATION ===
    function createButton() {
        const button = document.createElement('button');
        button.id = 'hf-auto-account-btn';
        button.textContent = '🧪 Auto HF Account';
        Object.assign(button.style, {
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: '10000',
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
        });

        button.onclick = async () => {
            const email = randomEmail();
            const username = randomString(10);
            await logoutIfLoggedIn();
            const success = await tryCreateAccount(email, username);
            if (!success) {
                showIframeForCaptcha(async () => {
                    const secondTry = await tryCreateAccount(email, username);
                    if (!secondTry) {
                        alert("❌ Still blocked. Try again manually later.");
                    }
                });
            }
        };

        document.body.appendChild(button);
    }

    // === INITIALIZE ===
    window.addEventListener('load', () => {
        createButton();
        startBillingMonitor();
    });
})();
