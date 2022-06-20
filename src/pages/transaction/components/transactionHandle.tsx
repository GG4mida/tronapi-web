import React, { useState } from 'react';
import {
  Form,
  Tooltip,
  Button,
  Table,
  Divider,
  message,
  Input,
  Spin,
  Radio,
  Modal,
} from 'antd';
import { useDispatch, useSelector, useModel } from 'umi';
import ITransaction from '@/types/ITransaction';
import { formatAmount, formatDateTime } from '@/utils/formater';
import { LINK } from '@/configs/links';

interface IProps {
  data: ITransaction;
  onSuccess: () => void;
}

const HANDLE_TYPE = {
  ADDRESS: 'address',
  HASH: 'hash',
};

const TransactionHandle: React.FC<IProps> = (props) => {
  const { data } = props;
  const [form] = Form.useForm();

  const { initialState, setInitialState } = useModel('@@initialState');

  const [transactionList, setTransactionList] = useState<Array<any>>([]);
  const dispatch = useDispatch();

  const handleSearch = () => {
    form
      .validateFields()
      .then(async (values) => {
        const res: any = await dispatch({
          type: 'transaction/search',
          payload: {
            ...values,
            id: data.id,
          },
        });
        if (res && res.success === true) {
          if (res.data && res.data.length) {
            setTransactionList(res.data);
          } else {
            setTransactionList([]);
            message.error('未查询到交易记录');
          }
        }
      })
      .catch((err) => {
        console.info('validate error:', err);
      });
  };

  const handleDoneSuccess = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      await setInitialState((s) => ({
        ...s,
        currentUser: userInfo,
      }));
    }
  };

  const handleDoneSubmit = async (transactionId: string) => {
    const res: any = await dispatch({
      type: 'transaction/markDone',
      payload: {
        id: data.id,
        transaction_id: transactionId,
      },
    });

    if (res && res.success === true) {
      handleDoneSuccess();
      message.success('订单处理成功', 2.5, () => {
        props.onSuccess();
      });
    }
  };

  const handleDoneConfirm = (transactionId: string) => {
    Modal.confirm({
      title: '确定关联该交易至订单信息？',
      content: (
        <div>
          该操作会将订单标注为已支付状态，同时发送系统回调通知，回调金额为订单金额。
        </div>
      ),
      onOk() {
        handleDoneSubmit(transactionId);
      },
    });
  };

  const loadingSearch = useSelector(
    (state: any) => state.loading.effects['transaction/search'],
  );

  const loadingDone = useSelector(
    (state: any) => state.loading.effects['transaction/markDone'],
  );

  const transactionColumns = [
    {
      title: '发送地址',
      dataIndex: 'from',
      key: 'from',
      render: (val: any, data: any) => {
        return <div>{val}</div>;
      },
    },
    {
      title: '接收地址',
      dataIndex: 'to',
      key: 'to',
      render: (val: any, data: any) => {
        return (
          <Tooltip title={val}>
            <div
              className="tw-truncate"
              style={{
                width: '200px',
              }}
            >
              {val}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: '交易金额',
      dataIndex: 'value',
      key: 'value',
      render: (val: any, data: any) => {
        return formatAmount(val);
      },
    },
    {
      title: '哈希',
      dataIndex: 'hash',
      key: 'hash',
      render: (val: any, data: any) => {
        return (
          <Tooltip title={val}>
            <a target="_blank" href={`${LINK.BROWSER}/#/transaction/${val}`}>
              <div
                className="tw-truncate"
                style={{
                  width: '200px',
                }}
              >
                {val}
              </div>
            </a>
          </Tooltip>
        );
      },
    },
    {
      title: '交易时间',
      dataIndex: 'create_time',
      key: 'create_time',
      render: (val: any, data: any) => {
        return formatDateTime(val);
      },
    },
    {
      title: '操作',
      dataIndex: 'id',
      key: 'id',
      render: (val: any) => {
        return (
          <a href="#" onClick={() => handleDoneConfirm(val)}>
            关联订单
          </a>
        );
      },
    },
  ];

  return (
    <>
      <Spin spinning={!!loadingDone}>
        <Form
          form={form}
          layout="vertical"
          name="transactionHandle"
          initialValues={{ type: HANDLE_TYPE.ADDRESS, address: '', hash: '' }}
          autoComplete="off"
        >
          <Form.Item label="查询类型" name="type">
            <Radio.Group>
              <Radio value={HANDLE_TYPE.ADDRESS}>按发送地址查询</Radio>
              <Radio value={HANDLE_TYPE.HASH}>按交易哈希查询</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('type') === HANDLE_TYPE.ADDRESS ? (
                <Form.Item
                  name="address"
                  label="发送地址"
                  rules={[
                    { required: true, message: '发送地址不能为空' },
                    {
                      pattern: /^T[0-9a-zA-Z]{33}$/i,
                      message: '仅支持波场网络以 T 开头的地址',
                    },
                  ]}
                >
                  <Input
                    style={{ width: '600px' }}
                    placeholder="请输入交易发送地址..."
                    maxLength={34}
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  name="hash"
                  label="交易哈希"
                  rules={[
                    { required: true, message: '交易哈希不能为空' },
                    {
                      pattern: /^[0-9a-z]{64}$/i,
                      message: '仅支持交易哈希格式，长度为 64 位',
                    },
                  ]}
                >
                  <Input
                    style={{ width: '600px' }}
                    placeholder="请输入交易哈希..."
                    maxLength={64}
                  />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item>
            <Button
              loading={loadingSearch}
              onClick={handleSearch}
              type="primary"
            >
              查询
            </Button>
          </Form.Item>
        </Form>
        {transactionList && transactionList.length ? (
          <Table
            rowKey={'id'}
            dataSource={transactionList}
            pagination={false}
            columns={transactionColumns}
          />
        ) : null}
      </Spin>
      <Divider dashed />
      <div>
        <h3>说明</h3>
        <ol>
          <li>
            如用户实际支付金额与订单金额不匹配，导致订单未完成且无回调通知，可使用该页面功能进行人工处理。
          </li>
          <li>商户需提交用户付款交易的发送地址，或者交易哈希进行人工处理。</li>
          <li>
            关联订单操作会将订单标注为已支付状态，同时发送系统回调通知，回调金额为订单金额。
          </li>
        </ol>
      </div>
    </>
  );
};

export default React.memo(TransactionHandle);
