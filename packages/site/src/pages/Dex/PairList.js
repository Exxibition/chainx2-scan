import React, { useEffect } from 'react'
import $t from '@src/locale'
import { useSelector, useDispatch } from 'react-redux'
import PCX from '../../assets/tokens/pcx_circle.jpg'
import classnames from 'classnames'
import TokenName from '@src/pages/Dex/TokenName'
import {
  fetchFills,
  fetchPairs,
  fetchTradingPairs,
  fillsSelector,
  pairsSelector,
  tradingPairsSelector
} from '../../store/reducers/dexSlice'
import { openOrdersSelector } from '../../store/reducers/accountSlice'
import Amount from '../../components/Amount'

export default function PairList() {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(fetchTradingPairs())
  }, [dispatch])
  const Trandingpairs = useSelector(tradingPairsSelector)
  return (
    <section className="panel">
      <div className="panel-heading" style={{ border: '1px solid #dbdbdb' }}>
        {$t('dex_pair')}
      </div>
      <div className="panel-block pairs" style={{ minHeight: 365 }}>
        <div className="pairs-items">
          <div>
            <div className={classnames('pairs-item', 'active')}>
              <img src={PCX} className="pairs-item-icon" />
              <div>PCX/BTC</div>
            </div>
          </div>
        </div>
        <div className={'pairs-content'}>
          <div className={'pairs-content-item'}>
            <div className="pairs-content-item__label">
              {$t('dex_latest_deal')}
            </div>
            <div className="pairs-content-item__value" style={{ fontSize: 24 }}>
              <Amount
                value={Trandingpairs.latestTransactionPrices}
                precision={7}
                symbol={'BTC'}
              />
            </div>
          </div>
          <div className={'pairs-content-item'}>
            <div className="pairs-content-item__label">
              {$t('dex_day_deal')}
            </div>
            <div className="pairs-content-item__value" style={{ fontSize: 24 }}>
              <div>{Trandingpairs.TransactionsDayNumber}</div>
            </div>
          </div>
          <div className={'pairs-content-item'}>
            <div className="pairs-content-item__label">
              {$t('dex_week_deal')}
            </div>
            <div className="pairs-content-item__value" style={{ fontSize: 24 }}>
              <div>{Trandingpairs.TransactionsWeekNumber}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
