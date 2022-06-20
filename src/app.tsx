import {
  BasicLayoutProps,
  Settings as LayoutSettings,
  PageLoading,
} from '@ant-design/pro-layout';
import { history, RequestConfig } from 'umi';
import { message } from 'antd';
import find from 'lodash.find';
import RightContent from '@/components/rightContent';
import Footer from '@/components/footer';
import { getProfile } from '@/services/account';
import { getInfo } from '@/services/system';
import Storage from '@/utils/storage';
import { STORAGE_KEY } from '@/configs/index';

const SIGNIN_PATH = '/account/signin';
const NOAUTH_PATHS = [
  /^\/account\/signin$/,
  /^\/account\/signup$/,
  /^\/account\/twofactor$/,
  /^\/tool\/test$/,
  /^\/tool\/test\/resolved$/,
];

enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 4,
  REDIRECT = 9,
}

interface ErrorInfoStructure {
  success: boolean;
  data?: any;
  errorCode?: string;
  errorMessage?: string;
  showType?: ErrorShowType;
  traceId?: string;
  host?: string;
  [key: string]: any;
}

const isNoAuthPath = (pathname: string) => {
  const noAuthPath = find(NOAUTH_PATHS, (p: RegExp) => {
    return p.test(pathname);
  });
  return !!noAuthPath;
};

export const request: RequestConfig = {
  timeout: 10000,
  errorConfig: {
    errorPage: '/account/signin',
  },
  errorHandler: (error: any) => {
    if (error?.request?.options?.skipErrorHandler) {
      throw error;
    }
    let errorInfo: ErrorInfoStructure | undefined;
    if (error.name === 'ResponseError' && error.data && error.request) {
      errorInfo = error.data;
      error.message = errorInfo?.errorMessage || error.message;
      error.data = error.data;
      error.info = errorInfo;
    }
    errorInfo = error.info;
    if (errorInfo) {
      const errorMessage = errorInfo?.data;
      const errorCode = errorInfo?.code;
      if (errorCode === 401) {
        history.push({
          pathname: SIGNIN_PATH,
          query: { errorCode, errorMessage },
        });
        return;
      }
      message.error(errorMessage);
    } else {
      message.error(error.message || '请求异常，请稍候重试');
    }
  },
  requestInterceptors: [
    (url, options) => {
      const authorizationData = Storage.getItem(STORAGE_KEY.AUTHORIZATION);
      const headers = {
        Authorization: authorizationData ? `Bearer ${authorizationData}` : '',
      };
      return {
        url,
        options: { ...options, headers },
      };
    },
  ],
};

export const dva = {
  config: {
    onError(err: Error) {
      message.error(err.message);
    },
  },
};

export const initialStateConfig = {
  loading: <PageLoading />,
};

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: any;
  fetchUserInfo?: () => Promise<any | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const authorization = Storage.getItem(STORAGE_KEY.AUTHORIZATION);
      if (!authorization) {
        throw new Error('no authorization');
      }
      const response = await getProfile();
      return response?.data || {};
    } catch (error) {
      history.push(SIGNIN_PATH);
    }
    return undefined;
  };

  const fetchSystemInfo = async () => {
    try {
      const response = await getInfo();
      return response?.data || {};
    } catch (error) {
      history.push(SIGNIN_PATH);
    }
    return {};
  };

  const {
    logo: systemLogo = '',
    name: systemName = '',
    slogan: systemSlogan = '',
    telegram,
    user_faucet_amount,
    user_withdrawal_min_amount,
    merchant_transaction_expire_second,
  } = await fetchSystemInfo();

  const theme = Storage.getItem(STORAGE_KEY.THEME);

  const settings: any = {
    logo: systemLogo || process.env.APP_LOGO,
    name: systemName || process.env.APP_NAME,
    slogan: systemSlogan || process.env.APP_SLOGAN,
    config: {
      telegram,
      user_faucet_amount,
      user_withdrawal_min_amount,
      merchant_transaction_expire_second,
    },
    navTheme: theme || 'dark',
  };

  const currentUser = await fetchUserInfo();
  return {
    fetchUserInfo,
    currentUser,
    settings,
  };
}

export const layout = ({
  initialState,
}: {
  initialState: { settings?: LayoutSettings; currentUser?: any };
}): BasicLayoutProps => {
  return {
    rightContentRender: () => <RightContent />,
    footerRender: () => <Footer />,
    onPageChange: () => {
      if (isNoAuthPath(history.location.pathname)) {
        return;
      }
      if (!initialState?.currentUser) {
        history.push(SIGNIN_PATH);
      }
    },
    ...initialState?.settings,
  };
};
