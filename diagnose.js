/**
 * 诊断脚本 - 找出为什么只读了部分弹幕
 * 在控制台运行此脚本
 */

console.log('%c=== 弹幕读取诊断 ===', 'color: blue; font-size: 16px; font-weight: bold;');

// 统计数据
const stats = {
  totalDanmu: 0,
  emptyText: 0,
  duplicates: 0,
  spoken: 0,
  missed: [],
};

// 获取所有弹幕
const allDanmu = document.querySelectorAll('.bili-danmaku-x-dm');
console.log(`\n📊 发现 ${allDanmu.length} 条弹幕\n`);

// 记录所有弹幕的文本
const danmuTexts = new Map(); // text -> count
const danmuElements = []; // 保存所有元素信息

allDanmu.forEach((el, index) => {
  const text = el.textContent.trim();
  stats.totalDanmu++;

  if (!text) {
    stats.emptyText++;
    console.log(`[${index}] ❌ 空文本 - 类: ${el.className}`);
    return;
  }

  // 记录文本出现次数
  danmuTexts.set(text, (danmuTexts.get(text) || 0) + 1);

  // 保存元素信息
  danmuElements.push({
    index,
    text,
    className: el.className,
    html: el.innerHTML.substring(0, 50),
  });

  console.log(`[${index}] "${text.substring(0, 40)}" ${text.length > 40 ? '...' : ''}`);
});

console.log(`\n%c📈 统计结果`, 'color: green; font-weight: bold;');
console.log(`  总弹幕数: ${stats.totalDanmu}`);
console.log(`  空文本: ${stats.emptyText}`);

// 分析去重情况
console.log(`\n%c🔍 去重分析`, 'color: orange; font-weight: bold;');
danmuTexts.forEach((count, text) => {
  if (count > 1) {
    console.log(`  重复 ${count} 次: "${text.substring(0, 40)}"`);
    stats.duplicates += count - 1; // 记录额外的去重
  }
});
console.log(`  可能被去重的弹幕: ${stats.duplicates}`);

// 检查哪些弹幕可能没有被读
console.log(`\n%c🎤 可能遗漏的弹幕`, 'color: red; font-weight: bold;');
console.log(`  (根据去重和页面初始加载推测)`);

// 估算实际读取的弹幕
const estimatedSpoken = stats.totalDanmu - stats.emptyText - stats.duplicates;
console.log(`\n  估计已读: ${estimatedSpoken} 条`);
console.log(`  估计遗漏: ${stats.duplicates} 条`);
console.log(`  无法读取: ${stats.emptyText} 条`);

// 推荐方案
console.log(`\n%c💡 可能的解决方案:`, 'color: purple; font-weight: bold;');

if (stats.duplicates > 0) {
  console.log(`  ✓ 方案1: 降低去重时间 (从 2000ms 改为 500ms)`);
  console.log(`           这样相同弹幕可以重复读`);
}

if (stats.totalDanmu > estimatedSpoken * 2) {
  console.log(`  ✓ 方案2: 加入初始化函数`);
  console.log(`           在页面加载完成时读取所有已存在的弹幕`);
}

console.log(`  ✓ 方案3: 提高 MutationObserver 的响应速度`);

// 详细信息
console.log(`\n%c📝 详细弹幕列表`, 'color: teal; font-weight: bold;');
danmuElements.slice(0, 10).forEach(dm => {
  console.log(`  [${dm.index}] "${dm.text}"`);
  console.log(`       类: ${dm.className}`);
  console.log(`       HTML: ${dm.html}`);
});

if (danmuElements.length > 10) {
  console.log(`  ... 还有 ${danmuElements.length - 10} 条`);
}

console.log(`\n%c=== 诊断完成 ===`, 'color: blue; font-size: 14px;');
console.log('请告诉我上面统计的数字，我会帮你优化脚本');
