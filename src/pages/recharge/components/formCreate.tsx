import React, { useState, useRef } from 'react';
import { useDispatch, useSelector, useModel } from 'umi';
import { Modal, Form, Alert, Input } from 'antd';
import { formatAmount } from '@/utils/formater';

interface IProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const amounts = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

const FormCreate: React.FC<IProps> = (props) => {
  const dispatch = useDispatch();

  const { initialState, setInitialState } = useModel('@@initialState');

  const [queryLoading, setQueryLoading] = useState(false);
  const [okButtonText, setOkButtonText] = useState('提交');

  const [resultVisible, setResultVisible] = useState(false);
  const [resultAmount, setResultAmount] = useState('');

  const [queryTimer] = useState<any>(null);
  const queryTimerRef = useRef(queryTimer);

  const [form] = Form.useForm();
  const { visible } = props;

  const { config }: any = initialState?.settings;

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
        type: 'recharge/query',
        payload: {
          id,
        },
      });
      if (res && res.success === true) {
        const { data } = res;
        const { status, amount } = data;
        if (status === true) {
          setQueryLoading(false);
          setOkButtonText('提交');
          setResultAmount(amount);
          setResultVisible(true);
          clearInterval(queryTimerRef.current);
          handleSuccess();
          props.onSuccess();
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
          type: 'recharge/create',
          payload: values,
        });
        if (res && res.success === true) {
          const { id, cashier_url } = res.data;
          handleQuery(id);
          setQueryLoading(true);
          setOkButtonText('请在打开的页面中完成支付...');
          window.open(cashier_url);
        }
      })
      .catch((err) => {
        console.info('validate error:', err);
      });
  };

  const handleReset = () => {
    if (queryTimerRef.current) {
      clearInterval(queryTimerRef.current);
    }
    setResultVisible(false);
    setResultAmount('');
    setQueryLoading(false);
    setOkButtonText('提交');
  };

  const handleClose = () => {
    handleReset();
    form.resetFields();
    props.onCancel();
  };

  const handleTagClick = (amount: number) => {
    form.setFieldsValue({
      amount: `${amount}`,
    });
  };

  const tags = () => {
    return (
      <div className="tw-mt-2">
        常用充值金额：
        {amounts.map((item, index) => {
          return (
            <a
              href="#"
              className="tw-mr-2"
              onClick={() => handleTagClick(item)}
              key={index}
            >
              {item}
            </a>
          );
        })}
      </div>
    );
  };

  const loading = useSelector(
    (state: any) => state.loading.effects['recharge/create'],
  );

  return (
    <Modal
      title="充值"
      visible={visible}
      onOk={handleSubmit}
      maskClosable={false}
      onCancel={handleClose}
      destroyOnClose={true}
      okText={okButtonText}
      okButtonProps={{
        loading: loading || queryLoading,
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="formAddressAdd"
        initialValues={{ amount: '' }}
        autoComplete="off"
      >
        {resultVisible && resultAmount ? (
          <Alert
            message={`恭喜你，已成功充值 ${formatAmount(resultAmount)}。`}
            type="success"
            className="tw-mb-3"
            showIcon
          />
        ) : null}
        <Form.Item
          label="金额"
          name="amount"
          extra={tags()}
          rules={[
            { required: true, message: '金额不能为空' },
            {
              pattern:
                /^((0{1}\.\d{1,2})|([1-9]\d*\.{1}\d{1,2})|([1-9]+\d*))$/i,
              message: '仅支持金额类型，最多两位小数',
            },
          ]}
        >
          <Input
            addonAfter="USDT"
            placeholder="请输入充值金额..."
            maxLength={34}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default React.memo(FormCreate);
