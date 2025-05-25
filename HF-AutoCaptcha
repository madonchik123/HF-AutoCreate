// ==UserScript==
// @name         HuggingFace Auto Account Manager
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Automates logout, random account creation with captcha retry, saves/restores textarea values, and monitors billing usage on HuggingFace. Full flow in-page with human-like behavior!
// @author       madonchik123
// @downloadURL https://github.com/madonchik123/HF-AutoCreate/raw/refs/heads/main/HF%20AutoCreate%20+%20Billing%20Monitor-1.1.user.js
// @updateURL https://github.com/madonchik123/HF-AutoCreate/raw/refs/heads/main/HF%20AutoCreate%20+%20Billing%20Monitor-1.1.user.js
// @match        https://huggingface.co/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // === HELPERS ===
    function randomString(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({
            length
        }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    function randomEmail() {
        return `${randomString(10)}@mail.ru`;
    }

    function getByXPath(xpath) {
        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    // Human-like delay function
    function humanDelay(min = 500, max = 1500) {
        return new Promise(resolve => {
            const delay = Math.random() * (max - min) + min;
            setTimeout(resolve, delay);
        });
    }

    // Simulate human mouse click with coordinates and delays
    function simulateHumanClick(element, doc = document) {
        return new Promise(async (resolve) => {
            if (!element) {
                resolve(false);
                return;
            }

            const rect = element.getBoundingClientRect();
            const x = rect.left + (rect.width * (0.3 + Math.random() * 0.4));
            const y = rect.top + (rect.height * (0.3 + Math.random() * 0.4));

            // Create realistic mouse events
            const events = ['mousedown', 'mouseup', 'click'];

            for (const eventType of events) {
                const event = new MouseEvent(eventType, {
                    view: doc.defaultView || window,
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y,
                    button: 0,
                    buttons: 1
                });
                element.dispatchEvent(event);

                // Small delay between events
                if (eventType !== 'click') {
                    await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
                }
            }

            resolve(true);
        });
    }

    // === LOGOUT ===
    async function logoutIfLoggedIn() {
        const form = document.querySelector('form[action="/logout"]');
        if (!form) return;

        const csrfInput = form.querySelector('input[name="csrf"]');
        const csrf = csrfInput ? csrfInput.value : null;
        if (!csrf) return;

        const body = new URLSearchParams({
            csrf
        });

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
            password: 'Sawrawrawr!',
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
            // Add human delay before account creation
            await humanDelay(800, 1500);

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

    async function detectItemInImage(item, base64Image) {
        const cloudName = "dev";
        const uploadPreset = "CloudinaryPreset";
        const apiKey = "CloudinaryApiKey";
        const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

        const formData = new FormData();
        formData.append("file", base64Image);
        formData.append("upload_preset", uploadPreset);
        formData.append("api_key", apiKey);

        try {
            // Upload image to Cloudinary
            const uploadResponse = await fetch(cloudinaryUploadUrl, {
                method: "POST",
                body: formData,
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(JSON.stringify(uploadResult));
            }

            const imageUrl = uploadResult.secure_url;
            console.log(imageUrl)
            // Prepare the Together API prompt
            const messages = [
                {
                    role: "system",
                    content: "All responses should be in JSON.",
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "You are analyzing a CAPTCHA image with a 3x3 grid of 9 numbered squares (positions 1-9). " +
                            "Look at each square carefully and identify which ones contain the specified item. " +
                            "The grid is numbered from left to right, top to bottom: " +
                            "Row 1: [1][2][3], Row 2: [4][5][6], Row 3: [7][8][9]. " +
                            "Return ONLY the position numbers where you see the item as an array of strings. " +
                            "For example, if you see the item in positions 2 and 5, return [\"2\", \"5\"]. " +
                            "If you don't see the item anywhere, return an empty array []. " +
                            "Be very precise - only select squares that clearly contain the specified item. " +
                            `The item to look for is: ${item}`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl,
                            },
                        },
                    ],
                },
            ];

            const togetherResponse = await fetch("https://api.together.xyz/v1/chat/completions", {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    authorization: "Bearer TogetherApiKey",
                },
                body: JSON.stringify({
                    model: "Qwen/Qwen2.5-VL-72B-Instruct",
                    messages: messages,
                    stream: false,
                    response_format: {
                        type: "json_schema",
                        schema: {
                            type: "object",
                            properties: {
                                position: {
                                    type: "array",
                                    items: {
                                        type: "string"
                                    },
                                    additionalProperties: false,
                                },
                            },
                            required: ["position"],
                            additionalProperties: false,
                        },
                    },
                }),
            });

            const result = await togetherResponse.json();
            const jsonout = JSON.parse(result.choices[0].message.content);
            const positions = jsonout.position || [];

            return jsonout;
        } catch (error) {
            console.error("Error:", error);
            return null;
        }
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

        // Enhanced close function that properly cleans up
        const closeIframe = () => {
            console.log("🔄 Closing iframe and cleaning up...");
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            if (onClose) onClose();
        };

        closeBtn.onclick = closeIframe;

        iframe.onload = async () => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

                console.log("🎯 Starting captcha solving process...");

                // Wait for page to fully load
                await humanDelay(2000, 3000);

                // First, wait and click verify button if it exists
                const verifyButton = iframeDoc.querySelector('#amzn-captcha-verify-button');
                if (verifyButton) {
                    console.log("🔍 Found verify button, clicking...");
                    await simulateHumanClick(verifyButton, iframeDoc);

                    // Wait for canvas to appear after verify button is clicked
                    await humanDelay(3000, 4000);
                }

                // Function to handle canvas processing with human-like behavior
                async function processCanvas() {
                    console.log("🖼️ Processing canvas...");

                    const canvas = iframeDoc.querySelector("#root > div > form > div:nth-child(3) > div > div:nth-child(2) > canvas");
                    if (!canvas) {
                        console.warn("❌ Canvas not found in iframe.");
                        return false;
                    }

                    // Wait a bit more to ensure canvas is fully rendered
                    await humanDelay(1000, 2000);

                    const base64 = canvas.toDataURL();
                    const tofindElement = iframeDoc.querySelector("#root > div > form > div:nth-child(3) > div > div:nth-child(1) > em");

                    if (!tofindElement) {
                        console.warn("❌ Could not find item description element.");
                        return false;
                    }

                    const tofind = tofindElement.innerText;
                    console.log("🎯 Looking for:", tofind);

                    const result = await detectItemInImage(tofind, base64);
                    const positions = result?.position || [];
                    console.log("📍 Detected positions:", positions);

                    if (positions.length === 0) {
                        console.log("⚠️ No positions detected, might be a difficult captcha");
                        return false;
                    }

                    // Click each detected button with human-like delays
                    for (const pos of positions) {
                        const number = parseInt(pos.trim());
                        if (!isNaN(number)) {
                            // Human delay before each click
                            await humanDelay(800, 1500);

                            const buttonSelector = `#root > div > form > div:nth-child(3) > div > div:nth-child(2) > canvas > button:nth-child(${number})`;
                            const targetButton = iframeDoc.querySelector(buttonSelector);

                            if (targetButton) {
                                console.log(`🖱️ Clicking image button number ${number}...`);
                                await simulateHumanClick(targetButton, iframeDoc);

                                // Small delay to see the visual feedback
                                await humanDelay(300, 600);
                            } else {
                                console.warn(`❌ Image button number ${number} not found`);
                            }
                        }
                    }

                    // Wait before clicking finish button (human would take time to review)
                    console.log("⏳ Reviewing selection before submitting...");
                    await humanDelay(1500, 2500);

                    const finishButton = iframeDoc.querySelector("#amzn-btn-verify-internal");
                    if (finishButton) {
                        console.log("✅ Clicking finish button...");
                        await simulateHumanClick(finishButton, iframeDoc);

                        // Wait to see if captcha was successful
                        await humanDelay(2000, 3000);

                        // Check if we're redirected or if there's a success indicator
                        // If still on captcha page, it might have failed
                        const stillOnCaptcha = iframeDoc.querySelector("#root > div > form > div:nth-child(3)");

                        if (!stillOnCaptcha) {
                            console.log("🎉 Captcha appears to be solved successfully!");
                            // Wait a bit more then close
                            await humanDelay(1000, 2000);
                            closeIframe();
                            return true;
                        } else {
                            console.log("⚠️ Still on captcha page, might need retry");
                            // Close after a delay anyway to avoid suspicion
                            await humanDelay(2000, 3000);
                            closeIframe();
                            return false;
                        }
                    } else {
                        console.warn("❌ Finish button not found");
                        closeIframe();
                        return false;
                    }
                }

                // Start the canvas processing
                await processCanvas();

            } catch (e) {
                console.error('❌ Error accessing iframe content:', e);
                // Close iframe on error after a delay
                await humanDelay(1000, 2000);
                closeIframe();
            }
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
            console.log("🚀 Starting account creation process...");
            const email = randomEmail();
            const username = randomString(10);

            console.log(`📧 Generated credentials: ${email} / ${username}`);

            await logoutIfLoggedIn();
            const success = await tryCreateAccount(email, username);

            if (!success) {
                console.log("🤖 Account creation blocked, attempting captcha solve...");
                showIframeForCaptcha(async () => {
                    console.log("🔄 Retrying account creation after captcha...");
                    // Add delay before retry to seem more human
                    await humanDelay(1000, 2000);

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
        console.log("🎉 HuggingFace Auto Account Manager loaded!");
    });
})();
