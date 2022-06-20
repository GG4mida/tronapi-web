import React from 'react';
import { Table, Pagination, Tooltip, Badge } from 'antd';
import { Link } from 'umi';
import ITransaction from '@/types/ITransaction';
import { formatDateTime, formatAmount } from '@/utils/formater';

interface IProps {
  data: {
    count: number;
    rows: Array<ITransaction>;
  };
  current: number;
  onPageChange: (page: number) => void;
}

const columns = [
  {
    title: '支付金额',
    dataIndex: 'coin_amount',
    key: 'coin_amount',
    width: 150,
    render: (val: any, data: ITransaction) => {
      return <div>{formatAmount(val)}</div>;
    },
  },
  {
    title: '订单金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 150,
    render: (val: any, data: ITransaction) => {
      const { currency } = data;
      return <div>{formatAmount(val, currency)}</div>;
    },
  },
  {
    title: '订单编号',
    dataIndex: 'order_id',
    key: 'order_id',
    render: (val: any) => {
      return (
        <Tooltip title={val}>
          <div
            className="tw-truncate"
            style={{
              width: '100px',
            }}
          >
            {val}
          </div>
        </Tooltip>
      );
    },
  },
  {
    title: '产品名称',
    dataIndex: 'product_name',
    key: 'product_name',
    render: (val: any) => {
      if (!val) return '-';
      return (
        <Tooltip title={val}>
          <div
            className="tw-truncate"
            style={{
              width: '100px',
            }}
          >
            {val}
          </div>
        </Tooltip>
      );
    },
  },
  {
    title: '用户编号',
    dataIndex: 'customer_id',
    key: 'customer_id',
    render: (val: any) => {
      if (!val) return '-';
      return (
        <Tooltip title={val}>
          <div
            className="tw-truncate"
            style={{
              width: '100px',
            }}
          >
            {val}
          </div>
        </Tooltip>
      );
    },
  },
  {
    title: '收款地址',
    dataIndex: 'coin_address',
    key: 'coin_address',
    render: (val: any) => {
      return (
        <Tooltip title={val}>
          <div
            className="tw-truncate"
            style={{
              width: '120px',
            }}
          >
            {val}
          </div>
        </Tooltip>
      );
    },
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    key: 'create_time',
    render: (val: any) => {
      return formatDateTime(val);
    },
  },
  {
    title: '订单状态',
    dataIndex: 'status',
    key: 'status',
    render: (val: any) => {
      if (val === true) {
        return <Badge status="success" text="已支付" />;
      }
      return <Badge status="error" text="未支付" />;
    },
  },
  {
    title: '完成时间',
    dataIndex: 'status_time',
    key: 'status_time',
    render: (val: any, data: ITransaction) => {
      const { status } = data;
      if (status === true) {
        return formatDateTime(val);
      }
      return '-';
    },
  },
  {
    title: '操作',
    dataIndex: 'id',
    key: 'id',
    render: (val: any) => {
      return <Link to={`/transaction/list/${val}`}>详情</Link>;
    },
  },
];

const ListData: React.FC<IProps> = (props) => {
  const { data, current, onPageChange } = props;
  const { rows, count } = data;

  return (
    <>
      <Table
        rowKey={'id'}
        dataSource={data.rows}
        columns={columns}
        pagination={false}
      />
      {rows && rows.length ? (
        <Pagination
          className="tw-mt-4 tw-text-right"
          current={current}
          pageSize={10}
          size="default"
          total={count}
          showTotal={() => `共 ${count} 条记录`}
          onChange={onPageChange}
        />
      ) : null}
    </>
  );
};

export default React.memo(ListData);
