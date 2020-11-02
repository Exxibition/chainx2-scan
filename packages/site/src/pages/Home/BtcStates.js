import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  DateShow,
  ExternalLink,
  Amount,
  NumberFormat,
  TxLink,
  AntSpinner as Spinner
} from '../../components'
import Bitcoin from '../../assets/tokens/btc.png'
import { ReactComponent as Right } from '../../assets/right.svg'
import { FormattedMessage } from 'react-intl'
import $t from '../../locale'
import { useDispatch, useSelector } from 'react-redux'
import {
  crossBlocksSelector,
  crossTransactionsDepositedSelector,
  fetchBitCoinTransitbridgeDeposited,
  fetchCrossBlocks
} from '../../store/reducers/crossBlocksSlice'
import { latestExtrinsicsSelector } from '../../store/reducers/latestExtrinsicSlice'
import Hash from '../../components/Hash'
import SeeAll from './SeeAll'
import AddressLink from '../../components/AddressLink'

export default function BtcStates() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)

  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(fetchBitCoinTransitbridgeDeposited(setLoading, page - 1, pageSize))
  }, [dispatch, page, pageSize])
  const { deposited = [], total } =
    useSelector(crossTransactionsDepositedSelector) || {}
  useEffect(() => {
    dispatch(fetchCrossBlocks(setLoading, page - 1, pageSize))
  }, [dispatch, page, pageSize])
  const { items = [] } = useSelector(crossBlocksSelector) || {}
  const extrinsics = useSelector(latestExtrinsicsSelector)
  const [status, setList] = useState({})

  return (
    <div style={{ display: 'flex' }}>
      <div
        className="panel"
        style={{ width: 417, marginRight: 16, marginBottom: 0, padding: 0 }}
      >
        <div className="panel-heading">
          <img src={Bitcoin} alt="Bitcoin" className="panel-heading-icon" />
          {$t('bitcoin_bridge')}
        </div>
        <div className="panel-block align-start">
          {!(items && items.length) ? (
            <div style={{ minHeight: 269, display: 'flex', width: '100%' }}>
              <Spinner />
            </div>
          ) : (
            <div className="btc_block">
              <div className="btc_status">
                <div className="btc_title">{$t('multisig_hot')}</div>
                <div className="btc_content">
                  <ExternalLink
                    value={status.hot_address}
                    type="btcAddress"
                    render={() => (
                      <Amount
                        value={status.hot_balance}
                        symbol="BTC"
                        hideSymbol
                      />
                    )}
                  />
                </div>
              </div>
              <div className="btc_status">
                <div className="btc_title">{$t('multisig_cold')}</div>
                <div className="btc_content">
                  <ExternalLink
                    value={status.cold_address}
                    type="btcAddress"
                    render={() => (
                      <Amount
                        value={status.cold_balance}
                        symbol="BTC"
                        hideSymbol
                      />
                    )}
                  />
                </div>
              </div>
              <div className="btc_status">
                <div className="btc_title">{$t('deposit_txs')}</div>
                <div className="btc_content">
                  <NavLink to="/crossblocks/bitcoin/locklist">
                    <Amount value={total} symbol="BTC" hideSymbol />
                  </NavLink>
                </div>
              </div>
              <div className="btc_status">
                <div className="btc_title">{$t('withdrawal_txs')}</div>
                <div className="btc_content">
                  <NavLink to="/crossblocks/bitcoin/deposits">
                    {status.deposit_count}
                  </NavLink>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <section className="panel" style={{ flex: 1 }}>
        <div
          className="panel-heading"
          style={{ borderBottom: '1px solid #dbdbdb' }}
        >
          {$t('bridge_newblocks')}
        </div>
        <div className="panel-block">
          <table className="table is-striped is-fullwidth data-table">
            <thead>
              <tr>
                <th>{$t('cross_block_height')}</th>
                <th>{$t('cross_block_hash')}</th>
                <th>{$t('chainx_relay_transaction_hash')}</th>
                <th>{$t('chainx_relay_transactioner')}</th>
                <th>{$t('chainx_relay_transaction_time')}</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length
                ? items
                    .slice(0, 6)
                    .map(
                      ({
                        _id,
                        btcHeight,
                        btcHash,
                        chainxExtrinsicHash,
                        signer,
                        chainxTime
                      }) => {
                        return (
                          <tr key={_id}>
                            <td>
                              <ExternalLink
                                type="btcTestnetHash"
                                style={{ width: 80 }}
                                value={btcHeight}
                                render={() => {
                                  return <NumberFormat value={btcHeight} />
                                }}
                              />
                            </td>
                            <td>
                              <ExternalLink
                                type="btcTestnetHash"
                                value={btcHash}
                                render={() => {
                                  return (
                                    <Hash
                                      style={{ width: 136 }}
                                      className="text-truncate"
                                      value={btcHash}
                                    />
                                  )
                                }}
                              />
                            </td>
                            <td>
                              <TxLink
                                style={{ width: 136 }}
                                className="text-truncate"
                                value={chainxExtrinsicHash}
                              />
                            </td>
                            <td>
                              <AddressLink
                                style={{ width: 136 }}
                                className="text-truncate"
                                value={signer}
                              />
                            </td>
                            <td>
                              <DateShow value={chainxTime} />
                            </td>
                          </tr>
                        )
                      }
                    )
                : loading}
            </tbody>
          </table>
        </div>
        <SeeAll link="/crossblocks" />
      </section>
    </div>
  )
}
