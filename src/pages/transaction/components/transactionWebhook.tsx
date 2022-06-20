import React from 'react';
import { useDispatch, useSelector } from 'umi';
import {
  Descriptions,
  Tag,
  Popconfirm,
  Divider,
  Space,
  Button,
  message,
} from 'antd';
import ITransaction from '@/types/ITransaction';
import { formatDateTime, formatJson } from '@/utils/formater';
import { COLOR } from '@/configs/enum';
import {
  CalendarOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CodeOutlined,
} from '@ant-design/icons';

interface IProps {
  data: ITransaction;
}

const TransactionWebhook: React.FC<IProps> = (props) => {
  const { data } = props;
  const dispatch = useDispatch();
  const { merchant_transaction_webhooks } = data;

  const webhook = React.useMemo(() => {
    const webhooks = [...merchant_transaction_webhooks];
    return webhooks[0];
  }, [merchant_transaction_webhooks]);

  const onSendWebhook = async () => {
    const res: any = await dispatch({
      type: 'transaction/sendWebhook',
      payload: {
        id: data.id,
      },
    });

    if (res && res.success === true) {
      message.success(res.data);
    }
  };

  const loading = useSelector(
    (state: any) => state.loading.effects['transaction/sendWebhook'],
  );

  return (
    <>
      <Descriptions
        layout="horizontal"
        column={1}
        size="middle"
        bordered
        labelStyle={{ width: '150px' }}
      >
        <Descriptions.Item label="回调地址">
          <Space>
            <span className="tw-text-red-600">POST</span>
            <span>{webhook.webhook_url}</span>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="回调状态">
          <Space>
            {webhook.webhook_result_code === 200 ? (
              <Tag icon={<CheckCircleOutlined />} color={COLOR.GREEN}>
                正常
              </Tag>
            ) : (
              <Tag icon={<WarningOutlined />} color={COLOR.RED}>
                异常
              </Tag>
            )}
            <Tag icon={<CodeOutlined />} color={COLOR.GRAY}>
              状态码：{webhook.webhook_result_code}
            </Tag>
            <Tag icon={<CalculatorOutlined />} color={COLOR.GRAY}>
              次数：{merchant_transaction_webhooks.length}
            </Tag>
            <Tag icon={<CalendarOutlined />} color={COLOR.GRAY}>
              {formatDateTime(webhook.create_time)}
            </Tag>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="回调数据">
          <pre>{formatJson(webhook.webhook_data)}</pre>
        </Descriptions.Item>
        <Descriptions.Item label="回调返回">
          <pre>{formatJson(webhook.webhook_result_data)}</pre>
        </Descriptions.Item>
        <Descriptions.Item label="操作">
          <Space>
            <Popconfirm
              title={
                <div>
                  <h4>确认重发回调通知吗？</h4>
                </div>
              }
              okText="确认"
              cancelText="取消"
              onConfirm={onSendWebhook}
            >
              <Button type="primary" loading={loading}>
                重发
              </Button>
            </Popconfirm>
          </Space>
        </Descriptions.Item>
      </Descriptions>
      <Divider dashed />
      <div>
        <h3>说明</h3>
        <ol>
          <li>系统会将回调状态码为 200 的记录，标记为成功状态。</li>
          <li>
            对于失败的回调通知，系统会自动重试两次，间隔时间分别为：30秒、10分钟。
          </li>
          <li>商户可手动重发回调通知。</li>
        </ol>
      </div>
    </>
  );
};

export default React.memo(TransactionWebhook);
