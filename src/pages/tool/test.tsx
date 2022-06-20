import React, { useState, useRef, useEffect } from 'react';
import { Form, Input, Modal, Divider, Select, Button } from 'antd';
import { useDispatch, useSelector, useModel } from 'umi';
import ContentHeader from '@/components/contentHeader';
import { CURRENCY_TYPE } from '@/configs/enum';
import { CURRENCY_OPTIONS } from '@/configs/options';
import { formatAmount } from '@/utils/formater';

const { Option } = Select;

const routes = [
  {
    path: '/',
    breadcrumbName: '首页',
  },
  {
    path: '/tool/test',
    breadcrumbName: '工具',
  },
];

const ToolTestPage: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { initialState, setInitialState } = useModel('@@initialState');

  const [queryLoading, setQueryLoading] = useState(false);
  const [buttonText, setButtonText] = useState('提交');
  const [queryTimer] = useState<any>(null);
  const queryTimerRef = useRef(queryTimer);

  const { config }: any = initialState?.settings;

  const handleReset = () => {
    if (queryTimerRef.current) {
      clearInterval(queryTimerRef.current);
    }
    setQueryLoading(false);
    setButtonText('提交');
  };

  const handleSuccess = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      await setInitialState((s) => ({
        ...s,
        currentUser: userInfo,
      }));
    }
  };

  const handleQuery = async (id: string) => {
    const queryHandler = async () => {
      const res: any = await dispatch({
        type: 'system/queryTestTransaction',
        payload: {
          id,
        },
      });
      if (res && res.success === true) {
        const { data } = res;
        const { status, coin_amount } = data;
        if (status === true) {
          Modal.success({
            title: '恭喜你，订单支付成功！',
            content: <div>支付金额: {formatAmount(coin_amount)}。</div>,
          });

          handleSuccess();
          handleReset();
        }
      } else {
        handleReset();
      }
    };
    let counter = 1;
    const timer = setInterval(() => {
      if (counter * 3 < config.merchant_transaction_expire_second) {
        queryHandler();
      } else {
        handleReset();
      }
      counter++;
    }, 3000);
    queryTimerRef.current = timer;
  };

  const handleSubmit = () => {
    form
      .validateFields()
      .then(async (values) => {
        handleReset();
        const res: any = await dispatch({
          type: 'system/createTestTransaction',
          payload: values,
        });
        if (res && res.success === true) {
          const { id, cashier_url } = res.data;
          handleQuery(id);
          setQueryLoading(true);
          setButtonText('请在打开的页面中完成支付...');
          window.open(cashier_url);
        }
      })
      .catch((err) => {
        console.info('validate error:', err);
      });
  };

  useEffect(() => {
    return () => {
      handleReset();
    };
  }, []);

  const loading = useSelector(
    (state: any) => state.loading.effects['system/createTestTransaction'],
  );

  return (
    <>
      <ContentHeader breadcrumb={{ routes }} title="订单测试"></ContentHeader>
      <div className="main-container">
        <Form
          form={form}
          layout="vertical"
          name="transactionHandle"
          initialValues={{
            currency: CURRENCY_TYPE.CNY,
            amount: '100',
          }}
          autoComplete="off"
        >
          <Form.Item label="订单币种" name="currency">
            <Select style={{ width: '400px' }}>
              {CURRENCY_OPTIONS.map((currency, index) => {
                return (
                  <Option key={index} value={currency.value}>
                    {currency.label}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item
            label="订单金额"
            name="amount"
            rules={[
              { required: true, message: '订单金额不能为空' },
              {
                pattern:
                  /^((0{1}\.\d{1,2})|([1-9]\d*\.{1}\d{1,2})|([1-9]+\d*))$/i,
                message: '仅支持金额类型，最多两位小数',
              },
            ]}
          >
            <Input
              placeholder="请输入订单金额..."
              maxLength={34}
              style={{ width: '400px' }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              loading={loading || queryLoading}
              onClick={handleSubmit}
              type="primary"
            >
              {buttonText}
            </Button>

            {queryLoading ? (
              <>
                <Divider type="vertical" />
                <Button onClick={handleReset}>取消</Button>
              </>
            ) : null}
          </Form.Item>
        </Form>
        <Divider dashed />
        <div>
          <h3>说明</h3>
          <ol>
            <li>
              该页面功能用于测试订单支付流程。测试金额会进入商户收款地址。
            </li>
          </ol>
        </div>
      </div>
    </>
  );
};

export default ToolTestPage;
