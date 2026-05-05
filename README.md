# extension-quick-toggle

SillyTavern 扩展快捷开关，在设置菜单底部添加常用扩展开关。

## 功能

| 扩展 | 切换方式 | 说明 |
|------|---------|------|
| **WestWorld** | 硬切换 | 启用/禁用扩展，SillyTavern 会自动刷新页面 |
| **导演自由内容** | 软切换 | 操作 WestWorld 的 `directorSuffixEnabled` 设置，即时生效 |

> 聊天记录管理器和小白X的软开关暂时停用，避免跨扩展设置未加载或 DOM 状态不同步时导致快捷开关异常。

## 安装

在酒馆中：**扩展 -> 安装扩展 -> 输入仓库地址**

```text
https://github.com/relax-sketch/extension-quick-toggle
```

## 使用

1. 打开酒馆设置菜单。
2. 滚动到底部，在横线附近查看快捷开关。
3. 彩色图标表示已启用，灰色图标表示已关闭。
4. 点击按钮切换对应功能。

## 兼容性

- SillyTavern 1.15.0+
- 如果某个扩展未安装，对应按钮不会显示。
