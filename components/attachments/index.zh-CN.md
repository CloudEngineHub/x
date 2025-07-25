---
category: Components
group:
  title: 表达
  order: 2
title: Attachments
subtitle: 输入附件
description: 用于展示一组附件信息集合。
cover: https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*5l2oSKBXatAAAAAAAAAAAAAADgCCAQ/original
coverDark: https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*N8QHQJhgfbEAAAAAAAAAAAAADgCCAQ/original
demo:
  cols: 1
---

## 何时使用

Attachments 组件用于需要展示一组附件信息集合的场景。

## 代码演示

<!-- prettier-ignore -->
<code src="./demo/basic.tsx">基本</code>
<code src="./demo/placeholder.tsx">占位信息</code>
<code src="./demo/overflow.tsx">超出样式</code>
<code src="./demo/with-sender.tsx">组合示例</code>
<code src="./demo/files.tsx">文件卡片</code>
<code src="./demo/files-custom.tsx">自定义卡片图标</code>

## API

通用属性参考：[通用属性](/docs/react/common-props)。

### AttachmentsProps

继承 antd [Upload](https://ant.design/components/upload) 属性。

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| classNames | 自定义样式类名，[见下](#semantic-dom) | Record<string, string> | - | - |
| disabled | 是否禁用 | boolean | false | - |
| getDropContainer | 设置拖拽时，可以释放文件的区域 | () => HTMLElement | - | - |
| items | 附件列表，同 Upload `fileList` | Attachment[] | - | - |
| overflow | 文件列表超出时样式 | 'wrap' \| 'scrollX' \| 'scrollY' | - | - |
| placeholder | 没有文件时的占位信息 | PlaceholderType \| ((type: 'inline' \| 'drop') => PlaceholderType) | - | - |
| rootClassName | 根节点的样式类名 | string | - | - |
| rootStyle | 根节点的样式对象 | React.CSSProperties | - | - |
| styles | 自定义样式对象，[见下](#semantic-dom) | Record<string, React.CSSProperties> | - | - |
| imageProps | 图片属性，同 antd [Image](https://ant.design/components/image) 属性 | ImageProps | - | - |

```tsx | pure
interface PlaceholderType {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
}
```

### AttachmentsRef

| 属性          | 说明             | 类型                 | 版本 |
| ------------- | ---------------- | -------------------- | ---- |
| nativeElement | 获取原生节点     | HTMLElement          | -    |
| upload        | 手工调用上传文件 | (file: File) => void | -    |

### Attachments.FileCard Props

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| prefixCls | 样式类名的前缀 | string | - | - |
| className | 样式类名 | string | - | - |
| style | 样式对象 | React.CSSProperties | - | - |
| item | 附件，同 Upload `UploadFile` | Attachment | - | - |
| onRemove | 点击移除文件时的回调，返回值为 false 时不移除。支持返回一个 Promise 对象，Promise 对象 resolve(false) 或 reject 时不移除 | (item: Attachment) => boolean \| Promise | - | - |
| imageProps | 图片属性，同 antd [Image](https://ant.design/components/image) 属性 | ImageProps | - | - |
| icon | 自定义图标 | React.ReactNode \| PresetIcons | - | 1.6.0 |
| type | 定义文件类型，当类型为`image`时，会展示为图片预览模式 | 'file' \| 'image' | `file` | 1.6.0 |

```ts
type PresetIcons =
  | 'default'
  | 'excel'
  | 'image'
  | 'markdown'
  | 'pdf'
  | 'ppt'
  | 'word'
  | 'zip'
  | 'video'
  | 'audio';
```

## Semantic DOM

<code src="./demo/_semantic.tsx" simplify="true"></code>

## 主题变量（Design Token）

<ComponentTokenTable component="Attachments"></ComponentTokenTable>
