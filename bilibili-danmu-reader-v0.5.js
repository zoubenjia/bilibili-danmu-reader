// ==UserScript==
// @name         读弹幕 - B站弹幕语音阅读
// @namespace    http://tampermonkey.net/
// @version      0.5.0
// @description  在B站自动用语音读出弹幕内容
// @author       Claude
// @match        https://www.bilibili.com/video/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // ============== 配置 ==============
  const CONFIG = {
    enabled: true,
    rate: 1,
    pitch: 1,
    volume: 1,
    deduplicateTime: 500,
    maxHistorySize: 100,
  };

  // ============== 状态管理 ==============
  let lastSpokenTexts = {};
  let spokenCount = 0;
  let synth = window.speechSynthesis;
  let observer = null;
  let processedNodes = new WeakSet();
  let speakQueue = []; // 语音队列
  let isProcessingQueue = false;
  let lastSpeakTime = 0;
  let synthHealthCheckCount = 0;

  // ============== 工具函数 ==============

  function getDanmuElements() {
    const selectors = [
      '.bili-danmaku-x-dm',
      '.bili-live-chat-item',
      '.danmaku-item',
      '.bili-danmaku-item',
      '[class*="danmaku"]',
    ];

    for (let selector of selectors) {
      let elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return elements;
      }
    }
    return [];
  }

  function extractTextFromDanmu(element) {
    if (!element) return '';

    const textSelectors = [
      '.bili-live-chat-item__content',
      '.danmaku-content',
      '.bili-danmaku-item__content',
      'span',
    ];

    for (let selector of textSelectors) {
      let textEl = element.querySelector(selector);
      if (textEl) {
        return textEl.textContent.trim();
      }
    }

    return element.textContent.trim();
  }

  function shouldSpeak(text) {
    if (!text) return false;

    const now = Date.now();
    const keys = Object.keys(lastSpokenTexts);

    if (keys.length > CONFIG.maxHistorySize) {
      keys
        .sort((a, b) => lastSpokenTexts[a] - lastSpokenTexts[b])
        .slice(0, Math.floor(keys.length / 2))
        .forEach(key => delete lastSpokenTexts[key]);
    } else {
      keys.forEach(key => {
        if (now - lastSpokenTexts[key] > CONFIG.deduplicateTime) {
          delete lastSpokenTexts[key];
        }
      });
    }

    if (lastSpokenTexts[text]) {
      return false;
    }

    lastSpokenTexts[text] = now;
    return true;
  }

  /**
   * 健康检查 speechSynthesis
   */
  function checkSynthHealth() {
    synthHealthCheckCount++;

    // 每10次检查一次
    if (synthHealthCheckCount % 10 !== 0) return;

    try {
      // 如果上一次播放后超过5秒还没新播放，可能卡住了
      const timeSinceLastSpeak = Date.now() - lastSpeakTime;
      if (timeSinceLastSpeak > 10000 && speakQueue.length > 0) {
        console.warn('[读弹幕] 检测到 speechSynthesis 可能卡住，强制重置...');
        synth.cancel();
        synth = window.speechSynthesis; // 重新获取
        isProcessingQueue = false;
        processQueue(); // 重新处理队列
      }
    } catch (e) {
      console.error('[读弹幕] 健康检查错误:', e.message);
    }
  }

  /**
   * 队列处理系统
   */
  function addToQueue(text) {
    if (!text || !CONFIG.enabled) return;

    if (!shouldSpeak(text)) {
      return;
    }

    speakQueue.push(text);
    console.log('[读弹幕] 加入队列:', text.substring(0, 30), `(队列: ${speakQueue.length})`);
    processQueue();
  }

  function processQueue() {
    if (isProcessingQueue || speakQueue.length === 0) {
      return;
    }

    // 检查语音是否在播放
    if (synth.speaking) {
      // 如果还在播放，等待300ms后重试
      setTimeout(processQueue, 300);
      return;
    }

    isProcessingQueue = true;
    const text = speakQueue.shift();

    try {
      let utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = CONFIG.rate;
      utterance.pitch = CONFIG.pitch;
      utterance.volume = CONFIG.volume;

      utterance.onstart = () => {
        console.log('[读弹幕] ▶ 开始:', text.substring(0, 30));
        lastSpeakTime = Date.now();
      };

      utterance.onend = () => {
        spokenCount++;
        console.log('[读弹幕] ✓ 完成');
        isProcessingQueue = false;
        // 继续处理下一条
        setTimeout(processQueue, 50);
      };

      utterance.onerror = (event) => {
        console.error('[读弹幕] 语音错误:', event.error);
        isProcessingQueue = false;
        lastSpeakTime = Date.now();
        // 继续处理下一条
        setTimeout(processQueue, 100);
      };

      synth.cancel(); // 清空之前的
      synth.speak(utterance);
    } catch (e) {
      console.error('[读弹幕] 播放失败:', e.message);
      isProcessingQueue = false;
      // 继续处理下一条
      setTimeout(processQueue, 100);
    }
  }

  function speakExistingDanmu() {
    const danmuElements = getDanmuElements();
    console.log(`[读弹幕] 读取 ${danmuElements.length} 条已存在的弹幕`);

    danmuElements.forEach((element, index) => {
      if (processedNodes.has(element)) {
        return;
      }
      processedNodes.add(element);

      setTimeout(() => {
        let text = extractTextFromDanmu(element);
        if (text) {
          addToQueue(text);
        }
      }, index * 30);
    });
  }

  function startObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    const container = document.querySelector(
      '.bpx-player-row-dm-wrap, .bili-live-chat-item-list, .danmaku-container, .bili-danmaku-container, [class*="chat"]'
    );

    if (!container) {
      console.log('[读弹幕] 未找到弹幕容器，2秒后重试...');
      setTimeout(startObserver, 2000);
      return;
    }

    console.log('[读弹幕] 已找到弹幕容器，开始监听...');
    speakExistingDanmu();

    observer = new MutationObserver((mutations) => {
      try {
        checkSynthHealth(); // 定期健康检查

        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            try {
              if (node.nodeType !== 1) return;

              if (processedNodes.has(node)) {
                return;
              }
              processedNodes.add(node);

              if (node.classList && node.classList.toString().includes('danmaku')) {
                let text = extractTextFromDanmu(node);
                if (text) {
                  addToQueue(text);
                  return;
                }
              }

              const danmuEl = node.querySelector && node.querySelector('[class*="danmaku"]');
              if (danmuEl && !processedNodes.has(danmuEl)) {
                processedNodes.add(danmuEl);
                let text = extractTextFromDanmu(danmuEl);
                if (text) {
                  addToQueue(text);
                }
              }
            } catch (e) {
              console.error('[读弹幕] 处理节点错误:', e.message);
            }
          });
        });
      } catch (e) {
        console.error('[读弹幕] MutationObserver 错误:', e.message);
        setTimeout(startObserver, 5000);
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });
  }

  function createControlPanel() {
    let panel = document.createElement('div');
    panel.id = 'duanmu-reader-panel';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
      min-width: 220px;
    `;

    let title = document.createElement('div');
    title.style.cssText = `
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    `;
    title.innerHTML = '🎤 读弹幕';

    let toggleBtn = document.createElement('button');
    toggleBtn.style.cssText = `
      width: 100%;
      padding: 6px 12px;
      margin-bottom: 6px;
      border: none;
      border-radius: 6px;
      background: ${CONFIG.enabled ? '#4ade80' : '#ef4444'};
      color: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s;
    `;
    toggleBtn.textContent = CONFIG.enabled ? '✓ 已启用' : '✗ 已禁用';

    toggleBtn.onclick = () => {
      CONFIG.enabled = !CONFIG.enabled;
      toggleBtn.textContent = CONFIG.enabled ? '✓ 已启用' : '✗ 已禁用';
      toggleBtn.style.background = CONFIG.enabled ? '#4ade80' : '#ef4444';
      GM_setValue('duanmu_reader_enabled', CONFIG.enabled);
      console.log('[读弹幕]', CONFIG.enabled ? '已启用' : '已禁用');
    };

    let statsDiv = document.createElement('div');
    statsDiv.id = 'duanmu-stats';
    statsDiv.style.cssText = `
      font-size: 11px;
      margin-top: 8px;
      padding: 6px;
      background: rgba(0,0,0,0.2);
      border-radius: 4px;
      text-align: center;
    `;
    statsDiv.innerHTML = `✓已读: <span id="spoken-count">0</span> | ⏳队列: <span id="queue-count">0</span>`;

    let hint = document.createElement('div');
    hint.style.cssText = `
      font-size: 11px;
      margin-top: 8px;
      opacity: 0.8;
      padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.2);
    `;
    hint.innerHTML = 'Alt+R: 切换<br/>点击标题收起';

    panel.appendChild(title);
    panel.appendChild(toggleBtn);
    panel.appendChild(statsDiv);
    panel.appendChild(hint);

    document.body.appendChild(panel);

    let isCollapsed = false;
    title.onclick = () => {
      isCollapsed = !isCollapsed;
      toggleBtn.style.display = isCollapsed ? 'none' : 'block';
      statsDiv.style.display = isCollapsed ? 'none' : 'block';
      hint.style.display = isCollapsed ? 'none' : 'block';
      title.style.marginBottom = isCollapsed ? '0' : '8px';
    };

    // 实时更新统计
    setInterval(() => {
      const countEl = document.getElementById('spoken-count');
      const queueEl = document.getElementById('queue-count');
      if (countEl) countEl.textContent = spokenCount;
      if (queueEl) queueEl.textContent = speakQueue.length;
    }, 500);
  }

  function setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toUpperCase() === 'R') {
        e.preventDefault();
        CONFIG.enabled = !CONFIG.enabled;
        let btn = document.querySelector('#duanmu-reader-panel button');
        if (btn) {
          btn.textContent = CONFIG.enabled ? '✓ 已启用' : '✗ 已禁用';
          btn.style.background = CONFIG.enabled ? '#4ade80' : '#ef4444';
        }
        console.log('[读弹幕]', CONFIG.enabled ? '已启用' : '已禁用');
      }
    });
  }

  function loadConfig() {
    if (typeof GM_getValue !== 'undefined') {
      CONFIG.enabled = GM_getValue('duanmu_reader_enabled', true);
      CONFIG.rate = parseFloat(GM_getValue('duanmu_reader_rate', 1));
      CONFIG.volume = parseFloat(GM_getValue('duanmu_reader_volume', 1));
    }
  }

  // ============== 初始化 ==============
  function init() {
    console.log('[读弹幕] 脚本已加载 v0.5.0');

    if (!('speechSynthesis' in window)) {
      console.error('[读弹幕] 浏览器不支持 Web Speech API');
      alert('您的浏览器不支持 Web Speech API，请升级浏览器');
      return;
    }

    loadConfig();
    createControlPanel();
    setupKeyboardShortcut();
    startObserver();

    // 定期健康检查
    setInterval(checkSynthHealth, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
