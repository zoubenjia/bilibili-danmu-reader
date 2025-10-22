// ==UserScript==
// @name         读弹幕 - B站弹幕语音阅读
// @namespace    http://tampermonkey.net/
// @version      0.9.0
// @description  在B站视频/直播自动用语音读出弹幕内容（轮询版本）
// @author       Claude
// @license      MIT
// @match        https://www.bilibili.com/video/*
// @match        https://live.bilibili.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// @downloadURL  https://raw.githubusercontent.com/zoubenjia/bilibili-danmu-reader/main/bilibili-danmu-reader-polling.js
// @updateURL    https://raw.githubusercontent.com/zoubenjia/bilibili-danmu-reader/main/bilibili-danmu-reader-polling.js
// ==/UserScript==

(function() {
  'use strict';

  const CONFIG = {
    enabled: true,
    rate: 1,
    pitch: 1,
    volume: 1,
    deduplicateTime: 500,
    maxHistorySize: 100,
    smartFilter: true,      // 智能过滤开关
    autoSpeedUp: true,      // 自动加速开关
    repeatFilter: true,     // 重复内容过滤开关
    nonsenseFilter: true,   // 无意义弹幕过滤开关（纯重复字符）
    userBaseRate: 1,        // 用户设定的基础语速（不被自动加速覆盖）
  };

  let lastSpokenTexts = {};
  let spokenCount = 0;
  let repeatFilteredCount = 0;  // 被重复过滤掉的弹幕数
  let recentTexts = [];  // 最近读过的弹幕列表，用于检测重复
  let synth = window.speechSynthesis;
  let processedTexts = new Set();  // 改为记录文本而不是元素引用
  let speakQueue = [];
  let isProcessingQueue = false;

  // ============== 工具函数 ==============

  // 动态计算最小过滤长度：根据队列长度智能调整
  function getMinFilterLength() {
    const queueLen = speakQueue.length;

    // 动态公式：队列越长，过滤长度越大
    // 基础长度 2 + (队列长度 / 5)，确保随着队列增长而逐步提高过滤要求
    let minLen = 2 + Math.floor(queueLen / 5);

    // 设置上下限：最小2字，最多10字
    return Math.min(Math.max(minLen, 2), 10);
  }

  // 检查是否是无意义的弹幕（纯重复字符）
  function isNonsenseText(text) {
    if (!CONFIG.nonsenseFilter) return false;

    // 长度过短的纯重复不过滤（可能是真实内容）
    if (text.length < 3) {
      return false;
    }

    // 检查是否只由一个字符重复组成
    const firstChar = text[0];
    const isAllSameChar = text.split('').every(char => char === firstChar);

    if (isAllSameChar) {
      return true; // 都是同一个字符，无意义
    }

    return false;
  }

  // 检查是否是重复的弹幕
  function isRepeatedText(text) {
    if (!CONFIG.repeatFilter) return false;

    // 检查最近的弹幕列表中是否有完全相同的
    if (recentTexts.includes(text)) {
      return true;
    }

    return false;
  }

  // 添加弹幕到最近列表
  function addToRecentTexts(text) {
    recentTexts.push(text);

    // 只保留最近 50 条
    if (recentTexts.length > 50) {
      recentTexts.shift();
    }
  }

  // 智能过滤：根据队列长度判断是否应该过滤这条弹幕
  function shouldFilterByLength(text) {
    if (!CONFIG.smartFilter) return false;

    const queueLen = speakQueue.length;

    // 队列少于 3 条时不过滤
    if (queueLen < 3) {
      return false;
    }

    // 动态获取当前应该过滤的最小长度
    const minLen = getMinFilterLength();
    return text.length < minLen;
  }

  // 自动加速：根据队列长度自动调整语速
  function getAutoSpeed() {
    if (!CONFIG.autoSpeedUp) {
      return CONFIG.rate; // 如果关闭自动加速，用用户设定的速度
    }

    const queueLen = speakQueue.length;

    // 多层级加速
    if (queueLen >= 12) {
      return 2.0;   // 队列很长时，加速到2.0x
    } else if (queueLen >= 8) {
      return 1.6;   // 队列较长时，加速到1.6x
    } else if (queueLen >= 4) {
      return 1.3;   // 队列开始堆积时，加速到1.3x
    }

    return CONFIG.rate; // 队列少时，用用户设定的速度
  }

  function getDanmuElements() {
    const selectors = [
      '.bili-danmaku-x-dm',
      '.bili-live-chat-item',
      '.danmaku-item',
      '.bili-danmaku-item',
      'li[class*="item"]',        // 支持某些直播间的li标签结构
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

  function addToQueue(text) {
    if (!text || !CONFIG.enabled) return;

    if (!shouldSpeak(text)) {
      return;
    }

    // 无意义过滤：过滤纯重复字符的弹幕（如"哈哈哈""666"等）
    if (isNonsenseText(text)) {
      return;
    }

    // 重复过滤：检查是否是最近重复的弹幕
    if (isRepeatedText(text)) {
      repeatFilteredCount++;
      return;
    }

    // 智能过滤：如果队列很长，过滤短弹幕
    if (shouldFilterByLength(text)) {
      return;
    }

    // 添加到最近列表
    addToRecentTexts(text);

    speakQueue.push(text);
    processQueue();
  }

  function isVideoPaused() {
    // 检查视频播放器是否暂停
    const video = document.querySelector('video');
    if (video && video.paused) {
      return true;
    }
    return false;
  }

  function processQueue() {
    if (isProcessingQueue || speakQueue.length === 0) {
      return;
    }

    // 如果视频暂停，暂停读弹幕
    if (isVideoPaused()) {
      setTimeout(processQueue, 500);
      return;
    }

    if (synth.speaking) {
      setTimeout(processQueue, 300);
      return;
    }

    isProcessingQueue = true;
    const text = speakQueue.shift();

    try {
      let utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';        // 设置中文语言
      utterance.rate = getAutoSpeed();  // 使用自动加速
      utterance.pitch = CONFIG.pitch;
      utterance.volume = CONFIG.volume;

      utterance.onstart = () => {
        // console.log('[读弹幕] ▶ 开始:', text.substring(0, 20));
      };

      utterance.onend = () => {
        spokenCount++;
        isProcessingQueue = false;
        setTimeout(processQueue, 50);
      };

      utterance.onerror = (event) => {
        console.error('[读弹幕] 语音错误:', event.error);
        isProcessingQueue = false;
        setTimeout(processQueue, 100);
      };

      synth.cancel();
      synth.speak(utterance);
    } catch (e) {
      console.error('[读弹幕] 播放失败:', e.message);
      isProcessingQueue = false;
      setTimeout(processQueue, 100);
    }
  }

  /**
   * 核心轮询函数 - 不依赖 MutationObserver
   * 每次检查是否有新的未处理弹幕
   * 改为用文本内容去重，防止弹幕元素删除后重复读
   */
  function pollNewDanmu() {
    try {
      const allDanmu = getDanmuElements();

      allDanmu.forEach(element => {
        // 提取文本
        let text = extractTextFromDanmu(element);
        if (!text) return;

        // 用文本去重，而不是元素引用
        const textId = `${text}:${element.offsetHeight}:${element.offsetWidth}`; // 用内容+位置作为ID
        if (processedTexts.has(textId)) {
          return;
        }

        // 标记为已处理
        processedTexts.add(textId);

        // 加入队列
        addToQueue(text);
      });
    } catch (e) {
      console.error('[读弹幕] 轮询错误:', e.message);
    }
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
      width: fit-content;
    `;

    let title = document.createElement('div');
    title.style.cssText = `
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: move;
      user-select: none;
    `;
    title.innerHTML = '🎤 读弹幕 v0.9.0';

    // 添加拖拽功能
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    title.addEventListener('mousedown', (e) => {
      // 如果是点击标题本身（收起功能），需要检查是否真的是拖拽
      isDragging = true;
      offsetX = e.clientX - panel.getBoundingClientRect().left;
      offsetY = e.clientY - panel.getBoundingClientRect().top;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        panel.style.left = (e.clientX - offsetX) + 'px';
        panel.style.top = (e.clientY - offsetY) + 'px';
        panel.style.right = 'auto';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

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
      line-height: 1.6;
    `;
    statsDiv.innerHTML = `✓已读: <span id="spoken-count">0</span><br/>⏳队列: <span id="queue-count">0</span><br/>📊页面: <span id="danmu-count">0</span><br/>🔍过滤: <span id="filter-length">2</span>字+`;

    // 语速调整
    let rateLabel = document.createElement('div');
    rateLabel.style.cssText = 'font-size: 12px; margin-top: 8px; margin-bottom: 4px; display: flex; justify-content: space-between;';
    rateLabel.innerHTML = `<span>语速</span><span>${CONFIG.rate.toFixed(1)}x</span>`;
    rateLabel.id = 'rate-label';

    let rateSlider = document.createElement('input');
    rateSlider.type = 'range';
    rateSlider.min = '0.5';
    rateSlider.max = '2';
    rateSlider.step = '0.1';
    rateSlider.value = CONFIG.rate;
    rateSlider.style.cssText = `width: 100%; height: 4px; margin-bottom: 8px; cursor: pointer;`;
    rateSlider.oninput = (e) => {
      CONFIG.rate = parseFloat(e.target.value);
      document.getElementById('rate-label').innerHTML = `<span>语速</span><span>${CONFIG.rate.toFixed(1)}x</span>`;
      GM_setValue('duanmu_reader_rate', CONFIG.rate);
    };

    // 音量调整
    let volumeLabel = document.createElement('div');
    volumeLabel.style.cssText = 'font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between;';
    volumeLabel.innerHTML = `<span>音量</span><span>${Math.round(CONFIG.volume * 100)}%</span>`;
    volumeLabel.id = 'volume-label';

    let volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '1';
    volumeSlider.step = '0.1';
    volumeSlider.value = CONFIG.volume;
    volumeSlider.style.cssText = `width: 100%; height: 4px; margin-bottom: 8px; cursor: pointer;`;
    volumeSlider.oninput = (e) => {
      CONFIG.volume = parseFloat(e.target.value);
      document.getElementById('volume-label').innerHTML = `<span>音量</span><span>${Math.round(CONFIG.volume * 100)}%</span>`;
      GM_setValue('duanmu_reader_volume', CONFIG.volume);
    };

    // 智能过滤开关
    let smartFilterBtn = document.createElement('button');
    smartFilterBtn.style.cssText = `
      width: 100%;
      padding: 6px 12px;
      margin-bottom: 6px;
      border: none;
      border-radius: 6px;
      background: ${CONFIG.smartFilter ? '#3b82f6' : '#9ca3af'};
      color: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s;
    `;
    smartFilterBtn.textContent = CONFIG.smartFilter ? '🎯 智能过滤: ON' : '🎯 智能过滤: OFF';
    smartFilterBtn.onclick = () => {
      CONFIG.smartFilter = !CONFIG.smartFilter;
      smartFilterBtn.textContent = CONFIG.smartFilter ? '🎯 智能过滤: ON' : '🎯 智能过滤: OFF';
      smartFilterBtn.style.background = CONFIG.smartFilter ? '#3b82f6' : '#9ca3af';
      GM_setValue('duanmu_reader_smartFilter', CONFIG.smartFilter);
    };

    // 自动加速开关
    let autoSpeedBtn = document.createElement('button');
    autoSpeedBtn.style.cssText = `
      width: 100%;
      padding: 6px 12px;
      margin-bottom: 6px;
      border: none;
      border-radius: 6px;
      background: ${CONFIG.autoSpeedUp ? '#8b5cf6' : '#9ca3af'};
      color: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s;
    `;
    autoSpeedBtn.textContent = CONFIG.autoSpeedUp ? '⚡ 自动加速: ON' : '⚡ 自动加速: OFF';
    autoSpeedBtn.onclick = () => {
      CONFIG.autoSpeedUp = !CONFIG.autoSpeedUp;
      autoSpeedBtn.textContent = CONFIG.autoSpeedUp ? '⚡ 自动加速: ON' : '⚡ 自动加速: OFF';
      autoSpeedBtn.style.background = CONFIG.autoSpeedUp ? '#8b5cf6' : '#9ca3af';
      GM_setValue('duanmu_reader_autoSpeedUp', CONFIG.autoSpeedUp);
    };

    // 重复过滤开关
    let repeatFilterBtn = document.createElement('button');
    repeatFilterBtn.style.cssText = `
      width: 100%;
      padding: 6px 12px;
      margin-bottom: 6px;
      border: none;
      border-radius: 6px;
      background: ${CONFIG.repeatFilter ? '#ec4899' : '#9ca3af'};
      color: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s;
    `;
    repeatFilterBtn.textContent = CONFIG.repeatFilter ? '🔄 去重: ON' : '🔄 去重: OFF';
    repeatFilterBtn.onclick = () => {
      CONFIG.repeatFilter = !CONFIG.repeatFilter;
      repeatFilterBtn.textContent = CONFIG.repeatFilter ? '🔄 去重: ON' : '🔄 去重: OFF';
      repeatFilterBtn.style.background = CONFIG.repeatFilter ? '#ec4899' : '#9ca3af';
      GM_setValue('duanmu_reader_repeatFilter', CONFIG.repeatFilter);
    };

    // 无意义弹幕过滤开关
    let nonsenseFilterBtn = document.createElement('button');
    nonsenseFilterBtn.style.cssText = `
      width: 100%;
      padding: 6px 12px;
      margin-bottom: 6px;
      border: none;
      border-radius: 6px;
      background: ${CONFIG.nonsenseFilter ? '#f59e0b' : '#9ca3af'};
      color: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s;
    `;
    nonsenseFilterBtn.textContent = CONFIG.nonsenseFilter ? '🚫 净化: ON' : '🚫 净化: OFF';
    nonsenseFilterBtn.onclick = () => {
      CONFIG.nonsenseFilter = !CONFIG.nonsenseFilter;
      nonsenseFilterBtn.textContent = CONFIG.nonsenseFilter ? '🚫 净化: ON' : '🚫 净化: OFF';
      nonsenseFilterBtn.style.background = CONFIG.nonsenseFilter ? '#f59e0b' : '#9ca3af';
      GM_setValue('duanmu_reader_nonsenseFilter', CONFIG.nonsenseFilter);
    };

    let hint = document.createElement('div');
    hint.style.cssText = `
      font-size: 11px;
      margin-top: 8px;
      opacity: 0.8;
      padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.2);
    `;
    hint.innerHTML = 'Alt+R: 切换<br/>拖拽移动<br/>双击收起';

    panel.appendChild(title);
    panel.appendChild(toggleBtn);
    panel.appendChild(statsDiv);
    panel.appendChild(rateLabel);
    panel.appendChild(rateSlider);
    panel.appendChild(volumeLabel);
    panel.appendChild(volumeSlider);
    panel.appendChild(smartFilterBtn);
    panel.appendChild(autoSpeedBtn);
    panel.appendChild(repeatFilterBtn);
    panel.appendChild(nonsenseFilterBtn);
    panel.appendChild(hint);

    document.body.appendChild(panel);

    let isCollapsed = true;

    // 初始化为收起状态
    toggleBtn.style.display = 'none';
    statsDiv.style.display = 'none';
    rateLabel.style.display = 'none';
    rateSlider.style.display = 'none';
    volumeLabel.style.display = 'none';
    volumeSlider.style.display = 'none';
    smartFilterBtn.style.display = 'none';
    autoSpeedBtn.style.display = 'none';
    repeatFilterBtn.style.display = 'none';
    nonsenseFilterBtn.style.display = 'none';
    hint.style.display = 'none';
    title.style.marginBottom = '0';

    title.ondblclick = () => {
      isCollapsed = !isCollapsed;
      toggleBtn.style.display = isCollapsed ? 'none' : 'block';
      statsDiv.style.display = isCollapsed ? 'none' : 'block';
      rateLabel.style.display = isCollapsed ? 'none' : 'block';
      rateSlider.style.display = isCollapsed ? 'none' : 'block';
      volumeLabel.style.display = isCollapsed ? 'none' : 'block';
      volumeSlider.style.display = isCollapsed ? 'none' : 'block';
      smartFilterBtn.style.display = isCollapsed ? 'none' : 'block';
      autoSpeedBtn.style.display = isCollapsed ? 'none' : 'block';
      repeatFilterBtn.style.display = isCollapsed ? 'none' : 'block';
      nonsenseFilterBtn.style.display = isCollapsed ? 'none' : 'block';
      hint.style.display = isCollapsed ? 'none' : 'block';
      title.style.marginBottom = isCollapsed ? '0' : '8px';
      // 收起时变窄，展开时恢复宽度
      panel.style.width = isCollapsed ? 'fit-content' : '220px';
    };

    setInterval(() => {
      const countEl = document.getElementById('spoken-count');
      const queueEl = document.getElementById('queue-count');
      const danmuEl = document.getElementById('danmu-count');
      const filterLenEl = document.getElementById('filter-length');

      if (countEl) countEl.textContent = spokenCount;
      if (queueEl) queueEl.textContent = speakQueue.length;
      if (danmuEl) danmuEl.textContent = getDanmuElements().length;
      // 实时显示当前的过滤长度
      if (filterLenEl && CONFIG.smartFilter) {
        filterLenEl.textContent = getMinFilterLength();
      }
    }, 500);
  }

  function setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toUpperCase() === 'D') {
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
      CONFIG.smartFilter = GM_getValue('duanmu_reader_smartFilter', true);
      CONFIG.autoSpeedUp = GM_getValue('duanmu_reader_autoSpeedUp', true);
      CONFIG.repeatFilter = GM_getValue('duanmu_reader_repeatFilter', true);
      CONFIG.nonsenseFilter = GM_getValue('duanmu_reader_nonsenseFilter', true);
    }
  }

  function init() {
    console.log('[读弹幕] 脚本已加载 v0.9.0 - 轮询模式（不依赖MutationObserver）');

    if (!('speechSynthesis' in window)) {
      console.error('[读弹幕] 浏览器不支持 Web Speech API');
      alert('您的浏览器不支持 Web Speech API，请升级浏览器');
      return;
    }

    loadConfig();
    createControlPanel();
    setupKeyboardShortcut();

    // 启动轮询 - 每 100ms 检查一次新弹幕（加快速度以捕捉快速出现的弹幕）
    setInterval(pollNewDanmu, 100);

    console.log('[读弹幕] ✓ 轮询模式已启动 (100ms 间隔)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
