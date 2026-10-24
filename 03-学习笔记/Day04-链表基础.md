# Day 4 · 链表基础

> **日期：** 2026-10-09
> **学习目标：** 链表基础操作——指针操纵与虚拟头节点
> **相关知识页：** [[02-Wiki/专题总结/04-链表]] · [[02-Wiki/专题总结/02-双指针与滑动窗口]]

---

## 一、今日模板回顾

### 虚拟头节点
```python
dummy = ListNode(0, head)
# ...
return dummy.next
```

### 链表翻转（三指针）
```python
pre, cur = None, head
while cur:
    nxt = cur.next
    cur.next = pre
    pre = cur
    cur = nxt
return pre
```

### 快慢指针（判环）
```python
slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
    if slow == fast:
        return True
return False
```

### 快慢指针找中点：**起点与循环条件必须配对**（10-12 二刷补 · 234 的真正的坑）

「反转的起点是 `slow` 还是 `slow->next`」不取决于奇偶，而**取决于快慢指针那句 `while` 怎么写**。两种写法下 `slow` 的落点是两套不同的约定：

| 快慢循环写法 | `slow` 落点（偶数长度） | `slow` 落点（奇数长度） | 反转起点 |
|---|---|---|---|
| `while (fast && fast->next)` | **后半段的头** | 中间节点 | **`slow`** |
| `while (fast->next && fast->next->next)` | 前半段的尾 | 中间节点 | **`slow->next`** |

穷举验证（n = 1..10 全部 0/1 串，2046 组，对拍数组版回文判定）：

| 组合 | 结果 |
|---|---|
| `fast && fast->next` + 起点 `slow` + `while (p2)` | ✅ **0 错** ← `palindrome-linked-list.cpp` 现版 |
| `fast && fast->next` + 起点 `slow->next` | ❌ **错 62 组**，最小反例 `[1,0]`——**全部是偶数长度**：偶数时 `slow` 已是后半段头，再 `->next` 就**漏比了后半段的第一个节点** |
| `fast->next && fast->next->next` + 起点 `slow->next` | ✅ 0 错 ← **本笔记 10-09 首刷那版代码** |
| `fast->next && fast->next->next` + 起点 `slow` | 💥 **n=2 就空指针崩溃** |

**为什么配对正确时不用判奇偶**：取 `slow` 作起点，偶数时它正是后半段头、一个不漏；奇数时中间节点被多卷进反转，比较的最后一轮 `p1` 与 `p2` 会落在**同一个节点**上，自己跟自己比恒等——**多比那一次是无害的**。反过来取 `slow->next`，奇数刚好对、偶数必漏。**「多卷一个真节点」无害、「少卷一个」致命**，这就是这两套配对不对称的原因。

**两个附带结论：**
1. **比较循环以 `p2` 为准，别写 `while (p1)`**——后半段永远不比前半段长，`p2` 是天然的终止者。10-12 现场翻车：`while (p1)` 版在 `[1]`、`[1,1]`、`[1,2,2,1]` 上**全部 SIGSEGV**（`p2` 先到 `nullptr` 还继续读 `p2->val`）。
2. `fast && fast->next` 这套**空表也安全**（`slow`/`fast` 直接是 `nullptr`，两个循环都不进，返回 `true`）；`fast->next && fast->next->next` 在 `head == nullptr` 时当场解引用 `fast->next`——力扣 234 约束 n≥1 不炸，本地测空会炸。**选型时这也是加分项。**

> ⚠️ **今天现场踩过这个坑（10-12 记）**：本文件 10-09 首刷记录的代码块原本是**另一套**配对（`fast->next && fast->next->next` + `slow->next`，那套本身是对的）；今天照着 cpp 把循环条件改成了 `fast && fast->next`、**起点却还留着 `slow->next`**——两半各改一半，正好变成上表「错 62 组」那一档（偶数长度漏比，反例 `[1,0]`）。现已把起点改回 `slow`，与 `palindrome-linked-list.cpp` 一致。**教训：配对要整套换，不能只换一半；改完必须重新跑一遍偶数长度的反例。**

---

## 二、做题记录

### 160. 相交链表（Easy）
- **核心思路：** 双指针 `p1`/`p2` 各自从两链表头出发，走完自己的链后**切换到对方的头**继续走。两者都走了 `lenA + lenB` 步，若有交点会在交点相遇，否则同时到达 `nullptr` 退出。
- **代码实现：**
```cpp
ListNode *getIntersectionNode(ListNode *headA, ListNode *headB) {
    ListNode *p1 = headA, *p2 = headB;
    while (p1 != p2) {
        p1 = (p1 == nullptr) ? headB : p1->next;
        p2 = (p2 == nullptr) ? headA : p2->next;
    }
    return p1;
}
```
- **复杂度：** O(m+n) / O(1)
- **掌握程度：** ✅（10-09 首刷勾）→ **二刷 10-12：❌ 没默出来**。卡点本人已自报：「写错了，没想到 `p1 = (p1 == nullptr) ? headB : p1->next;`」——**缺的不是「双指针对齐长度」这个思路，而是「走到尾节点时切换到对方头」那一句**：只写 `p1 = p1->next` 就会永远错开 `lenB - lenA` 的偏移、遇不上。按 [[04-Outputs/错题本]] 规则 3（默不出骨架 → 升 `❌`）转**重讲模板**，不再重刷旧题。<br>现版代码已由对拍背书：长度 0..6 × 交点位置（含无交点、含空表）共 **294 组 0 错**。另记一条易错：无交点时两指针**同时**到达 `nullptr` 而退出，返回的正是 `nullptr`——这个「用 null 当相遇点」的设计是本题最妙也最容易写漏的地方。
- **感悟/易错点：**
+ 如何接上另一个链表是难点
+ 相交判定比的是**节点地址**（不是 val）；两指针都无交点时会同时变 `nullptr`，循环自然结束返回 `nullptr`。
+ 1012 二刷: 写错了, 没想到p1 = (p1 == nullptr) ? headB : p1->next;
### 206. 反转链表（Easy）
- **核心思路：** 三指针 `prev`/`cur`/`nxt`，固定顺序：**先存 `nxt` → 断链 `cur->next=prev` → 前驱前进 → 当前前进**。
- **代码实现：**
```cpp
ListNode *reverseList(ListNode *head) {
    ListNode *prev = nullptr, *cur = head;
    while (cur) {
        ListNode *nxt = cur->next;
        cur->next = prev;
        prev = cur;
        cur = nxt;
    }
    return prev;
}
```
- **复杂度：** O(n) / O(1)
- **掌握程度：** 🔄 → **二刷 10-12（P0-R2 整题默）：✅ 一次写成、出列**。`prev = nullptr` 起步 + 显式四步「存 `nxt` → 断链 → `prev` 前进 → `cur` 前进」，返回 `prev`；空表入参返回 `nullptr` 已实测。**首刷栽过的 `for(cur=head; cur; cur=cur->next)` 增量步陷阱已避开**——**这条一清，25 / 146 的前置条件就成立了**，10-13 的 P0-1 可以开新格。
- **感悟/易错点：**
+ prev需要是nullptr
+ 别用 `for(cur=head; cur; cur=cur->next)`：增量步 `cur=cur->next` 会在循环体改掉 `cur->next` 之后才执行，读到的是已断链的指针 → 漏节点甚至死循环。必须先用 `nxt` 暂存。
+ `prev` 初值必须是 `nullptr`，返回的才是新头（原尾）。
+ 1012 二刷: 一遍过

### 234. 回文链表（Easy）
- **核心思路：** 快慢指针找中点 → **反转后半段** → 前半段(从 head)与后半段(从新头)双指针逐个比 **值**。
- **代码实现：**
```cpp
bool isPalindrome(ListNode *head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    // 反转后半段，新头在 prev。注意：起点必须与上面的循环条件配对——`fast && fast->next` 配 `slow`
    ListNode *cur = slow, *prev = nullptr;
    while (cur) {
        ListNode *nxt = cur->next;
        cur->next = prev;
        prev = cur;
        cur = nxt;
    }
    ListNode *p1 = head, *p2 = prev;
    while (p2) {
        if (p1->val != p2->val) return false;
        p1 = p1->next;
        p2 = p2->next;
    }
    return true;
}
```
- **复杂度：** O(n) / O(1)
- **掌握程度：** 🔄（10-09 首刷勾）→ **二刷 10-12：❌ 没写出来**（本人 tag：「slow 在中点偏右，没写出来」，随后自己推出「`1 → 2 → 3 ← 2 ← 1`，所以不用考虑奇偶」——**卡点定位很准**：这题真正的坑不是「比值 vs 比地址」，而是 **`slow` 的落点与反转起点必须成套**，见本节开头的配对表）。今天还现场复现了一次「两半各改一半」：循环条件换成 `fast && fast->next`、起点留着 `slow->next` → 偶数长度漏比（穷举 2046 组里错 62 组、最小反例 `[1,0]`）；改回 `slow` 后 0 错。按 [[04-Outputs/错题本]] 规则 3 升 `❌` → **重讲模板**（04-链表 的「找中点 + 反转后半」两支）；**10-13 的 D+1 只默「slow 落点／反转起点」这两行即可验收**。
- **感悟/易错点：**
+ 反转后比较的时候, 需要比较值, 并且注意中间值的起点
+ 两处踩坑：① 比较要用 `p1->val != p2->val`，写成 `p1 != p2` 比的是地址；② 反转后的新头是 `prev`，不是原来的 `slow`（`slow` 已变成尾节点），起点必须用 `prev`。
+ 循环以 `p2`（后半段）为准：偶数长度两边等长，奇数长度前半多一个中间节点，不影响判定。
+ 1012 二刷: slow 在中点偏右, 没写出来
    相当于是1 → 2 → 3 ← 2 ← 1, 所以不用考虑奇偶

### 141. 环形链表（Easy）
- **核心思路：** 快慢指针，`fast` 每次走两步、`slow` 走一步，**有环则必相遇**，无环则 `fast` 到 `nullptr`。
- **代码实现：**
```cpp
bool hasCycle(ListNode *head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}
```
- **复杂度：** O(n) / O(1)
- **掌握程度：** ✅（10-09 首刷勾；**10-12 二刷重做过（cpp 23:30）、笔记未留 tag，三态请本人当场勾**）
- **感悟/易错点：**
+ 快慢指针即可
+ 循环条件判空用 `fast && fast->next`，保证 `fast->next->next` 不越界。
+ 1012 二刷: 一遍过

### 142. 环形链表 II（Medium）
- **核心思路：** 快慢相遇后，把 `slow` 拉回 `head`，两者**每次各走一步**，再次相遇处即环入口。数学关系：`head → 入口` 的距离 = `相遇点 → 入口` 的距离。
- **代码实现：**
```cpp
ListNode *detectCycle(ListNode *head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            slow = head;
            while (slow != fast) {
                slow = slow->next;
                fast = fast->next;
            }
            return slow;
        }
    }
    return nullptr;
}
```
- **复杂度：** O(n) / O(1)
- **掌握程度：** ✅
- **感悟/易错点：**
+ 相遇后重新回到起点然后再次相遇
+ 第二段必须两指针**都走一步**（不是快慢），否则对不上数学关系。

### 21. 合并两个有序链表（Easy）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**

### 2. 两数相加（Medium）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**

### 19. 删除链表的倒数第 N 个节点（Medium）
- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **掌握程度：** ✅ 🔄 ❌
- **感悟/易错点：**

---

## 三、今日总结

**学到的新模板/技巧：**
- 反转三指针固定顺序：`nxt 暂存 → 断链 → prev 前进 → cur 前进`；`prev` 初值必须为 `nullptr`。
- 快慢指针三种用法：判环(141)、找中点(234)、找环入口(142)。
- 相交链表的"走完自己切换对方头"双指针，靠走相同总长对齐。
- 回文链表：找中点 + 反转后半 + 双指针比值，O(1) 空间。

**遇到的困难：**
- 反转链表误用 `for(cur=head; cur; cur=cur->next)`，增量步读到被改坏的 `cur->next` → 死循环/漏节点。
- 回文链表两处踩坑：比了指针地址而非值；反转后错用 `slow`（已是尾）而非新头 `prev` 作起点。

**遗留问题（需复习）：**
- 回文链表反转破坏了原链表结构，若要复原需在判定后再反转一次。
- 合并两个有序链表(21)、两数相加(2)、删除倒数第 N 个节点(19) 尚未在笔记中收口。

**遗留问题（10-12 二刷补记）：**
- **五题二刷实况（10-12 晚 22:31~23:50）**：**206 ✅ 一次写成、出列**（P0-R2 验收项，25 / 146 的前置就此清掉）· 141 重做过、笔记没留 tag、三态待勾 · **160 ❌**（「切换到对方头」那句没写出——思路对、骨架默不出）· **234 ❌**（`slow` 落点与反转起点配不上）· 142 本轮未动 → P0-R3 · 10-25。
- **今天最贵的一课叫「配对」**：`while (fast && fast->next)` / 反转起点 / 比较循环的终止者是**一整套互相锁定的约定**，与 10-10 那条「区间定义 / 长度公式 / 终止条件三者互相锁定」同源。现场错法正是**两半各改一半**——循环条件跟着 cpp 换了、起点留着旧的，笔记里那份代码于是悄悄变成「偶数长度漏比」（穷举 2046 组错 62 组、最小反例 `[1,0]`），**比崩溃更难发现**。改配对照要整套换，换完立刻拿偶数长度反例（`[1,0]`、`[1,2,2,1]`）重跑。
- **一个值得留的读数**：同一天 206 一次写成、234 却写不出。234 = 找中点 + 反转后半 + 比值，**缺的不是反转（那个原子操作已 ✅），是「找中点」这一支的约定**。而 143 重排链表 / 92 反转链表 II / 25 K 个一组都要用它 → **10-13 的 D+1 除默 25 的骨架外，加默 234 那两行（`slow` 落点、反转起点）**，两行、约 5min。
- 三态纪律：今天链表四题的三态当场落纸，**141 的 tag 是唯一缺项**。

**整体感受：** 😊
