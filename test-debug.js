/**
 * 调试测试脚本 - 在 B 站视频页面的控制台运行
 * 用来诊断弹幕脚本的问题
 */

console.log('%c=== 开始调试测试 ===', 'color: blue; font-size: 16px;');

// 1. 检查弹幕容器
console.log('\n%c1️⃣ 检查弹幕容器', 'color: green; font-weight: bold;');
const containers = {
  'bpx-player-row-dm-wrap': document.querySelector('.bpx-player-row-dm-wrap'),
  'bili-live-chat-item-list': document.querySelector('.bili-live-chat-item-list'),
  'danmaku-container': document.querySelector('.danmaku-container'),
};

for (let [name, el] of Object.entries(containers)) {
  console.log(`  ${el ? '✓' : '✗'} ${name}:`, el);
}

// 2. 检查弹幕元素
console.log('\n%c2️⃣ 检查弹幕元素', 'color: green; font-weight: bold;');
const danmuElements = {
  '.bili-danmaku-x-dm': document.querySelectorAll('.bili-danmaku-x-dm'),
  '.bili-danmaku-x-roll': document.querySelectorAll('.bili-danmaku-x-roll'),
  '.bili-danmaku-x-show': document.querySelectorAll('.bili-danmaku-x-show'),
  '[class*="danmaku"]': document.querySelectorAll('[class*="danmaku"]'),
};

for (let [selector, els] of Object.entries(danmuElements)) {
  console.log(`  ${selector}: ${els.length} 个元素`);
  if (els.length > 0 && els.length <= 5) {
    Array.from(els).forEach((el, i) => {
      console.log(`    [${i}] 文本: "${el.textContent.trim()}" | 类: "${el.className}"`);
    });
  }
}

// 3. 测试提取文本
console.log('\n%c3️⃣ 测试文本提取', 'color: green; font-weight: bold;');
const firstDanmu = document.querySelector('.bili-danmaku-x-dm');
if (firstDanmu) {
  console.log('第一条弹幕:');
  console.log('  textContent:', firstDanmu.textContent.trim());
  console.log('  innerHTML:', firstDanmu.innerHTML.substring(0, 100));

  // 尝试多种方式提取文本
  const textMethods = {
    'textContent': firstDanmu.textContent.trim(),
    'innerText': firstDanmu.innerText?.trim() || '(不支持)',
    'firstChild.textContent': firstDanmu.firstChild?.textContent?.trim() || '(无)',
  };

  console.log('  不同提取方式:');
  for (let [method, text] of Object.entries(textMethods)) {
    console.log(`    ${method}: "${text}"`);
  }
} else {
  console.log('未找到弹幕元素');
}

// 4. 测试语音合成
console.log('\n%c4️⃣ 测试语音合成', 'color: green; font-weight: bold;');
if ('speechSynthesis' in window) {
  console.log('✓ 浏览器支持 Web Speech API');

  // 尝试播放测试语音
  const utterance = new SpeechSynthesisUtterance('测试语音');
  utterance.onstart = () => console.log('  ▶ 开始播放语音');
  utterance.onend = () => console.log('  ⏹ 语音播放结束');
  utterance.onerror = (e) => console.log('  ✗ 语音错误:', e.error);

  console.log('  正在播放: "测试语音" (5秒内应该听到声音)');
  window.speechSynthesis.speak(utterance);
} else {
  console.log('✗ 浏览器不支持 Web Speech API');
}

// 5. 模拟 MutationObserver 测试
console.log('\n%c5️⃣ 设置 MutationObserver 监听', 'color: green; font-weight: bold;');
const container = document.querySelector('.bpx-player-row-dm-wrap');
if (container) {
  console.log('✓ 找到容器，开始监听新弹幕...');

  const testObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          console.log(`  📍 新增节点: <${node.tagName} class="${node.className}">`);

          if (node.classList && node.classList.toString().includes('danmaku')) {
            console.log(`    ✓ 检测到新弹幕！文本: "${node.textContent.trim().substring(0, 30)}"`);
          }
        }
      });
    });
  });

  testObserver.observe(container, {
    childList: true,
    subtree: true,
  });

  console.log('  监听已开始，等待新弹幕...(此日志会消失，但监听在后台继续)');
} else {
  console.log('✗ 未找到容器，无法监听');
}

console.log('\n%c=== 调试完成 ===', 'color: blue; font-size: 16px;');
console.log('请观察上面的输出，告诉我:');
console.log('  1. 容器是否被找到?');
console.log('  2. 弹幕元素是否被找到? 有多少个?');
console.log('  3. 第一条弹幕的文本是什么?');
console.log('  4. 是否听到"测试语音"?');
console.log('  5. 监听中是否看到新增节点的日志?');
