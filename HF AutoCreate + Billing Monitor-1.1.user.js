// ==UserScript==
// @name         HF AutoCreate + Billing Monitor
// @namespace    http://tampermonkey.net/
// @version      1.1
// @match        https://huggingface.co/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // --- STORAGE KEYS ---
  const STORAGE_KEY_1 = 'hf_saved_textarea_1';
  const STORAGE_KEY_2 = 'hf_saved_textarea_2';

  // --- CREATE BUTTON ---
  const btn = document.createElement('button');
  btn.innerText = '🧪 Auto Create HF Account';
  Object.assign(btn.style, {
    position: 'fixed',
    top: '10px',
    left: '10px',
    zIndex: '10000',
    padding: '8px 12px',
    background: '#ffcc00',
    border: '1px solid #000',
    borderRadius: '4px',
    cursor: 'pointer',
  });
  document.body.appendChild(btn);

  // --- BUTTON CLICK HANDLER ---
  btn.addEventListener('click', async () => {
    saveTextareaValues();
    await tryLogout();
    showIframeWithJoin();
  });

  // --- Save textarea values after delay ---
  function saveTextareaValues() {
    setTimeout(() => {
      const t1 = getByXPath('/html/body/div[1]/div[1]/main/div[1]/div/div/div[3]/div[1]/div[2]/div[1]/label/div/textarea');
      const t2 = getByXPath('/html/body/div[1]/div[1]/main/div[1]/div/div/div[3]/div[1]/div[3]/div[2]/div/div[1]/div[1]/label/div/textarea');
      if (t1) localStorage.setItem(STORAGE_KEY_1, t1.value);
      if (t2) localStorage.setItem(STORAGE_KEY_2, t2.value);
      console.log("✅ Saved textarea values");
    }, 500);
  }

  // --- Restore textarea values after delay ---
  function restoreTextareaValues() {
    setTimeout(() => {
      const val1 = localStorage.getItem(STORAGE_KEY_1);
      const val2 = localStorage.getItem(STORAGE_KEY_2);
      const t1 = getByXPath('/html/body/div[1]/div[1]/main/div[1]/div/div/div[3]/div[1]/div[2]/div[1]/label/div/textarea');
      const t2 = getByXPath('/html/body/div[1]/div[1]/main/div[1]/div/div/div[3]/div[1]/div[3]/div[2]/div/div[1]/div[1]/label/div/textarea');
      if (t1 && val1 !== null) t1.value = val1;
      if (t2 && val2 !== null) t2.value = val2;
      console.log("✅ Restored textarea values");
    }, 1000);
  }

  function getByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  }

  // --- Logout if logged in ---
  async function tryLogout() {
    const form = document.querySelector('form[action="/logout"]');
    if (form) {
      form.submit();
      console.log("🚪 Logging out...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // --- Show join iframe + close button ---
  function showIframeWithJoin() {
    if (document.getElementById('hf-join-iframe')) return; // avoid multiple iframes

    const iframe = document.createElement('iframe');
    iframe.src = "https://huggingface.co/join";
    Object.assign(iframe.style, {
      position: "fixed",
      top: "50px",
      left: "50px",
      width: "80vw",
      height: "80vh",
      zIndex: "9999",
      border: "3px solid black",
      background: "#fff",
    });
    iframe.id = "hf-join-iframe";

    const closeBtn = document.createElement('button');
    closeBtn.innerText = "❌ Close & Retry";
    Object.assign(closeBtn.style, {
      position: "fixed",
      top: "10px",
      right: "10px",
      zIndex: "10000",
      padding: '8px 12px',
      background: '#f44336',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    });
    closeBtn.onclick = () => {
      document.body.removeChild(iframe);
      document.body.removeChild(closeBtn);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    document.body.appendChild(iframe);
    document.body.appendChild(closeBtn);
  }

  // --- Billing check and prompt ---
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
          "upgrade-insecure-requests": "1",
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
        if (confirm(`Your usage is ${minutes}/5 minutes. Generate new account?`)) {
          btn.click();
        }
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

  // --- Initialize ---
  restoreTextareaValues();
  startBillingMonitor();

})();
