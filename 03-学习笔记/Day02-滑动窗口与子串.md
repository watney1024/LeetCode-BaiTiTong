# Day 2 · 滑动窗口与子串

> **日期：** 2026-__-__
> **学习目标：** 滑动窗口三问法与子串处理技巧
> **相关知识页：** [[02-Wiki/专题总结/02-双指针与滑动窗口]] · [[02-Wiki/专题总结/03-数组与矩阵]]

---

## 一、今日模板回顾

### 滑动窗口通用模板
```python
left = 0
for right in range(len(s)):
    # 右扩：将 s[right] 纳入窗口
    # while 窗口不合法：左缩
    # 更新答案
```

```cpp
// 滑动窗口算法伪码框架
void slidingWindow(string s) {
    // 用合适的数据结构记录窗口中的数据，根据具体场景变通
    // 比如说，我想记录窗口中元素出现的次数，就用 map
    // 如果我想记录窗口中的元素和，就可以只用一个 int
    auto window = ...

    int left = 0, right = 0;
    while (right < s.size()) {
        // c 是将移入窗口的字符
        char c = s[right];
        window.add(c);
        // 增大窗口
        right++;

        // 进行窗口内数据的一系列更新
        ...

        // *** debug 输出的位置 ***
        printf("window: [%d, %d)\n", left, right);
        // 注意在最终的解法代码中不要 print
        // 因为 IO 操作很耗时，可能导致超时

        // 判断左侧窗口是否要收缩
        while (window needs shrink) {
            // d 是将移出窗口的字符
            char d = s[left];
            window.remove(d);
            // 缩小窗口
            left++;

            // 进行窗口内数据的一系列更新
            ...
        }
    }
}
```

### 前缀和
```python
prefix = [0] * (len(nums) + 1)
for i in range(len(nums)):
    prefix[i + 1] = prefix[i] + nums[i]
# 区间 [i, j] 和 = prefix[j+1] - prefix[i]
```

### 单调队列
```python
from collections import deque
q = deque()
# 维护单调递减：队首始终是最大值
```

---

## 二、做题记录

### 3. 无重复字符的最长子串（Medium）
- **核心思路：**
- **代码实现：**

- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：** right需要从0开始, 在确保窗口合法之后, 再更新ans, 区间需要是**左闭右开**
- 下次使用unordered_map而不是set
+ 1010二刷: 写出来了。对比了 set 版和 map 计数版两种「窗口里存什么」
    - `unordered_set<char>`: 只记「字符在不在窗口里」。收缩时先判断 `count(c)` 把 `c` 挡在门外, 缩完才 `insert(c)` — 不变式是「窗口内始终无重复」, 状态少一半
    - `unordered_map<char, int>`: 记「出现几次」。先无条件 `window[c]++` 让计数变成 2, 再缩到 ≤1 — 骨架可照搬到 438 / 567 / 76
    - 结论: 只打这一题用 set 语义最贴切; 要当滑动窗口通用模板必须用计数版, 因为 set 表达不了「需要几个 a」
    - 性能: `s` 只有 ASCII, 把哈希表换成 `int cnt[128] = {}`, 常数远小于 unordered_map/set
+ 1010二刷: **区间约定确认** — 为什么这里右边是开的?
    - 长度公式不会骗人: `res = max(res, right - left)` 用的是 `right - left` 而不是 `+ 1`, 说明统计的就是 `[left, right)`
    - 错觉来自把「变量 `right`」和「表达式 `s[right]`」当成同一件事。`right++` 发生在取走 `s[right]` 之后, 所以到更新答案那一行, `right` 已经跨到窗口右端 +1
    - set 版同理: 内层 `while (st.count(c))` 时 `c` 还不在 `st` 里, 正因为 `right` 是开的; 若 `right` 是闭的, `c` 早该在集合里, `count` 恒真 → 死循环
    - 闭区间写法也合法, 但要配套改: `for (int right = 0; right < n; ++right)` 里 `right` 无法提前自增, 窗口取 `[left, right]`, 长度必须写 `right - left + 1`。**区间定义 / 长度公式 / 终止条件三者互相锁定**, off-by-one 基本都是这里错配, 不是算法本身
    - 自查实验: `"abba"` 按闭区间理解会算出 `"abb"` = 3 这个非法答案; 把 `right - left` 改成 `right - left + 1`, `"abba"` 立刻返回 3。实测(g++ 15.2): 输入 `"abba" / "abcabcbb" / "pwwkew" / ""` → 正确版 `2 / 3 / 3 / 0`, `+1` 误写 `3 / 4 / 4 / 0`; set 版与计数版逐项一致
    - 固定约定(写进 Wiki): `left`/`right` 表示窗口边界, 窗口 = `[left, right)`, `right` 是「下一个待进入的元素下标」, 长度 `right - left`, 循环条件 `right < n`

### 438. 找到字符串中所有字母异位词（Medium）
- **核心思路：**
- **代码实现：**
```cpp
#include <vector>
#include <string>
#include <unordered_map>

using namespace std;

class Solution {
public:
    vector<int> findAnagrams(string s, string t) {
        unordered_map<char, int> need;
        unordered_map<char, int> window;
        for (char c : t) {
            need[c]++;
        }

        int left = 0, right = 0;
        int valid = 0;
        // 记录结果
        vector<int> res;
        while (right < s.size()) {
            char c = s[right];
            right++;
            // 进行窗口内数据的一系列更新
            if (need.count(c)) {
                window[c]++;
                if (window[c] == need[c]) {
                    valid++;
                }
            }
            // 判断左侧窗口是否要收缩
            while (right - left >= t.size()) {
                // 当窗口符合条件时，把起始索引加入 res
                if (valid == need.size()) {
                    res.push_back(left);
                }
                char d = s[left];
                left++;
                // 进行窗口内数据的一系列更新
                if (need.count(d)) {
                    if (window[d] == need[d]) {
                        valid--;
                    }
                    window[d]--;
                }
            }
        }
        return res;
    }
};
```
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**
+ 1010二刷: 还是没写出来, 套路: 更新窗口数据, 判断窗口是否需要收缩, 符合条件的放到res, 更新数据
+ 1010二刷 bug: 模板文件 `find-all-anagrams-in-a-string.cpp` 里 `int len = need.size();` 写在了 `for (auto &c : p) ++need[c];` **之前**, `len` 恒为 0
    - 判据从「窗口已凑齐」退化成「窗口一个 need 字符都没凑齐」(`valid == 0`), 漏报和误报同时发生
    - 漏报: `s="cbaebabacd", p="abc"` 窗口 `"cba"` 形成时 `valid` 已涨到 3, `3 == 0` 不成立 → 返回 `[]`
    - 误报: `s="xyz", p="abc"` 窗口内无任何 need 字符, `valid` 一直是 0, `0 == 0` 成立 → 返回 `[0]`
    - 修法: 填充完 `need` 之后再取 `.size()`; 命名 `len` → `kinds`/`cnt`, 它不是长度而是字符种类数(76 的模板里就叫 `cnt`, 顺序也是对的)
    - 排查结论: 同目录 76 无此问题, 属于 438 独有, 不是拷贝扩散
    - 实测(g++ 15.2 -Wall): 修复后 `cbaebabacd`/`abc` → `[0,6]`, `abab`/`ab` → `[0,1,2]`, `aab`/`aab` → `[0]`, `xyz`/`abc` → `[]`; 同一份代码只把 `len` 那行挪回填充之前 → `[]`, `[]`, `[]`, `[0]`
+ 1010二刷 复查: `while (right - left >= p.size())` 里同时做「记录」和「收缩」是**刚好安全**的
    - 每轮外层只吞一个字符, 窗口最多多到 `p.size()`, 循环体每轮恰好执行一次 → 记录时窗口大小恒为 `p.size()`
    - 但这层安全性是隐式的: 一旦把 `res.push_back` 挪出 while, 或改成「超限时才收缩」, off-by-one 立刻回来。固定窗口建议写 `if (right - left == p.size())` + 一次收缩, 语义更硬
+ 1010二刷 复查: `int` 与 `size_t` 比较 (`right < s.size()`、`right - left >= p.size()`) 会触发 `-Wsign-compare`。当前 `right - left` 不会为负所以无 UB, 但若 `p` 允许为空, `-1` 会被提升成巨大无符号数 → `>= 0` 恒真 → 无限收缩越界。防御写法: 开头 `if (p.empty()) return {};`
+ 本题代码本身是对的: `if (window[c] == need[c]) ++valid` 是「达到恰好够」, 收缩时 `if (window[d] == need[d]) --valid;` 必须在 `window[d]--` **之前**判断, 否则跌破的那一步就漏掉了
### 560. 和为 K 的子数组（Medium）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**
+ 全是正数才能用滑动窗口
+ 先查再插入
+ 二刷: 还是没写出来
### 239. 滑动窗口最大值（Hard）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**
+ 并非滑动窗口, 而是单调队列
+ 分为 入, 出, 记录答案
+ 二刷: 大框架有了, 但是要记住: 使用双端队列, 弹出末尾元素
### 76. 最小覆盖子串（Hard）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**
+ substr 用法
+ 缩窗口和记录答案的时机?
+ 维护start, len, 记录最小长度的子串
+ 二刷: 写出来了

### 53. 最大子数组和（Medium）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**
+ dp
+ 二刷: 差一点小细节
### 56. 合并区间（Medium）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**
+ cmp函数的写法
```cpp
auto cmp =          // auto自动推导类型，把lambda存到变量cmp
[]                  // 捕获列表：这里是空[]，不捕获外部任何变量
(const vector<int> &a, const vector<int> &b)  // 参数列表：两个vector引用
{ return a[0] < b[0]; } // 函数体：比较规则
```

+ 何时引用? for (auto inter : intervals) 还是for (auto &inter : intervals)
+ 合并的时候注意比较右端点的值
---

## 三、今日总结

**学到的新模板/技巧：**
-

**遇到的困难：**
-

**遗留问题（需复习）：**
-

**整体感受：** 😊 😐 😢
