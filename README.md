![logo](./static/logo.png)

# 乐聊小程序

乐聊是基于大语言模型的文档分析，对话微信小程序。

采用UniApp框架开发，后端由UniAI平台提供接口支持。

UniAI详情请访问：<https://github.com/uni-openai/UniAI>

## 立刻体验

直接体验线上乐聊小程序，扫描以下二维码，或在微信搜索名为“IICT”（事业单位）的小程序，感谢支持。

![iict](static/qrcode.png)

## 准备

请提前下载[HBuilderX](https://www.dcloud.io/hbuilderx.html)和[微信小程序开发工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)做开发

UniAPP的文档：<https://zh.uniapp.dcloud.io/>

## 运行

在HBuilder上方菜单栏选择运行->小程序->微信小程序运行

## 注意事项

由于微信小程序不支持SSE流模式，因此在本项目中采用`while`无限轮询后端缓存器，UniAI采用了redis缓存用户的聊天，每个用户同一时间仅缓存1个正在进行生成的聊天，且5分钟后缓存自动失效。

## 开源鸣谢

[中科苏州智能计算技术研究院（IICT）](https://github.com/CAS-IICT)

[ChatGLM](https://github.com/THUDM/ChatGLM2-6B)

[UniAI](https://github.com/uni-openai/UniAI)

## 开发者

[Youwei](https://github.com/devilyouwei) huangyw@iict.ac.cn

## 更新

【2023-9-27】增加代码高亮，修复了长按复制提示语