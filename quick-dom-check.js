// ============================================
// 快速DOM检查脚本 - 直播弹幕选择器诊断
// 使用方法：复制此脚本内容到浏览器控制台运行
// ============================================

(function() {
  'use strict';

  // 颜色辅助函数
  const style = {
    success: 'color: #4ade80; font-weight: bold;',
    error: 'color: #ef4444; font-weight: bold;',
    info: 'color: #3b82f6; font-weight: bold;',
    warn: 'color: #f59e0b; font-weight: bold;',
    header: 'font-size: 16px; font-weight: bold; color: #667eea;',
  };

  console.log('%c=== 读弹幕 直播DOM快速检查 ===', style.header);
  console.log('');

  // ============ 1. 检查弹幕容器 ============
  console.log('%c[1] 检查弹幕容器', style.info);

  const containerSelectors = [
    { selector: '.bili-live-chat-item-list', name: '标准直播弹幕列表' },
    { selector: '.bili-live-chat__messages', name: '直播聊天消息' },
    { selector: '#chat-history-list', name: 'ID: chat-history-list' },
    { selector: '.chat-history-list', name: '聊天历史列表' },
    { selector: '[class*="chat-item"]', name: '包含chat-item的容器' },
  ];

  let containerFound = false;
  containerSelectors.forEach(({ selector, name }) => {
    const element = document.querySelector(selector);
    const count = document.querySelectorAll(selector).length;

    if (element) {
      console.log(`  %c✓ ${name}`, style.success);
      console.log(`    选择器: ${selector}`);
      console.log(`    找到${count}个元素`);
      containerFound = true;
    } else {
      console.log(`  %c✗ ${name}`, style.error);
      console.log(`    选择器: ${selector}`);
    }
  });

  console.log('');

  // ============ 2. 检查弹幕元素 ============
  console.log('%c[2] 检查单条弹幕元素', style.info);

  const itemSelectors = [
    { selector: '.bili-live-chat-item', name: '标准直播弹幕项' },
    { selector: '.chat-item', name: '通用弹幕项' },
    { selector: '.danmaku-item', name: '弹幕项通用类名' },
    { selector: '[class*="message"]', name: '包含message的类' },
    { selector: 'li[class*="item"]', name: 'li标签弹幕项' },
  ];

  let itemFound = null;
  itemSelectors.forEach(({ selector, name }) => {
    const items = document.querySelectorAll(selector);

    if (items.length > 0) {
      console.log(`  %c✓ ${name}`, style.success);
      console.log(`    选择器: ${selector}`);
      console.log(`    找到${items.length}个元素`);

      if (!itemFound) {
        itemFound = { selector, items };
      }
    }
  });

  if (!itemFound) {
    console.log(`  %c✗ 未找到任何弹幕元素！`, style.error);
  }

  console.log('');

  // ============ 3. 检查弹幕文本 ============
  console.log('%c[3] 检查弹幕文本内容', style.info);

  if (itemFound) {
    const firstItem = itemFound.items[0];

    const textSelectors = [
      { selector: '.bili-live-chat-item__content', name: '标准文本容器' },
      { selector: '.chat-item-content', name: '通用文本容器' },
      { selector: '.message-text', name: '消息文本' },
      { selector: 'span', name: '文本跨度（兜底）' },
      { selector: 'p', name: '段落文本' },
      { selector: 'div', name: '分区容器' },
    ];

    console.log('  检查第一条弹幕的文本提取方法：');

    textSelectors.forEach(({ selector, name }) => {
      const textEl = firstItem.querySelector(selector);

      if (textEl && textEl.textContent.trim()) {
        const text = textEl.textContent.trim();
        console.log(`  %c✓ ${name}`, style.success);
        console.log(`    选择器: ${selector}`);
        console.log(`    文本: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
      }
    });

    // 直接用textContent
    const directText = firstItem.textContent.trim();
    console.log(`  %c✓ 直接 textContent`, style.success);
    console.log(`    文本: "${directText.substring(0, 50)}${directText.length > 50 ? '...' : ''}"`);
  }

  console.log('');

  // ============ 4. 显示第一条弹幕的完整HTML ============
  if (itemFound) {
    console.log('%c[4] 第一条弹幕的完整HTML结构', style.info);

    const firstItem = itemFound.items[0];
    const html = firstItem.outerHTML;

    // 格式化HTML输出
    console.log('  HTML结构：');
    console.log('  %c' + html.substring(0, 500) + (html.length > 500 ? '\n  ...' : ''), 'font-family: monospace; white-space: pre-wrap;');

    // 完整HTML到浏览器表格
    console.table({
      'HTML长度': html.length,
      '类名数量': firstItem.classList.length,
      '子元素数': firstItem.children.length,
    });
  }

  console.log('');

  // ============ 5. 监听新弹幕 ============
  console.log('%c[5] 监听新弹幕（将在3秒内报告新弹幕）', style.warn);

  if (itemFound) {
    const container = document.querySelector(itemFound.selector)?.parentElement;

    if (container) {
      const processedTexts = new Set();

      // 记录当前弹幕
      itemFound.items.forEach(item => {
        const text = item.textContent.trim();
        if (text) processedTexts.add(text);
      });

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const text = node.textContent?.trim();

              if (text && !processedTexts.has(text)) {
                processedTexts.add(text);
                console.log(`  %c新弹幕: "${text}"`, style.success);
              }
            }
          });
        });
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
      });

      // 3秒后停止监听
      setTimeout(() => {
        observer.disconnect();
        console.log('%c✓ 监听已停止', style.success);
      }, 3000);
    }
  }

  console.log('');

  // ============ 6. 总结 ============
  console.log('%c[6] 诊断总结', style.header);

  if (containerFound && itemFound) {
    console.log('%c✓ 弹幕容器已找到', style.success);
    console.log('%c✓ 弹幕元素已找到', style.success);
    console.log('%c脚本应该可以正常工作！', style.success);
  } else if (itemFound) {
    console.log('%c✓ 弹幕元素已找到（容器可能未检测到）', style.warn);
    console.log('%c脚本可能可以工作，但不够稳定', style.warn);
  } else {
    console.log('%c✗ 未找到弹幕元素！', style.error);
    console.log('%c可能原因：', style.error);
    console.log('  1. 直播间尚未加载弹幕');
    console.log('  2. 直播间DOM结构与标准不同');
    console.log('  3. 直播间处于离线状态');
    console.log('%c建议：等待页面完全加载，或切换到其他直播间测试', style.warn);
  }

  console.log('');
  console.log('%c✓ 诊断完成！', style.success);
  console.log('  如果有问题，请在GitHub issues中报告：');
  console.log('  https://github.com/zoubenjia/bilibili-danmu-reader/issues');
})();
