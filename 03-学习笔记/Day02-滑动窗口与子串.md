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

### 1. 无重复字符的最长子串（Medium）
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
- **感悟/易错点：** right需要从0开始, 在确保窗口合法之后, 再更新ans, 区间需要是**左闭右开**
- 下次使用unordered_map而不是set

### 2. 找到字符串中所有字母异位词（Medium）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**

### 3. 和为 K 的子数组（Medium）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**
+ 全是正数才能用滑动窗口
+ 先查再插入
### 4. 滑动窗口最大值（Hard）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**
+ 并非滑动窗口, 而是单调队列
+ 分为 入, 出, 记录答案
### 5. 最小覆盖子串（Hard）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**
+ substr 用法
+ 缩窗口和记录答案的时机?
+ 维护start, len, 记录最小长度的子串

### 6. 最大子数组和（Medium）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**
+ dp
### 7. 合并区间（Medium）
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
---

## 三、今日总结

**学到的新模板/技巧：**
-

**遇到的困难：**
-

**遗留问题（需复习）：**
-

**整体感受：** 😊 😐 😢
