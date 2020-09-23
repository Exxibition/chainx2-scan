import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  activePairSelector,
  fetchFills,
  fillsSelector
} from '@src/store/reducers/dexSlice'
import Table from '@components/Table'
import Amount from '@components/Amount'
import $t from '@src/locale'
import AddressLink from '@components/AddressLink'
import DateShow from '@components/DateShow'

export default function HistoryEntrust() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const active = useSelector(activePairSelector)
  const { pipDecimals = 0, tickDecimals = 0 } = active || {}

  const { items = [], total } = useSelector(fillsSelector)

  const dispatch = useDispatch()

  useEffect(() => {
    if (typeof active !== 'undefined' && active !== null) {
      dispatch(fetchFills(active.pairId, page - 1, pageSize))
    }
  }, [active, dispatch, page, pageSize])

  return (
    <Table
      onChange={({ current, pageSize: size }) => {
        setPage(current)
        setPageSize(size)
      }}
      pagination={{ current: page, pageSize, total }}
      dataSource={items.map(fill => {
        return {
          key: fill.tradingHistoryIdx,
          id: fill.tradingHistoryIdx,
          price: (
            <Amount
              value={fill.price}
              precision={pipDecimals}
              minDigits={pipDecimals - tickDecimals}
              symbol={'PCX'}
              hideSymbol
            />
          ),
          amount: <Amount value={fill.turnover} symbol={'PCX'} hideSymbol />,
          maker: (
            <AddressLink
              style={{ maxWidth: 136 }}
              className="text-truncate"
              value={fill.maker}
            />
          ),
          taker: (
            <AddressLink
              style={{ maxWidth: 136 }}
              className="text-truncate"
              value={fill.taker}
            />
          ),
          maker_user_order_index: fill.makerOrderId,
          taker_user_order_index: fill.takerOrderId,
          createTime: <DateShow value={fill.blockTime} />
        }
      })}
      columns={[
        {
          title: <>ID</>,
          dataIndex: 'id'
        },
        {
          title: <>{$t('dex_price')}</>,
          dataIndex: 'price'
        },
        {
          title: <>{$t('dex_fill_amount')}</>,
          dataIndex: 'amount'
        },
        {
          title: <>{$t('dex_maker_account')}</>,
          dataIndex: 'maker'
        },
        {
          title: $t('dex_maker_order_id'),
          dataIndex: 'maker_user_order_index'
        },
        {
          title: <>{$t('dex_taker_account')}</>,
          dataIndex: 'taker'
        },
        {
          title: $t('dex_taker_order_id'),
          dataIndex: 'taker_user_order_index'
        },
        {
          title: $t('common_time'),
          dataIndex: 'createTime'
        }
      ]}
    />
  )
}
