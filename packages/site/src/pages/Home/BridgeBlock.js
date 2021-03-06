import $t from '../../locale'
import { DateShow, ExternalLink, NumberFormat, TxLink } from '../../components'
import Hash from '../../components/Hash'
import AddressLink from '../../components/AddressLink'
import SeeAll from './SeeAll'
import React, { useEffect, useState } from 'react'
import {
  crossBlocksSelector,
  fetchCrossBlocks
} from '../../store/reducers/crossBlocksSlice'
import { useDispatch, useSelector } from 'react-redux'
import AccountLink from '../../components/AccountLink'
import swapEndian from '../../utils/swapEndian'

const BridgeBlock = function() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)

  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(fetchCrossBlocks(setLoading, page - 1, pageSize))
  }, [dispatch, page, pageSize])
  const { items = [] } = useSelector(crossBlocksSelector) || {}
  return (
    <section className="panel">
      <div
        className="panel-heading"
        style={{ borderBottom: '1px solid #dbdbdb' }}
      >
        {$t('bridge_newblocks')}
      </div>
      <div className="panel-block table-container">
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
                      const btcHashForExplorer = swapEndian(btcHash.slice(2))
                      return (
                        <tr key={_id}>
                          <td>
                            <ExternalLink
                              type="btcHash"
                              style={{ width: 80 }}
                              value={btcHeight}
                              render={() => {
                                return <NumberFormat value={btcHeight} />
                              }}
                            />
                          </td>
                          <td>
                            <ExternalLink
                              type="btcHash"
                              value={btcHashForExplorer}
                              render={() => {
                                return (
                                  <Hash
                                    style={{ width: 136 }}
                                    className="text-truncate"
                                    value={btcHashForExplorer}
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
                            <AccountLink
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
  )
}

export default BridgeBlock
