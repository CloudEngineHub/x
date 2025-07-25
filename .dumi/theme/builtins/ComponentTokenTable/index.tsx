import { LinkOutlined, QuestionCircleOutlined, RightOutlined } from '@ant-design/icons';
import { XProvider } from '@ant-design/x';
import { Flex, Popover, Table, Typography } from 'antd';
import tokenData from 'antd/es/version/token.json';
import tokenMeta from 'antd/es/version/token-meta.json';
import { createStyles, css, useTheme } from 'antd-style';
import { getDesignToken } from 'antd-token-previewer';
import React, { useMemo, useState } from 'react';

import useLocale from '../../../hooks/useLocale';
import type { TokenData } from '../TokenTable';
import { useColumns } from '../TokenTable';

const compare = (token1: string, token2: string) => {
  const hasColor1 = token1.toLowerCase().includes('color');
  const hasColor2 = token2.toLowerCase().includes('color');
  if (hasColor1 && !hasColor2) {
    return -1;
  }
  if (!hasColor1 && hasColor2) {
    return 1;
  }
  return token1 < token2 ? -1 : 1;
};

const defaultToken = getDesignToken();

const locales = {
  cn: {
    token: 'Token 名称',
    description: '描述',
    type: '类型',
    value: '默认值',
    componentToken: '组件 Token',
    globalToken: '全局 Token',
    componentComment: '这里是你的组件 token',
    globalComment: '这里是你的全局 token',
    help: '如何定制？',
    customizeTokenLink: '/docs/react/customize-theme-cn#修改主题变量',
    customizeComponentTokenLink: '/docs/react/customize-theme-cn#修改组件变量',
  },
  en: {
    token: 'Token Name',
    description: 'Description',
    type: 'Type',
    value: 'Default Value',
    componentToken: 'Component Token',
    globalToken: 'Global Token',
    componentComment: 'here is your component tokens',
    globalComment: 'here is your global tokens',
    help: 'How to use?',
    customizeTokenLink: '/docs/react/customize-theme#customize-design-token',
    customizeComponentTokenLink: 'docs/react/customize-theme#customize-component-token',
  },
};

const useStyle = createStyles(({ token }) => ({
  tableTitle: css`
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    line-height: 40px;
    gap: ${token.marginXS}px;
  `,
  arrowIcon: css`
    font-size: ${token.fontSizeLG}px;
    & svg {
      transition: all ${token.motionDurationSlow};
    }
  `,
  help: css`
    font-size: ${token.fontSizeSM}px;
    font-weight: normal;
    color: #999;
    a {
      color: #999;
    }
  `,
  tokenTitle: css`
    font-size: ${token.fontSizeLG}px;
    font-weight: bold;
  `,
}));

interface SubTokenTableProps {
  defaultOpen?: boolean;
  title: string;
  helpText: React.ReactNode;
  helpLink: string;
  tokens: string[];
  component?: string;
  comment?: {
    componentComment?: string;
    globalComment?: string;
  };
}

const SubTokenTable: React.FC<SubTokenTableProps> = (props) => {
  const { defaultOpen, tokens, title, helpText, helpLink, component, comment } = props;
  const [, lang] = useLocale(locales);
  const token = useTheme();
  const columns = useColumns();

  const [open, setOpen] = useState<boolean>(defaultOpen ?? process.env.NODE_ENV !== 'production');

  const { styles } = useStyle();

  if (!tokens.length) {
    return null;
  }

  const data = tokens
    .sort(component ? undefined : compare)
    .map<TokenData>((name) => {
      const meta = component
        ? tokenMeta.components[component].find((item) => item.token === name)
        : tokenMeta.global[name];

      if (!meta) {
        return null as unknown as TokenData;
      }

      return {
        name,
        desc: lang === 'cn' ? meta.desc : meta.descEn,
        type: meta.type,
        value: component ? tokenData[component].component[name] : defaultToken[name],
      };
    })
    .filter(Boolean);

  const code = component
    ? `<XProvider
  theme={{
    components: {
      ${component}: {
        /* ${comment?.componentComment} */
      },
    },
  }}
>
  ...
</XProvider>`
    : `<XProvider
  theme={{
    token: {
      /* ${comment?.globalComment} */
    },
  }}
>
  ...
</XProvider>`;

  return (
    <>
      <div className={styles.tableTitle} onClick={() => setOpen(!open)}>
        <RightOutlined className={styles.arrowIcon} rotate={open ? 90 : 0} />
        <Flex className={styles.tokenTitle} gap="small" justify="flex-start" align="center">
          {title}
          <Popover
            title={null}
            destroyTooltipOnHide
            styles={{ root: { width: 400 } }}
            content={
              <Typography>
                <pre dir="ltr" style={{ fontSize: 12 }}>
                  <code dir="ltr">{code}</code>
                </pre>
                <a href={helpLink} target="_blank" rel="noreferrer">
                  <LinkOutlined style={{ marginInlineEnd: 4 }} />
                  {helpText}
                </a>
              </Typography>
            }
          >
            <span className={styles.help}>
              <QuestionCircleOutlined style={{ marginInlineEnd: 4 }} />
              {helpText}
            </span>
          </Popover>
        </Flex>
      </div>
      {open && (
        <XProvider theme={{ token: { borderRadius: 0 } }}>
          <Table<TokenData>
            size="middle"
            columns={columns}
            bordered
            dataSource={data}
            style={{ marginBottom: token.margin }}
            pagination={false}
            rowKey={(record) => record.name}
          />
        </XProvider>
      )}
    </>
  );
};

export interface ComponentTokenTableProps {
  component: string;
}

const ComponentTokenTable: React.FC<ComponentTokenTableProps> = ({ component }) => {
  const [locale] = useLocale(locales);
  const [mergedGlobalTokens] = useMemo(() => {
    const globalTokenSet = new Set<string>();

    component.split(',').forEach((comp) => {
      const { global: globalTokens = [] } = tokenData[comp] || {};

      globalTokens.forEach((token: string) => {
        globalTokenSet.add(token);
      });
    });

    return [Array.from(globalTokenSet)] as const;
  }, [component]);

  return (
    <>
      {tokenMeta.components[component] && (
        <SubTokenTable
          defaultOpen
          title={locale.componentToken}
          helpText={locale.help}
          helpLink={locale.customizeTokenLink}
          tokens={tokenMeta.components[component].map((item) => item.token)}
          component={component}
          comment={{
            componentComment: locale.componentComment,
            globalComment: locale.globalComment,
          }}
        />
      )}
      <SubTokenTable
        title={locale.globalToken}
        helpText={locale.help}
        helpLink={locale.customizeComponentTokenLink}
        tokens={mergedGlobalTokens}
        comment={{
          componentComment: locale.componentComment,
          globalComment: locale.globalComment,
        }}
      />
    </>
  );
};

export default React.memo(ComponentTokenTable);
