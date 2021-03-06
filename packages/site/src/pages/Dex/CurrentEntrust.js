import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  activePairSelector,
  fetchOpenOrders,
  openOrdersSelector
} from '@src/store/reducers/dexSlice'
import Table from '@components/Table'
import AddressLink from '@components/AddressLink'
import $t from '@src/locale'
import OrderDirection from '@components/OrderDirection'
import Amount from '@components/Amount'
import HasFill from '@components/HasFill'
import OrderStatus from '@components/OrderStatus'
import AccountLink from '../../components/AccountLink'
import BlockLink from '../../components/BlockLink'

export default function CurrentEntrust() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const active = useSelector(activePairSelector)
  const { pipDecimals = 0, tickDecimals = 0 } = active || {}
  const openOrders = useSelector(openOrdersSelector)
  const { items: orders, total } = openOrders || {}

  const dispatch = useDispatch()
  const width = document.documentElement.clientWidth
  const simple = width < 1024
  useEffect(() => {
    if (typeof active !== 'undefined' && active !== null) {
      dispatch(fetchOpenOrders(active.pairId, page - 1, pageSize))
    }
  }, [active, dispatch, page, pageSize])

  return (
    <Table
      onChange={({ current, pageSize: size }) => {
        setPage(current)
        setPageSize(size)
      }}
      pagination={{ current: page, pageSize, total, simple }}
      scroll={{
        x: '100vh'
      }}
      dataSource={(orders || []).map((data, idx) => {
        const hasFill = data.alreadyFilled

        return {
          createdBlockHeight: <BlockLink value={data.props.createdAt} />,
          updatedBlockHeight: <BlockLink value={data.lastUpdateAt} />,
          accountid: (
            <AccountLink
              style={{ maxWidth: 136 }}
              className="text-truncate"
              value={data.props.submitter}
            />
          ),
          id: data.props.id,
          direction: <OrderDirection value={data.props.side} />,
          price: (
            <Amount
              value={data.props.price}
              precision={pipDecimals}
              minDigits={pipDecimals - tickDecimals}
              symbol={'PCX'}
              hideSymbol
            />
          ),
          amount: (
            <Amount value={data.props.amount} symbol={'PCX'} hideSymbol />
          ),
          hasFillAmount: (
            <HasFill fill={hasFill} total={data.props.amount} symbol={'PCX'} />
          ),
          status: <OrderStatus value={data.status} />,
          key: idx
        }
      })}
      columns={[
        {
          title: $t('dex_open_order_account'),
          dataIndex: 'accountid'
        },
        {
          title: $t('dex_account_order_number'),
          dataIndex: 'id'
        },
        {
          title: $t('dex_order_created_blockheight'),
          dataIndex: 'createdBlockHeight'
        },
        {
          title: $t('dex_order_updated_blockheight'),
          dataIndex: 'updatedBlockHeight'
        },
        {
          title: $t('dex_order_direction'),
          dataIndex: 'direction'
        },
        {
          title: $t('dex_order_price'),
          dataIndex: 'price'
        },
        {
          title: $t('dex_order_amount'),
          dataIndex: 'amount'
        },
        {
          title: $t('dex_fill_percent'),
          dataIndex: 'hasFillAmount'
        },
        {
          title: $t('common_status'),
          dataIndex: 'status'
        }
      ]}
    />
  )
}
