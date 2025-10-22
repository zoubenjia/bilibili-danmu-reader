// 完整DOM分析脚本 - 直播弹幕深度诊断
// 使用方法：复制此脚本内容到浏览器控制台运行

(function() {
  'use strict';

  const timestamp = new Date().toLocaleTimeString('zh-CN');

  console.log('%c====== 读弹幕 直播完整DOM分析 ======', 'font-size:16px; color:#667eea; font-weight:bold;');

  // 环境信息
  console.log('%c[1] 环境信息', 'color:#3b82f6; font-weight:bold;');
  const urlInfo = {
    URL: window.location.href,
    直播间ID: window.location.pathname.replace('/', ''),
  };
  console.table(urlInfo);

  // 容器分析
  console.log('%c[2] 弹幕容器分析', 'color:#3b82f6; font-weight:bold;');

  const containers = {
    '标准直播容器': '.bili-live-chat-item-list',
    '聊天历史': '#chat-history-list',
  };

  let foundContainers = false;
  for (const [name, selector] of Object.entries(containers)) {
    const el = document.querySelector(selector);
    if (el) {
      console.log('✓ ' + name + ' (' + selector + ')');
      foundContainers = true;
    }
  }

  // 弹幕元素分析
  console.log('%c[3] 弹幕元素分析', 'color:#3b82f6; font-weight:bold;');

  const itemSelectors = {
    '标准直播弹幕': '.bili-live-chat-item',
    '通用弹幕项': '.chat-item',
    '弹幕': '.danmaku-item',
  };

  let bestMatch = null;
  for (const [name, selector] of Object.entries(itemSelectors)) {
    const items = document.querySelectorAll(selector);
    if (items.length > 0) {
      console.log('✓ ' + name + ': ' + items.length + ' 个 (' + selector + ')');
      if (!bestMatch || items.length < bestMatch.items.length) {
        bestMatch = { name: name, selector: selector, items: items };
      }
    }
  }

  if (!bestMatch) {
    console.log('%c✗ 未找到任何弹幕元素！', 'color:#ef4444; font-weight:bold;');
    console.log('可能原因:');
    console.log('  1. 直播间未加载弹幕');
    console.log('  2. DOM结构与标准不同');
    console.log('  3. 直播间离线状态');
    return;
  }

  // 详细分析最优匹配
  console.log('%c[4] 最优匹配详细分析: ' + bestMatch.name, 'color:#3b82f6; font-weight:bold;');

  const items = bestMatch.items;
  const firstItem = items[0];

  if (firstItem) {
    console.log('第一条弹幕的HTML:');
    console.log(firstItem.outerHTML.substring(0, 300));
    console.log('');

    // 测试文本提取
    console.log('文本提取测试:');
    const textEl = firstItem.querySelector('.bili-live-chat-item__content');
    if (textEl) {
      console.log('✓ 通过 .bili-live-chat-item__content 获取: "' + textEl.textContent.trim().substring(0, 40) + '"');
    } else {
      const spans = firstItem.querySelectorAll('span');
      if (spans.length > 0) {
        console.log('✓ 通过 span 获取: "' + spans[0].textContent.trim().substring(0, 40) + '"');
      }
    }
  }

  // 推荐配置
  console.log('%c[5] 推荐脚本配置', 'color:#3b82f6; font-weight:bold;');
  console.log('元素选择器: ' + bestMatch.selector);
  console.log('总计弹幕: ' + items.length);
  console.log('');
  console.log('✓ 推荐: 脚本应该可以正常工作');

  // 监听新弹幕
  console.log('%c[6] 实时弹幕监听 (5秒内)', 'color:#3b82f6; font-weight:bold;');

  let newCount = 0;
  const container = firstItem.parentElement;

  if (container) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            const text = node.textContent.trim();
            if (text && text.length > 0) {
              newCount++;
              console.log('新弹幕: "' + text.substring(0, 40) + '"');
            }
          }
        });
      });
    });

    observer.observe(container, {
      childList: true,
      subtree: false,
    });

    setTimeout(function() {
      observer.disconnect();
      console.log('监听停止，共捕捉: ' + newCount + ' 条新弹幕');
    }, 5000);

    console.log('监听中... (5秒后自动停止)');
  }

  console.log('%c========== 分析完成 ==========', 'font-size:14px; color:#667eea; font-weight:bold;');
})();
