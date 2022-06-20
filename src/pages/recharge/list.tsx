import React, { useState } from 'react';
import { Spin, Button, Divider } from 'antd';
import { useDispatch, useSelector } from 'umi';
import ContentHeader from '@/components/contentHeader';
import { RechargeModelState } from '@/models/recharge';
import { ListStat, ListData, FormCreate } from './components';
import { PlusOutlined } from '@ant-design/icons';

const routes = [
  {
    path: '/',
    breadcrumbName: '首页',
  },
  {
    path: '/recharge',
    breadcrumbName: '充值',
  },
];

const RechargeListPage: React.FC = () => {
  const dispatch = useDispatch();

  const [formVisible, setFormVisible] = useState(false);

  React.useEffect(() => {
    fetchList();
  }, []);

  const fetchList = () => {
    dispatch({
      type: 'recharge/getList',
    });
  };

  const {
    data_list: rechargeList,
    data_list_params: rechargeParams,
  }: RechargeModelState = useSelector((state: any) => state.recharge);

  const loading = useSelector(
    (state: any) => state.loading.effects['recharge/getList'],
  );

  const onPageChange = (pageIndex: number) => {
    dispatch({
      type: 'recharge/setListParams',
      payload: {
        page_index: pageIndex,
      },
    });
    fetchList();
  };

  const onRechargeSuccess = () => {
    fetchList();
  };

  const onRechargeCancel = () => {
    setFormVisible(false);
  };

  const onRechargeClick = () => {
    setFormVisible(true);
  };

  return (
    <>
      <ContentHeader
        breadcrumb={{ routes }}
        title="记录"
        extra={[
          <Button
            onClick={onRechargeClick}
            key="create"
            type="primary"
            icon={<PlusOutlined />}
          >
            充值　
          </Button>,
        ]}
      >
        <ListStat />
      </ContentHeader>
      <div className="main-container">
        <Spin size="large" spinning={loading}>
          <ListData
            data={rechargeList}
            current={rechargeParams.page_index}
            onPageChange={onPageChange}
          />
        </Spin>

        <Divider dashed />
        <div>
          <h3>说明</h3>
          <ol>
            <li>如需要退款，请联系客服。</li>
          </ol>
        </div>
      </div>
      <FormCreate
        visible={formVisible}
        onSuccess={onRechargeSuccess}
        onCancel={onRechargeCancel}
      />
    </>
  );
};

export default RechargeListPage;
