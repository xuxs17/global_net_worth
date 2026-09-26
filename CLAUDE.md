# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

全球收入水平对比计算器 — 纯前端静态站点。用户输入月薪和币种后，换算为 10 个国家/地区的等值金额，与该国**平均月薪**对比判定财富等级（7 级），按倍数降序排成排行榜。趣味角色 + 排行榜呈现，支持 URL 分享和生成分享图。

> 2026-05-10 起判定基准从「人均 GNI + PPP 双列」改为「各国平均月薪单列」（提交 526f625 / 08714cb）。PPP 不再计算，`baseline.json` 中的 `gdp_per_capita` / `ppp_conversion_factor` 为无消费方的遗留字段。`需求文档.md` / `功能设计文档.md` 仍描述旧口径，以本文件与代码为准。

部署方式：GitHub 仓库 → Netlify 自动部署，绑定自定义域名。

## 技术栈与约束

- **纯静态前端**：HTML5 + CSS3 + Vanilla JS（可选 Alpine.js），无构建工具，无后端
- **数据**：所有汇率和基准数据以静态 JSON 文件存放在 `data/` 目录，前端直接 fetch
- **数据更新**：GitHub Actions 定时任务拉取汇率/基准数据，产出 JSON 提交到仓库
- **部署**：Netlify，推送即部署
- **分享图生成**：html2canvas
- **广告**：Google AdSense + Carbon Ads（预留广告位，不遮挡核心交互）
- **无 npm 依赖**：当前阶段无 package.json，直接用浏览器原生 API

## 文件结构（按设计文档约定）

```
/
├── index.html          # 唯一页面
├── css/
│   └── style.css       # 样式与动画
├── js/
│   ├── main.js         # 主逻辑、事件绑定
│   ├── exchange.js     # 汇率换算（转 USD / 从 USD 转目标币种）
│   ├── levels.js       # 等级判定（nominal + PPP）
│   ├── render.js       # 榜单渲染
│   ├── share.js        # URL 状态同步 + 分享图生成
│   └── characters.js   # 角色-等级映射
├── data/
│   ├── rates.json      # 汇率（每日 Actions 更新），base 为 USD
│   └── baseline.json   # 各国平均月薪 / GNI（手工维护，无自动更新）
├── scripts/
│   └── update_rates.py # 拉取汇率并写 rates.json（由 .github/workflows 调用）
└── assets/
    ├── characters/     # 等级角色图片/动画资源（当前为空，用 emoji 占位）
    └── flags/          # 自托管 Twemoji 国旗 SVG，见 assets/flags/CREDITS.md
```

## 核心数据模型

**汇率（rates.json）**：`{ "base": "USD", "date": "YYYY-MM-DD", "rates": { "CNY": 6.71, ... }, "sources": { "CNY": "ecb", "RUB": "er-api" }, "stale": { "RUB": "2026-05-08" } }`

- `sources` 记录每个币种的实际上游；`stale` 只在「两个源都没给值、沿用旧值」时出现，值为该旧数据的日期。前端页脚与分享图都会显式标注 stale 币种，不允许静默展示过期数字。
- ECB（Frankfurter）只覆盖约 30 个币种，**永远不含 RUB 与 VND**，因此 `open.er-api.com` 是这两个币种的唯一来源。

**收入基准（baseline.json）**：国家码 → `{ countryName, currencyCode, gni_per_capita, gdp_per_capita, ppp_conversion_factor, average_monthly_salary }`，另有 `_meta` 记录来源与时效。判定只用 `average_monthly_salary`（缺失时回退 `gni_per_capita / 12`）；`_` 前缀的键会被 `targetCountries` 跳过。

## 核心算法

1. 用户输入 `amount` + `fromCurrency` → `amountInUSD = amount / rates[fromCurrency]`；`amountInUSD > 1e8` 或非有限值直接拒绝（否则换算结果会长到几百位撑破卡片）
2. `annualIncomeUSD = amountInUSD * 12`
3. 遍历 10 个目标币种，`convertedAmount = amountInUSD * rates[toCurrency]`
4. 财富等级 = `annualIncomeUSD / (country.average_monthly_salary * 12)` 按区间映射（7 级：>10x / 5-10x / 1-5x / 0.5-1x / 0.2-0.5x / 0.1-0.2x / ≤0.1x）
5. 单个国家取数失败只降级为「数据暂缺」卡片并排到末尾；全部失败才整页报错，且报的是数据错误而不是「请检查输入」
6. 按倍数降序排列展示

## 等级标签（中性网感用语，禁止使用"赤贫""穷人"等词）

| 内部 key | 显示标签 | 倍数区间 |
|---|---|---|
| extremely_rich | 超高净值人士 | > 10 |
| very_rich | 相当富裕 | (5, 10] |
| middle | 中产水平 | (1, 5] |
| average | 普通收入 | (0.5, 1] |
| low | 温饱有余 | (0.2, 0.5] |
| very_low | 手头有点紧 | (0.1, 0.2] |
| extremely_low | 需要精打细算 | ≤ 0.1 |

## 开发方式

- 本地用 Live Server 打开 `index.html` 即可开发测试
- 无构建步骤，修改后刷新浏览器
- 页面加载时解析 `?amount=XXX&from=YYY` URL 参数自动计算
- 输入变更后通过 `history.replaceState` 更新 URL（debounce 500ms）
- 结果卡片按名义汇率倍数降序排列
- 移动端优先，按钮不小于 44×44pt

## 关键约束

- 所有数据显示日期必须来自 rates.json 的 `date` 字段；`stale` 非空时必须同时标注哪些币种是旧值及其日期，不允许旧数字顶着新日期展示
- 分享图必须叠加水印和免责声明（`#capture-area` 内的 `.capture-footer`，页面与截图共用同一份 DOM）
- 国旗一律用 `assets/flags/*.svg`，**禁止 emoji 国旗**：Windows 没有 regional-indicator 字形会退化成两个字母，而分享图是位图，字体依赖会跟着图扩散。重新下载素材后必须保留根 `<svg>` 上的 `width`/`height`，否则 html2canvas 量成 0×0 并静默丢弃
- 切换语言只改界面文案，不得改动用户已输入的金额或币种（新访客未输入时才可以套用 locale 默认币种）
- 广告位不能遮挡核心交互按钮
- 数据加载失败时显示友好提示，不崩溃
