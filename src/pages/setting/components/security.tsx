import React from 'react';
import { Form, Space, Input, Button, Divider } from 'antd';
import { SETTING_TYPE } from '@/configs/setting';

interface IProps {
  onSubmit: (values: any) => void;
  data: any;
  loading: boolean;
}

const Security: React.FC<IProps> = (props) => {
  const { data, loading } = props;
  const [form] = Form.useForm();

  React.useEffect(() => {
    const { ip_whitelist } = data;
    form.setFieldsValue({
      ip_whitelist,
    });
  }, [data]);

  const onSubmit = () => {
    form
      .validateFields()
      .then(async (values) => {
        props.onSubmit({
          ...values,
          type: SETTING_TYPE.SECURITY,
        });
      })
      .catch((err) => {
        console.info('validate error:', err);
      });
  };

  return (
    <>
      <Form form={form} name="security" layout="vertical" autoComplete="off">
        <Form.Item name="ip_whitelist" label="接口IP白名单">
          <Input
            placeholder="请输入IP地址, 多个IP请以英文逗号分隔..."
            style={{ width: '400px' }}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              loading={loading}
              type="primary"
              htmlType="submit"
              onClick={onSubmit}
            >
              提交
            </Button>
          </Space>
        </Form.Item>
      </Form>
      <Divider dashed />
      <div>
        <h3>说明</h3>
        <ol>
          <li>可填写你应用托管的服务器IP地址，保障接口安全。</li>
          <li>多个IP请以英文逗号分隔。留空则不校验。</li>
        </ol>
      </div>
    </>
  );
};

export default Security;
