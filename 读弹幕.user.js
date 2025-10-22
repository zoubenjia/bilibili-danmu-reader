// ==UserScript==
// @name         读弹幕 - B站弹幕语音阅读
// @namespace    http://tampermonkey.net/
// @version      0.2.0
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
    rate: 1,           // 语速 (0.5-2)
    pitch: 1,          // 音调 (0.5-2)
    volume: 1,         // 音量 (0-1)
    deduplicateTime: 2000, // 去重时间（毫秒）
  };

  // ============== 状态管理 ==============
  let lastSpokenTexts = {}; // 记录最近说过的弹幕，用于去重
  let synth = window.speechSynthesis;

  // ============== 工具函数 ==============

  /**
   * 获取所有弹幕元素
   */
  function getDanmuElements() {
    // B站弹幕的选择器可能需要调整
    // 尝试多个可能的选择器
    const selectors = [
      '.bili-danmaku-x-dm',    // 最新版本 B 站视频弹幕 (2025年)
      '.bili-live-chat-item',  // 直播弹幕
      '.danmaku-item',         // 视频弹幕
      '.bili-danmaku-item',    // 新版本弹幕
      '[class*="danmaku"]',    // 包含danmaku的类
    ];

    for (let selector of selectors) {
      let elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return elements;
      }
    }

    return [];
  }

  /**
   * 从弹幕元素中提取文本
   */
  function extractTextFromDanmu(element) {
    // 尝试多个可能的文本选择器
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

  /**
   * 检查是否应该读出这条弹幕（去重）
   */
  function shouldSpeak(text) {
    const now = Date.now();

    // 清理过期的记录
    for (let key in lastSpokenTexts) {
      if (now - lastSpokenTexts[key] > CONFIG.deduplicateTime) {
        delete lastSpokenTexts[key];
      }
    }

    // 检查是否最近说过这条
    if (lastSpokenTexts[text]) {
      return false;
    }

    lastSpokenTexts[text] = now;
    return true;
  }

  /**
   * 用语音读出文本
   */
  function speakText(text) {
    if (!CONFIG.enabled || !text.trim()) {
      return;
    }

    if (!shouldSpeak(text)) {
      console.log('[读弹幕] 去重跳过:', text);
      return;
    }

    try {
      let utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = CONFIG.rate;
      utterance.pitch = CONFIG.pitch;
      utterance.volume = CONFIG.volume;

      console.log('[读弹幕] 播放:', text);
      synth.cancel(); // 取消之前的语音
      synth.speak(utterance);
    } catch (e) {
      console.error('[读弹幕] 语音合成错误:', e);
    }
  }

  /**
   * 监听弹幕变化
   */
  function observeDanmu() {
    // 找到弹幕容器
    let danmuContainer = document.querySelector(
      '.bpx-player-row-dm-wrap, .bili-live-chat-item-list, .danmaku-container, .bili-danmaku-container, [class*="chat"]'
    );

    if (!danmuContainer) {
      console.log('[读弹幕] 未找到弹幕容器，2秒后重试...');
      setTimeout(observeDanmu, 2000);
      return;
    }

    console.log('[读弹幕] 已找到弹幕容器，开始监听...');

    // 使用 MutationObserver 监听新弹幕
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // 元素节点
            // 如果是新弹幕元素
            if (node.classList && node.classList.toString().includes('danmaku')) {
              let text = extractTextFromDanmu(node);
              if (text) {
                speakText(text);
              }
            }
            // 或者是弹幕容器的子元素
            let danmuEl = node.querySelector && node.querySelector('[class*="danmaku"]');
            if (danmuEl) {
              let text = extractTextFromDanmu(danmuEl);
              if (text) {
                speakText(text);
              }
            }
          }
        });
      });
    });

    observer.observe(danmuContainer, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 创建控制面板
   */
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
      min-width: 200px;
    `;

    // 标题
    let title = document.createElement('div');
    title.style.cssText = `
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    title.innerHTML = '🎤 读弹幕';

    // 启用/禁用按钮
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

    toggleBtn.onmouseover = () => toggleBtn.style.opacity = '0.8';
    toggleBtn.onmouseout = () => toggleBtn.style.opacity = '1';

    toggleBtn.onclick = () => {
      CONFIG.enabled = !CONFIG.enabled;
      toggleBtn.textContent = CONFIG.enabled ? '✓ 已启用' : '✗ 已禁用';
      toggleBtn.style.background = CONFIG.enabled ? '#4ade80' : '#ef4444';
      GM_setValue('duanmu_reader_enabled', CONFIG.enabled);
    };

    // 语速控制
    let rateLabel = document.createElement('div');
    rateLabel.style.cssText = 'font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between;';
    rateLabel.innerHTML = `<span>语速</span><span>${CONFIG.rate.toFixed(1)}x</span>`;
    rateLabel.id = 'rate-label';

    let rateSlider = document.createElement('input');
    rateSlider.type = 'range';
    rateSlider.min = '0.5';
    rateSlider.max = '2';
    rateSlider.step = '0.1';
    rateSlider.value = CONFIG.rate;
    rateSlider.style.cssText = `
      width: 100%;
      height: 4px;
      margin-bottom: 8px;
      cursor: pointer;
    `;
    rateSlider.oninput = (e) => {
      CONFIG.rate = parseFloat(e.target.value);
      document.getElementById('rate-label').innerHTML = `<span>语速</span><span>${CONFIG.rate.toFixed(1)}x</span>`;
      GM_setValue('duanmu_reader_rate', CONFIG.rate);
    };

    // 音量控制
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
    volumeSlider.style.cssText = `
      width: 100%;
      height: 4px;
      cursor: pointer;
    `;
    volumeSlider.oninput = (e) => {
      CONFIG.volume = parseFloat(e.target.value);
      document.getElementById('volume-label').innerHTML = `<span>音量</span><span>${Math.round(CONFIG.volume * 100)}%</span>`;
      GM_setValue('duanmu_reader_volume', CONFIG.volume);
    };

    // 快捷键提示
    let hint = document.createElement('div');
    hint.style.cssText = `
      font-size: 11px;
      margin-top: 8px;
      opacity: 0.8;
      padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.2);
    `;
    hint.innerHTML = 'Alt+R: 切换<br/>收起后点击展开';

    panel.appendChild(title);
    panel.appendChild(toggleBtn);
    panel.appendChild(rateLabel);
    panel.appendChild(rateSlider);
    panel.appendChild(volumeLabel);
    panel.appendChild(volumeSlider);
    panel.appendChild(hint);

    document.body.appendChild(panel);

    // 点击可收起/展开
    let isCollapsed = false;
    title.style.cursor = 'pointer';
    title.onclick = () => {
      isCollapsed = !isCollapsed;
      toggleBtn.style.display = isCollapsed ? 'none' : 'block';
      rateLabel.style.display = isCollapsed ? 'none' : 'block';
      rateSlider.style.display = isCollapsed ? 'none' : 'block';
      volumeLabel.style.display = isCollapsed ? 'none' : 'block';
      volumeSlider.style.display = isCollapsed ? 'none' : 'block';
      hint.style.display = isCollapsed ? 'none' : 'block';
      title.style.marginBottom = isCollapsed ? '0' : '8px';
    };
  }

  /**
   * 快捷键处理
   */
  function setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Alt + R
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

  /**
   * 从存储恢复配置
   */
  function loadConfig() {
    if (typeof GM_getValue !== 'undefined') {
      CONFIG.enabled = GM_getValue('duanmu_reader_enabled', true);
      CONFIG.rate = parseFloat(GM_getValue('duanmu_reader_rate', 1));
      CONFIG.volume = parseFloat(GM_getValue('duanmu_reader_volume', 1));
    }
  }

  // ============== 初始化 ==============
  function init() {
    console.log('[读弹幕] 脚本已加载');

    // 检查浏览器支持
    if (!('speechSynthesis' in window)) {
      console.error('[读弹幕] 浏览器不支持 Web Speech API');
      alert('您的浏览器不支持 Web Speech API，请升级浏览器');
      return;
    }

    loadConfig();
    createControlPanel();
    setupKeyboardShortcut();
    observeDanmu();
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
