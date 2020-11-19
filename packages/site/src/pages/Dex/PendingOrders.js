import React, { useEffect } from 'react'
import $t from '@src/locale'
import { useDispatch, useSelector } from 'react-redux'
import {
  activePairSelector,
  fetchDepth,
  normalizedDepthSelector
} from '@src/store/reducers/dexSlice'
import classnames from 'classnames'
import Amount from '@components/Amount'
import {
  fetchTradingPairs,
  tradingPairsSelector
} from '../../store/reducers/dexSlice'

export default function PendingOrders() {
  const dispatch = useDispatch()
  const active = useSelector(activePairSelector)
  const { asks, bids } = useSelector(normalizedDepthSelector)
  const totalConcatArr = [...asks, ...bids].map(item => item.total)
  const max = Math.max(...totalConcatArr)

  const { pipDecimals: precision = 0, tickDecimals: unitPrecision = 0 } =
    active || {}

  useEffect(() => {
    if (typeof active !== 'undefined' && active !== null) {
      dispatch(fetchDepth(active.pairId))
    }
  }, [dispatch, active])

  useEffect(() => {
    dispatch(fetchTradingPairs())
  }, [dispatch])
  const Tradingpairs = useSelector(tradingPairsSelector)
  return (
    <section className="panel">
      <div className="panel-heading">{$t('dex_depth_orders')}</div>
      <div className="panel-block handicap" style={{ minHeight: 365 }}>
        <dl className="handicap-list">
          <dt className="handicap-header">
            <span className="price">{$t('common_price')}</span>
            <span className="amount">{$t('common_amount')}</span>
            <span className="total">{$t('dex_acc_amount')}</span>
          </dt>
          <dd className="handicap-content">
            <div className="handicap-step">
              <div className="handicap-sell">
                {asks.map((item, index) => {
                  if (item.amount === 0) {
                    return null
                  } else {
                    return (
                      <div
                        className={classnames('ask-item', {
                          odd: !(index % 2)
                        })}
                        key={index}
                      >
                        <div
                          className="asks capstotal"
                          style={{ width: `${(item.total / max) * 66.6}%` }}
                        />
                        <span className="price">
                          <Amount
                            value={item.price}
                            precision={precision}
                            minDigits={precision - unitPrecision}
                            hideSymbol
                          />
                        </span>
                        <span className="amount">
                          <Amount value={item.amount} symbol="PCX" hideSymbol />
                        </span>
                        <span className="total">
                          <Amount value={item.total} symbol="PCX" hideSymbol />
                        </span>
                      </div>
                    )
                  }
                })}
              </div>
              <div className="handicap-now-price">
                <span className="last-price">
                  <Amount
                    value={
                      Tradingpairs ? Tradingpairs.latestTransactionPrices : 0
                    }
                    precision={9}
                    minDigits={precision - unitPrecision}
                    hideSymbol
                  />
                </span>
              </div>
              <div className="handicap-buy">
                {bids.map((item, index) => {
                  return (
                    <div
                      className={classnames('bid-item', { odd: !(index % 2) })}
                      key={index}
                    >
                      <div
                        className="bids capstotal"
                        style={{ width: `${(item.total / max) * 66.6}%` }}
                      />
                      <span className="price">
                        <Amount
                          value={item.price}
                          precision={precision}
                          minDigits={precision - unitPrecision}
                          hideSymbol
                        />
                      </span>
                      <span className="amount">
                        <Amount value={item.amount} symbol="PCX" hideSymbol />
                      </span>
                      <span className="total">
                        <Amount value={item.total} symbol="PCX" hideSymbol />
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </dd>
        </dl>
      </div>
    </section>
  )
}
